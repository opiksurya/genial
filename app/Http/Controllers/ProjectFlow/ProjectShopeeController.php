<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Http\Controllers\ShopeeClientConnectController;
use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Models\ShopeeConnectLink;
use App\Services\Shopee\ShopeeClientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
        $queryState = $request->query('state');
        $queryState = is_string($queryState) ? $queryState : '';

        // A shop owner authorizing through a link has no account; that flow is checked first and never relaxes the staff flow below.
        $clientPayload = $queryState !== '' ? Cache::get("shopee_oauth:{$queryState}") : null;
        if (is_array($clientPayload) && ($clientPayload['flow'] ?? null) === 'client') {
            return $this->completeClientConnect($request, $queryState, $clientPayload);
        }

        if (! $request->user()) {
            return redirect()->route('login');
        }

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

        $connected = $this->connectShop($project, (string) $code, (string) $shopId);

        if (! $connected['success']) {
            return redirect($returnUrl)->with('error', $connected['message']);
        }

        return redirect($returnUrl)->with('success', "Berhasil menghubungkan toko Shopee: {$connected['config']->shop_name}!");
    }

    /**
     * Finish a connection started from a client link. Requires the same browser session that opened the link.
     *
     * @param  array<string, mixed>  $payload
     */
    private function completeClientConnect(Request $request, string $state, array $payload): RedirectResponse
    {
        $connect = app(ShopeeClientConnectController::class);

        $sessionState = $request->session()->get('shopee_client_state');
        if (! is_string($sessionState) || ! hash_equals($sessionState, $state)) {
            return $connect->finish('error', 'Sesi otorisasi tidak cocok. Buka kembali tautan dari tim kami dan coba lagi.');
        }

        // From here the state is spent, whatever the outcome.
        Cache::forget("shopee_oauth:{$state}");
        $request->session()->forget('shopee_client_state');

        $link = ShopeeConnectLink::find($payload['link_id'] ?? 0);
        if (! $link || ! $link->isUsable() || $link->project_id !== ($payload['project_id'] ?? null)) {
            return $connect->finish('error', 'Tautan ini sudah tidak berlaku. Minta tautan baru dari tim kami.');
        }

        $code = $request->query('code');
        $shopId = $request->query('shop_id');

        if (empty($code) || empty($shopId)) {
            $message = $request->filled('main_account_id')
                ? 'Otorisasi akun utama (merchant) belum didukung. Hubungkan lewat toko tunggal.'
                : 'Otorisasi dibatalkan. Tautan masih bisa dipakai selama belum kedaluwarsa.';

            return $connect->finish('error', $message);
        }

        $connected = $this->connectShop($link->project, (string) $code, (string) $shopId);

        if (! $connected['success']) {
            Log::warning('Shopee client link authorization failed', ['project_id' => $link->project_id, 'message' => $connected['message']]);

            return $connect->finish('error', 'Toko belum berhasil dihubungkan. Silakan coba lagi atau hubungi tim kami.');
        }

        $link->update(['used_at' => now(), 'connected_shop_id' => (string) $shopId]);

        return $connect->finish('success', null, $connected['config']->shop_name);
    }

    /**
     * Exchange the authorization code for tokens and store them on the project's Shopee config.
     *
     * @return array{success: bool, message: string|null, config: ProjectShopeeConfig|null}
     */
    private function connectShop(Project $project, string $code, string $shopId): array
    {
        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);
        if (! $config->hasCredentials()) {
            return ['success' => false, 'message' => 'Kredensial Shopee Partner tidak ditemukan.', 'config' => null];
        }

        $result = ShopeeClientService::handleCallback(
            $code,
            $shopId,
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $config->resolvedIsSandbox()
        );

        if (! $result['success']) {
            $config->status = 'error';
            $config->error_message = $result['message'];
            $config->save();

            return ['success' => false, 'message' => $result['message'], 'config' => null];
        }

        $config->shop_id = $shopId;
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

        return ['success' => true, 'message' => null, 'config' => $config];
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
