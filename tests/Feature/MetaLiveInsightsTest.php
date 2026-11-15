<?php

use App\Models\Project;
use App\Models\ProjectMetaConfig;
use App\Models\User;
use App\Services\MetaAdsAnalytics\MetaAdsDataService;
use App\Services\MetaAdsAnalytics\MetaAdsPeriod;
use Carbon\CarbonImmutable;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Cache::flush();
    $this->travelTo(CarbonImmutable::parse('2026-11-15 10:00:00', config('app.timezone')));
});

function metaProject(array $config = [], string $name = 'Toko Batik', string $client = 'CV Batik'): Project
{
    $project = Project::create(['name' => $name, 'client' => $client, 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    ProjectMetaConfig::create(array_merge([
        'project_id' => $project->id,
        'is_default' => true,
        'ad_account_id' => 'act_555',
        'pixel_id' => '777',
        'access_token' => 'test-token',
        'account_name' => 'Batik Ads',
        'currency' => 'IDR',
        'status' => 'connected',
    ], $config));

    return $project->fresh('metaConfig');
}

function metaReport(Project $project, MetaAdsPeriod $period = MetaAdsPeriod::Last7Days): array
{
    return (new MetaAdsDataService)->report($period, CarbonImmutable::yesterday(), $project);
}

/** An insights row; "buys" is reported under several action types the way Meta does. */
function insightsRow(string $date, int $spend, int $impressions, int $linkClicks, int $buys = 0, int $revenue = 0, int $leads = 0, bool $omni = true): array
{
    $actions = [['action_type' => 'link_click', 'value' => (string) $linkClicks]];
    $values = [];

    if ($buys > 0) {
        $types = $omni ? ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'] : ['purchase'];
        foreach ($types as $type) {
            $actions[] = ['action_type' => $type, 'value' => (string) $buys];
            $values[] = ['action_type' => $type, 'value' => (string) $revenue];
        }
    }
    if ($leads > 0) {
        $actions[] = ['action_type' => 'lead', 'value' => (string) $leads];
    }

    return [
        'date_start' => $date, 'date_stop' => $date,
        'spend' => (string) $spend, 'impressions' => (string) $impressions,
        'clicks' => (string) ($linkClicks + 50), 'inline_link_clicks' => (string) $linkClicks,
        'actions' => $actions, 'action_values' => $values,
    ];
}

function breakdownRow(array $dimensions, int $spend, int $buys = 0, int $revenue = 0): array
{
    return [
        ...$dimensions,
        'spend' => (string) $spend, 'impressions' => '1000', 'inline_link_clicks' => '10',
        'actions' => $buys > 0 ? [['action_type' => 'purchase', 'value' => (string) $buys]] : [],
        'action_values' => $buys > 0 ? [['action_type' => 'purchase', 'value' => (string) $revenue]] : [],
    ];
}

function campaignNode(string $id, string $status, ?array $insight, string $budget = '5000000'): array
{
    return [
        'id' => $id, 'name' => "Kampanye {$id}", 'effective_status' => $status, 'objective' => 'OUTCOME_SALES',
        'daily_budget' => $budget,
        ...($insight ? ['insights' => ['data' => [$insight]]] : []),
    ];
}

function adNode(string $id, array $creative, ?array $insight): array
{
    return ['id' => $id, 'creative' => $creative, ...($insight ? ['insights' => ['data' => [$insight]]] : [])];
}

/**
 * Fake the Graph API for ad account act_555 and pixel 777. Pass overrides keyed by section to change one answer;
 * a value can be a plain payload array or a ready Http::response().
 *
 * @param  array<string, mixed>  $overrides
 */
function fakeGraph(array $overrides = []): void
{
    $answers = array_merge([
        'daily' => ['data' => [
            insightsRow('2026-11-03', 100000, 10000, 100, 2, 300000),
            insightsRow('2026-11-10', 100000, 10000, 150, 4, 800000, 2),
            insightsRow('2026-11-12', 200000, 20000, 300, 6, 1200000, 0, false),
        ]],
        'totals' => ['data' => [['spend' => '300000', 'impressions' => '30000', 'reach' => '25000', 'clicks' => '500', 'inline_link_clicks' => '450']]],
        'platform' => ['data' => [
            breakdownRow(['publisher_platform' => 'instagram'], 200000, 7, 1400000),
            breakdownRow(['publisher_platform' => 'facebook'], 80000, 3, 600000),
            breakdownRow(['publisher_platform' => 'audience_network'], 20000),
        ]],
        'placement' => ['data' => [
            breakdownRow(['publisher_platform' => 'instagram', 'platform_position' => 'reels'], 120000, 4, 900000),
            breakdownRow(['publisher_platform' => 'instagram', 'platform_position' => 'feed'], 80000),
            breakdownRow(['publisher_platform' => 'facebook', 'platform_position' => 'feed'], 60000),
            breakdownRow(['publisher_platform' => 'facebook', 'platform_position' => 'video_feeds'], 20000),
            breakdownRow(['publisher_platform' => 'instagram', 'platform_position' => 'story'], 10000),
            breakdownRow(['publisher_platform' => 'audience_network', 'platform_position' => 'an_classic'], 5000),
            breakdownRow(['publisher_platform' => 'facebook', 'platform_position' => 'right_hand_column'], 3000),
            breakdownRow(['publisher_platform' => 'instagram', 'platform_position' => 'instagram_explore'], 2000),
        ]],
        'age' => ['data' => [
            breakdownRow(['age' => '25-34'], 180000, 6, 1200000),
            breakdownRow(['age' => '18-24'], 60000, 2, 400000),
            breakdownRow(['age' => '35-44'], 60000, 2, 400000),
        ]],
        'gender' => ['data' => [
            breakdownRow(['gender' => 'female'], 210000, 8, 1500000),
            breakdownRow(['gender' => 'male'], 90000, 2, 500000),
        ]],
        'campaigns' => ['data' => [
            campaignNode('c2', 'PAUSED', insightsRow('x', 100000, 10000, 100)),
            campaignNode('c1', 'ACTIVE', insightsRow('x', 200000, 20000, 300, 7, 1400000)),
            campaignNode('c3', 'PAUSED', null),
            campaignNode('c4', 'ACTIVE', null),
        ]],
        'ads' => ['data' => [
            adNode('a1', ['video_id' => '9'], insightsRow('x', 150000, 15000, 250, 5, 1000000)),
            adNode('a2', ['object_story_spec' => ['link_data' => ['child_attachments' => [['link' => 'x'], ['link' => 'y']]]]], insightsRow('x', 100000, 10000, 100)),
            adNode('a3', ['object_type' => 'PHOTO'], insightsRow('x', 50000, 5000, 50)),
            adNode('a4', ['object_type' => 'VIDEO'], insightsRow('x', 20000, 2000, 20)),
            adNode('a5', ['object_type' => 'PHOTO'], null),
        ]],
        'pixelInfo' => ['name' => 'Batik Pixel', 'last_fired_time' => now()->subHours(2)->toIso8601String(), 'is_unavailable' => false],
        'events' => ['data' => [['aggregation' => 'event', 'data' => [['value' => 'PageView', 'count' => 1000], ['value' => 'Purchase', 'count' => 10], ['value' => 'PageView', 'count' => 500]]]]],
        'methods' => ['data' => [['aggregation' => 'event_detection_method', 'data' => [['value' => 'browser', 'count' => 1400], ['value' => 'server', 'count' => 110]]]]],
    ], $overrides);

    Http::fake(function (Request $request) use ($answers) {
        $path = parse_url($request->url(), PHP_URL_PATH);
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

        $key = match (true) {
            str_ends_with($path, '/insights') && isset($query['time_increment']) => 'daily',
            str_ends_with($path, '/insights') => match ($query['breakdowns'] ?? null) {
                'publisher_platform' => 'platform',
                'publisher_platform,platform_position' => 'placement',
                'age' => 'age',
                'gender' => 'gender',
                default => 'totals',
            },
            str_ends_with($path, '/campaigns') => 'campaigns',
            str_ends_with($path, '/ads') => 'ads',
            str_ends_with($path, '/stats') => ($query['aggregation'] ?? '') === 'event' ? 'events' : 'methods',
            default => 'pixelInfo',
        };

        $answer = $answers[$key];

        return $answer instanceof PromiseInterface ? $answer : Http::response($answer);
    });
}

function graphError(int $code, string $message = 'boom', int $status = 400): PromiseInterface
{
    return Http::response(['error' => ['message' => $message, 'type' => 'OAuthException', 'code' => $code]], $status);
}

function sentTo(string $needle): Collection
{
    return Http::recorded(fn (Request $request) => str_contains($request->url(), $needle))->values();
}

// ------------------------------------------------------------------ figures

test('the daily series, totals and kpis come from the real insights', function () {
    fakeGraph();

    $report = metaReport(metaProject());
    $totals = $report['summary']['totals'];

    expect($report['isConnected'])->toBeTrue()
        ->and($report['range'])->toMatchArray(['start' => '2026-11-08', 'end' => '2026-11-14', 'previousStart' => '2026-11-01', 'previousEnd' => '2026-11-07'])
        ->and($report['daily'])->toHaveCount(7)
        ->and($totals)->toMatchArray([
            'spend' => 300000, 'revenue' => 2000000, 'roas' => 6.67, 'purchases' => 10, 'leads' => 2,
            'clicks' => 450, 'impressions' => 30000, 'reach' => 25000, 'cpc' => 667, 'cpm' => 10000, 'ctr' => 1.5, 'cpa' => 30000,
        ]);
});

test('a conversion reported under several action types is counted once', function () {
    fakeGraph();

    $day = collect(metaReport(metaProject())['daily'])->firstWhere('date', '2026-11-10');

    // omni_purchase, purchase and the pixel type all say 4 purchases worth 800000
    expect($day)->toMatchArray(['purchases' => 4, 'revenue' => 800000, 'leads' => 2, 'clicks' => 150, 'roas' => 8.0]);
});

test('a day Meta returns nothing for is zero, not missing', function () {
    fakeGraph();

    $day = collect(metaReport(metaProject())['daily'])->firstWhere('date', '2026-11-09');

    expect($day)->toMatchArray(['spend' => 0, 'revenue' => 0, 'purchases' => 0, 'clicks' => 0, 'impressions' => 0, 'roas' => 0, 'cpc' => 0, 'ctr' => 0]);
});

test('the daily series adds up to the totals', function (MetaAdsPeriod $period) {
    fakeGraph();

    $report = metaReport(metaProject(), $period);
    $totals = $report['summary']['totals'];

    expect(array_sum(array_column($report['daily'], 'spend')))->toBe($totals['spend'])
        ->and(array_sum(array_column($report['daily'], 'revenue')))->toBe($totals['revenue'])
        ->and(array_sum(array_column($report['daily'], 'purchases')))->toBe($totals['purchases'])
        ->and(array_sum(array_column($report['daily'], 'clicks')))->toBe($totals['clicks'])
        ->and(array_sum(array_column($report['daily'], 'impressions')))->toBe($totals['impressions'])
        ->and($report['daily'])->toHaveCount($period->value);
})->with(MetaAdsPeriod::cases());

test('the previous period feeds the kpi comparison', function () {
    fakeGraph();

    $kpis = collect(metaReport(metaProject())['summary']['kpis'])->keyBy('key');

    expect($kpis)->toHaveCount(8)
        ->and($kpis['spend'])->toMatchArray(['value' => 300000, 'previous' => 100000, 'change' => 200.0])
        ->and($kpis['roas'])->toMatchArray(['value' => 6.67, 'previous' => 3.0, 'change' => 122.3])
        ->and($kpis['purchases'])->toMatchArray(['value' => 10, 'previous' => 2, 'change' => 400.0]);
});

test('the daily request covers both periods in one call, in the account timezone dates', function () {
    fakeGraph();

    metaReport(metaProject());

    parse_str((string) parse_url(sentTo('time_increment')->first()[0]->url(), PHP_URL_QUERY), $query);

    expect(json_decode($query['time_range'], true))->toBe(['since' => '2026-11-01', 'until' => '2026-11-14'])
        ->and($query['level'])->toBe('account')
        ->and($query['access_token'])->toBe('test-token')
        ->and((int) $query['limit'])->toBe(500);
});

// -------------------------------------------------------------- breakdowns

test('platforms are shares of spend, with the usual four always listed', function () {
    fakeGraph();

    $platforms = collect(metaReport(metaProject())['platforms']);

    expect($platforms->pluck('platform')->all())->toBe(['instagram', 'facebook', 'audience_network', 'messenger'])
        ->and($platforms->pluck('share')->all())->toBe([66.7, 26.7, 6.7, 0.0])
        ->and($platforms[0])->toMatchArray(['label' => 'Instagram', 'spend' => 200000, 'revenue' => 1400000, 'roas' => 7.0, 'purchases' => 7]);
});

test('placements keep the top six and fold the rest together', function () {
    fakeGraph();

    $placements = collect(metaReport(metaProject())['placements']);

    expect($placements->pluck('name')->all())->toBe([
        'Instagram Reels', 'Instagram Feeds', 'Facebook Feeds', 'Facebook Video Feeds', 'Instagram Stories', 'Audience Network Classic', 'Penempatan Lainnya',
    ])
        ->and($placements->pluck('share')->all())->toBe([40.0, 26.7, 20.0, 6.7, 3.3, 1.7, 1.7])
        ->and($placements->last()['spend'])->toBe(5000)
        ->and($placements[0])->toMatchArray(['spend' => 120000, 'purchases' => 4, 'roas' => 7.5]);
});

test('audiences are split by age and gender from the breakdowns', function () {
    fakeGraph();

    $audiences = metaReport(metaProject())['audiences'];

    expect(collect($audiences['ageGroups'])->pluck('age')->all())->toBe(['18–24', '25–34', '35–44'])
        ->and(collect($audiences['ageGroups'])->pluck('share')->all())->toBe([20.0, 60.0, 20.0])
        ->and($audiences['ageGroups'][1])->toMatchArray(['spend' => 180000, 'purchases' => 6, 'roas' => 6.67])
        ->and(collect($audiences['gender'])->pluck('gender')->all())->toBe(['Wanita', 'Pria'])
        ->and(collect($audiences['gender'])->pluck('share')->all())->toBe([70.0, 30.0])
        ->and($audiences['segments'])->toBe([]);
});

// --------------------------------------------------------------- campaigns

test('campaigns show real figures, newest noise left out, biggest spend first', function () {
    fakeGraph();

    $campaigns = collect(metaReport(metaProject())['campaigns']);

    expect($campaigns->pluck('id')->all())->toBe(['c1', 'c2', 'c4'])
        ->and($campaigns[0])->toMatchArray([
            'name' => 'Kampanye c1', 'status' => 'ACTIVE', 'objective' => 'OUTCOME_SALES', 'dailyBudget' => 5000000,
            'spend' => 200000, 'revenue' => 1400000, 'roas' => 7.0, 'impressions' => 20000, 'clicks' => 300,
            'ctr' => 1.5, 'cpc' => 667, 'purchases' => 7, 'cpa' => 28571,
        ])
        ->and($campaigns[1]['status'])->toBe('PAUSED')
        ->and($campaigns[2])->toMatchArray(['status' => 'ACTIVE', 'spend' => 0, 'purchases' => 0, 'cpa' => 0]);
});

test('the campaign request is limited to the selected period', function () {
    fakeGraph();

    metaReport(metaProject(), MetaAdsPeriod::Last30Days);

    parse_str((string) parse_url(sentTo('/campaigns')->first()[0]->url(), PHP_URL_QUERY), $query);

    expect($query['fields'])->toContain('"since":"2026-10-16"')->toContain('"until":"2026-11-14"');
});

// ---------------------------------------------------------------- creatives

test('creative formats are told apart from the ad creative and grouped', function () {
    fakeGraph();

    $creatives = collect(metaReport(metaProject())['creatives']);

    expect($creatives->pluck('format')->all())->toBe(['Video', 'Carousel', 'Gambar'])
        ->and($creatives[0])->toMatchArray(['spend' => 170000, 'revenue' => 1000000, 'roas' => 5.88, 'hookRate' => null, 'holdRate' => null])
        ->and($creatives[1]['spend'])->toBe(100000)
        ->and($creatives[2]['spend'])->toBe(50000);
});

// -------------------------------------------------------------------- pixel

test('the pixel shows its real activity, and never invents match quality', function () {
    fakeGraph();

    $pixel = metaReport(metaProject())['pixelHealth'];

    expect($pixel)->toMatchArray(['pixelId' => '777', 'status' => 'Aktif', 'eventMatchQuality' => null, 'capiActive' => true])
        ->and($pixel['lastEventTime'])->not->toBe('')
        ->and($pixel['events'])->toBe([
            ['name' => 'PageView', 'count' => 1500, 'matchRate' => null],
            ['name' => 'Purchase', 'count' => 10, 'matchRate' => null],
        ]);
});

test('an old last event marks the pixel as inactive', function () {
    fakeGraph(['pixelInfo' => ['name' => 'Batik Pixel', 'last_fired_time' => now()->subDays(20)->toIso8601String()]]);

    expect(metaReport(metaProject())['pixelHealth']['status'])->toBe('Tidak aktif');
});

test('server events missing means the conversions api is not detected', function () {
    fakeGraph(['methods' => ['data' => [['data' => [['value' => 'browser', 'count' => 900]]]]]]);

    expect(metaReport(metaProject())['pixelHealth']['capiActive'])->toBeFalse();
});

test('without a pixel id nothing is asked about the pixel', function () {
    fakeGraph();

    $pixel = metaReport(metaProject(['pixel_id' => null]))['pixelHealth'];

    expect($pixel['status'])->toBe('Belum diatur')->and($pixel['events'])->toBe([]);
    expect(sentTo('/777'))->toHaveCount(0);
});

test('a pixel that cannot be read does not break the report', function () {
    fakeGraph(['pixelInfo' => graphError(100, 'Unsupported get request')]);

    $report = metaReport(metaProject());

    expect($report['isConnected'])->toBeTrue()
        ->and($report['pixelHealth']['status'])->toBe('Tidak terbaca')
        ->and($report['summary']['totals']['spend'])->toBe(300000);
});

// ------------------------------------------------------------ partial / errors

test('a failing breakdown empties that section and says so, the rest stays real', function () {
    fakeGraph(['platform' => graphError(100, 'Invalid parameter')]);

    $report = metaReport(metaProject());

    expect($report['isConnected'])->toBeTrue()
        ->and($report['meta']['partial'])->toBe(['platform'])
        ->and(collect($report['platforms'])->sum('spend'))->toBe(0)
        ->and($report['summary']['totals']['spend'])->toBe(300000)
        ->and($report['campaigns'])->toHaveCount(3);
});

test('a dead token shows zeros with the reason and marks the connection', function () {
    fakeGraph(['daily' => graphError(190, 'Error validating access token: Session has expired')]);
    $project = metaProject();

    $report = metaReport($project);

    expect($report['isConnected'])->toBeFalse()
        ->and($report['liveError'])->toBe('Token akses Meta kedaluwarsa atau dicabut. Hubungkan ulang akun Meta.')
        ->and($report['summary']['totals']['spend'])->toBe(0)
        ->and($project->metaConfig->fresh()->status)->toBe('error')
        ->and($project->metaConfig->fresh()->error_message)->toBe($report['liveError']);
});

test('after a dead token the reason keeps showing without calling Meta again', function () {
    $project = metaProject(['status' => 'error', 'error_message' => 'Token akses Meta kedaluwarsa atau dicabut. Hubungkan ulang akun Meta.']);
    Http::fake();

    $report = metaReport($project->fresh('metaConfig'));

    expect($report['isConnected'])->toBeFalse()
        ->and($report['liveError'])->toContain('Hubungkan ulang');
    Http::assertNothingSent();
});

test('an auth error in an optional section still fails the whole report', function () {
    fakeGraph(['ads' => graphError(190)]);

    expect(metaReport(metaProject()))->toHaveKey('liveError');
});

test('rate limiting and permission problems get plain messages', function (int $code, string $expected) {
    fakeGraph(['daily' => graphError($code, 'raw meta text')]);

    expect(metaReport(metaProject())['liveError'])->toContain($expected);
})->with([
    'rate limit' => [17, 'Batas panggilan Meta tercapai'],
    'permission' => [200, 'izin membaca iklan'],
    'other' => [100, 'Meta menolak permintaan: raw meta text'],
]);

test('an unreachable Meta gives a clear message', function () {
    Http::fake(fn () => throw new ConnectionException('cURL error 28: timed out'));

    expect(metaReport(metaProject())['liveError'])->toStartWith('Tidak dapat menghubungi Meta');
});

// ----------------------------------------------------- caching / isolation

test('the report is cached so the page does not hit Meta on every load', function () {
    fakeGraph();
    $project = metaProject();

    metaReport($project);
    $calls = Http::recorded()->count();

    metaReport($project);

    expect($calls)->toBeGreaterThan(5)->and(Http::recorded()->count())->toBe($calls);
});

test('a failed report is not cached, a good one is', function () {
    $project = metaProject();
    $key = "meta_analytics:{$project->metaConfig->id}:7:2026-11-14";

    fakeGraph(['daily' => graphError(17)]);
    metaReport($project);
    expect(Cache::has($key))->toBeFalse();

    Http::swap(new Factory);
    fakeGraph();
    metaReport($project);
    expect(Cache::has($key))->toBeTrue();
});

test('each connected project is read from its own ad account', function () {
    fakeGraph();
    $a = metaProject(['ad_account_id' => 'act_111', 'access_token' => 'token-a'], 'Toko A', 'Klien A');
    $b = metaProject(['ad_account_id' => 'act_222', 'access_token' => 'token-b'], 'Toko B', 'Klien B');

    // fakeGraph answers by path suffix, so both accounts resolve; what matters is where each call went.
    metaReport($a);
    metaReport($b);

    $daily = sentTo('time_increment')->map(fn ($pair) => parse_url($pair[0]->url(), PHP_URL_PATH).'|'.(function ($url) {
        parse_str((string) parse_url($url, PHP_URL_QUERY), $q);

        return $q['access_token'];
    })($pair[0]->url()))->all();

    expect($daily)->toContain('/v21.0/act_111/insights|token-a')->toContain('/v21.0/act_222/insights|token-b');
});

test('a project that is not connected makes no calls to Meta', function () {
    Http::fake();

    $report = metaReport(metaProject(['status' => 'disconnected']));

    expect($report['isConnected'])->toBeFalse()->and($report['summary']['totals']['spend'])->toBe(0);
    Http::assertNothingSent();
});

// --------------------------------------------------------------------- page

test('the analytics page serves the real figures and never exposes the token', function () {
    fakeGraph();
    $project = metaProject();

    $response = $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index', ['project_id' => $project->id, 'period' => 7]));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('analytics.isConnected', true)
        ->where('analytics.summary.totals.spend', 300000)
        ->where('analytics.summary.kpis.0.key', 'spend')
        ->has('analytics.campaigns', 3)
        ->has('analytics.meta.partial', 0)
        ->missing('analytics.liveError'));

    expect($response->getContent())->not->toContain('test-token');
});

test('the analytics page shows zeros and the reason when Meta refuses', function () {
    fakeGraph(['daily' => graphError(190)]);
    $project = metaProject();

    $this->actingAs(User::factory()->create())
        ->get(route('meta-ads.index', ['project_id' => $project->id, 'period' => 7]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('analytics.isConnected', false)
            ->where('analytics.summary.totals.spend', 0)
            ->where('analytics.liveError', 'Token akses Meta kedaluwarsa atau dicabut. Hubungkan ulang akun Meta.'));
});

// -------------------------------------------------------------- smoke test

test('the smoke test reads every section of a connected account', function () {
    fakeGraph();
    $project = metaProject();

    $this->artisan('meta:smoke-test', ['project' => $project->id])
        ->expectsOutputToContain('OK   insights harian')
        ->expectsOutputToContain('OK   iklan dan kreatif')
        ->expectsOutputToContain('OK   pixel')
        ->assertSuccessful();
});

test('the smoke test fails and names the problem when Meta refuses', function () {
    fakeGraph(['daily' => graphError(190)]);
    $project = metaProject();

    $this->artisan('meta:smoke-test', ['project' => $project->id])
        ->expectsOutputToContain('FAIL insights harian')
        ->assertFailed();
});

test('the smoke test prints the reason Meta gave', function () {
    fakeGraph(['daily' => graphError(17)]);
    $project = metaProject();

    $this->artisan('meta:smoke-test', ['project' => $project->id])
        ->expectsOutputToContain('[17] Batas panggilan Meta tercapai')
        ->assertFailed();
});

test('the smoke test refuses a project without a connected account', function () {
    Http::fake();

    $this->artisan('meta:smoke-test', ['project' => metaProject(['status' => 'disconnected'])->id])->assertFailed();

    Http::assertNothingSent();
});
