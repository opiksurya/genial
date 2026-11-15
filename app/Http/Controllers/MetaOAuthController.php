<?php

namespace App\Http\Controllers;

use App\Models\ProjectMetaConfig;
use App\Services\MetaAppCredentials;
use App\Services\MetaClientService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MetaOAuthController extends Controller
{
    /**
     * One-time setup (Super Admin): save the shared Meta App ID and Secret.
     */
    public function saveApp(Request $request)
    {
        $validated = $request->validate([
            'app_id' => ['required', 'regex:/^\d{8,25}$/'],
            'app_secret' => ['required', 'string', 'min:16', 'max:100'],
        ]);

        // Make sure the pair is real before storing it.
        $check = Http::timeout(15)->get(MetaClientService::BASE_URL . '/oauth/access_token', [
            'client_id' => trim($validated['app_id']),
            'client_secret' => trim($validated['app_secret']),
            'grant_type' => 'client_credentials',
        ]);

        if (! $check->successful()) {
            return back()->with('error', 'App ID atau App Secret tidak cocok: ' . ($check->json('error.message') ?? 'ditolak Meta') . '.');
        }

        MetaAppCredentials::save($validated['app_id'], $validated['app_secret']);

        return back()->with('success', 'Aplikasi Meta tersimpan. Sekarang klik "Hubungkan dengan Facebook".');
    }

    /**
     * Step 1 of the one-click flow: send the user to Facebook.
     */
    public function connect(Request $request)
    {
        $returnUrl = $request->input('return_url') ?: route('meta-ads.index');

        if (! MetaAppCredentials::isConfigured()) {
            return redirect($returnUrl)->with('error', 'Aplikasi Meta belum disiapkan. Minta Super Admin mengisi App Secret satu kali di halaman Meta Ads Analytics.');
        }

        $state = Str::random(40);
        session([
            'meta_connect_state' => $state,
            'meta_connect_return_url' => $returnUrl,
        ]);

        return redirect()->away(MetaClientService::generateOAuthUrl(
            MetaAppCredentials::appId(),
            route('meta-ads.callback'),
            $state,
        ));
    }

    /**
     * Step 2: Facebook sends the user back. One login connects every brand it can see.
     */
    public function callback(Request $request)
    {
        $returnUrl = session('meta_connect_return_url', route('meta-ads.index'));
        $expected = session('meta_connect_state');
        session()->forget(['meta_connect_state', 'meta_connect_return_url']);

        if (! $expected || $request->query('state') !== $expected) {
            return redirect($returnUrl)->with('error', 'Sesi login Facebook tidak valid. Silakan coba lagi.');
        }

        if ($request->has('error')) {
            return redirect($returnUrl)->with('error', $request->query('error_description') ?: 'Login Facebook dibatalkan.');
        }

        if (blank($request->query('code'))) {
            return redirect($returnUrl)->with('error', 'Kode otorisasi dari Facebook tidak ditemukan.');
        }

        $result = MetaClientService::handleOAuthCallback(
            $request->query('code'),
            MetaAppCredentials::appId(),
            MetaAppCredentials::appSecret(),
            route('meta-ads.callback'),
        );

        if (! $result['success']) {
            return redirect($returnUrl)->with('error', $result['message']);
        }

        $visible = MetaClientService::listAccessibleAdAccounts($result['access_token']);
        $visibleIds = collect($visible['accounts'])
            ->map(fn ($a) => MetaClientService::formatAdAccountId($a['id'] ?? $a['account_id'] ?? ''))
            ->all();

        $connected = 0;
        $missing = [];

        foreach (ProjectMetaConfig::with('project:id,name')->get() as $config) {
            if (! in_array($config->ad_account_id, $visibleIds, true)) {
                $missing[] = $config->project?->name ?? $config->ad_account_id;

                continue;
            }

            $config->app_id = MetaAppCredentials::appId();
            $config->access_token = $result['access_token'];
            $config->fb_user_id = $result['fb_user_id'];
            $config->fb_user_name = $result['fb_user_name'];
            $config->token_expires_at = now()->addSeconds($result['expires_in']);
            $config->save();

            if (MetaClientService::syncAccount($config)['success']) {
                $connected++;
            } else {
                $missing[] = $config->project?->name ?? $config->ad_account_id;
            }
        }

        $name = $result['fb_user_name'] ?: 'Facebook';
        $message = "Terhubung sebagai {$name}. {$connected} ad account berhasil tersambung.";

        if ($missing) {
            return redirect($returnUrl)->with('warning', $message . ' Belum terbaca: ' . implode(', ', array_unique($missing)) . '. Pastikan akun Facebook ini punya akses ke akun iklan tersebut.');
        }

        return redirect($returnUrl)->with('success', $message);
    }
}
