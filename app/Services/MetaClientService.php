<?php

namespace App\Services;

use App\Models\ProjectMetaConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaClientService
{
    protected const GRAPH_API_VERSION = 'v21.0';
    protected const BASE_URL = 'https://graph.facebook.com/' . self::GRAPH_API_VERSION;

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
    public static function getCampaigns(ProjectMetaConfig $config): array
    {
        if (!$config->isConnected() || empty($config->access_token)) {
            return [];
        }

        $formattedId = self::formatAdAccountId($config->ad_account_id);

        try {
            $response = Http::timeout(15)->get(self::BASE_URL . "/{$formattedId}/campaigns", [
                'fields' => 'id,name,status,objective,daily_budget,lifetime_budget,updated_time',
                'limit' => 20,
                'access_token' => $config->access_token,
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }

            return [];
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
}
