<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeClientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ProjectShopeeController extends Controller
{
    private const STATE_TTL_SECONDS = 600;

    /**
     * Save Shopee API Developer Credentials.
     * Leave Partner ID empty to use the shared app configured in .env.
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'partner_id' => 'nullable|string|max:100',
            'partner_key' => 'nullable|string',
            'is_sandbox' => 'nullable|boolean',
        ]);

        $partnerId = trim((string) ($validated['partner_id'] ?? ''));

        if ($partnerId === '' && ! config('services.shopee.partner_id')) {
            return back()->withErrors(['partner_id' => 'Partner ID wajib diisi (belum ada aplikasi Shopee bersama di server).']);
        }

        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);

        $config->partner_id = $partnerId !== '' ? $partnerId : null;
        $config->is_sandbox = $request->boolean('is_sandbox');

        if (! empty($validated['partner_key'])) {
            $config->partner_key = trim($validated['partner_key']);
        }

        $config->save();

        return back()->with('success', 'Kredensial Shopee API berhasil disimpan.');
    }

    /**
     * Redirect to Shopee Open Platform Shop Authorization.
     */
    public function oauthRedirect(Request $request, Project $project)
    {
        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);

        if ($request->filled('partner_id')) {
            $config->partner_id = trim($request->input('partner_id'));
        }
        if ($request->filled('partner_key')) {
            $config->partner_key = trim($request->input('partner_key'));
        }
        if ($request->has('is_sandbox') && $config->partner_id) {
            $config->is_sandbox = $request->boolean('is_sandbox');
        }
        $config->save();

        if (! $config->hasCredentials()) {
            return back()->with('error', 'Partner ID dan Partner Key wajib diisi sebelum menghubungkan ke Shopee.');
        }

        $state = Str::random(40);
        $payload = [
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'return_url' => $this->safeReturnUrl($request->input('return_url') ?: url()->previous(), $project),
        ];

        Cache::put("shopee_oauth:{$state}", $payload, self::STATE_TTL_SECONDS);
        // Fallback lookup in case Shopee drops our query string from the redirect URL.
        Cache::put("shopee_oauth_user:{$request->user()->id}", $state, self::STATE_TTL_SECONDS);

        $redirectUri = (config('services.shopee.redirect') ?: route('auth.shopee.callback')).'?'.http_build_query(['state' => $state]);

        return redirect()->away(ShopeeClientService::generateAuthUrl(
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $redirectUri,
            $config->resolvedIsSandbox()
        ));
    }

    /**
     * Single registered callback for every project. The project is resolved from the server-side state, never from the URL.
     */
    public function oauthCallback(Request $request): RedirectResponse
    {
        $fallback = route('shopee.index');
        $userId = $request->user()->id;

        $state = $request->query('state');
        $key = is_string($state) && $state !== ''
            ? "shopee_oauth:{$state}"
            : 'shopee_oauth:'.Cache::get("shopee_oauth_user:{$userId}");

        $payload = Cache::pull($key);
        Cache::forget("shopee_oauth_user:{$userId}");

        if (! is_array($payload) || ($payload['user_id'] ?? null) !== $userId) {
            return redirect($fallback)->with('error', 'Sesi otorisasi Shopee tidak valid atau sudah kedaluwarsa. Silakan coba hubungkan lagi.');
        }

        $project = Project::find($payload['project_id']);
        $returnUrl = $payload['return_url'] ?? $fallback;

        if (! $project) {
            return redirect($fallback)->with('error', 'Proyek untuk otorisasi Shopee tidak ditemukan.');
        }

        $code = $request->query('code');
        $shopId = $request->query('shop_id');

        if (empty($code) || empty($shopId)) {
            $message = $request->filled('main_account_id')
                ? 'Otorisasi akun utama (merchant) belum didukung. Hubungkan lewat toko tunggal.'
                : ($request->query('message') ?: 'Otorisasi Shopee dibatalkan atau tidak lengkap.');

            return redirect($returnUrl)->with('error', (string) $message);
        }

        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);
        if (! $config->hasCredentials()) {
            return redirect($returnUrl)->with('error', 'Kredensial Shopee Partner tidak ditemukan.');
        }

        $result = ShopeeClientService::handleCallback(
            (string) $code,
            $shopId,
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $config->resolvedIsSandbox()
        );

        if (! $result['success']) {
            $config->status = 'error';
            $config->error_message = $result['message'];
            $config->save();

            return redirect($returnUrl)->with('error', $result['message']);
        }

        $config->shop_id = (string) $shopId;
        $config->shop_name = $result['shop_name'] ?? "Shopee Store #{$shopId}";
        $config->access_token = $result['access_token'];
        $config->refresh_token = $result['refresh_token'] ?? null;
        $config->token_expires_at = now()->addSeconds($result['expires_in'] ?? 14400);
        $config->refresh_expires_at = now()->addDays(30); // Shopee refresh token ~30 days
        $config->status = 'connected';
        $config->last_synced_at = now();
        $config->error_message = null;
        // Keep only non-secret fields; the token response contains the raw tokens.
        $config->shopee_raw_data = collect($result['raw'] ?? [])->only(['request_id', 'expire_in', 'merchant_id_list', 'shop_id_list'])->all();
        $config->save();

        return redirect($returnUrl)->with('success', "Berhasil menghubungkan toko Shopee: {$config->shop_name}!");
    }

    /**
     * Disconnect Shopee store.
     */
    public function disconnect(Request $request, Project $project)
    {
        $config = $project->shopeeConfig;
        if ($config) {
            $config->access_token = null;
            $config->refresh_token = null;
            $config->token_expires_at = null;
            $config->refresh_expires_at = null;
            $config->status = 'disconnected';
            $config->error_message = null;
            $config->save();
        }

        return back()->with('success', 'Koneksi akun toko Shopee berhasil diputus.');
    }

    /**
     * Test connection on-the-fly.
     */
    public function testConnection(Request $request, Project $project)
    {
        $config = $project->shopeeConfig;
        $usesInput = $request->filled('partner_id');

        $partnerId = $usesInput ? $request->input('partner_id') : $config?->resolvedPartnerId();
        $partnerKey = $request->input('partner_key') ?: ($usesInput ? $config?->partner_key : $config?->resolvedPartnerKey());
        $isSandbox = $usesInput ? $request->boolean('is_sandbox') : ($config?->resolvedIsSandbox() ?? (bool) config('services.shopee.sandbox'));

        $result = ShopeeClientService::testCredentials(
            (string) $partnerId,
            (string) $partnerKey,
            $isSandbox,
            $config?->shop_id,
            $config?->access_token
        );

        return response()->json($result);
    }

    /**
     * Only allow returning to this application, never to an arbitrary external URL.
     */
    private function safeReturnUrl(?string $url, Project $project): string
    {
        $default = route('shopee.index', ['project_id' => $project->id]);

        if (! $url) {
            return $default;
        }

        $host = parse_url($url, PHP_URL_HOST);
        $isRelative = str_starts_with($url, '/') && ! str_starts_with($url, '//');

        if ($isRelative || ($host !== null && $host === parse_url(config('app.url'), PHP_URL_HOST))) {
            return $url;
        }

        return $default;
    }
}
