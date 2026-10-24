<?php

use App\Models\Project;
use App\Models\User;
use App\Services\MetaAdsAnalytics\MetaAdsDataService;
use App\Services\MetaAdsAnalytics\MetaAdsPeriod;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page from meta ads', function () {
    $this->get(route('meta-ads.index'))->assertRedirect(route('login'));
});

test('authenticated users see the meta ads analytics page with data for the default period', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-23 10:00:00'));

    $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('meta-ads/index')
            ->where('period', 30)
            ->has('periodOptions', 3)
            ->where('analytics.isDummy', true)
            ->where('analytics.range.start', '2026-09-23')
            ->where('analytics.range.end', '2026-10-22')
            ->where('analytics.range.previousEnd', '2026-09-22')
            ->has('analytics.daily', 30)
            ->has('analytics.summary.kpis', 8)
            ->has('analytics.platforms', 4)
            ->has('analytics.placements')
            ->has('analytics.campaigns')
            ->has('analytics.audiences.ageGroups')
            ->has('analytics.creatives')
            ->has('analytics.pixelHealth.events')
        );
});

test('valid period changes the reported range for meta ads', function (int $period) {
    $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index', ['period' => $period]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', $period)
            ->has('analytics.daily', $period)
        );
})->with([7, 30, 90]);

test('invalid period falls back to 30 days for meta ads', function (mixed $period) {
    $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index', ['period' => $period]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('period', 30)
            ->has('analytics.daily', 30)
        );
})->with([
    'unsupported number' => '14',
    'negative' => '-7',
    'non numeric' => 'meta',
    'huge' => '99999999999999999999',
]);

test('meta ads dummy data is deterministic for the same period and end date', function () {
    $endDate = CarbonImmutable::parse('2026-10-22');

    $first = (new MetaAdsDataService)->report(MetaAdsPeriod::Last30Days, $endDate);
    $second = (new MetaAdsDataService)->report(MetaAdsPeriod::Last30Days, $endDate);

    expect($first)->toBe($second);
});

test('switching projects in meta ads customizes account name and generates distinct deterministic data', function () {
    $user = User::factory()->create();
    $projectA = Project::create([
        'name' => 'Tatamu Brand',
        'client' => 'Tatamu',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);
    $projectB = Project::create([
        'name' => 'Prestige Atelier',
        'client' => 'Prestige Atelier',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);

    $this->actingAs($user)
        ->get(route('meta-ads.index', ['project_id' => $projectA->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedProjectId', $projectA->id)
            ->where('selectedProject.name', 'Tatamu Brand')
            ->where('analytics.accountName', 'Tatamu - Meta Ads')
            ->has('projects')
        );

    $this->actingAs($user)
        ->get(route('meta-ads.index', ['project_id' => $projectB->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedProjectId', $projectB->id)
            ->where('selectedProject.name', 'Prestige Atelier')
            ->where('analytics.accountName', 'Prestige Atelier - Meta Ads')
        );

    $service = new MetaAdsDataService();
    $date = CarbonImmutable::parse('2026-10-22');
    $reportA = $service->report(MetaAdsPeriod::Last30Days, $date, $projectA);
    $reportB = $service->report(MetaAdsPeriod::Last30Days, $date, $projectB);

    expect($reportA['accountName'])->toBe('Tatamu - Meta Ads')
        ->and($reportB['accountName'])->toBe('Prestige Atelier - Meta Ads')
        ->and($reportA['summary']['totals']['spend'])->not->toBe($reportB['summary']['totals']['spend']);
});

test('meta ads dummy data totals are internally consistent', function (MetaAdsPeriod $period) {
    $report = (new MetaAdsDataService)->report($period, CarbonImmutable::parse('2026-10-22'));
    $totals = $report['summary']['totals'];
    $daily = $report['daily'];

    expect(array_sum(array_column($daily, 'spend')))->toBe($totals['spend'])
        ->and(array_sum(array_column($daily, 'revenue')))->toBe($totals['revenue'])
        ->and(array_sum(array_column($daily, 'purchases')))->toBe($totals['purchases'])
        ->and(array_sum(array_column($daily, 'clicks')))->toBe($totals['clicks'])
        ->and(array_sum(array_column($daily, 'impressions')))->toBe($totals['impressions'])
        ->and(round($totals['revenue'] / $totals['spend'], 2))->toBe($totals['roas']);
})->with(MetaAdsPeriod::cases());

test('updating project meta config saves app_id and encrypted app_secret', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'name' => 'Tatamu Brand',
        'client' => 'Tatamu',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);

    $this->actingAs($user)
        ->post(route('projects.meta.update', $project), [
            'ad_account_id' => 'act_4489107658080015',
            'app_id' => '1808794403668949',
            'app_secret' => 'super_secret_meta_key_123',
            'pixel_id' => '928374615283921',
        ])
        ->assertRedirect();

    $config = $project->fresh()->metaConfig;
    expect($config)->not->toBeNull()
        ->and($config->ad_account_id)->toBe('act_4489107658080015')
        ->and($config->app_id)->toBe('1808794403668949')
        ->and($config->app_secret)->toBe('super_secret_meta_key_123')
        ->and($config->pixel_id)->toBe('928374615283921');
});

test('meta oauth redirect generates facebook oauth url and sets state session', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'name' => 'Tatamu Brand',
        'client' => 'Tatamu',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);

    $response = $this->actingAs($user)
        ->get(route('projects.meta.oauth.redirect', [
            'project' => $project->id,
            'app_id' => '1808794403668949',
            'app_secret' => 'my_secret_token',
            'ad_account_id' => 'act_4489107658080015',
        ]));

    $response->assertRedirect();
    $targetUrl = $response->headers->get('Location');

    expect($targetUrl)->toContain('https://www.facebook.com/v21.0/dialog/oauth')
        ->and($targetUrl)->toContain('client_id=1808794403668949')
        ->and($targetUrl)->toContain('ads_read')
        ->and(session('meta_oauth_state'))->not->toBeNull()
        ->and(session('meta_oauth_project_id'))->toBe($project->id);

    $config = $project->fresh()->metaConfig;
    expect($config->app_id)->toBe('1808794403668949')
        ->and($config->app_secret)->toBe('my_secret_token')
        ->and($config->ad_account_id)->toBe('act_4489107658080015');
});

test('meta oauth callback rejects invalid state', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'name' => 'Tatamu Brand',
        'client' => 'Tatamu',
        'start_date' => now(),
        'end_date' => now()->addMonth(),
    ]);

    session(['meta_oauth_state' => 'valid_state_123']);

    $response = $this->actingAs($user)
        ->get(route('projects.meta.oauth.callback', [
            'project' => $project->id,
            'state' => 'invalid_state_456',
            'code' => 'fb_auth_code_sample',
        ]));

    $response->assertRedirect()
        ->assertSessionHas('error');
});

