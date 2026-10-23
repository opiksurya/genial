<?php

use App\Models\User;
use App\Services\ShopeeAnalytics\ShopeeDummyDataService;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('shopee.index'))->assertRedirect(route('login'));
});

test('authenticated users see the shopee analytics page with dummy data for the default period', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-23 10:00:00'));

    $this->actingAs(User::factory()->create())
        ->get(route('shopee.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shopee/index')
            ->where('period', 30)
            ->has('periodOptions', 3)
            ->where('analytics.isDummy', true)
            ->where('analytics.range.start', '2026-09-23')
            ->where('analytics.range.end', '2026-10-22')
            ->where('analytics.range.previousEnd', '2026-09-22')
            ->has('analytics.sales.daily', 30)
            ->has('analytics.summary.kpis', 8)
            ->has('analytics.ads.campaigns')
            ->has('analytics.content.liveSessions')
            ->has('analytics.content.videos')
            ->has('analytics.storefront.etalase')
            ->has('analytics.storefront.products', 16)
        );
});

test('a valid period changes the reported range', function (int $period) {
    $this->actingAs(User::factory()->create())
        ->get(route('shopee.index', ['period' => $period]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', $period)
            ->has('analytics.sales.daily', $period)
        );
})->with([7, 30, 90]);

test('an invalid period falls back to 30 days', function (mixed $period) {
    $this->actingAs(User::factory()->create())
        ->get(route('shopee.index', ['period' => $period]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', 30)
            ->has('analytics.sales.daily', 30)
        );
})->with([
    'unsupported number' => '14',
    'negative' => '-7',
    'non numeric' => 'abc',
    'huge' => '99999999999999999999',
    'array' => [['7']],
]);

test('dummy data is deterministic for the same period and end date', function () {
    $endDate = CarbonImmutable::parse('2026-10-22');

    $first = (new ShopeeDummyDataService)->report(ShopeePeriod::Last30Days, $endDate);
    $second = (new ShopeeDummyDataService)->report(ShopeePeriod::Last30Days, $endDate);

    expect($first)->toBe($second);
});

test('a given day has the same numbers regardless of the requested period', function () {
    $endDate = CarbonImmutable::parse('2026-10-22');

    $week = (new ShopeeDummyDataService)->report(ShopeePeriod::Last7Days, $endDate);
    $quarter = (new ShopeeDummyDataService)->report(ShopeePeriod::Last90Days, $endDate);

    expect($week['sales']['daily'])->toBe(array_slice($quarter['sales']['daily'], -7));
});

test('dummy data totals are internally consistent', function (ShopeePeriod $period) {
    $report = (new ShopeeDummyDataService)->report($period, CarbonImmutable::parse('2026-10-22'));
    $sales = $report['sales'];
    $revenue = $sales['totals']['revenue'];

    expect($revenue)->toBeGreaterThan(0)
        ->and(array_sum(array_column($sales['daily'], 'revenue')))->toBe($revenue)
        ->and(array_sum(array_column($sales['weekly'], 'revenue')))->toBe($revenue)
        ->and(array_sum(array_column($report['storefront']['etalase'], 'revenue')))->toBe($revenue)
        ->and(array_sum(array_column($report['storefront']['products'], 'revenue')))->toBe($revenue)
        ->and(array_sum(array_column($report['summary']['channels'], 'revenue')))->toBe($revenue)
        ->and(array_sum(array_column($sales['statuses'], 'orders')))->toBe($sales['totals']['orders'])
        ->and($sales['totals']['aov'])->toBe((int) round($revenue / $sales['totals']['completed']));

    $ads = $report['ads'];
    expect(array_sum(array_column($ads['campaigns'], 'spend')))->toBe($ads['totals']['spend'])
        ->and(array_sum(array_column($ads['campaigns'], 'revenue')))->toBe($ads['totals']['revenue'])
        ->and($ads['totals']['roas'])->toBe(round($ads['totals']['revenue'] / $ads['totals']['spend'], 2))
        ->and(array_sum(array_column($ads['daily'], 'spend')))->toBe($ads['totals']['spend']);

    foreach ($ads['campaigns'] as $campaign) {
        expect($campaign['roas'])->toBe(round($campaign['revenue'] / $campaign['spend'], 2))
            ->and($campaign['ctr'])->toBe(round($campaign['clicks'] * 100 / $campaign['impressions'], 2))
            ->and($campaign['conversions'])->toBeLessThanOrEqual($campaign['clicks']);
    }

    $channels = collect($report['summary']['channels'])->keyBy('channel');
    $content = $report['content'];
    expect($channels['ads']['revenue'])->toBe($ads['totals']['revenue'])
        ->and(array_sum(array_column($content['liveSessions'], 'revenue')))->toBe($channels['live']['revenue'])
        ->and(array_sum(array_column($content['videos'], 'revenue')))->toBe($channels['video']['revenue'])
        ->and($content['totals']['revenue'])->toBe($channels['live']['revenue'] + $channels['video']['revenue']);

    $revenueKpi = collect($report['summary']['kpis'])->firstWhere('key', 'revenue');
    expect($revenueKpi['value'])->toBe($revenue)
        ->and($revenueKpi['change'])->toBe(round(($revenueKpi['value'] - $revenueKpi['previous']) / $revenueKpi['previous'] * 100, 1));
})->with(ShopeePeriod::cases());

test('products without sales are flagged as slow moving', function () {
    $report = (new ShopeeDummyDataService)->report(ShopeePeriod::Last30Days, CarbonImmutable::parse('2026-10-22'));

    $unsold = collect($report['storefront']['products'])->where('units', 0);

    expect($unsold)->not->toBeEmpty()
        ->and(collect($report['storefront']['slowMoving'])->pluck('id')->all())->toContain(...$unsold->pluck('id')->all());
});

test('switching projects customizes store name and generates distinct deterministic data', function () {
    $user = User::factory()->create();
    $projectA = \App\Models\Project::create([
        'name' => 'Tatamu Brand',
        'client' => 'Tatamu',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);
    $projectB = \App\Models\Project::create([
        'name' => 'Prestige Atelier',
        'client' => 'Prestige Atelier',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);

    $responseA = $this->actingAs($user)
        ->get(route('shopee.index', ['project_id' => $projectA->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedProjectId', $projectA->id)
            ->where('selectedProject.name', 'Tatamu Brand')
            ->where('analytics.storeName', 'Tatamu Official Store')
            ->has('projects')
        );

    $responseB = $this->actingAs($user)
        ->get(route('shopee.index', ['project_id' => $projectB->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedProjectId', $projectB->id)
            ->where('selectedProject.name', 'Prestige Atelier')
            ->where('analytics.storeName', 'Prestige Atelier Official Store')
        );

    $service = new ShopeeDummyDataService();
    $date = CarbonImmutable::parse('2026-10-22');
    $reportA = $service->report(ShopeePeriod::Last30Days, $date, $projectA);
    $reportB = $service->report(ShopeePeriod::Last30Days, $date, $projectB);

    expect($reportA['storeName'])->toBe('Tatamu Official Store')
        ->and($reportB['storeName'])->toBe('Prestige Atelier Official Store')
        ->and($reportA['sales']['totals']['revenue'])->not->toBe($reportB['sales']['totals']['revenue']);
});

