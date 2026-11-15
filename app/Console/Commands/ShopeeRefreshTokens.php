<?php

namespace App\Console\Commands;

use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeTokenService;
use Illuminate\Console\Command;

class ShopeeRefreshTokens extends Command
{
    protected $signature = 'shopee:refresh-tokens';

    protected $description = 'Refresh Shopee access tokens that are expired or about to expire';

    public function handle(ShopeeTokenService $tokens): int
    {
        $failed = 0;
        $refreshed = 0;

        ProjectShopeeConfig::where('status', 'connected')
            ->whereNotNull('refresh_token')
            ->each(function (ProjectShopeeConfig $config) use ($tokens, &$failed, &$refreshed) {
                // Refresh well before expiry so a missed run does not break the connection.
                if (! $config->accessTokenExpiresWithin(3600)) {
                    return;
                }

                if ($tokens->refresh($config)) {
                    $refreshed++;
                } else {
                    $failed++;
                    $this->warn("Project #{$config->project_id}: {$config->error_message}");
                }
            });

        $this->info("Refreshed: {$refreshed}, failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
