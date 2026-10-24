<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeClientService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectShopeeController extends Controller
{
    /**
     * Save Shopee API Developer Credentials.
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'partner_id' => 'required|string|max:100',
            'partner_key' => 'nullable|string',
            'is_sandbox' => 'nullable|boolean',
        ]);

        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);

        $config->partner_id = trim($validated['partner_id']);
        $config->is_sandbox = $request->boolean('is_sandbox');

        if (!empty($validated['partner_key'])) {
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
        if ($request->has('is_sandbox')) {
            $config->is_sandbox = $request->boolean('is_sandbox');
        }
        $config->save();

        $partnerId = $config->partner_id;
        $partnerKey = $config->partner_key;

        if (empty($partnerId) || empty($partnerKey)) {
            return back()->with('error', 'Partner ID dan Partner Key wajib diisi sebelum menghubungkan ke Shopee.');
        }

        $redirectUri = route('projects.shopee.oauth.callback', $project);

        session([
            'shopee_oauth_project_id' => $project->id,
            'shopee_oauth_return_url' => $request->input('return_url') ?: url()->previous(),
        ]);

        $authUrl = ShopeeClientService::generateAuthUrl(
            $partnerId,
            $partnerKey,
            $redirectUri,
            $config->is_sandbox
        );

        return redirect()->away($authUrl);
    }

    /**
     * Handle Callback from Shopee Open Platform.
     */
    public function oauthCallback(Request $request, Project $project)
    {
        $returnUrl = session('shopee_oauth_return_url', route('shopee.index', ['project_id' => $project->id]));
        session()->forget(['shopee_oauth_project_id', 'shopee_oauth_return_url']);

        $code = $request->query('code');
        $shopId = $request->query('shop_id');

        if (empty($code) || empty($shopId)) {
            $errMsg = $request->query('message') ?: 'Otorisasi Shopee dibatalkan atau tidak lengkap.';
            return redirect($returnUrl)->with('error', $errMsg);
        }

        $config = $project->shopeeConfig;
        if (!$config || empty($config->partner_id) || empty($config->partner_key)) {
            return redirect($returnUrl)->with('error', 'Kredensial Shopee Partner tidak ditemukan.');
        }

        $result = ShopeeClientService::handleCallback(
            $code,
            $shopId,
            $config->partner_id,
            $config->partner_key,
            $config->is_sandbox
        );

        if (!$result['success']) {
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
        $config->shopee_raw_data = $result['raw'] ?? null;
        $config->save();

        $storeName = $config->shop_name;
        return redirect($returnUrl)->with('success', "Berhasil menghubungkan toko Shopee: {$storeName}!");
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
            $config->status = 'disconnected';
            $config->save();
        }

        return back()->with('success', 'Koneksi akun toko Shopee berhasil diputus.');
    }

    /**
     * Test connection on-the-fly.
     */
    public function testConnection(Request $request, Project $project)
    {
        $partnerId = $request->input('partner_id') ?: $project->shopeeConfig?->partner_id;
        $partnerKey = $request->input('partner_key') ?: $project->shopeeConfig?->partner_key;
        $isSandbox = $request->boolean('is_sandbox');

        $result = ShopeeClientService::testCredentials(
            $partnerId,
            $partnerKey,
            $isSandbox,
            $project->shopeeConfig?->shop_id,
            $project->shopeeConfig?->access_token
        );

        return response()->json($result);
    }
}
