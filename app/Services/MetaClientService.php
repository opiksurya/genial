<?php

namespace App\Services;

use App\Models\ProjectMetaConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaClientService
{
    public const GRAPH_API_VERSION = 'v21.0';
    public const BASE_URL = 'https://graph.facebook.com/' . self::GRAPH_API_VERSION;

    /**
     * Format Ad Account ID with 'act_' prefix if needed.
     */
    public static function formatAdAccountId(string $adAccountId): string
    {
        $clean = trim($adAccountId);
        return str_starts_with($clean, 'act_') ? $clean : 'act_' . $clean;
    }

    /**
     * Test connection to a Meta Ad Account using provided credentials.
     */
    public static function testConnection(string $adAccountId, string $accessToken): array
    {
        $formattedId = self::formatAdAccountId($adAccountId);

        try {
            $response = Http::timeout(15)->get(self::BASE_URL . "/{$formattedId}", [
                'fields' => 'id,name,account_status,currency,timezone_name,amount_spent,balance,created_time',
                'access_token' => $accessToken,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'Berhasil terhubung ke Akun Iklan Meta: ' . ($data['name'] ?? $formattedId),
                    'data' => [
                        'ad_account_id' => $data['id'] ?? $formattedId,
                        'account_name' => $data['name'] ?? 'Meta Ad Account',
                        'currency' => $data['currency'] ?? 'IDR',
                        'timezone_name' => $data['timezone_name'] ?? 'Asia/Jakarta',
                        'account_status' => $data['account_status'] ?? 1,
                        'amount_spent' => isset($data['amount_spent']) ? ((float) $data['amount_spent']) / 100 : 0,
                    ],
                ];
            }

            $error = $response->json('error');
            $errorMessage = $error['message'] ?? 'Gagal menghubungi server Meta Graph API';
            $errorUserMsg = $error['error_user_msg'] ?? null;

            return [
                'success' => false,
                'message' => $errorUserMsg ?: $errorMessage,
                'error_code' => $error['code'] ?? $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('Meta Client Connection Test Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Koneksi error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Test Pixel validity.
     */
    public static function testPixel(string $pixelId, string $accessToken): array
    {
        $cleanId = trim($pixelId);

        try {
            $response = Http::timeout(10)->get(self::BASE_URL . "/{$cleanId}", [
                'fields' => 'id,name,is_unavailable',
                'access_token' => $accessToken,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'Pixel ditemukan: ' . ($data['name'] ?? $cleanId),
                    'data' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json('error.message') ?? 'Pixel ID tidak ditemukan atau token tidak punya akses.',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Pixel test error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Sync latest account details and status for a project's meta config.
     */
    public static function syncAccount(ProjectMetaConfig $config): array
    {
        if (empty($config->ad_account_id) || empty($config->access_token)) {
            $config->update([
                'status' => 'disconnected',
                'error_message' => 'Ad Account ID atau Access Token belum diisi.',
            ]);
            return ['success' => false, 'message' => 'Data kredensial Meta belum lengkap.'];
        }

        $result = self::testConnection($config->ad_account_id, $config->access_token);

        if ($result['success']) {
            $data = $result['data'];
            $config->update([
                'account_name' => $data['account_name'],
                'currency' => $data['currency'],
                'timezone_name' => $data['timezone_name'],
                'account_status' => $data['account_status'],
                'status' => 'connected',
                'error_message' => null,
                'last_synced_at' => now(),
                'meta_raw_data' => $data,
            ]);
            return ['success' => true, 'message' => 'Data akun Meta berhasil disinkronkan.', 'config' => $config];
        }

        $config->update([
            'status' => 'error',
            'error_message' => $result['message'],
            'last_synced_at' => now(),
        ]);

        return ['success' => false, 'message' => $result['message']];
    }

    /**
     * Fetch active campaigns for this client.
     */
    /**
     * Fetch all campaigns for this client with live insights.
     */
    public static function getCampaigns(ProjectMetaConfig $config): array
    {
        if (!$config->isConnected() || empty($config->access_token)) {
            return [];
        }

        $formattedId = self::formatAdAccountId($config->ad_account_id);

        try {
            $response = Http::timeout(20)->get(self::BASE_URL . "/{$formattedId}/campaigns", [
                'fields' => 'id,name,status,objective,daily_budget,lifetime_budget,updated_time,insights.date_preset(last_30d){spend,impressions,clicks,cpc,ctr,actions,purchase_roas}',
                'limit' => 50,
                'access_token' => $config->access_token,
            ]);

            if (!$response->successful()) {
                Log::warning('Meta getCampaigns failed: ' . $response->body());
                return [];
            }

            $rawCampaigns = $response->json('data') ?? [];
            $campaigns = [];

            foreach ($rawCampaigns as $c) {
                $insight = $c['insights']['data'][0] ?? null;

                $spend = isset($insight['spend']) ? (float) $insight['spend'] : 0;
                $impressions = isset($insight['impressions']) ? (int) $insight['impressions'] : 0;
                $clicks = isset($insight['clicks']) ? (int) $insight['clicks'] : 0;
                $cpc = isset($insight['cpc']) ? (float) $insight['cpc'] : 0;
                $ctr = isset($insight['ctr']) ? (float) $insight['ctr'] : 0;

                // Extract ROAS
                $roas = 0;
                if (!empty($insight['purchase_roas'])) {
                    $roas = (float) ($insight['purchase_roas'][0]['value'] ?? 0);
                }

                // Extract Purchases / Orders & Leads & ATC
                $purchases = 0;
                $leads = 0;
                $atc = 0;

                if (!empty($insight['actions'])) {
                    foreach ($insight['actions'] as $act) {
                        $type = $act['action_type'] ?? '';
                        $val = (int) ($act['value'] ?? 0);

                        if (in_array($type, ['omni_purchase', 'purchase', 'catalog_sales'])) {
                            $purchases += $val;
                        } elseif (in_array($type, ['lead', 'contact_total'])) {
                            $leads += $val;
                        } elseif (in_array($type, ['omni_add_to_cart', 'add_to_cart'])) {
                            $atc += $val;
                        }
                    }
                }

                $budget = null;
                $budgetType = 'daily';
                if (!empty($c['daily_budget'])) {
                    $budget = (float) $c['daily_budget'];
                    $budgetType = 'daily';
                } elseif (!empty($c['lifetime_budget'])) {
                    $budget = (float) $c['lifetime_budget'];
                    $budgetType = 'lifetime';
                }

                $campaigns[] = [
                    'id' => $c['id'],
                    'name' => $c['name'],
                    'status' => $c['status'],
                    'objective' => $c['objective'] ?? 'UNKNOWN',
                    'budget' => $budget,
                    'budget_type' => $budgetType,
                    'updated_time' => $c['updated_time'] ?? null,
                    'spend' => $spend,
                    'impressions' => $impressions,
                    'clicks' => $clicks,
                    'cpc' => $cpc,
                    'ctr' => $ctr,
                    'roas' => round($roas, 2),
                    'purchases' => $purchases,
                    'leads' => $leads,
                    'atc' => $atc,
                ];
            }

            return $campaigns;
        } catch (\Exception $e) {
            Log::error('Meta getCampaigns error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Fetch overall insights / performance for this client's ad account.
     */
    public static function getAccountInsights(ProjectMetaConfig $config, string $datePreset = 'last_7d'): ?array
    {
        if (!$config->isConnected() || empty($config->access_token)) {
            return null;
        }

        $formattedId = self::formatAdAccountId($config->ad_account_id);

        try {
            $response = Http::timeout(20)->get(self::BASE_URL . "/{$formattedId}/insights", [
                'fields' => 'spend,impressions,reach,clicks,cpc,cpm,ctr,purchase_roas,actions,cost_per_action_type',
                'date_preset' => $datePreset,
                'access_token' => $config->access_token,
            ]);

            if ($response->successful()) {
                $data = $response->json('data');
                return !empty($data[0]) ? $data[0] : null;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Meta getAccountInsights error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate Facebook OAuth authorization URL for 1-click connect.
     */
    public static function generateOAuthUrl(string $appId, string $redirectUri, string $state): string
    {
        $scopes = ['ads_read', 'ads_management', 'read_insights', 'public_profile', 'email'];

        return 'https://www.facebook.com/' . self::GRAPH_API_VERSION . '/dialog/oauth?' . http_build_query([
            'client_id' => trim($appId),
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'response_type' => 'code',
            'scope' => implode(',', $scopes),
        ]);
    }

    /**
     * Exchange OAuth code for Long-Lived User Access Token and user profile.
     */
    public static function handleOAuthCallback(string $code, string $appId, string $appSecret, string $redirectUri): array
    {
        try {
            // Step 1: Exchange code for short-lived token
            $shortResponse = Http::timeout(15)->get(self::BASE_URL . '/oauth/access_token', [
                'client_id' => trim($appId),
                'client_secret' => trim($appSecret),
                'redirect_uri' => $redirectUri,
                'code' => trim($code),
            ]);

            if (!$shortResponse->successful()) {
                $errMsg = $shortResponse->json('error.message') ?? 'Gagal menukarkan kode otorisasi Facebook.';
                Log::warning('Meta short-lived token exchange failed: ' . $shortResponse->body());
                return ['success' => false, 'message' => $errMsg];
            }

            $shortToken = $shortResponse->json('access_token');

            // Step 2: Exchange for long-lived access token (~60 days)
            $longResponse = Http::timeout(15)->get(self::BASE_URL . '/oauth/access_token', [
                'grant_type' => 'fb_exchange_token',
                'client_id' => trim($appId),
                'client_secret' => trim($appSecret),
                'fb_exchange_token' => $shortToken,
            ]);

            $longToken = $longResponse->successful() ? $longResponse->json('access_token') : $shortToken;
            $expiresIn = $longResponse->successful() ? (int) $longResponse->json('expires_in', 5184000) : 5184000;

            // Step 3: Fetch Facebook User profile (Name & ID)
            $profileResponse = Http::timeout(10)->get(self::BASE_URL . '/me', [
                'fields' => 'id,name,email',
                'access_token' => $longToken,
            ]);

            $profile = $profileResponse->successful() ? $profileResponse->json() : [];

            // Step 4: Fetch user's accessible Ad Accounts
            $adAccountsResponse = Http::timeout(15)->get(self::BASE_URL . '/me/adaccounts', [
                'fields' => 'id,account_id,name,currency,account_status',
                'limit' => 25,
                'access_token' => $longToken,
            ]);

            $adAccounts = $adAccountsResponse->successful() ? ($adAccountsResponse->json('data') ?? []) : [];

            return [
                'success' => true,
                'access_token' => $longToken,
                'expires_in' => $expiresIn,
                'fb_user_id' => $profile['id'] ?? null,
                'fb_user_name' => $profile['name'] ?? null,
                'ad_accounts' => $adAccounts,
            ];
        } catch (\Exception $e) {
            Log::error('Meta handleOAuthCallback exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Koneksi ke Facebook error: ' . $e->getMessage()];
        }
    }
}
