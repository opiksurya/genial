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

test('authenticated users see the meta ads page with zeros when no account is connected', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-23 10:00:00'));

    $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('meta-ads/index')
            ->where('period', 30)
            ->has('periodOptions', 3)
            ->where('analytics.isConnected', false)
            ->where('analytics.range.start', '2026-09-23')
            ->where('analytics.range.end', '2026-10-22')
            ->where('analytics.range.previousEnd', '2026-09-22')
            ->has('analytics.daily', 30)
            ->where('analytics.summary.totals.spend', 0)
            ->where('analytics.summary.totals.revenue', 0)
            ->has('analytics.summary.kpis', 8)
            ->where('analytics.summary.kpis.0.value', 0)
            ->has('analytics.platforms', 4)
            ->where('analytics.platforms.0.spend', 0)
            ->has('analytics.placements', 6)
            ->where('analytics.placements.0.roas', 0)
            ->has('analytics.campaigns', 0)
            ->has('analytics.audiences.ageGroups', 6)
            ->has('analytics.audiences.segments', 0)
            ->has('analytics.creatives', 3)
            ->where('analytics.adAccountId', '')
            ->where('analytics.pixelHealth.status', 'Belum terhubung')
            ->has('analytics.pixelHealth.events', 0)
        );
});

test('a disconnected meta report contains no generated figures at all', function () {
    $report = (new MetaAdsDataService)->report(MetaAdsPeriod::Last7Days, CarbonImmutable::parse('2026-10-22'));

    $numbers = [];
    array_walk_recursive($report, function ($value, $key) use (&$numbers) {
        if (is_int($value) || is_float($value)) {
            $numbers[$key] = $value;
        }
    });

    expect($report['isConnected'])->toBeFalse()
        ->and($report['summary']['totals'])->each->toBe(0)
        ->and(collect($report['daily'])->sum('spend'))->toBe(0)
        ->and(collect($report['platforms'])->pluck('share')->unique()->all())->toBe([0])
        ->and(collect($report['creatives'])->pluck('hookRate')->unique()->all())->toBe([null])
        ->and(array_filter($numbers, fn ($n, $k) => ! in_array($k, ['projectId'], true) && $n !== 0, ARRAY_FILTER_USE_BOTH))->toBe([]);
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

test('switching projects in meta ads customizes the account name per project', function () {
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
            ->where('analytics.accountName', 'Tatamu')
            ->has('projects')
        );

    $this->actingAs($user)
        ->get(route('meta-ads.index', ['project_id' => $projectB->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedProjectId', $projectB->id)
            ->where('selectedProject.name', 'Prestige Atelier')
            ->where('analytics.accountName', 'Prestige Atelier')
        );
});

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

