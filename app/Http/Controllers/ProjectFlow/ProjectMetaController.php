<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectMetaController extends Controller
{
    /**
     * Store or update Meta connection settings for a client's project.
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'ad_account_id' => 'required|string|max:100',
            'app_id' => 'nullable|string|max:100',
            'app_secret' => 'nullable|string',
            'pixel_id' => 'nullable|string|max:100',
            'access_token' => 'nullable|string',
        ]);

        $config = $project->metaConfig ?: new ProjectMetaConfig(['project_id' => $project->id]);

        $config->ad_account_id = MetaClientService::formatAdAccountId($validated['ad_account_id']);
        $config->pixel_id = !empty($validated['pixel_id']) ? trim($validated['pixel_id']) : null;

        if (array_key_exists('app_id', $validated)) {
            $config->app_id = !empty($validated['app_id']) ? trim($validated['app_id']) : null;
        }

        if (!empty($validated['app_secret'])) {
            $config->app_secret = trim($validated['app_secret']);
        }

        // Only update token if provided (preserves existing token on simple edits)
        if (!empty($validated['access_token'])) {
            $config->access_token = trim($validated['access_token']);
        }

        $config->save();

        // Immediately attempt to sync & verify connection with Meta Graph API
        $syncResult = MetaClientService::syncAccount($config);

        if ($syncResult['success']) {
            return back()->with('success', $syncResult['message']);
        }

        return back()->with('warning', 'Konfigurasi tersimpan, namun koneksi Meta gagal: ' . $syncResult['message']);
    }

    /**
     * Redirect user to Facebook OAuth authorization dialog (1-click connect).
     */
    public function oauthRedirect(Request $request, Project $project)
    {
        $appId = $request->input('app_id') 
            ?: $project->metaConfig?->app_id 
            ?: config('services.facebook.client_id');

        $appSecret = $request->input('app_secret') 
            ?: $project->metaConfig?->app_secret 
            ?: config('services.facebook.client_secret');

        if (empty($appId) || empty($appSecret)) {
            return back()->with('error', 'Meta App ID dan Meta App Secret wajib diisi terlebih dahulu untuk Login with Facebook.');
        }

        // Store App ID, Secret, and ad_account_id in metaConfig if provided
        $config = $project->metaConfig ?: new ProjectMetaConfig(['project_id' => $project->id]);
        $config->app_id = trim($appId);
        $config->app_secret = trim($appSecret);
        if ($request->filled('ad_account_id')) {
            $config->ad_account_id = MetaClientService::formatAdAccountId($request->input('ad_account_id'));
        }
        if ($request->filled('pixel_id')) {
            $config->pixel_id = trim($request->input('pixel_id'));
        }
        $config->save();

        $state = Str::random(40);
        $redirectUri = route('projects.meta.oauth.callback', $project);

        session([
            'meta_oauth_state' => $state,
            'meta_oauth_project_id' => $project->id,
            'meta_oauth_return_url' => $request->input('return_url') ?: url()->previous(),
        ]);

        $oauthUrl = MetaClientService::generateOAuthUrl($appId, $redirectUri, $state);

        return redirect()->away($oauthUrl);
    }

    /**
     * Handle callback from Facebook OAuth.
     */
    public function oauthCallback(Request $request, Project $project)
    {
        $state = $request->query('state');
        $sessionState = session('meta_oauth_state');
        $returnUrl = session('meta_oauth_return_url', route('meta-ads.index', ['project_id' => $project->id]));

        session()->forget(['meta_oauth_state', 'meta_oauth_project_id', 'meta_oauth_return_url']);

        if (!$state || $state !== $sessionState) {
            return redirect($returnUrl)->with('error', 'Validasi sesi Facebook OAuth gagal. Silakan coba lagi.');
        }

        if ($request->has('error')) {
            $errorDesc = $request->query('error_description') ?: $request->query('error_message') ?: 'Otorisasi Facebook dibatalkan atau ditolak.';
            return redirect($returnUrl)->with('error', $errorDesc);
        }

        $code = $request->query('code');
        if (empty($code)) {
            return redirect($returnUrl)->with('error', 'Kode otorisasi dari Facebook tidak ditemukan.');
        }

        $config = $project->metaConfig;
        $appId = $config?->app_id ?: config('services.facebook.client_id');
        $appSecret = $config?->app_secret ?: config('services.facebook.client_secret');
        $redirectUri = route('projects.meta.oauth.callback', $project);

        if (empty($appId) || empty($appSecret)) {
            return redirect($returnUrl)->with('error', 'Meta App ID dan Secret tidak ditemukan.');
        }

        $result = MetaClientService::handleOAuthCallback($code, $appId, $appSecret, $redirectUri);

        if (!$result['success']) {
            return redirect($returnUrl)->with('error', $result['message']);
        }

        if (!$config) {
            $config = new ProjectMetaConfig(['project_id' => $project->id]);
        }

        $config->access_token = $result['access_token'];
        $config->fb_user_id = $result['fb_user_id'];
        $config->fb_user_name = $result['fb_user_name'];
        $config->token_expires_at = now()->addSeconds($result['expires_in']);
        $config->status = 'connected';
        $config->error_message = null;

        // If ad_account_id is still empty, auto-fill from user's first available ad account
        if (empty($config->ad_account_id) && !empty($result['ad_accounts'])) {
            $firstAccount = $result['ad_accounts'][0];
            $config->ad_account_id = MetaClientService::formatAdAccountId($firstAccount['id'] ?? $firstAccount['account_id']);
            $config->account_name = $firstAccount['name'] ?? null;
            $config->currency = $firstAccount['currency'] ?? 'IDR';
        }

        $config->save();

        // Perform immediate account sync
        MetaClientService::syncAccount($config);

        $name = $result['fb_user_name'] ?: 'Facebook';
        return redirect($returnUrl)->with('success', "Berhasil terhubung ke akun Facebook: {$name}!");
    }

    /**
     * Test connection on-the-fly (Ajax / API).
     */
    public function testConnection(Request $request, Project $project)
    {
        $validated = $request->validate([
            'ad_account_id' => 'required|string|max:100',
            'access_token' => 'nullable|string',
        ]);

        $token = !empty($validated['access_token']) 
            ? trim($validated['access_token']) 
            : $project->metaConfig?->access_token;

        if (empty($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Access Token belum diisi atau belum tersimpan.',
            ], 422);
        }

        $result = MetaClientService::testConnection($validated['ad_account_id'], $token);

        return response()->json($result);
    }

    /**
     * Force sync latest data from Meta.
     */
    public function sync(Project $project)
    {
        $config = $project->metaConfig;

        if (!$config) {
            return back()->with('error', 'Koneksi Meta belum dikonfigurasi untuk project ini.');
        }

        $result = MetaClientService::syncAccount($config);

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Disconnect / clear Meta integration for this client.
     */
    public function destroy(Project $project)
    {
        $project->metaConfig?->delete();

        return back()->with('success', 'Koneksi Meta Ads untuk client ini berhasil diputus.');
    }

    /**
     * Get list of live campaigns for this client from Meta API.
     */
    public function getCampaigns(Project $project)
    {
        $config = $project->metaConfig;

        if (!$config || !$config->isConnected()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Meta belum terhubung untuk client ini.',
                'campaigns' => [],
            ]);
        }

        $campaigns = MetaClientService::getCampaigns($config);

        return response()->json([
            'success' => true,
            'campaigns' => $campaigns,
            'account_name' => $config->account_name,
            'currency' => $config->currency,
            'ad_account_id' => $config->ad_account_id,
        ]);
    }
}
