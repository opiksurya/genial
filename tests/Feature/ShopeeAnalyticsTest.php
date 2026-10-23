<?php

use App\Models\User;
use App\Services\ShopeeAnalytics\ShopeeDummyDataService;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('shopee.index'))->assertRedirect(route('login'));
});

test('authenticated users see the dummy analytics for the last 30 days by default', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-23 10:00:00'));
    $this->actingAs(User::factory()->create());

    $this->get(route('shopee.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shopee/index')
            ->where('period', 30)
            ->has('periodOptions', 3)
            ->where('report.is_dummy', true)
            ->where('report.period.start', '2026-09-23')
            ->where('report.period.end', '2026-10-22')
            ->where('report.period.previous_end', '2026-09-22')
            ->has('report.sales.daily', 30)
            ->has('report.summary.current')
            ->has('report.summary.previous')
            ->has('report.ads.campaigns', 6)
            ->has('report.content.live.sessions')
            ->has('report.content.video.videos')
            ->has('report.showcases', 5)
            ->has('report.products', 16)
        );
});

test('a supported period changes the reported range', function (int $days) {
    $this->actingAs(User::factory()->create());

    $this->get(route('shopee.index', ['period' => $days]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', $days)
            ->has('report.sales.daily', $days)
        );
})->with([7, 90]);

test('an invalid period falls back to 30 days', function (mixed $period) {
    $this->actingAs(User::factory()->create());

    $this->get(route('shopee.index', ['period' => $period]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', 30)
            ->has('report.sales.daily', 30)
        );
})->with([
    'unsupported number' => '15',
    'negative' => '-7',
    'text' => 'abc',
    'array' => [['7']],
]);

test('the dummy data is deterministic for the same period', function () {
    $endDate = CarbonImmutable::parse('2026-10-22');

    $first = (new ShopeeDummyDataService)->report(ShopeePeriod::Last30Days, $endDate);
    $second = (new ShopeeDummyDataService)->report(ShopeePeriod::Last30Days, $endDate);

    expect($first)->toBe($second);
});

test('the dummy data totals are consistent across every breakdown', function (ShopeePeriod $period) {
    $report = (new ShopeeDummyDataService)->report($period, CarbonImmutable::parse('2026-10-22'));
    $summary = $report['summary']['current'];
    $channels = collect($report['sales']['channels'])->keyBy('channel');

    expect($summary['revenue'])
        ->toBeGreaterThan(0)
        ->toBe(collect($report['products'])->sum('revenue'))
        ->toBe(collect($report['showcases'])->sum('revenue'))
        ->toBe(collect($report['sales']['daily'])->sum('revenue'))
        ->toBe(collect($report['sales']['weekly'])->sum('revenue'))
        ->toBe($channels->sum('revenue'))
        ->and($summary['orders'])->toBe(collect($report['showcases'])->sum('orders'))
        ->and($summary['orders'])->toBe($report['sales']['statuses'][0]['orders'])
        ->and($summary['aov'])->toBe((int) round($summary['revenue'] / $summary['orders']));

    expect($report['ads']['totals']['revenue'])
        ->toBe($channels['ads']['revenue'])
        ->toBe($summary['ad_revenue'])
        ->toBe(collect($report['ads']['campaigns'])->sum('revenue'))
        ->and($report['ads']['totals']['spend'])->toBe(collect($report['ads']['daily'])->sum('spend'))
        ->and($summary['roas'])->toBe(round($summary['ad_revenue'] / $summary['ad_spend'], 2));

    foreach ($report['ads']['campaigns'] as $campaign) {
        expect($campaign['roas'])->toBe(round($campaign['revenue'] / $campaign['spend'], 2))
            ->and($campaign['ctr'])->toBe(round($campaign['clicks'] / $campaign['impressions'] * 100, 2))
            ->and($campaign['cpc'])->toBe((int) round($campaign['spend'] / $campaign['clicks']));
    }

    expect($report['content']['live']['totals']['revenue'])
        ->toBe($channels['live']['revenue'])
        ->toBe(collect($report['content']['live']['sessions'])->sum('revenue'))
        ->and($report['content']['video']['totals']['revenue'])
        ->toBe($channels['video']['revenue'])
        ->toBe(collect($report['content']['video']['videos'])->sum('revenue'));
})->with(ShopeePeriod::cases());
