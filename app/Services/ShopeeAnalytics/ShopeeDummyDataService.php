<?php

namespace App\Services\ShopeeAnalytics;

use Carbon\CarbonImmutable;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Dummy analytics for a Shopee store, used until the Shopee Open API is connected.
 *
 * Every day is generated from a seed derived from its date, so a day's numbers never change
 * between requests. All totals (showcases, channels, campaigns, live sessions, videos) are summed
 * from the same per-product daily rows, which keeps them consistent with each other. A Shopee
 * Open API backed replacement only has to return the same report shape.
 */
class ShopeeDummyDataService
{
    private const STORE_NAME = 'Genial Beauty Official Shop';

    private const SEED_PREFIX = 'genial-shopee-dummy';

    private const ORGANIC_ORDERS_PER_DAY = 70;

    private const VIDEO_EVERY_DAYS = 3;

    private const VIDEO_LIFETIME_DAYS = 14;

    private const LIVE_WEEKDAYS = [2, 4, 6];

    /** @var array<string, string> */
    private const SHOWCASES = [
        'serum' => 'Serum & Essence',
        'pembersih' => 'Pembersih Wajah',
        'pelembap' => 'Pelembap & Sunscreen',
        'paket' => 'Paket Bundling',
        'aksesoris' => 'Aksesoris & Tools',
    ];

    /** @var array<string, array{showcase: string, name: string, price: int, weight: float, conversion_rate: float, stock: int}> */
    private const PRODUCTS = [
        'SRM-NIA-30' => ['showcase' => 'serum', 'name' => 'Niacinamide 10% Serum 30ml', 'price' => 89000, 'weight' => 1.6, 'conversion_rate' => 0.045, 'stock' => 420],
        'SRM-VTC-20' => ['showcase' => 'serum', 'name' => 'Vitamin C Brightening Serum 20ml', 'price' => 99000, 'weight' => 1.1, 'conversion_rate' => 0.038, 'stock' => 260],
        'SRM-RET-20' => ['showcase' => 'serum', 'name' => 'Retinol Night Serum 20ml', 'price' => 119000, 'weight' => 0.6, 'conversion_rate' => 0.03, 'stock' => 150],
        'PBS-GFW-100' => ['showcase' => 'pembersih', 'name' => 'Gentle Facial Wash 100ml', 'price' => 49000, 'weight' => 1.4, 'conversion_rate' => 0.055, 'stock' => 610],
        'PBS-MCW-200' => ['showcase' => 'pembersih', 'name' => 'Micellar Water 200ml', 'price' => 59000, 'weight' => 0.9, 'conversion_rate' => 0.05, 'stock' => 380],
        'PBS-EXT-150' => ['showcase' => 'pembersih', 'name' => 'Exfoliating Toner 150ml', 'price' => 75000, 'weight' => 0.5, 'conversion_rate' => 0.035, 'stock' => 210],
        'PLM-CER-50' => ['showcase' => 'pelembap', 'name' => 'Ceramide Moisturizer 50g', 'price' => 85000, 'weight' => 1.2, 'conversion_rate' => 0.042, 'stock' => 330],
        'PLM-SPF-50' => ['showcase' => 'pelembap', 'name' => 'Sunscreen SPF 50 PA++++ 50ml', 'price' => 69000, 'weight' => 1.5, 'conversion_rate' => 0.05, 'stock' => 540],
        'PLM-SLM-80' => ['showcase' => 'pelembap', 'name' => 'Overnight Sleeping Mask 80g', 'price' => 79000, 'weight' => 0.4, 'conversion_rate' => 0.03, 'stock' => 140],
        'PKT-GLW-3' => ['showcase' => 'paket', 'name' => 'Paket Glowing 3in1', 'price' => 229000, 'weight' => 0.7, 'conversion_rate' => 0.028, 'stock' => 120],
        'PKT-ACN-3' => ['showcase' => 'paket', 'name' => 'Paket Acne Care', 'price' => 199000, 'weight' => 0.45, 'conversion_rate' => 0.026, 'stock' => 95],
        'PKT-TRV-4' => ['showcase' => 'paket', 'name' => 'Paket Travel Kit', 'price' => 149000, 'weight' => 0.25, 'conversion_rate' => 0.02, 'stock' => 80],
        'AKS-JDR-01' => ['showcase' => 'aksesoris', 'name' => 'Jade Roller Wajah', 'price' => 65000, 'weight' => 0.3, 'conversion_rate' => 0.025, 'stock' => 160],
        'AKS-PCH-01' => ['showcase' => 'aksesoris', 'name' => 'Pouch Kosmetik Mini', 'price' => 35000, 'weight' => 0.05, 'conversion_rate' => 0.008, 'stock' => 300],
        'AKS-SPT-01' => ['showcase' => 'aksesoris', 'name' => 'Spatula Masker Silikon', 'price' => 15000, 'weight' => 0.03, 'conversion_rate' => 0.006, 'stock' => 450],
        'AKS-HDB-01' => ['showcase' => 'aksesoris', 'name' => 'Headband Skincare', 'price' => 25000, 'weight' => 0.04, 'conversion_rate' => 0.007, 'stock' => 260],
    ];

    /** @var array<string, array{name: string, type: string, showcase: string|null, daily_budget: int, cpc: int, ctr: float, cvr: float}> */
    private const CAMPAIGNS = [
        'ADS-01' => ['name' => 'Pencarian - Serum Unggulan', 'type' => 'Iklan Pencarian', 'showcase' => 'serum', 'daily_budget' => 350000, 'cpc' => 1100, 'ctr' => 0.032, 'cvr' => 0.06],
        'ADS-02' => ['name' => 'Pencarian - Sunscreen & Pelembap', 'type' => 'Iklan Pencarian', 'showcase' => 'pelembap', 'daily_budget' => 300000, 'cpc' => 950, 'ctr' => 0.035, 'cvr' => 0.065],
        'ADS-03' => ['name' => 'GMV Max - Paket Bundling', 'type' => 'GMV Max', 'showcase' => 'paket', 'daily_budget' => 250000, 'cpc' => 1500, 'ctr' => 0.028, 'cvr' => 0.04],
        'ADS-04' => ['name' => 'Iklan Toko - Brand Awareness', 'type' => 'Iklan Toko', 'showcase' => null, 'daily_budget' => 150000, 'cpc' => 700, 'ctr' => 0.018, 'cvr' => 0.025],
        'ADS-05' => ['name' => 'Produk Serupa - Pembersih', 'type' => 'Iklan Produk Serupa', 'showcase' => 'pembersih', 'daily_budget' => 120000, 'cpc' => 600, 'ctr' => 0.022, 'cvr' => 0.05],
        'ADS-06' => ['name' => 'Pencarian - Aksesoris', 'type' => 'Iklan Pencarian', 'showcase' => 'aksesoris', 'daily_budget' => 60000, 'cpc' => 500, 'ctr' => 0.015, 'cvr' => 0.02],
    ];

    /** @var list<string> */
    private const VIDEO_TITLES = [
        'Review Jujur %s',
        'Cara Pakai %s yang Benar',
        'Before After 14 Hari Pakai %s',
        'Rutinitas Pagi dengan %s',
    ];

    /** @var array<string, string> */
    private const CHANNELS = [
        'organic' => 'Organik',
        'ads' => 'Shopee Ads',
        'live' => 'Shopee Live',
        'video' => 'Shopee Video',
    ];

    /** @var array<string, array<string, mixed>> */
    private array $generatedDays = [];

    /**
     * Build the full analytics report for the period that ends on the given date.
     *
     * @return array<string, mixed>
     */
    public function report(ShopeePeriod $period, CarbonImmutable $endDate): array
    {
        $end = $endDate->startOfDay();
        $start = $end->subDays($period->value - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($period->value - 1);

        $days = $this->daysBetween($start, $end);
        $previousDays = $this->daysBetween($previousStart, $previousEnd);
        $products = $this->productRows($days);

        return [
            'store_name' => self::STORE_NAME,
            'is_dummy' => true,
            'period' => [
                'days' => $period->value,
                'label' => $period->label(),
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previous_start' => $previousStart->toDateString(),
                'previous_end' => $previousEnd->toDateString(),
            ],
            'summary' => [
                'current' => $this->totals($days),
                'previous' => $this->totals($previousDays),
            ],
            'sales' => $this->sales($days, $products),
            'ads' => $this->ads($days),
            'content' => $this->content($days),
            'showcases' => $this->showcases($products),
            'products' => $products,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function daysBetween(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $days = [];

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $days[] = $this->generatedDays[$date->toDateString()] ??= $this->generateDay($date);
        }

        return $days;
    }

    /**
     * @return array<string, mixed>
     */
    private function generateDay(CarbonImmutable $date): array
    {
        $random = $this->randomizer($date->toDateString());
        $demand = $this->demandFactor($date);
        $products = array_map(
            fn (): array => ['organic' => 0, 'ads' => 0, 'live' => 0, 'video' => 0, 'cancelled' => 0, 'returned' => 0, 'views' => 0],
            self::PRODUCTS,
        );

        $campaigns = [];
        foreach (self::CAMPAIGNS as $id => $campaign) {
            $spend = (int) round($campaign['daily_budget'] * $random->getFloat(0.75, 1.0) * min($demand, 1.3));
            $clicks = intdiv($spend, (int) round($campaign['cpc'] * $random->getFloat(0.85, 1.15)));
            $impressions = (int) round($clicks / ($campaign['ctr'] * $random->getFloat(0.85, 1.15)));
            $conversions = $this->stochasticRound($random, $clicks * $campaign['cvr'] * $random->getFloat(0.7, 1.3));

            $revenue = 0;
            foreach ($this->allocate($conversions, $this->productWeights($campaign['showcase'])) as $sku => $orders) {
                $products[$sku]['ads'] += $orders;
                $revenue += $orders * self::PRODUCTS[$sku]['price'];
            }

            $campaigns[$id] = compact('spend', 'impressions', 'clicks', 'conversions', 'revenue');
        }

        $live = null;
        if (in_array($date->dayOfWeekIso, self::LIVE_WEEKDAYS, true) || $date->day === 25) {
            $viewers = (int) round($random->getInt(600, 2200) * $demand);
            $orders = $this->stochasticRound($random, $viewers * $random->getFloat(0.01, 0.018));

            $revenue = 0;
            foreach ($this->allocate($orders, $this->productWeights()) as $sku => $productOrders) {
                $products[$sku]['live'] += $productOrders;
                $revenue += $productOrders * self::PRODUCTS[$sku]['price'];
            }

            $live = [
                'date' => $date->toDateString(),
                'started_at' => sprintf('%02d:00', $random->getInt(19, 21)),
                'duration_minutes' => $random->getInt(90, 180),
                'viewers' => $viewers,
                'peak_viewers' => (int) round($viewers * $random->getFloat(0.12, 0.2)),
                'likes' => (int) round($viewers * $random->getFloat(1.5, 3.0)),
                'comments' => (int) round($viewers * $random->getFloat(0.08, 0.15)),
                'shares' => (int) round($viewers * $random->getFloat(0.01, 0.03)),
                'orders' => $orders,
                'revenue' => $revenue,
            ];
        }

        $videos = [];
        for ($age = 0; $age < self::VIDEO_LIFETIME_DAYS; $age++) {
            $publishedAt = $date->subDays($age);
            if ($this->dayNumber($publishedAt) % self::VIDEO_EVERY_DAYS !== 0) {
                continue;
            }

            $video = $this->video($publishedAt);
            $views = (int) round($video['initial_views'] * (0.72 ** $age) * $random->getFloat(0.8, 1.2));
            $orders = $this->stochasticRound($random, $views * $random->getFloat(0.002, 0.004));
            $products[$video['sku']]['video'] += $orders;

            $videos[$video['id']] = [
                'views' => $views,
                'likes' => (int) round($views * $random->getFloat(0.04, 0.08)),
                'comments' => (int) round($views * $random->getFloat(0.003, 0.006)),
                'shares' => (int) round($views * $random->getFloat(0.004, 0.008)),
                'orders' => $orders,
                'revenue' => $orders * self::PRODUCTS[$video['sku']]['price'],
            ];
        }

        $totalWeight = array_sum(array_column(self::PRODUCTS, 'weight'));
        foreach (self::PRODUCTS as $sku => $product) {
            $products[$sku]['organic'] = $this->stochasticRound(
                $random,
                self::ORGANIC_ORDERS_PER_DAY * $demand * $product['weight'] / $totalWeight * $random->getFloat(0.7, 1.3),
            );

            $completed = $products[$sku]['organic'] + $products[$sku]['ads'] + $products[$sku]['live'] + $products[$sku]['video'];
            $products[$sku]['cancelled'] = $this->stochasticRound($random, $completed * $random->getFloat(0.04, 0.09));
            $products[$sku]['returned'] = $this->stochasticRound($random, $completed * $random->getFloat(0.01, 0.035));
            $products[$sku]['views'] = (int) round(($completed + 0.3) / $product['conversion_rate'] * $random->getFloat(0.85, 1.15));
        }

        return [
            'date' => $date->toDateString(),
            'products' => $products,
            'campaigns' => $campaigns,
            'live' => $live,
            'videos' => $videos,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return list<array<string, mixed>>
     */
    private function productRows(array $days): array
    {
        $rows = [];

        foreach (self::PRODUCTS as $sku => $product) {
            $counts = ['organic' => 0, 'ads' => 0, 'live' => 0, 'video' => 0, 'cancelled' => 0, 'returned' => 0, 'views' => 0];
            foreach ($days as $day) {
                foreach ($counts as $field => $value) {
                    $counts[$field] = $value + $day['products'][$sku][$field];
                }
            }

            $orders = $counts['organic'] + $counts['ads'] + $counts['live'] + $counts['video'];
            $dailyOrders = $orders / count($days);

            $rows[] = [
                'sku' => $sku,
                'name' => $product['name'],
                'showcase' => $product['showcase'],
                'showcase_name' => self::SHOWCASES[$product['showcase']],
                'price' => $product['price'],
                'orders' => $orders,
                'revenue' => $orders * $product['price'],
                'channel_orders' => [
                    'organic' => $counts['organic'],
                    'ads' => $counts['ads'],
                    'live' => $counts['live'],
                    'video' => $counts['video'],
                ],
                'cancelled_orders' => $counts['cancelled'],
                'returned_orders' => $counts['returned'],
                'views' => $counts['views'],
                'conversion_rate' => $this->percentage($orders, $counts['views']),
                'stock' => $product['stock'],
                'stock_days' => $dailyOrders > 0 ? (int) floor($product['stock'] / $dailyOrders) : null,
                'is_slow_moving' => $orders < count($days) / 10,
            ];
        }

        usort($rows, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return $rows;
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return array<string, int|float>
     */
    private function totals(array $days): array
    {
        $products = $this->productRows($days);
        $campaigns = $this->campaignTotals($days);

        $revenue = array_sum(array_column($products, 'revenue'));
        $orders = array_sum(array_column($products, 'orders'));
        $views = array_sum(array_column($products, 'views'));
        $cancelled = array_sum(array_column($products, 'cancelled_orders'));
        $returned = array_sum(array_column($products, 'returned_orders'));

        return [
            'revenue' => $revenue,
            'orders' => $orders,
            'aov' => $orders > 0 ? (int) round($revenue / $orders) : 0,
            'placed_orders' => $orders + $cancelled + $returned,
            'cancelled_orders' => $cancelled,
            'returned_orders' => $returned,
            'views' => $views,
            'conversion_rate' => $this->percentage($orders, $views),
            'ad_spend' => $campaigns['spend'],
            'ad_revenue' => $campaigns['revenue'],
            'roas' => $this->ratio($campaigns['revenue'], $campaigns['spend']),
            'live_revenue' => array_sum(array_map(fn (array $day): int => $day['live']['revenue'] ?? 0, $days)),
            'video_revenue' => array_sum(array_map(fn (array $day): int => array_sum(array_column($day['videos'], 'revenue')), $days)),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @param  list<array<string, mixed>>  $products
     * @return array<string, mixed>
     */
    private function sales(array $days, array $products): array
    {
        $daily = array_map(function (array $day): array {
            $orders = 0;
            $revenue = 0;
            foreach ($day['products'] as $sku => $counts) {
                $productOrders = $counts['organic'] + $counts['ads'] + $counts['live'] + $counts['video'];
                $orders += $productOrders;
                $revenue += $productOrders * self::PRODUCTS[$sku]['price'];
            }

            return ['date' => $day['date'], 'orders' => $orders, 'revenue' => $revenue];
        }, $days);

        $weekly = [];
        foreach ($daily as $day) {
            $weekStart = CarbonImmutable::parse($day['date'])->startOfWeek()->toDateString();
            $weekly[$weekStart] ??= ['week_start' => $weekStart, 'orders' => 0, 'revenue' => 0];
            $weekly[$weekStart]['orders'] += $day['orders'];
            $weekly[$weekStart]['revenue'] += $day['revenue'];
        }

        $channels = [];
        foreach (self::CHANNELS as $channel => $label) {
            $orders = 0;
            $revenue = 0;
            foreach ($products as $product) {
                $orders += $product['channel_orders'][$channel];
                $revenue += $product['channel_orders'][$channel] * $product['price'];
            }
            $channels[] = ['channel' => $channel, 'label' => $label, 'orders' => $orders, 'revenue' => $revenue];
        }

        $statusValue = fn (string $field): int => array_sum(array_map(fn (array $product): int => $product[$field] * $product['price'], $products));

        return [
            'daily' => $daily,
            'weekly' => array_values($weekly),
            'channels' => $channels,
            'statuses' => [
                ['status' => 'completed', 'label' => 'Selesai', 'orders' => array_sum(array_column($products, 'orders')), 'value' => array_sum(array_column($products, 'revenue'))],
                ['status' => 'cancelled', 'label' => 'Dibatalkan', 'orders' => array_sum(array_column($products, 'cancelled_orders')), 'value' => $statusValue('cancelled_orders')],
                ['status' => 'returned', 'label' => 'Retur / Refund', 'orders' => array_sum(array_column($products, 'returned_orders')), 'value' => $statusValue('returned_orders')],
            ],
            'top_products' => array_slice($products, 0, 10),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return array<string, mixed>
     */
    private function ads(array $days): array
    {
        $campaigns = [];
        foreach (self::CAMPAIGNS as $id => $campaign) {
            $stats = ['spend' => 0, 'impressions' => 0, 'clicks' => 0, 'conversions' => 0, 'revenue' => 0];
            foreach ($days as $day) {
                foreach ($stats as $field => $value) {
                    $stats[$field] = $value + $day['campaigns'][$id][$field];
                }
            }

            $campaigns[] = [
                'id' => $id,
                'name' => $campaign['name'],
                'type' => $campaign['type'],
                'target' => $campaign['showcase'] ? self::SHOWCASES[$campaign['showcase']] : 'Semua Produk',
                ...$this->adMetrics($stats),
            ];
        }

        usort($campaigns, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return [
            'totals' => $this->adMetrics($this->campaignTotals($days)),
            'campaigns' => $campaigns,
            'daily' => array_map(fn (array $day): array => [
                'date' => $day['date'],
                'spend' => array_sum(array_column($day['campaigns'], 'spend')),
                'revenue' => array_sum(array_column($day['campaigns'], 'revenue')),
            ], $days),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return array{spend: int, impressions: int, clicks: int, conversions: int, revenue: int}
     */
    private function campaignTotals(array $days): array
    {
        $totals = ['spend' => 0, 'impressions' => 0, 'clicks' => 0, 'conversions' => 0, 'revenue' => 0];

        foreach ($days as $day) {
            foreach ($day['campaigns'] as $stats) {
                foreach ($totals as $field => $value) {
                    $totals[$field] = $value + $stats[$field];
                }
            }
        }

        return $totals;
    }

    /**
     * @param  array{spend: int, impressions: int, clicks: int, conversions: int, revenue: int}  $stats
     * @return array<string, int|float>
     */
    private function adMetrics(array $stats): array
    {
        return [
            ...$stats,
            'ctr' => $this->percentage($stats['clicks'], $stats['impressions']),
            'cpc' => $stats['clicks'] > 0 ? (int) round($stats['spend'] / $stats['clicks']) : 0,
            'conversion_rate' => $this->percentage($stats['conversions'], $stats['clicks']),
            'roas' => $this->ratio($stats['revenue'], $stats['spend']),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $days
     * @return array<string, mixed>
     */
    private function content(array $days): array
    {
        $sessions = array_values(array_filter(array_column($days, 'live')));

        $videos = [];
        foreach ($days as $day) {
            foreach ($day['videos'] as $id => $stats) {
                $videos[$id] ??= [...$this->video(CarbonImmutable::parse(substr($id, 4))), 'views' => 0, 'likes' => 0, 'comments' => 0, 'shares' => 0, 'orders' => 0, 'revenue' => 0];
                foreach ($stats as $field => $value) {
                    $videos[$id][$field] += $value;
                }
            }
        }

        $videos = array_map(fn (array $video): array => [
            'id' => $video['id'],
            'title' => $video['title'],
            'product' => self::PRODUCTS[$video['sku']]['name'],
            'published_at' => $video['published_at'],
            'views' => $video['views'],
            'likes' => $video['likes'],
            'comments' => $video['comments'],
            'shares' => $video['shares'],
            'orders' => $video['orders'],
            'revenue' => $video['revenue'],
            'engagement_rate' => $this->percentage($video['likes'] + $video['comments'] + $video['shares'], $video['views']),
        ], array_values($videos));
        usort($videos, fn (array $a, array $b): int => $b['views'] <=> $a['views']);

        $liveViewers = array_sum(array_column($sessions, 'viewers'));
        $videoViews = array_sum(array_column($videos, 'views'));

        return [
            'live' => [
                'totals' => [
                    'sessions' => count($sessions),
                    'duration_minutes' => array_sum(array_column($sessions, 'duration_minutes')),
                    'viewers' => $liveViewers,
                    'average_viewers' => count($sessions) > 0 ? (int) round($liveViewers / count($sessions)) : 0,
                    'engagement_rate' => $this->percentage(array_sum(array_column($sessions, 'comments')) + array_sum(array_column($sessions, 'shares')), $liveViewers),
                    'orders' => array_sum(array_column($sessions, 'orders')),
                    'revenue' => array_sum(array_column($sessions, 'revenue')),
                ],
                'sessions' => array_reverse($sessions),
            ],
            'video' => [
                'totals' => [
                    'videos' => count($videos),
                    'views' => $videoViews,
                    'engagement_rate' => $this->percentage(
                        array_sum(array_column($videos, 'likes')) + array_sum(array_column($videos, 'comments')) + array_sum(array_column($videos, 'shares')),
                        $videoViews,
                    ),
                    'orders' => array_sum(array_column($videos, 'orders')),
                    'revenue' => array_sum(array_column($videos, 'revenue')),
                ],
                'videos' => $videos,
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $products
     * @return list<array<string, mixed>>
     */
    private function showcases(array $products): array
    {
        $totalRevenue = array_sum(array_column($products, 'revenue'));
        $showcases = [];

        foreach (self::SHOWCASES as $key => $name) {
            $items = array_filter($products, fn (array $product): bool => $product['showcase'] === $key);
            $orders = array_sum(array_column($items, 'orders'));
            $revenue = array_sum(array_column($items, 'revenue'));
            $views = array_sum(array_column($items, 'views'));

            $showcases[] = [
                'key' => $key,
                'name' => $name,
                'product_count' => count($items),
                'slow_moving_count' => count(array_filter($items, fn (array $product): bool => $product['is_slow_moving'])),
                'orders' => $orders,
                'revenue' => $revenue,
                'revenue_share' => $this->percentage($revenue, $totalRevenue),
                'views' => $views,
                'conversion_rate' => $this->percentage($orders, $views),
                'stock' => array_sum(array_column($items, 'stock')),
            ];
        }

        usort($showcases, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return $showcases;
    }

    /**
     * @return array{id: string, title: string, sku: string, published_at: string, initial_views: int}
     */
    private function video(CarbonImmutable $publishedAt): array
    {
        $index = intdiv($this->dayNumber($publishedAt), self::VIDEO_EVERY_DAYS);
        $featured = array_keys(array_filter(self::PRODUCTS, fn (array $product): bool => $product['weight'] >= 0.4));
        $sku = $featured[$index % count($featured)];

        return [
            'id' => 'VID-'.$publishedAt->toDateString(),
            'title' => sprintf(self::VIDEO_TITLES[$index % count(self::VIDEO_TITLES)], self::PRODUCTS[$sku]['name']),
            'sku' => $sku,
            'published_at' => $publishedAt->toDateString(),
            'initial_views' => $this->randomizer('video-'.$publishedAt->toDateString())->getInt(3000, 15000),
        ];
    }

    /**
     * Relative demand for a day: weekends, payday, double dates (10.10, 11.11) and a slow seasonal wave.
     */
    private function demandFactor(CarbonImmutable $date): float
    {
        $weekday = [1 => 0.95, 2 => 0.97, 3 => 1.0, 4 => 1.02, 5 => 1.08, 6 => 1.15, 7 => 1.1][$date->dayOfWeekIso];
        $payday = $date->day >= 25 || $date->day <= 2 ? 1.2 : 1.0;
        $doubleDate = $date->day === $date->month ? 1.8 : 1.0;
        $season = 1 + 0.08 * sin($this->dayNumber($date) / 45);

        return $weekday * $payday * $doubleDate * $season;
    }

    /**
     * @return array<string, float>
     */
    private function productWeights(?string $showcase = null): array
    {
        $products = $showcase === null
            ? self::PRODUCTS
            : array_filter(self::PRODUCTS, fn (array $product): bool => $product['showcase'] === $showcase);

        return array_map(fn (array $product): float => $product['weight'], $products);
    }

    /**
     * Split a whole number across keys proportionally to their weights (largest remainder).
     *
     * @param  array<string, float>  $weights
     * @return array<string, int>
     */
    private function allocate(int $total, array $weights): array
    {
        $sum = array_sum($weights);
        $allocation = [];
        $remainders = [];

        foreach ($weights as $key => $weight) {
            $exact = $total * $weight / $sum;
            $allocation[$key] = (int) floor($exact);
            $remainders[$key] = $exact - $allocation[$key];
        }

        arsort($remainders);
        foreach (array_slice(array_keys($remainders), 0, $total - array_sum($allocation)) as $key) {
            $allocation[$key]++;
        }

        return $allocation;
    }

    private function stochasticRound(Randomizer $random, float $value): int
    {
        $whole = (int) floor($value);

        return $whole + ($random->getFloat(0, 1) < $value - $whole ? 1 : 0);
    }

    private function percentage(int|float $part, int|float $whole): float
    {
        return $whole > 0 ? round($part / $whole * 100, 2) : 0.0;
    }

    private function ratio(int|float $numerator, int|float $denominator): float
    {
        return $denominator > 0 ? round($numerator / $denominator, 2) : 0.0;
    }

    private function dayNumber(CarbonImmutable $date): int
    {
        return intdiv($date->startOfDay()->getTimestamp(), 86400);
    }

    private function randomizer(string $key): Randomizer
    {
        return new Randomizer(new Mt19937(crc32(self::SEED_PREFIX.':'.$key)));
    }
}
