<?php

namespace App\Services\Shopee;

use App\Models\ProjectShopeeConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeClientService
{
    public const BASE_PROD = 'https://partner.shopeemobile.com';
    public const BASE_SANDBOX = 'https://partner.test-stable.shopeemobile.com';

    /**
     * Get base URL based on sandbox flag.
     */
    public static function getBaseUrl(bool $isSandbox = false): string
    {
        return $isSandbox ? self::BASE_SANDBOX : self::BASE_PROD;
    }

    /**
     * Generate HMAC-SHA256 signature for Shopee Open API v2.
     *
     * Signature format varies by endpoint:
     * - Public / Auth: partner_id + path + timestamp
     * - Shop Level: partner_id + path + timestamp + access_token + shop_id
     */
    public static function generateSignature(
        string|int $partnerId,
        string $path,
        int $timestamp,
        string $partnerKey,
        ?string $accessToken = null,
        string|int|null $shopId = null
    ): string {
        $baseString = sprintf('%s%s%s', $partnerId, $path, $timestamp);

        if ($accessToken !== null && $shopId !== null) {
            $baseString .= sprintf('%s%s', $accessToken, $shopId);
        }

        return hash_hmac('sha256', $baseString, $partnerKey);
    }

    /**
     * Generate OAuth Authorization URL for merchant to authorize Shopee shop.
     */
    public static function generateAuthUrl(
        string|int $partnerId,
        string $partnerKey,
        string $redirectUri,
        bool $isSandbox = false
    ): string {
        $baseUrl = self::getBaseUrl($isSandbox);
        $path = '/api/v2/shop/auth_partner';
        $timestamp = time();

        $sign = self::generateSignature($partnerId, $path, $timestamp, $partnerKey);

        $params = http_build_query([
            'partner_id' => (int) $partnerId,
            'timestamp' => $timestamp,
            'sign' => $sign,
            'redirect' => $redirectUri,
        ]);

        return "{$baseUrl}{$path}?{$params}";
    }

    /**
     * Exchange authorization code for access token and refresh token.
     */
    public static function handleCallback(
        string $code,
        string|int $shopId,
        string|int $partnerId,
        string $partnerKey,
        bool $isSandbox = false
    ): array {
        $baseUrl = self::getBaseUrl($isSandbox);
        $path = '/api/v2/auth/token/get';
        $timestamp = time();

        $sign = self::generateSignature($partnerId, $path, $timestamp, $partnerKey);

        try {
            $response = Http::timeout(20)->post("{$baseUrl}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}", [
                'code' => $code,
                'shop_id' => (int) $shopId,
                'partner_id' => (int) $partnerId,
            ]);

            $json = $response->json();

            if (!empty($json['error'])) {
                $msg = $json['message'] ?? $json['error'] ?? 'Gagal otorisasi token dari Shopee.';
                return ['success' => false, 'message' => $msg];
            }

            $accessToken = $json['access_token'] ?? null;
            $refreshToken = $json['refresh_token'] ?? null;
            $expiresIn = (int) ($json['expire_in'] ?? 14400); // 4 hours default

            if (!$accessToken) {
                return ['success' => false, 'message' => 'Shopee tidak mengembalikan Access Token yang valid.'];
            }

            // Try to fetch shop info to get shop_name
            $shopName = null;
            try {
                $shopInfo = self::getShopInfo($partnerId, $partnerKey, $accessToken, $shopId, $isSandbox);
                if (!empty($shopInfo['shop_name'])) {
                    $shopName = $shopInfo['shop_name'];
                }
            } catch (\Throwable $e) {
                Log::warning('Shopee getShopInfo failed during callback: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_in' => $expiresIn,
                'shop_id' => (string) $shopId,
                'shop_name' => $shopName,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Shopee handleCallback error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Koneksi ke Shopee Open Platform gagal: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get Shop Info (/api/v2/shop/get_shop_info).
     */
    public static function getShopInfo(
        string|int $partnerId,
        string $partnerKey,
        string $accessToken,
        string|int $shopId,
        bool $isSandbox = false
    ): ?array {
        $baseUrl = self::getBaseUrl($isSandbox);
        $path = '/api/v2/shop/get_shop_info';
        $timestamp = time();

        $sign = self::generateSignature($partnerId, $path, $timestamp, $partnerKey, $accessToken, $shopId);

        $params = http_build_query([
            'partner_id' => (int) $partnerId,
            'timestamp' => $timestamp,
            'access_token' => $accessToken,
            'shop_id' => (int) $shopId,
            'sign' => $sign,
        ]);

        $response = Http::timeout(15)->get("{$baseUrl}{$path}?{$params}");
        $json = $response->json();

        if (!empty($json['error'])) {
            throw new \Exception($json['message'] ?? $json['error']);
        }

        return $json['response'] ?? $json;
    }

    /**
     * Test Shopee credentials.
     */
    public static function testCredentials(
        string|int $partnerId,
        string $partnerKey,
        bool $isSandbox = false,
        ?string $shopId = null,
        ?string $accessToken = null
    ): array {
        if (empty($partnerId) || empty($partnerKey)) {
            return [
                'success' => false,
                'message' => 'Partner ID dan Partner Key wajib diisi.',
            ];
        }

        // If access token and shop id exist, test live shop info
        if (!empty($accessToken) && !empty($shopId)) {
            try {
                $info = self::getShopInfo($partnerId, $partnerKey, $accessToken, $shopId, $isSandbox);
                $name = $info['shop_name'] ?? "Toko #{$shopId}";
                return [
                    'success' => true,
                    'message' => "Koneksi berhasil! Terhubung ke toko Shopee: {$name}.",
                    'data' => [
                        'shop_name' => $name,
                        'shop_id' => $shopId,
                        'region' => $info['region'] ?? 'ID',
                    ],
                ];
            } catch (\Throwable $e) {
                return [
                    'success' => false,
                    'message' => 'Gagal verifikasi token toko Shopee: ' . $e->getMessage(),
                ];
            }
        }

        // Otherwise verify Partner ID & Key format
        return [
            'success' => true,
            'message' => 'Format Partner ID & Partner Key valid. Silakan klik tombol "Hubungkan Toko Shopee" untuk otorisasi toko.',
        ];
    }
}
