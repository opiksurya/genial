<?php

namespace App\Services\ShopeeAnalytics;

use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeApiException;
use Carbon\CarbonImmutable;

/**
 * Shopee analytics built from the connected shop's real Open API data, in the same shape as the dummy source.
 *
 * Revenue is the value of COMPLETED orders. Ads, live/video content, product views and conversion
 * are not available through the order and product APIs, so those sections are reported as unavailable
 * instead of being invented.
 */
class ShopeeLiveDataService
{
    public const int MAX_ORDERS = 2000;

    private const int LOW_STOCK_DAYS_OF_COVER = 14;

    private const float SLOW_MOVING_UNITS_PER_DAY = 0.15;

    private const array STATUS_LABELS = [
        'completed' => 'Selesai',
        'cancelled' => 'Batal',
        'returned' => 'Retur',
    ];

    public function __construct(private ShopeeStoreDataFetcher $fetcher) {}

    /**
     * @return array<string, mixed>
     *
     * @throws ShopeeApiException
     */
    public function report(ShopeePeriod $period, CarbonImmutable $endDate, Project $project, ProjectShopeeConfig $config): array
    {
        $end = $endDate->startOfDay();
        $start = $end->subDays($period->value - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($period->value - 1);

        $fetched = $this->fetcher->orders($config, $previousStart, $end, self::MAX_ORDERS);
        $returns = $this->fetcher->returns($config, $previousStart, $end);
        $items = $this->fetcher->items($config);
        $categories = $this->fetcher->categories($config);

        $catalog = $this->catalog($items, $categories);
        $current = $this->aggregate($fetched['orders'], $returns ?? [], $start, $end);
        $previous = $this->aggregate($fetched['orders'], $returns ?? [], $previousStart, $previousEnd);

        $unavailable = ['ads', 'content', 'views'];
        if ($returns === null) {
            $unavailable[] = 'returns';
        }

        return [
            'isConnected' => true,
            'storeName' => $config->shop_name ?: (($project->client ?: $project->name).' Store'),
            'projectId' => $project->id,
            'projectName' => $project->name,
            'clientName' => $project->client,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previousStart' => $previousStart->toDateString(),
                'previousEnd' => $previousEnd->toDateString(),
            ],
            'summary' => $this->summary($current, $previous),
            'sales' => $this->sales($current, $catalog, $start),
            'ads' => $this->emptyAds(),
            'content' => $this->emptyContent(),
            'storefront' => $this->storefront($catalog, $current, $period->value),
            'meta' => [
                'unavailable' => $unavailable,
                'truncated' => $fetched['truncated'],
                'maxOrders' => self::MAX_ORDERS,
                'generatedAt' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Same shape as a live report, with every number at zero. Shown when no shop is connected
     * (or the Shopee call failed) so nothing invented is ever presented as store data.
     *
     * @return array<string, mixed>
     */
    public function disconnectedReport(ShopeePeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
    {
        $end = $endDate->startOfDay();
        $start = $end->subDays($period->value - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($period->value - 1);

        $current = $this->aggregate([], [], $start, $end);

        return [
            'isConnected' => false,
            'storeName' => $project ? ($project->client ?: $project->name) : 'Belum ada proyek',
            'projectId' => $project?->id,
            'projectName' => $project?->name,
            'clientName' => $project?->client,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previousStart' => $previousStart->toDateString(),
                'previousEnd' => $previousEnd->toDateString(),
            ],
            'summary' => ['kpis' => $this->zeroKpis(), 'channels' => []],
            'sales' => $this->sales($current, [], $start),
            'ads' => $this->emptyAds($current['daily']),
            'content' => $this->emptyContent(),
            'storefront' => $this->storefront([], $current, $period->value),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function zeroKpis(): array
    {
        $definitions = [
            'revenue' => ['Omzet (Pesanan Selesai)', 'currency', true],
            'orders' => ['Total Pesanan', 'number', true],
            'aov' => ['Rata-rata Nilai Pesanan (AOV)', 'currency', true],
            'conversionRate' => ['Tingkat Konversi', 'percent', true],
            'adSpend' => ['Biaya Iklan', 'currency', false],
            'roas' => ['ROAS Iklan', 'ratio', true],
            'contentRevenue' => ['Omzet dari Live & Video', 'currency', true],
            'cancellationRate' => ['Rasio Batal & Retur', 'percent', false],
        ];

        $kpis = [];
        foreach ($definitions as $key => [$label, $format, $higherIsBetter]) {
            $kpis[] = ['key' => $key, 'label' => $label, 'format' => $format, 'higherIsBetter' => $higherIsBetter, 'value' => 0, 'previous' => 0, 'change' => null];
        }

        return $kpis;
    }

    /**
     * Index active products by item id.
     *
     * @param  list<array<string, mixed>>  $items
     * @param  array<int, string>  $categories
     * @return array<int, array<string, mixed>>
     */
    private function catalog(array $items, array $categories): array
    {
        $catalog = [];

        foreach ($items as $item) {
            $id = (int) $item['item_id'];
            $stock = $item['stock_info_v2']['summary_info']['total_available_stock']
                ?? $item['stock_info'][0]['current_stock']
                ?? 0;

            $catalog[$id] = [
                'id' => $id,
                'sku' => (string) ($item['item_sku'] ?? ''),
                'name' => (string) ($item['item_name'] ?? "Produk #{$id}"),
                'etalase' => $categories[(int) ($item['category_id'] ?? 0)] ?? 'Tanpa Kategori',
                'price' => (int) round((float) ($item['price_info'][0]['current_price'] ?? 0)),
                'stock' => (int) $stock,
            ];
        }

        return $catalog;
    }

    /**
     * Group orders created inside [start, end] by day and product.
     *
     * @param  list<array<string, mixed>>  $orders
     * @param  array<string, float>  $returns
     * @return array<string, mixed>
     */
    private function aggregate(array $orders, array $returns, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $timezone = config('app.timezone');
        $daily = [];

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $daily[$date->toDateString()] = ['date' => $date->toDateString(), 'revenue' => 0, 'orders' => 0, 'completed' => 0];
        }

        $totals = ['revenue' => 0, 'orders' => 0, 'completed' => 0, 'cancelled' => 0, 'returned' => 0, 'units' => 0, 'cancelledValue' => 0, 'returnedValue' => 0];
        $products = [];

        foreach ($orders as $order) {
            $day = CarbonImmutable::createFromTimestamp((int) ($order['create_time'] ?? 0), $timezone)->toDateString();

            if (! isset($daily[$day])) {
                continue;
            }

            $sn = (string) $order['order_sn'];
            $value = (int) round((float) ($order['total_amount'] ?? 0));
            $status = $this->status((string) ($order['order_status'] ?? ''), isset($returns[$sn]));

            $totals['orders']++;
            $daily[$day]['orders']++;

            if ($status === 'cancelled') {
                $totals['cancelled']++;
                $totals['cancelledValue'] += $value;
            } elseif ($status === 'returned') {
                $totals['returned']++;
                $totals['returnedValue'] += (int) round($returns[$sn] ?: $value);
            } elseif ($status === 'completed') {
                $totals['completed']++;
                $totals['revenue'] += $value;
                $daily[$day]['completed']++;
                $daily[$day]['revenue'] += $value;

                foreach ($order['item_list'] ?? [] as $line) {
                    $itemId = (int) $line['item_id'];
                    $quantity = (int) ($line['model_quantity_purchased'] ?? 1);
                    $lineValue = (int) round((float) ($line['model_discounted_price'] ?? $line['model_original_price'] ?? 0) * $quantity);

                    $products[$itemId] ??= [
                        'name' => (string) ($line['item_name'] ?? "Produk #{$itemId}"),
                        'sku' => (string) ($line['model_sku'] ?: ($line['item_sku'] ?? '')),
                        'orders' => 0, 'units' => 0, 'revenue' => 0,
                    ];
                    $products[$itemId]['orders']++;
                    $products[$itemId]['units'] += $quantity;
                    $products[$itemId]['revenue'] += $lineValue;
                    $totals['units'] += $quantity;
                }
            }
        }

        return ['totals' => $totals, 'daily' => array_values($daily), 'products' => $products];
    }

    /**
     * Shopee has no "returned" order status; returns come from the returns API.
     * Orders still in progress (unpaid, to ship, shipped) only count towards the order total.
     */
    private function status(string $shopeeStatus, bool $hasReturn): string
    {
        if ($hasReturn && $shopeeStatus === 'COMPLETED') {
            return 'returned';
        }

        return match ($shopeeStatus) {
            'COMPLETED' => 'completed',
            'CANCELLED', 'IN_CANCEL' => 'cancelled',
            default => 'in_progress',
        };
    }

    /**
     * @param  array<string, mixed>  $current
     * @param  array<string, mixed>  $previous
     * @return array<string, mixed>
     */
    private function summary(array $current, array $previous): array
    {
        $kpis = fn (array $totals): array => [
            'revenue' => $totals['revenue'],
            'orders' => $totals['orders'],
            'aov' => $this->ratio($totals['revenue'], $totals['completed'], 0),
            'cancellationRate' => $this->ratio(($totals['cancelled'] + $totals['returned']) * 100, $totals['orders']),
        ];

        $definitions = [
            'revenue' => ['label' => 'Omzet (Pesanan Selesai)', 'format' => 'currency', 'higherIsBetter' => true],
            'orders' => ['label' => 'Total Pesanan', 'format' => 'number', 'higherIsBetter' => true],
            'aov' => ['label' => 'Rata-rata Nilai Pesanan (AOV)', 'format' => 'currency', 'higherIsBetter' => true],
            'cancellationRate' => ['label' => 'Rasio Batal & Retur', 'format' => 'percent', 'higherIsBetter' => false],
        ];

        $currentKpis = $kpis($current['totals']);
        $previousKpis = $kpis($previous['totals']);

        $items = [];
        foreach ($definitions as $key => $definition) {
            $items[] = [
                'key' => $key,
                ...$definition,
                'value' => $currentKpis[$key],
                'previous' => $previousKpis[$key],
                'change' => $previousKpis[$key] == 0 ? null : round(($currentKpis[$key] - $previousKpis[$key]) / $previousKpis[$key] * 100, 1),
            ];
        }

        return ['kpis' => $items, 'channels' => []];
    }

    /**
     * @param  array<string, mixed>  $current
     * @param  array<int, array<string, mixed>>  $catalog
     * @return array<string, mixed>
     */
    private function sales(array $current, array $catalog, CarbonImmutable $start): array
    {
        $totals = $current['totals'];

        $weekly = [];
        foreach ($current['daily'] as $day) {
            $weekStart = CarbonImmutable::parse($day['date'])->startOfWeek(CarbonImmutable::MONDAY)->toDateString();
            $weekly[$weekStart] ??= ['weekStart' => max($weekStart, $start->toDateString()), 'weekEnd' => $day['date'], 'revenue' => 0, 'orders' => 0, 'completed' => 0];
            $weekly[$weekStart]['weekEnd'] = $day['date'];
            $weekly[$weekStart]['revenue'] += $day['revenue'];
            $weekly[$weekStart]['orders'] += $day['orders'];
            $weekly[$weekStart]['completed'] += $day['completed'];
        }

        $statuses = [];
        foreach ([
            'completed' => [$totals['completed'], $totals['revenue']],
            'cancelled' => [$totals['cancelled'], $totals['cancelledValue']],
            'returned' => [$totals['returned'], $totals['returnedValue']],
        ] as $status => [$orders, $value]) {
            $statuses[] = [
                'status' => $status,
                'label' => self::STATUS_LABELS[$status],
                'orders' => $orders,
                'value' => $value,
                'share' => $this->ratio($orders * 100, $totals['orders'], 1),
            ];
        }

        $rows = [];
        foreach ($current['products'] as $itemId => $product) {
            $rows[] = [
                'id' => $itemId,
                'sku' => $product['sku'],
                'name' => $product['name'],
                'etalase' => $catalog[$itemId]['etalase'] ?? 'Produk Nonaktif',
                'orders' => $product['orders'],
                'units' => $product['units'],
                'revenue' => $product['revenue'],
                'share' => $this->ratio($product['revenue'] * 100, $totals['revenue'], 1),
            ];
        }
        usort($rows, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return [
            'totals' => [
                'revenue' => $totals['revenue'],
                'grossValue' => $totals['revenue'] + $totals['cancelledValue'] + $totals['returnedValue'],
                'orders' => $totals['orders'],
                'completed' => $totals['completed'],
                'cancelled' => $totals['cancelled'],
                'returned' => $totals['returned'],
                'units' => $totals['units'],
                'aov' => $this->ratio($totals['revenue'], $totals['completed'], 0),
            ],
            'daily' => $current['daily'],
            'weekly' => array_values($weekly),
            'statuses' => $statuses,
            'topProducts' => array_slice($rows, 0, 10),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $catalog
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>
     */
    private function storefront(array $catalog, array $current, int $days): array
    {
        $totalRevenue = $current['totals']['revenue'];
        $products = [];

        foreach ($catalog as $id => $item) {
            $stats = $current['products'][$id] ?? ['orders' => 0, 'units' => 0, 'revenue' => 0];
            $unitsPerDay = $stats['units'] / $days;
            $daysOfCover = $unitsPerDay > 0 ? (int) floor($item['stock'] / $unitsPerDay) : null;

            $products[] = [
                'id' => $id,
                'sku' => $item['sku'],
                'name' => $item['name'],
                'etalase' => $item['etalase'],
                'price' => $item['price'],
                'stock' => $item['stock'],
                'views' => 0,
                'orders' => $stats['orders'],
                'units' => $stats['units'],
                'revenue' => $stats['revenue'],
                'conversionRate' => 0,
                'daysOfCover' => $daysOfCover,
                'stockStatus' => match (true) {
                    $item['stock'] === 0 => 'habis',
                    $daysOfCover !== null && $daysOfCover < self::LOW_STOCK_DAYS_OF_COVER => 'menipis',
                    default => 'aman',
                },
                'isSlowMoving' => $stats['units'] <= $days * self::SLOW_MOVING_UNITS_PER_DAY,
            ];
        }

        $etalase = [];
        foreach ($products as $product) {
            $etalase[$product['etalase']] ??= ['name' => $product['etalase'], 'productCount' => 0, 'stock' => 0, 'views' => 0, 'orders' => 0, 'units' => 0, 'revenue' => 0];
            $etalase[$product['etalase']]['productCount']++;
            foreach (['stock', 'views', 'orders', 'units', 'revenue'] as $key) {
                $etalase[$product['etalase']][$key] += $product[$key];
            }
        }

        $etalase = array_map(fn (array $row): array => [
            ...$row,
            'conversionRate' => 0,
            'share' => $this->ratio($row['revenue'] * 100, $totalRevenue, 1),
        ], array_values($etalase));
        usort($etalase, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return [
            'etalase' => $etalase,
            'products' => $products,
            'slowMoving' => array_values(array_filter($products, fn (array $product): bool => $product['isSlowMoving'])),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return array<string, mixed>
     */
    private function emptyAds(array $days = []): array
    {
        $zero = ['spend' => 0, 'impressions' => 0, 'clicks' => 0, 'ctr' => 0, 'cpc' => 0, 'conversions' => 0, 'conversionRate' => 0, 'costPerConversion' => 0, 'revenue' => 0, 'roas' => 0];

        return [
            'totals' => $zero,
            'campaigns' => [],
            'daily' => array_map(fn (array $day): array => ['date' => $day['date'], 'spend' => 0, 'revenue' => 0], $days),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyContent(): array
    {
        return [
            'totals' => [
                'live' => ['sessions' => 0, 'durationMinutes' => 0, 'viewers' => 0, 'orders' => 0, 'revenue' => 0, 'engagementRate' => 0],
                'video' => ['count' => 0, 'views' => 0, 'orders' => 0, 'revenue' => 0, 'engagementRate' => 0],
                'revenue' => 0,
                'orders' => 0,
                'shareOfRevenue' => 0,
            ],
            'liveSessions' => [],
            'videos' => [],
        ];
    }

    private function ratio(int|float $numerator, int|float $denominator, int $precision = 2): float|int
    {
        if ($denominator == 0) {
            return 0;
        }

        $value = round($numerator / $denominator, $precision);

        return $precision === 0 ? (int) $value : $value;
    }
}
