<?php

namespace App\Services\ShopeeAnalytics;

use Carbon\CarbonImmutable;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Deterministic dummy data for the Shopee Analytics module.
 *
 * Every simulated day is seeded from its own date, so the same date always
 * produces the same numbers regardless of which period is requested. All
 * aggregates are derived from the same simulated orders, which keeps totals
 * consistent across tabs (per-etalase sum = total sales, ROAS = ad revenue / spend, etc.).
 */
class ShopeeDummyDataService implements ShopeeAnalyticsSource
{
    private const string SEED_PREFIX = 'genial-shopee-dummy-v1';

    private const int BASE_DAILY_VIEWS = 220;

    private const int VIDEO_ACTIVE_DAYS = 10;

    private const float VIDEO_VIEW_DECAY = 0.6;

    private const float SLOW_MOVING_UNITS_PER_DAY = 0.15;

    private const int LOW_STOCK_DAYS_OF_COVER = 14;

    private const array CHANNEL_LABELS = [
        'organic' => 'Organik',
        'ads' => 'Iklan',
        'live' => 'Live',
        'video' => 'Video',
    ];

    private const array STATUS_LABELS = [
        'completed' => 'Selesai',
        'cancelled' => 'Batal',
        'returned' => 'Retur',
    ];

    /**
     * @var list<array{id: int, sku: string, name: string, etalase: string, price: int, stock: int, viewWeight: float, conversion: float}>
     */
    private const array PRODUCTS = [
        ['id' => 1, 'sku' => 'GBS-SKN-001', 'name' => 'Serum Vitamin C 20ml', 'etalase' => 'Skincare', 'price' => 89000, 'stock' => 340, 'viewWeight' => 1.0, 'conversion' => 0.045],
        ['id' => 2, 'sku' => 'GBS-SKN-002', 'name' => 'Moisturizer Gel Aloe 50g', 'etalase' => 'Skincare', 'price' => 65000, 'stock' => 520, 'viewWeight' => 0.9, 'conversion' => 0.05],
        ['id' => 3, 'sku' => 'GBS-SKN-003', 'name' => 'Sunscreen SPF 50 PA++++ 40ml', 'etalase' => 'Skincare', 'price' => 75000, 'stock' => 410, 'viewWeight' => 1.2, 'conversion' => 0.055],
        ['id' => 4, 'sku' => 'GBS-SKN-004', 'name' => 'Facial Wash Gentle 100ml', 'etalase' => 'Skincare', 'price' => 45000, 'stock' => 760, 'viewWeight' => 0.8, 'conversion' => 0.06],
        ['id' => 5, 'sku' => 'GBS-SKN-005', 'name' => 'Toner Exfoliating 150ml', 'etalase' => 'Skincare', 'price' => 79000, 'stock' => 85, 'viewWeight' => 0.5, 'conversion' => 0.035],
        ['id' => 6, 'sku' => 'GBS-BDY-001', 'name' => 'Body Lotion Brightening 250ml', 'etalase' => 'Bodycare', 'price' => 59000, 'stock' => 630, 'viewWeight' => 0.7, 'conversion' => 0.05],
        ['id' => 7, 'sku' => 'GBS-BDY-002', 'name' => 'Body Scrub Kopi 200g', 'etalase' => 'Bodycare', 'price' => 49000, 'stock' => 280, 'viewWeight' => 0.5, 'conversion' => 0.04],
        ['id' => 8, 'sku' => 'GBS-BDY-003', 'name' => 'Body Mist Vanilla 100ml', 'etalase' => 'Bodycare', 'price' => 39000, 'stock' => 900, 'viewWeight' => 0.6, 'conversion' => 0.045],
        ['id' => 9, 'sku' => 'GBS-HAI-001', 'name' => 'Shampoo Anti Rontok 300ml', 'etalase' => 'Haircare', 'price' => 55000, 'stock' => 450, 'viewWeight' => 0.6, 'conversion' => 0.04],
        ['id' => 10, 'sku' => 'GBS-HAI-002', 'name' => 'Hair Serum Argan 50ml', 'etalase' => 'Haircare', 'price' => 69000, 'stock' => 18, 'viewWeight' => 0.4, 'conversion' => 0.035],
        ['id' => 11, 'sku' => 'GBS-HAI-003', 'name' => 'Hair Mask Keratin 200g', 'etalase' => 'Haircare', 'price' => 72000, 'stock' => 160, 'viewWeight' => 0.15, 'conversion' => 0.01],
        ['id' => 12, 'sku' => 'GBS-PKT-001', 'name' => 'Paket Glowing Basic (3 Item)', 'etalase' => 'Paket Hemat', 'price' => 199000, 'stock' => 120, 'viewWeight' => 0.7, 'conversion' => 0.03],
        ['id' => 13, 'sku' => 'GBS-PKT-002', 'name' => 'Paket Body Care Lengkap', 'etalase' => 'Paket Hemat', 'price' => 149000, 'stock' => 95, 'viewWeight' => 0.4, 'conversion' => 0.028],
        ['id' => 14, 'sku' => 'GBS-PKT-003', 'name' => 'Paket Hair Repair', 'etalase' => 'Paket Hemat', 'price' => 165000, 'stock' => 60, 'viewWeight' => 0.05, 'conversion' => 0.0],
        ['id' => 15, 'sku' => 'GBS-AKS-001', 'name' => 'Pouch Kosmetik Kanvas', 'etalase' => 'Aksesoris', 'price' => 35000, 'stock' => 240, 'viewWeight' => 0.1, 'conversion' => 0.004],
        ['id' => 16, 'sku' => 'GBS-AKS-002', 'name' => 'Headband Skincare Bulu', 'etalase' => 'Aksesoris', 'price' => 25000, 'stock' => 300, 'viewWeight' => 0.06, 'conversion' => 0.0],
    ];

    /**
     * @var list<array{id: string, name: string, type: string, dailyBudget: int, cpm: int, ctr: float, productIds: list<int>}>
     */
    private const array CAMPAIGNS = [
        ['id' => 'ADS-001', 'name' => 'Pencarian - Serum & Sunscreen', 'type' => 'Iklan Pencarian', 'dailyBudget' => 120000, 'cpm' => 14000, 'ctr' => 0.034, 'productIds' => [1, 3]],
        ['id' => 'ADS-002', 'name' => 'Iklan Toko - Genial Beauty', 'type' => 'Iklan Toko', 'dailyBudget' => 200000, 'cpm' => 9000, 'ctr' => 0.021, 'productIds' => [1, 2, 3, 4, 5]],
        ['id' => 'ADS-003', 'name' => 'Penemuan - Bodycare', 'type' => 'Iklan Penemuan', 'dailyBudget' => 130000, 'cpm' => 7500, 'ctr' => 0.016, 'productIds' => [6, 7, 8]],
        ['id' => 'ADS-004', 'name' => 'GMV Max - Paket Hemat', 'type' => 'GMV Max', 'dailyBudget' => 150000, 'cpm' => 11000, 'ctr' => 0.026, 'productIds' => [12, 13, 14]],
        ['id' => 'ADS-005', 'name' => 'Pencarian - Haircare', 'type' => 'Iklan Pencarian', 'dailyBudget' => 110000, 'cpm' => 12500, 'ctr' => 0.028, 'productIds' => [9, 10, 11]],
    ];

    private const array LIVE_TITLES = [
        'Flash Sale Skincare Malam',
        'Live Review Serum & Sunscreen',
        'Promo Gajian Spesial',
        'Live Q&A Kulit Berjerawat',
        'Bundling Hemat Akhir Pekan',
        'Tutorial Skincare Pagi',
    ];

    private const array VIDEO_TITLES = [
        'Cara Pakai Serum Vitamin C',
        'Before After 7 Hari Sunscreen',
        'Rutinitas Skincare Pagi 1 Menit',
        'Unboxing Paket Glowing',
        'Tips Rambut Anti Rontok',
        'Body Scrub Kopi: Review Jujur',
        'Review Body Mist Vanilla',
        '3 Kesalahan Pakai Toner',
        'Skincare Budget 100 Ribu',
        'Pouch Kosmetik Serbaguna',
    ];

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $simulatedDays = [];

    /**
     * @var array<string, array<string, mixed>|null>
     */
    private array $publishedVideos = [];

    /**
     * {@inheritDoc}
     */
    public function report(ShopeePeriod $period, CarbonImmutable $endDate): array
    {
        $end = $endDate->startOfDay();
        $start = $end->subDays($period->value - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($period->value - 1);

        $current = $this->aggregate($start, $end);
        $previous = $this->aggregate($previousStart, $previousEnd);

        return [
            'isDummy' => true,
            'storeName' => 'Genial Beauty Store',
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previousStart' => $previousStart->toDateString(),
                'previousEnd' => $previousEnd->toDateString(),
            ],
            'summary' => $this->buildSummary($current, $previous),
            'sales' => $this->buildSales($current),
            'ads' => $this->buildAds($current),
            'content' => $this->buildContent($current),
            'storefront' => $this->buildStorefront($current, $period->value),
        ];
    }

    /**
     * Sum simulated days into one period aggregate.
     *
     * @return array<string, mixed>
     */
    private function aggregate(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $products = [];
        foreach (self::PRODUCTS as $product) {
            $products[$product['id']] = ['views' => 0, 'orders' => 0, 'cancelled' => 0, 'returned' => 0, 'completed' => 0, 'units' => 0, 'revenue' => 0, 'cancelledValue' => 0, 'returnedValue' => 0];
        }

        $campaigns = [];
        foreach (self::CAMPAIGNS as $campaign) {
            $campaigns[$campaign['id']] = ['spend' => 0, 'impressions' => 0, 'clicks' => 0, 'conversions' => 0, 'revenue' => 0];
        }

        $channels = array_fill_keys(array_keys(self::CHANNEL_LABELS), ['orders' => 0, 'revenue' => 0]);
        $daily = [];
        $liveSessions = [];
        $videos = [];

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $day = $this->simulateDay($date);
            $dayTotals = ['date' => $day['date'], 'revenue' => 0, 'orders' => 0, 'completed' => 0, 'adSpend' => 0, 'adRevenue' => 0];

            foreach ($day['products'] as $productId => $stats) {
                foreach ($stats as $key => $value) {
                    $products[$productId][$key] += $value;
                }
                $dayTotals['revenue'] += $stats['revenue'];
                $dayTotals['orders'] += $stats['orders'];
                $dayTotals['completed'] += $stats['completed'];
            }

            foreach ($day['channels'] as $channel => $stats) {
                $channels[$channel]['orders'] += $stats['orders'];
                $channels[$channel]['revenue'] += $stats['revenue'];
            }

            foreach ($day['campaigns'] as $campaignId => $stats) {
                foreach ($stats as $key => $value) {
                    $campaigns[$campaignId][$key] += $value;
                }
                $dayTotals['adSpend'] += $stats['spend'];
                $dayTotals['adRevenue'] += $stats['revenue'];
            }

            if ($day['live'] !== null) {
                $liveSessions[] = $day['live'];
            }

            foreach ($day['videos'] as $videoId => $stats) {
                if (! isset($videos[$videoId])) {
                    $videos[$videoId] = $this->publishedVideos[$this->videoDateFromId($videoId)] + ['views' => 0, 'likes' => 0, 'comments' => 0, 'shares' => 0, 'orders' => 0, 'revenue' => 0];
                }
                foreach ($stats as $key => $value) {
                    $videos[$videoId][$key] += $value;
                }
            }

            $daily[] = $dayTotals;
        }

        return [
            'products' => $products,
            'campaigns' => $campaigns,
            'channels' => $channels,
            'daily' => $daily,
            'liveSessions' => $liveSessions,
            'videos' => array_values($videos),
            'totals' => $this->periodTotals($products, $campaigns, $channels),
        ];
    }

    /**
     * @param  array<int, array<string, int>>  $products
     * @param  array<string, array<string, int>>  $campaigns
     * @param  array<string, array{orders: int, revenue: int}>  $channels
     * @return array<string, int>
     */
    private function periodTotals(array $products, array $campaigns, array $channels): array
    {
        $sum = fn (array $rows, string $key): int => (int) array_sum(array_column($rows, $key));

        return [
            'revenue' => $sum($products, 'revenue'),
            'orders' => $sum($products, 'orders'),
            'completed' => $sum($products, 'completed'),
            'cancelled' => $sum($products, 'cancelled'),
            'returned' => $sum($products, 'returned'),
            'units' => $sum($products, 'units'),
            'views' => $sum($products, 'views'),
            'cancelledValue' => $sum($products, 'cancelledValue'),
            'returnedValue' => $sum($products, 'returnedValue'),
            'adSpend' => $sum($campaigns, 'spend'),
            'adRevenue' => $sum($campaigns, 'revenue'),
            'contentRevenue' => $channels['live']['revenue'] + $channels['video']['revenue'],
        ];
    }

    /**
     * Simulate one store day. Results are memoized and depend only on the date.
     *
     * @return array<string, mixed>
     */
    private function simulateDay(CarbonImmutable $date): array
    {
        $dateKey = $date->toDateString();

        if (isset($this->simulatedDays[$dateKey])) {
            return $this->simulatedDays[$dateKey];
        }

        $rng = $this->randomizer('day', $dateKey);
        $demand = $this->demandFactor($date, $rng);
        $live = $this->liveSessionOn($date);
        $activeVideos = $this->activeVideosOn($date);

        $campaignsByProduct = [];
        foreach (self::CAMPAIGNS as $campaign) {
            foreach ($campaign['productIds'] as $productId) {
                $campaignsByProduct[$productId][] = $campaign['id'];
            }
        }

        $products = [];
        $channels = array_fill_keys(array_keys(self::CHANNEL_LABELS), ['orders' => 0, 'revenue' => 0]);
        $campaignResults = array_fill_keys(array_column(self::CAMPAIGNS, 'id'), ['conversions' => 0, 'revenue' => 0]);
        $videoResults = [];
        foreach ($activeVideos as $videoId => $video) {
            $videoResults[$videoId] = ['views' => $video['views'], 'likes' => $video['likes'], 'comments' => $video['comments'], 'shares' => $video['shares'], 'orders' => 0, 'revenue' => 0];
        }
        $liveOrders = 0;
        $liveRevenue = 0;

        foreach (self::PRODUCTS as $product) {
            $views = (int) round(self::BASE_DAILY_VIEWS * $product['viewWeight'] * $demand * $rng->getFloat(0.85, 1.15));
            $orderCount = (int) round($views * $product['conversion'] * $rng->getFloat(0.8, 1.2));
            $stats = ['views' => $views, 'orders' => $orderCount, 'cancelled' => 0, 'returned' => 0, 'completed' => 0, 'units' => 0, 'revenue' => 0, 'cancelledValue' => 0, 'returnedValue' => 0];

            for ($order = 0; $order < $orderCount; $order++) {
                $quantity = $this->pickQuantity($rng);
                $value = $quantity * $product['price'];
                $statusRoll = $rng->getFloat(0, 1);

                if ($statusRoll < 0.06) {
                    $stats['cancelled']++;
                    $stats['cancelledValue'] += $value;

                    continue;
                }

                if ($statusRoll < 0.09) {
                    $stats['returned']++;
                    $stats['returnedValue'] += $value;

                    continue;
                }

                $stats['completed']++;
                $stats['units'] += $quantity;
                $stats['revenue'] += $value;

                $channel = $this->pickChannel($rng, isset($campaignsByProduct[$product['id']]), $live !== null, $activeVideos !== []);
                $channels[$channel]['orders']++;
                $channels[$channel]['revenue'] += $value;

                if ($channel === 'ads') {
                    $productCampaigns = $campaignsByProduct[$product['id']];
                    $campaignId = $productCampaigns[$rng->getInt(0, count($productCampaigns) - 1)];
                    $campaignResults[$campaignId]['conversions']++;
                    $campaignResults[$campaignId]['revenue'] += $value;
                } elseif ($channel === 'live') {
                    $liveOrders++;
                    $liveRevenue += $value;
                } elseif ($channel === 'video') {
                    $videoId = $this->pickWeightedVideo($rng, $activeVideos);
                    $videoResults[$videoId]['orders']++;
                    $videoResults[$videoId]['revenue'] += $value;
                }
            }

            $products[$product['id']] = $stats;
        }

        $campaigns = [];
        foreach (self::CAMPAIGNS as $campaign) {
            $spend = (int) round($campaign['dailyBudget'] * min(1.0, $rng->getFloat(0.72, 0.95) * min($demand, 1.1)));
            $impressions = (int) round($spend / ($campaign['cpm'] * $rng->getFloat(0.9, 1.1)) * 1000);
            $conversions = $campaignResults[$campaign['id']]['conversions'];
            $clicks = max((int) round($impressions * $campaign['ctr'] * $rng->getFloat(0.85, 1.15)), $conversions * 4);

            $campaigns[$campaign['id']] = [
                'spend' => $spend,
                'impressions' => $impressions,
                'clicks' => $clicks,
                'conversions' => $conversions,
                'revenue' => $campaignResults[$campaign['id']]['revenue'],
            ];
        }

        if ($live !== null) {
            $live['orders'] = $liveOrders;
            $live['revenue'] = $liveRevenue;
        }

        return $this->simulatedDays[$dateKey] = [
            'date' => $dateKey,
            'products' => $products,
            'channels' => $channels,
            'campaigns' => $campaigns,
            'live' => $live,
            'videos' => $videoResults,
        ];
    }

    private function demandFactor(CarbonImmutable $date, Randomizer $rng): float
    {
        $factor = match ($date->dayOfWeekIso) {
            6, 7 => 1.15,
            5 => 1.05,
            default => 1.0,
        };

        if ($date->day >= 25 || $date->day <= 2) {
            $factor *= 1.2;
        }

        if ($date->day === $date->month) {
            $factor *= 2.2;
        }

        $daysSinceLaunch = max(0, (int) CarbonImmutable::parse('2025-01-01')->diffInDays($date));
        $factor *= 1 + min($daysSinceLaunch, 600) * 0.0006;

        return $factor * $rng->getFloat(0.88, 1.12);
    }

    private function pickQuantity(Randomizer $rng): int
    {
        $roll = $rng->getFloat(0, 1);

        return match (true) {
            $roll < 0.72 => 1,
            $roll < 0.93 => 2,
            default => 3,
        };
    }

    private function pickChannel(Randomizer $rng, bool $hasCampaign, bool $hasLive, bool $hasVideo): string
    {
        $roll = $rng->getFloat(0, 1);
        $threshold = 0.0;

        foreach (['ads' => $hasCampaign ? 0.26 : 0.0, 'live' => $hasLive ? 0.18 : 0.0, 'video' => $hasVideo ? 0.12 : 0.0] as $channel => $probability) {
            $threshold += $probability;
            if ($roll < $threshold) {
                return $channel;
            }
        }

        return 'organic';
    }

    /**
     * @param  array<string, array<string, mixed>>  $activeVideos
     */
    private function pickWeightedVideo(Randomizer $rng, array $activeVideos): string
    {
        $totalViews = array_sum(array_column($activeVideos, 'views'));
        $roll = $rng->getFloat(0, max(1, $totalViews));
        $cumulative = 0;

        foreach ($activeVideos as $videoId => $video) {
            $cumulative += $video['views'];
            if ($roll < $cumulative) {
                return $videoId;
            }
        }

        return array_key_last($activeVideos);
    }

    /**
     * Live sessions run on Tuesday, Thursday and weekends (most weeks).
     *
     * @return array<string, mixed>|null
     */
    private function liveSessionOn(CarbonImmutable $date): ?array
    {
        $rng = $this->randomizer('live', $date->toDateString());

        if (! in_array($date->dayOfWeekIso, [2, 4, 6, 7], true) || $rng->getFloat(0, 1) > 0.85) {
            return null;
        }

        $isTwinDate = $date->day === $date->month;
        $viewers = (int) round($rng->getInt(600, 2500) * ($isTwinDate ? 2.0 : 1.0));
        $likes = (int) round($viewers * $rng->getFloat(0.25, 0.7));
        $comments = (int) round($viewers * $rng->getFloat(0.05, 0.15));
        $shares = (int) round($viewers * $rng->getFloat(0.01, 0.04));

        return [
            'id' => 'LIVE-'.$date->format('Ymd'),
            'date' => $date->toDateString(),
            'startTime' => $rng->getInt(0, 1) === 0 ? '19:00' : '20:00',
            'title' => $isTwinDate ? "Live Spesial {$date->day}.{$date->month}" : self::LIVE_TITLES[$rng->getInt(0, count(self::LIVE_TITLES) - 1)],
            'durationMinutes' => $rng->getInt(4, 12) * 15,
            'viewers' => $viewers,
            'peakViewers' => (int) round($viewers * $rng->getFloat(0.12, 0.25)),
            'likes' => $likes,
            'comments' => $comments,
            'shares' => $shares,
            'orders' => 0,
            'revenue' => 0,
        ];
    }

    /**
     * A short video is published on roughly 40% of days.
     *
     * @return array<string, mixed>|null
     */
    private function videoPublishedOn(CarbonImmutable $date): ?array
    {
        $dateKey = $date->toDateString();

        if (array_key_exists($dateKey, $this->publishedVideos)) {
            return $this->publishedVideos[$dateKey];
        }

        $rng = $this->randomizer('video', $dateKey);

        if ($rng->getFloat(0, 1) > 0.4) {
            return $this->publishedVideos[$dateKey] = null;
        }

        return $this->publishedVideos[$dateKey] = [
            'id' => 'VID-'.$date->format('Ymd'),
            'publishedAt' => $dateKey,
            'title' => self::VIDEO_TITLES[$rng->getInt(0, count(self::VIDEO_TITLES) - 1)],
            'durationSeconds' => $rng->getInt(15, 60),
            'baseViews' => $rng->getInt(0, 9) === 0 ? $rng->getInt(30000, 60000) : $rng->getInt(2500, 15000),
            'likeRate' => $rng->getFloat(0.04, 0.09),
            'commentRate' => $rng->getFloat(0.003, 0.01),
            'shareRate' => $rng->getFloat(0.002, 0.008),
        ];
    }

    /**
     * Videos published in the last few days, with the views they earn on this date.
     *
     * @return array<string, array{views: int, likes: int, comments: int, shares: int}>
     */
    private function activeVideosOn(CarbonImmutable $date): array
    {
        $active = [];

        for ($age = 0; $age < self::VIDEO_ACTIVE_DAYS; $age++) {
            $video = $this->videoPublishedOn($date->subDays($age));

            if ($video === null) {
                continue;
            }

            $views = (int) round($video['baseViews'] * (self::VIDEO_VIEW_DECAY ** $age));

            $active[$video['id']] = [
                'views' => $views,
                'likes' => (int) round($views * $video['likeRate']),
                'comments' => (int) round($views * $video['commentRate']),
                'shares' => (int) round($views * $video['shareRate']),
            ];
        }

        return $active;
    }

    private function videoDateFromId(string $videoId): string
    {
        return CarbonImmutable::createFromFormat('Ymd', substr($videoId, 4))->toDateString();
    }

    private function randomizer(string $stream, string $dateKey): Randomizer
    {
        return new Randomizer(new Mt19937(crc32(self::SEED_PREFIX.'|'.$stream.'|'.$dateKey)));
    }

    /**
     * @param  array<string, mixed>  $current
     * @param  array<string, mixed>  $previous
     * @return array<string, mixed>
     */
    private function buildSummary(array $current, array $previous): array
    {
        $kpis = function (array $totals): array {
            return [
                'revenue' => $totals['revenue'],
                'orders' => $totals['orders'],
                'aov' => $this->ratio($totals['revenue'], $totals['completed'], 0),
                'conversionRate' => $this->ratio($totals['completed'] * 100, $totals['views']),
                'adSpend' => $totals['adSpend'],
                'roas' => $this->ratio($totals['adRevenue'], $totals['adSpend']),
                'contentRevenue' => $totals['contentRevenue'],
                'cancellationRate' => $this->ratio(($totals['cancelled'] + $totals['returned']) * 100, $totals['orders']),
            ];
        };

        $definitions = [
            'revenue' => ['label' => 'Omzet (Pesanan Selesai)', 'format' => 'currency', 'higherIsBetter' => true],
            'orders' => ['label' => 'Total Pesanan', 'format' => 'number', 'higherIsBetter' => true],
            'aov' => ['label' => 'Rata-rata Nilai Pesanan (AOV)', 'format' => 'currency', 'higherIsBetter' => true],
            'conversionRate' => ['label' => 'Tingkat Konversi', 'format' => 'percent', 'higherIsBetter' => true],
            'adSpend' => ['label' => 'Biaya Iklan', 'format' => 'currency', 'higherIsBetter' => false],
            'roas' => ['label' => 'ROAS Iklan', 'format' => 'ratio', 'higherIsBetter' => true],
            'contentRevenue' => ['label' => 'Omzet dari Live & Video', 'format' => 'currency', 'higherIsBetter' => true],
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

        $channels = [];
        foreach ($current['channels'] as $channel => $stats) {
            $channels[] = [
                'channel' => $channel,
                'label' => self::CHANNEL_LABELS[$channel],
                'orders' => $stats['orders'],
                'revenue' => $stats['revenue'],
                'share' => $this->ratio($stats['revenue'] * 100, $current['totals']['revenue'], 1),
            ];
        }

        return [
            'kpis' => $items,
            'channels' => $channels,
        ];
    }

    /**
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>
     */
    private function buildSales(array $current): array
    {
        $totals = $current['totals'];

        $weekly = [];
        foreach ($current['daily'] as $day) {
            $weekStart = CarbonImmutable::parse($day['date'])->startOfWeek(CarbonImmutable::MONDAY)->toDateString();
            $weekly[$weekStart] ??= ['weekStart' => $weekStart, 'weekEnd' => $day['date'], 'days' => 0, 'revenue' => 0, 'orders' => 0, 'completed' => 0];
            $weekly[$weekStart]['weekEnd'] = $day['date'];
            $weekly[$weekStart]['days']++;
            $weekly[$weekStart]['revenue'] += $day['revenue'];
            $weekly[$weekStart]['orders'] += $day['orders'];
            $weekly[$weekStart]['completed'] += $day['completed'];
        }
        $weekly = array_values($weekly);
        if ($weekly !== []) {
            $weekly[0]['weekStart'] = max($weekly[0]['weekStart'], $current['daily'][0]['date']);
        }

        $statusValues = [
            'completed' => [$totals['completed'], $totals['revenue']],
            'cancelled' => [$totals['cancelled'], $totals['cancelledValue']],
            'returned' => [$totals['returned'], $totals['returnedValue']],
        ];
        $statuses = [];
        foreach ($statusValues as $status => [$orders, $value]) {
            $statuses[] = [
                'status' => $status,
                'label' => self::STATUS_LABELS[$status],
                'orders' => $orders,
                'value' => $value,
                'share' => $this->ratio($orders * 100, $totals['orders'], 1),
            ];
        }

        $productRows = $this->productRows($current, 0);
        usort($productRows, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

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
            'daily' => array_map(fn (array $day): array => [
                'date' => $day['date'],
                'revenue' => $day['revenue'],
                'orders' => $day['orders'],
                'completed' => $day['completed'],
            ], $current['daily']),
            'weekly' => array_map(fn (array $week): array => array_diff_key($week, ['days' => true]), $weekly),
            'statuses' => $statuses,
            'topProducts' => array_map(fn (array $row): array => [
                'id' => $row['id'],
                'sku' => $row['sku'],
                'name' => $row['name'],
                'etalase' => $row['etalase'],
                'orders' => $row['orders'],
                'units' => $row['units'],
                'revenue' => $row['revenue'],
                'share' => $this->ratio($row['revenue'] * 100, $totals['revenue'], 1),
            ], array_slice(array_values(array_filter($productRows, fn (array $row): bool => $row['revenue'] > 0)), 0, 10)),
        ];
    }

    /**
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>
     */
    private function buildAds(array $current): array
    {
        $campaigns = [];
        foreach (self::CAMPAIGNS as $campaign) {
            $stats = $current['campaigns'][$campaign['id']];
            $campaigns[] = [
                'id' => $campaign['id'],
                'name' => $campaign['name'],
                'type' => $campaign['type'],
                'dailyBudget' => $campaign['dailyBudget'],
                ...$this->adMetrics($stats),
            ];
        }

        $totals = [
            'spend' => (int) array_sum(array_column($current['campaigns'], 'spend')),
            'impressions' => (int) array_sum(array_column($current['campaigns'], 'impressions')),
            'clicks' => (int) array_sum(array_column($current['campaigns'], 'clicks')),
            'conversions' => (int) array_sum(array_column($current['campaigns'], 'conversions')),
            'revenue' => (int) array_sum(array_column($current['campaigns'], 'revenue')),
        ];

        return [
            'totals' => $this->adMetrics($totals),
            'campaigns' => $campaigns,
            'daily' => array_map(fn (array $day): array => [
                'date' => $day['date'],
                'spend' => $day['adSpend'],
                'revenue' => $day['adRevenue'],
            ], $current['daily']),
        ];
    }

    /**
     * @param  array{spend: int, impressions: int, clicks: int, conversions: int, revenue: int}  $stats
     * @return array<string, int|float>
     */
    private function adMetrics(array $stats): array
    {
        return [
            'spend' => $stats['spend'],
            'impressions' => $stats['impressions'],
            'clicks' => $stats['clicks'],
            'ctr' => $this->ratio($stats['clicks'] * 100, $stats['impressions']),
            'cpc' => $this->ratio($stats['spend'], $stats['clicks'], 0),
            'conversions' => $stats['conversions'],
            'conversionRate' => $this->ratio($stats['conversions'] * 100, $stats['clicks']),
            'costPerConversion' => $this->ratio($stats['spend'], $stats['conversions'], 0),
            'revenue' => $stats['revenue'],
            'roas' => $this->ratio($stats['revenue'], $stats['spend']),
        ];
    }

    /**
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>
     */
    private function buildContent(array $current): array
    {
        $engagement = fn (array $row, string $audienceKey): float => $this->ratio(($row['likes'] + $row['comments'] + $row['shares']) * 100, $row[$audienceKey]);

        $liveSessions = array_map(fn (array $live): array => [
            ...$live,
            'engagementRate' => $engagement($live, 'viewers'),
        ], array_reverse($current['liveSessions']));

        $videos = array_map(fn (array $video): array => [
            'id' => $video['id'],
            'publishedAt' => $video['publishedAt'],
            'title' => $video['title'],
            'durationSeconds' => $video['durationSeconds'],
            'views' => $video['views'],
            'likes' => $video['likes'],
            'comments' => $video['comments'],
            'shares' => $video['shares'],
            'engagementRate' => $engagement($video, 'views'),
            'orders' => $video['orders'],
            'revenue' => $video['revenue'],
        ], array_reverse($current['videos']));

        $sum = fn (array $rows, string $key): int => (int) array_sum(array_column($rows, $key));

        $live = [
            'sessions' => count($liveSessions),
            'durationMinutes' => $sum($liveSessions, 'durationMinutes'),
            'viewers' => $sum($liveSessions, 'viewers'),
            'orders' => $sum($liveSessions, 'orders'),
            'revenue' => $sum($liveSessions, 'revenue'),
        ];
        $live['engagementRate'] = $this->ratio(($sum($liveSessions, 'likes') + $sum($liveSessions, 'comments') + $sum($liveSessions, 'shares')) * 100, $live['viewers']);

        $video = [
            'count' => count($videos),
            'views' => $sum($videos, 'views'),
            'orders' => $sum($videos, 'orders'),
            'revenue' => $sum($videos, 'revenue'),
        ];
        $video['engagementRate'] = $this->ratio(($sum($videos, 'likes') + $sum($videos, 'comments') + $sum($videos, 'shares')) * 100, $video['views']);

        return [
            'totals' => [
                'live' => $live,
                'video' => $video,
                'revenue' => $live['revenue'] + $video['revenue'],
                'orders' => $live['orders'] + $video['orders'],
                'shareOfRevenue' => $this->ratio(($live['revenue'] + $video['revenue']) * 100, $current['totals']['revenue'], 1),
            ],
            'liveSessions' => $liveSessions,
            'videos' => $videos,
        ];
    }

    /**
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>
     */
    private function buildStorefront(array $current, int $days): array
    {
        $products = $this->productRows($current, $days);
        $totalRevenue = $current['totals']['revenue'];

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
            'conversionRate' => $this->ratio($row['orders'] * 100, $row['views']),
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
     * Per-product rows for the period. When $days is 0 the stock-related fields are skipped.
     *
     * @param  array<string, mixed>  $current
     * @return list<array<string, mixed>>
     */
    private function productRows(array $current, int $days): array
    {
        $rows = [];

        foreach (self::PRODUCTS as $product) {
            $stats = $current['products'][$product['id']];
            $row = [
                'id' => $product['id'],
                'sku' => $product['sku'],
                'name' => $product['name'],
                'etalase' => $product['etalase'],
                'price' => $product['price'],
                'stock' => $product['stock'],
                'views' => $stats['views'],
                'orders' => $stats['completed'],
                'units' => $stats['units'],
                'revenue' => $stats['revenue'],
                'conversionRate' => $this->ratio($stats['completed'] * 100, $stats['views']),
            ];

            if ($days > 0) {
                $unitsPerDay = $stats['units'] / $days;
                $daysOfCover = $unitsPerDay > 0 ? (int) floor($product['stock'] / $unitsPerDay) : null;

                $row['daysOfCover'] = $daysOfCover;
                $row['stockStatus'] = match (true) {
                    $product['stock'] === 0 => 'habis',
                    $daysOfCover !== null && $daysOfCover < self::LOW_STOCK_DAYS_OF_COVER => 'menipis',
                    default => 'aman',
                };
                $row['isSlowMoving'] = $stats['units'] <= $days * self::SLOW_MOVING_UNITS_PER_DAY;
            }

            $rows[] = $row;
        }

        return $rows;
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
