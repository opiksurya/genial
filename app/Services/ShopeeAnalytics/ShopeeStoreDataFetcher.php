<?php

namespace App\Services\ShopeeAnalytics;

use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeApiException;
use App\Services\Shopee\ShopeeTokenService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

/**
 * Pulls raw order, return, product and category data for one connected shop from Shopee Open API.
 * Buyer personal data (name, address, phone) is never requested.
 */
class ShopeeStoreDataFetcher
{
    /** Shopee limits order and return queries to a 15 day window. */
    private const int WINDOW_DAYS = 14;

    private const int PAGE_SIZE = 100;

    private const int DETAIL_CHUNK = 50;

    private const int MAX_ITEMS = 1000;

    public function __construct(private ShopeeTokenService $tokens) {}

    /**
     * Orders created in [from, to], newest window first so that a cap drops the oldest data.
     *
     * @return array{orders: list<array<string, mixed>>, truncated: bool}
     */
    public function orders(ProjectShopeeConfig $config, CarbonImmutable $from, CarbonImmutable $to, int $maxOrders): array
    {
        $orderSns = [];
        $truncated = false;

        foreach ($this->windows($from, $to) as [$windowFrom, $windowTo]) {
            $cursor = '';

            do {
                $response = $this->tokens->call($config, 'GET', '/api/v2/order/get_order_list', array_filter([
                    'time_range_field' => 'create_time',
                    'time_from' => $windowFrom,
                    'time_to' => $windowTo,
                    'page_size' => self::PAGE_SIZE,
                    'cursor' => $cursor,
                ], fn ($value) => $value !== ''))['response'] ?? [];

                foreach ($response['order_list'] ?? [] as $row) {
                    $orderSns[] = (string) $row['order_sn'];
                }

                $cursor = (string) ($response['next_cursor'] ?? '');

                if (count($orderSns) >= $maxOrders) {
                    $orderSns = array_slice($orderSns, 0, $maxOrders);
                    $truncated = ! empty($response['more']);

                    break 2;
                }
            } while (! empty($response['more']) && $cursor !== '');
        }

        $orders = [];

        foreach (array_chunk($orderSns, self::DETAIL_CHUNK) as $chunk) {
            $detail = $this->tokens->call($config, 'GET', '/api/v2/order/get_order_detail', [
                'order_sn_list' => implode(',', $chunk),
                'response_optional_fields' => 'item_list,total_amount',
            ])['response']['order_list'] ?? [];

            array_push($orders, ...$detail);
        }

        return ['orders' => $orders, 'truncated' => $truncated];
    }

    /**
     * Returns requested in [from, to], keyed by order_sn. Returns an empty list when the shop has no returns access.
     *
     * @return array<string, float>|null order_sn => refund amount, or null when the API is not available to this app
     */
    public function returns(ProjectShopeeConfig $config, CarbonImmutable $from, CarbonImmutable $to): ?array
    {
        $returns = [];

        try {
            foreach ($this->windows($from, $to) as [$windowFrom, $windowTo]) {
                $page = 0;

                do {
                    $response = $this->tokens->call($config, 'GET', '/api/v2/returns/get_return_list', [
                        'page_no' => $page,
                        'page_size' => self::PAGE_SIZE,
                        'create_time_from' => $windowFrom,
                        'create_time_to' => $windowTo,
                    ])['response'] ?? [];

                    foreach ($response['return'] ?? [] as $row) {
                        $returns[(string) $row['order_sn']] = (float) ($row['refund_amount'] ?? 0);
                    }

                    $page++;
                } while (! empty($response['more']) && $page < 50);
            }
        } catch (ShopeeApiException) {
            return null;
        }

        return $returns;
    }

    /**
     * Active products with price, stock and category.
     *
     * @return list<array<string, mixed>>
     */
    public function items(ProjectShopeeConfig $config): array
    {
        $ids = [];
        $offset = 0;

        do {
            $response = $this->tokens->call($config, 'GET', '/api/v2/product/get_item_list', [
                'offset' => $offset,
                'page_size' => self::PAGE_SIZE,
                'item_status' => 'NORMAL',
            ])['response'] ?? [];

            foreach ($response['item'] ?? [] as $row) {
                $ids[] = (int) $row['item_id'];
            }

            $offset = (int) ($response['next_offset'] ?? 0);
        } while (! empty($response['has_next_page']) && count($ids) < self::MAX_ITEMS);

        $items = [];

        foreach (array_chunk($ids, self::DETAIL_CHUNK) as $chunk) {
            $detail = $this->tokens->call($config, 'GET', '/api/v2/product/get_item_base_info', [
                'item_id_list' => implode(',', $chunk),
            ])['response']['item_list'] ?? [];

            array_push($items, ...$detail);
        }

        return $items;
    }

    /**
     * Category id => display name. Cached for a day because the tree is large and rarely changes.
     *
     * @return array<int, string>
     */
    public function categories(ProjectShopeeConfig $config): array
    {
        return Cache::remember('shopee_categories:'.$config->resolvedIsSandbox(), now()->addDay(), function () use ($config): array {
            try {
                $list = $this->tokens->call($config, 'GET', '/api/v2/product/get_category', ['language' => 'id'])['response']['category_list'] ?? [];
            } catch (ShopeeApiException) {
                return [];
            }

            $names = [];

            foreach ($list as $category) {
                $names[(int) $category['category_id']] = (string) ($category['display_category_name'] ?? $category['original_category_name'] ?? '');
            }

            return $names;
        });
    }

    /**
     * Split [from, to] into windows Shopee accepts, newest first, as unix timestamps.
     *
     * @return list<array{0: int, 1: int}>
     */
    private function windows(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $windows = [];
        $cursor = $to->endOfDay();
        $floor = $from->startOfDay();

        while ($cursor->gte($floor)) {
            $windowStart = $cursor->subDays(self::WINDOW_DAYS)->addSecond()->startOfDay();
            $windowStart = $windowStart->lt($floor) ? $floor : $windowStart;
            $windows[] = [$windowStart->timestamp, $cursor->timestamp];
            $cursor = $windowStart->subSecond();
        }

        return $windows;
    }
}
