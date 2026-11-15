<?php

use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Models\User;
use App\Services\ShopeeAnalytics\ShopeeAnalyticsManager;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use App\Services\ShopeeAnalytics\ShopeeStoreDataFetcher;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config([
        'services.shopee.partner_id' => '1000001',
        'services.shopee.partner_key' => 'shared-partner-key',
        'services.shopee.sandbox' => true,
    ]);
    Cache::flush();
    $this->travelTo(CarbonImmutable::parse('2026-11-15 10:00:00', config('app.timezone')));

    $this->project = Project::create(['name' => 'Toko Batik', 'client' => 'CV Batik', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->config = ProjectShopeeConfig::create([
        'project_id' => $this->project->id,
        'shop_id' => '555',
        'shop_name' => 'Batik Resmi',
        'access_token' => 'access',
        'refresh_token' => 'refresh',
        'token_expires_at' => now()->addHours(2),
        'refresh_expires_at' => now()->addDays(20),
        'status' => 'connected',
    ]);
});

function at(string $datetime): int
{
    return CarbonImmutable::parse($datetime, config('app.timezone'))->timestamp;
}

function line(int $itemId, string $name, int $qty, int $price): array
{
    return ['item_id' => $itemId, 'item_name' => $name, 'model_sku' => "SKU-{$itemId}", 'model_quantity_purchased' => $qty, 'model_discounted_price' => $price];
}

function fakeShop(array $orders, array $returns = [], bool $returnsDenied = false): void
{
    Http::fake([
        '*/api/v2/order/get_order_list*' => Http::response(['response' => [
            'more' => false,
            'order_list' => array_map(fn ($o) => ['order_sn' => $o['order_sn']], $orders),
        ]]),
        '*/api/v2/order/get_order_detail*' => Http::response(['response' => ['order_list' => $orders]]),
        '*/api/v2/returns/get_return_list*' => $returnsDenied
            ? Http::response(['error' => 'error_permission', 'message' => 'no access'])
            : Http::response(['response' => ['more' => false, 'return' => $returns]]),
        '*/api/v2/product/get_item_list*' => Http::response(['response' => ['item' => [['item_id' => 1], ['item_id' => 2]], 'has_next_page' => false]]),
        '*/api/v2/product/get_item_base_info*' => Http::response(['response' => ['item_list' => [
            ['item_id' => 1, 'item_name' => 'Kain Batik Tulis', 'item_sku' => 'KBT', 'category_id' => 10, 'price_info' => [['current_price' => 100000]], 'stock_info_v2' => ['summary_info' => ['total_available_stock' => 8]]],
            ['item_id' => 2, 'item_name' => 'Kemeja Batik', 'item_sku' => 'KMJ', 'category_id' => 11, 'price_info' => [['current_price' => 250000]], 'stock_info_v2' => ['summary_info' => ['total_available_stock' => 0]]],
        ]]]),
        '*/api/v2/product/get_category*' => Http::response(['response' => ['category_list' => [
            ['category_id' => 10, 'display_category_name' => 'Kain'],
            ['category_id' => 11, 'display_category_name' => 'Pakaian'],
        ]]]),
    ]);
}

function sampleOrders(): array
{
    return [
        ['order_sn' => 'A1', 'order_status' => 'COMPLETED', 'create_time' => at('2026-11-10 12:00'), 'total_amount' => 300000, 'item_list' => [line(1, 'Kain Batik Tulis', 3, 100000)]],
        ['order_sn' => 'A2', 'order_status' => 'COMPLETED', 'create_time' => at('2026-11-11 09:00'), 'total_amount' => 250000, 'item_list' => [line(2, 'Kemeja Batik', 1, 250000)]],
        ['order_sn' => 'A3', 'order_status' => 'CANCELLED', 'create_time' => at('2026-11-11 10:00'), 'total_amount' => 100000, 'item_list' => [line(1, 'Kain Batik Tulis', 1, 100000)]],
        ['order_sn' => 'A4', 'order_status' => 'SHIPPED', 'create_time' => at('2026-11-12 10:00'), 'total_amount' => 999000, 'item_list' => [line(1, 'Kain Batik Tulis', 9, 111000)]],
        ['order_sn' => 'A5', 'order_status' => 'COMPLETED', 'create_time' => at('2026-11-13 10:00'), 'total_amount' => 200000, 'item_list' => [line(1, 'Kain Batik Tulis', 2, 100000)]],
        ['order_sn' => 'P1', 'order_status' => 'COMPLETED', 'create_time' => at('2026-11-03 10:00'), 'total_amount' => 100000, 'item_list' => [line(1, 'Kain Batik Tulis', 1, 100000)]],
    ];
}

function liveReport(?ShopeePeriod $period = null): array
{
    return app(ShopeeAnalyticsManager::class)->report($period ?? ShopeePeriod::Last7Days, CarbonImmutable::yesterday(), test()->project);
}

test('a project without a connection gets a report with every number at zero', function () {
    $this->config->update(['status' => 'disconnected']);
    Http::fake();

    $report = liveReport();

    expect($report['isConnected'])->toBeFalse()
        ->and($report)->not->toHaveKey('liveError')
        ->and($report['storeName'])->toBe('CV Batik')
        ->and(collect($report['summary']['kpis'])->pluck('value')->unique()->all())->toBe([0])
        ->and(collect($report['summary']['kpis'])->pluck('key')->all())->toHaveCount(8)
        ->and($report['summary']['channels'])->toBe([])
        ->and($report['sales']['totals'])->each->toBe(0)
        ->and($report['sales']['daily'])->toHaveCount(7)
        ->and(collect($report['sales']['daily'])->sum('revenue'))->toBe(0)
        ->and(collect($report['sales']['statuses'])->pluck('orders')->all())->toBe([0, 0, 0])
        ->and($report['sales']['topProducts'])->toBe([])
        ->and($report['ads']['campaigns'])->toBe([])
        ->and($report['ads']['totals'])->each->toBe(0)
        ->and($report['content']['liveSessions'])->toBe([])
        ->and($report['content']['videos'])->toBe([])
        ->and($report['storefront']['products'])->toBe([])
        ->and($report['storefront']['etalase'])->toBe([])
        ->and($report)->not->toHaveKey('meta');
    Http::assertNothingSent();
});

test('a project that does not exist yet still gets a zero report', function () {
    $report = app(ShopeeAnalyticsManager::class)->report(ShopeePeriod::Last30Days, CarbonImmutable::yesterday(), null);

    expect($report['isConnected'])->toBeFalse()
        ->and($report['storeName'])->toBe('Belum ada proyek')
        ->and($report['sales']['daily'])->toHaveCount(30)
        ->and($report['sales']['totals']['revenue'])->toBe(0);
});

test('revenue counts completed orders only, while all orders count towards the total', function () {
    fakeShop(sampleOrders());

    $report = liveReport();

    expect($report['isConnected'])->toBeTrue()
        ->and($report['storeName'])->toBe('Batik Resmi')
        ->and($report['range'])->toMatchArray(['start' => '2026-11-08', 'end' => '2026-11-14'])
        ->and($report['sales']['totals'])->toMatchArray([
            'revenue' => 750000,
            'orders' => 5,
            'completed' => 3,
            'cancelled' => 1,
            'returned' => 0,
            'grossValue' => 850000,
            'aov' => 250000,
            'units' => 6,
        ]);
});

test('the previous period feeds the kpi comparison', function () {
    fakeShop(sampleOrders());

    $revenue = collect(liveReport()['summary']['kpis'])->firstWhere('key', 'revenue');

    expect($revenue)->toMatchArray(['value' => 750000, 'previous' => 100000, 'change' => 650.0]);
});

test('a completed order with a return counts as returned, not as revenue', function () {
    fakeShop(sampleOrders(), [['order_sn' => 'A5', 'refund_amount' => 150000]]);

    $totals = liveReport()['sales']['totals'];

    expect($totals['returned'])->toBe(1)
        ->and($totals['completed'])->toBe(2)
        ->and($totals['revenue'])->toBe(550000)
        ->and(collect(liveReport()['sales']['statuses'])->firstWhere('status', 'returned')['value'])->toBe(150000);
});

test('top products are ranked by completed revenue with their category', function () {
    fakeShop(sampleOrders());

    $top = liveReport()['sales']['topProducts'];

    expect($top[0])->toMatchArray(['id' => 1, 'name' => 'Kain Batik Tulis', 'etalase' => 'Kain', 'units' => 5, 'revenue' => 500000, 'share' => 66.7])
        ->and($top[1])->toMatchArray(['id' => 2, 'revenue' => 250000]);
});

test('the storefront shows stock, category and stock status from the catalog', function () {
    fakeShop(sampleOrders());

    $products = collect(liveReport()['storefront']['products'])->keyBy('id');

    expect($products[1])->toMatchArray(['stock' => 8, 'price' => 100000, 'etalase' => 'Kain', 'stockStatus' => 'menipis'])
        ->and($products[2])->toMatchArray(['stock' => 0, 'etalase' => 'Pakaian', 'stockStatus' => 'habis'])
        ->and(collect(liveReport()['storefront']['etalase'])->pluck('name')->all())->toBe(['Kain', 'Pakaian']);
});

test('every day in the range is present even without orders', function () {
    fakeShop(sampleOrders());

    $daily = liveReport()['sales']['daily'];

    expect($daily)->toHaveCount(7)
        ->and(collect($daily)->firstWhere('date', '2026-11-09'))->toMatchArray(['revenue' => 0, 'orders' => 0])
        ->and(collect($daily)->firstWhere('date', '2026-11-10')['revenue'])->toBe(300000);
});

test('sections the api cannot provide are reported as unavailable instead of invented', function () {
    fakeShop(sampleOrders());

    $report = liveReport();

    expect($report['meta']['unavailable'])->toContain('ads', 'content', 'views')
        ->and($report['ads']['campaigns'])->toBe([])
        ->and($report['content']['liveSessions'])->toBe([])
        ->and($report['summary']['channels'])->toBe([])
        ->and(collect($report['summary']['kpis'])->pluck('key')->all())->toBe(['revenue', 'orders', 'aov', 'cancellationRate']);
});

test('a shop without returns access is flagged and still reported', function () {
    fakeShop(sampleOrders(), returnsDenied: true);

    $report = liveReport();

    expect($report['meta']['unavailable'])->toContain('returns')
        ->and($report['sales']['totals']['revenue'])->toBe(750000);
});

test('buyer personal data is never requested', function () {
    fakeShop(sampleOrders());

    liveReport();

    Http::assertSent(function ($request) {
        if (! str_contains($request->url(), 'get_order_detail')) {
            return true;
        }

        parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);

        return $query['response_optional_fields'] === 'item_list,total_amount';
    });
});

test('a 90 day period queries Shopee in windows of at most 15 days', function () {
    fakeShop([]);

    liveReport(ShopePeriodNinety());

    $windows = [];
    Http::assertSent(function ($request) use (&$windows) {
        if (str_contains($request->url(), 'get_order_list')) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
            $windows[] = [(int) $query['time_from'], (int) $query['time_to']];
        }

        return true;
    });

    expect(count($windows))->toBeGreaterThan(10)
        ->and(collect($windows)->every(fn ($w) => ($w[1] - $w[0]) < 15 * 86400))->toBeTrue()
        ->and(collect($windows)->min(fn ($w) => $w[0]))->toBe(at('2026-11-14') - 179 * 86400 + 0)
        ->and(collect($windows)->max(fn ($w) => $w[1]))->toBe(at('2026-11-14 23:59:59'));
});

function ShopePeriodNinety(): ShopeePeriod
{
    return ShopeePeriod::Last90Days;
}

test('the order cap keeps the newest orders and flags the result as truncated', function () {
    Http::fake([
        '*/api/v2/order/get_order_list*' => Http::response(['response' => [
            'more' => true,
            'next_cursor' => 'c1',
            'order_list' => [['order_sn' => 'N1'], ['order_sn' => 'N2'], ['order_sn' => 'N3']],
        ]]),
        '*/api/v2/order/get_order_detail*' => Http::response(['response' => ['order_list' => []]]),
    ]);

    $result = app(ShopeeStoreDataFetcher::class)->orders($this->config, CarbonImmutable::parse('2026-11-01'), CarbonImmutable::parse('2026-11-14'), 2);

    $detailRequests = Http::recorded(fn ($request) => str_contains($request->url(), 'get_order_detail'))->values();
    parse_str(parse_url($detailRequests[0][0]->url(), PHP_URL_QUERY), $query);

    expect($result['truncated'])->toBeTrue()
        ->and($detailRequests)->toHaveCount(1)
        ->and($query['order_sn_list'])->toBe('N1,N2');
});

test('the report is cached so the page does not hit Shopee on every load', function () {
    fakeShop(sampleOrders());

    liveReport();
    $callsAfterFirst = count(Http::recorded());

    liveReport();

    expect(count(Http::recorded()))->toBe($callsAfterFirst);
});

test('a failing shopee api shows zeros and says why, never invented numbers', function () {
    Http::fake(['*/api/v2/*' => Http::response(['error' => 'error_permission', 'message' => 'Permission denied for order'])]);

    $report = liveReport();

    expect($report['isConnected'])->toBeFalse()
        ->and($report['liveError'])->toBe('Permission denied for order')
        ->and($report['sales']['totals']['revenue'])->toBe(0)
        ->and(collect($report['summary']['kpis'])->pluck('value')->unique()->all())->toBe([0]);
});

test('the analytics page serves live data for a connected project and hides secrets', function () {
    fakeShop(sampleOrders());

    $response = $this->actingAs(User::factory()->create())
        ->get(route('shopee.index', ['project_id' => $this->project->id, 'period' => 7]));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('analytics.isConnected', true)
        ->where('analytics.sales.totals.revenue', 750000)
        ->has('analytics.meta.unavailable')
    );

    expect($response->getContent())->not->toContain('"access"')->not->toContain('shared-partner-key');
});
