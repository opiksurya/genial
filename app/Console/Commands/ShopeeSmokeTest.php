<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\Shopee\ShopeeApiException;
use App\Services\Shopee\ShopeeTokenService;
use Illuminate\Console\Command;

class ShopeeSmokeTest extends Command
{
    protected $signature = 'shopee:smoke-test {project : Project ID or slug}';

    protected $description = 'Call the core Shopee APIs for a connected shop (use the sandbox shop to prepare app review)';

    public function handle(ShopeeTokenService $tokens): int
    {
        $project = Project::where('id', $this->argument('project'))
            ->orWhere('slug', $this->argument('project'))
            ->first();

        $config = $project?->shopeeConfig;

        if (! $config || ! $config->isConnected()) {
            $this->error('Proyek tidak ditemukan atau toko Shopee belum terhubung.');

            return self::FAILURE;
        }

        $this->line(sprintf('Toko #%s (%s) — %s', $config->shop_id, $config->shop_name, $config->resolvedIsSandbox() ? 'SANDBOX' : 'PRODUCTION'));

        $now = now()->timestamp;
        $calls = [
            'shop.get_shop_info' => ['GET', '/api/v2/shop/get_shop_info', []],
            'shop.get_profile' => ['GET', '/api/v2/shop/get_profile', []],
            'order.get_order_list' => ['GET', '/api/v2/order/get_order_list', [
                'time_range_field' => 'create_time',
                'time_from' => $now - 86400 * 7,
                'time_to' => $now,
                'page_size' => 20,
            ]],
            'product.get_item_list' => ['GET', '/api/v2/product/get_item_list', [
                'offset' => 0,
                'page_size' => 20,
                'item_status' => 'NORMAL',
            ]],
            'logistics.get_channel_list' => ['GET', '/api/v2/logistics/get_channel_list', []],
        ];

        $failures = 0;

        foreach ($calls as $name => [$method, $path, $params]) {
            try {
                $response = $tokens->call($config, $method, $path, $params);
                $this->info(sprintf('  OK   %-28s request_id=%s', $name, $response['request_id'] ?? '-'));
            } catch (ShopeeApiException $e) {
                $failures++;
                $this->error(sprintf('  FAIL %-28s %s%s', $name, $e->errorCode ? "[{$e->errorCode}] " : '', $e->getMessage()));
            }
        }

        $config->forceFill(['last_synced_at' => now()])->save();

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }
}
