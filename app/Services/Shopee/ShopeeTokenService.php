<?php

namespace App\Services\Shopee;

use App\Models\ProjectShopeeConfig;
use Illuminate\Support\Facades\Log;

/**
 * Keeps a shop's access token alive and runs authenticated Shopee API calls for it.
 * Access tokens last about 4 hours; refresh tokens about 30 days and rotate on every refresh.
 */
class ShopeeTokenService
{
    public const REFRESH_LEEWAY_SECONDS = 600;

    /**
     * Refresh the shop's tokens now. On failure the config is flagged so the UI can ask for re-authorization.
     */
    public function refresh(ProjectShopeeConfig $config): bool
    {
        if (empty($config->refresh_token) || empty($config->shop_id) || ! $config->hasCredentials()) {
            return $this->markFailed($config, 'Token refresh tidak tersedia. Hubungkan ulang toko Shopee.', true);
        }

        if ($config->refresh_expires_at !== null && $config->refresh_expires_at->isPast()) {
            return $this->markFailed($config, 'Otorisasi Shopee kedaluwarsa. Hubungkan ulang toko Shopee.', true);
        }

        $result = ShopeeClientService::refreshAccessToken(
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $config->refresh_token,
            $config->shop_id,
            $config->resolvedIsSandbox()
        );

        if (! $result['success']) {
            // Authorization errors mean the refresh token is dead; anything else may be transient.
            $permanent = in_array($result['code'] ?? null, ['error_auth', 'error_param', 'error_shop_not_found'], true);

            return $this->markFailed($config, $result['message'], $permanent);
        }

        $config->access_token = $result['access_token'];
        $config->refresh_token = $result['refresh_token'];
        $config->token_expires_at = now()->addSeconds($result['expires_in']);
        $config->refresh_expires_at = now()->addDays(30);
        $config->status = 'connected';
        $config->error_message = null;
        $config->save();

        return true;
    }

    /**
     * Refresh only when the access token is close to expiry.
     */
    public function ensureFresh(ProjectShopeeConfig $config): bool
    {
        if (! $config->accessTokenExpiresWithin(self::REFRESH_LEEWAY_SECONDS)) {
            return true;
        }

        return $this->refresh($config);
    }

    /**
     * Authenticated call for a connected shop. Refreshes first when needed and retries once on an auth error.
     *
     * @param  array<string, mixed>  $params
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     *
     * @throws ShopeeApiException
     */
    public function call(ProjectShopeeConfig $config, string $method, string $path, array $params = [], array $body = []): array
    {
        if (! $config->isConnected() || ! $config->hasCredentials()) {
            throw new ShopeeApiException('Toko Shopee belum terhubung.');
        }

        if (! $this->ensureFresh($config)) {
            throw new ShopeeApiException($config->error_message ?: 'Token Shopee tidak dapat diperbarui.');
        }

        $attempt = fn () => ShopeeClientService::shopRequest(
            $method,
            $path,
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $config->access_token,
            $config->shop_id,
            $config->resolvedIsSandbox(),
            $params,
            $body
        );

        try {
            return $attempt();
        } catch (ShopeeApiException $e) {
            if (! $e->isAuthError() || ! $this->refresh($config)) {
                throw $e;
            }

            return $attempt();
        }
    }

    private function markFailed(ProjectShopeeConfig $config, string $message, bool $permanent): bool
    {
        Log::warning('Shopee token refresh failed', ['project_id' => $config->project_id, 'shop_id' => $config->shop_id, 'message' => $message]);

        $config->error_message = $message;

        if ($permanent) {
            $config->status = 'error';
        }

        $config->save();

        return false;
    }
}
