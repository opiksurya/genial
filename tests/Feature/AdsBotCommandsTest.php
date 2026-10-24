<?php

use App\Models\Project;
use App\Models\ProjectMetaConfig;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

/**
 * Run an ads bot command and decode its JSON output.
 *
 * @param  array<string, mixed>  $parameters
 * @return array{0: int, 1: array<string, mixed>, 2: string}
 */
function runAdsBot(string $command, array $parameters = []): array
{
    $exitCode = Artisan::call($command, $parameters);
    $output = Artisan::output();

    return [$exitCode, json_decode($output, true, flags: JSON_THROW_ON_ERROR), $output];
}

/**
 * Fake the Graph API by "METHOD path" (path without the version prefix).
 * A list of responses is consumed in order; the last one repeats.
 * Use ['__status' => 400, '__body' => [...]] for error responses.
 *
 * @param  array<string, array<string, mixed>|list<array<string, mixed>>>  $routes
 */
function fakeMeta(array $routes): void
{
    Http::preventStrayRequests();

    Http::fake(function (Request $request) use (&$routes) {
        $path = preg_replace('#^/v[\d.]+/#', '', (string) parse_url($request->url(), PHP_URL_PATH));
        $key = $request->method().' '.$path;

        if (! array_key_exists($key, $routes)) {
            return Http::response(['error' => ['message' => "Unexpected {$key}", 'code' => 100]], 400);
        }

        $response = $routes[$key];
        if (array_is_list($response)) {
            $current = count($response) > 1 ? array_shift($routes[$key]) : $response[0];
            $response = $current;
        }

        return Http::response($response['__body'] ?? $response, $response['__status'] ?? 200);
    });
}

function metaPosts(): array
{
    return Http::recorded(fn (Request $request) => $request->method() === 'POST')
        ->map(fn (array $pair) => [$pair[0]->url(), $pair[0]->data()])
        ->values()
        ->all();
}

function campaignGraph(array $overrides = []): array
{
    return [
        'id' => '111',
        'name' => 'Promo Oktober',
        'account_id' => '123',
        'status' => 'ACTIVE',
        'effective_status' => 'ACTIVE',
        'objective' => 'OUTCOME_SALES',
        'daily_budget' => '150000',
        'budget_remaining' => '90000',
        ...$overrides,
    ];
}

function adsetGraph(array $overrides = [], array $campaign = []): array
{
    return [
        'id' => '222',
        'name' => 'Lookalike 1%',
        'account_id' => '123',
        'campaign_id' => '111',
        'status' => 'ACTIVE',
        'effective_status' => 'ACTIVE',
        'daily_budget' => '50000',
        'campaign' => ['id' => '111', 'name' => 'Promo Oktober', ...$campaign],
        ...$overrides,
    ];
}

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff'] as $roleName) {
        Role::findOrCreate($roleName);
    }

    User::factory()->create(['email' => 'owner@example.com'])->assignRole('Super Admin');
    User::factory()->create(['email' => 'admin@example.com'])->assignRole('Admin');
    User::factory()->create(['email' => 'staff@example.com'])->assignRole('Staff');

    $this->project = Project::create(['name' => 'Toko Batik', 'client' => 'CV Batik', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->config = ProjectMetaConfig::create([
        'project_id' => $this->project->id,
        'ad_account_id' => 'act_123',
        'access_token' => 'secret-meta-token',
        'account_name' => 'Batik Ads',
        'currency' => 'IDR',
        'status' => 'connected',
        'token_expires_at' => '2026-12-20 00:00:00',
    ]);
});

test('accounts lists meta connections without exposing tokens', function () {
    [$exitCode, $json, $raw] = runAdsBot('ads:bot-accounts');

    expect($exitCode)->toBe(0)
        ->and($json['accounts'])->toBe([[
            'project_id' => $this->project->id,
            'project_name' => 'Toko Batik',
            'account_name' => 'Batik Ads',
            'ad_account_id' => 'act_123',
            'currency' => 'IDR',
            'status' => 'connected',
            'token_expires_at' => '2026-12-20T00:00:00+00:00',
        ]])
        ->and($raw)->not->toContain('secret-meta-token')
        ->and($raw)->not->toContain('access_token');
});

test('campaigns lists budgets, budget level and insights with ad sets', function () {
    $insight = fn (array $values) => ['data' => [$values]];

    fakeMeta([
        'GET act_123/campaigns' => ['data' => [
            campaignGraph(['insights' => $insight([
                'spend' => '300000', 'impressions' => '12000', 'clicks' => '240', 'ctr' => '2.0',
                'actions' => [
                    ['action_type' => 'link_click', 'value' => '200'],
                    ['action_type' => 'purchase', 'value' => '6'],
                    ['action_type' => 'omni_purchase', 'value' => '6'],
                ],
                'purchase_roas' => [['action_type' => 'omni_purchase', 'value' => '3.456']],
            ])]),
            ['id' => '112', 'name' => 'Leads ABO', 'status' => 'PAUSED', 'effective_status' => 'PAUSED', 'objective' => 'OUTCOME_LEADS'],
        ]],
        'GET act_123/adsets' => ['data' => [
            ['id' => '222', 'name' => 'Lookalike', 'campaign_id' => '111', 'status' => 'ACTIVE', 'effective_status' => 'ACTIVE', 'optimization_goal' => 'OFFSITE_CONVERSIONS'],
            ['id' => '223', 'name' => 'Interest', 'campaign_id' => '112', 'status' => 'PAUSED', 'effective_status' => 'CAMPAIGN_PAUSED', 'daily_budget' => '75000', 'optimization_goal' => 'LEAD_GENERATION',
                'insights' => $insight(['spend' => '50000', 'actions' => [['action_type' => 'lead', 'value' => '5']]])],
        ]],
    ]);

    [$exitCode, $json] = runAdsBot('ads:bot-campaigns', ['--project' => $this->project->id, '--date-preset' => 'last_30d', '--with-adsets' => true]);

    expect($exitCode)->toBe(0)
        ->and($json['currency'])->toBe('IDR')
        ->and($json['date_preset'])->toBe('last_30d');

    [$cbo, $abo] = $json['campaigns'];

    expect($cbo)->toMatchArray([
        'id' => '111', 'budget_level' => 'campaign', 'cbo' => true,
        'daily_budget' => 150000, 'lifetime_budget' => null, 'budget_remaining' => 90000,
    ])
        ->and($cbo['insights'])->toEqual([
            'spend' => 300000, 'impressions' => 12000, 'clicks' => 240, 'ctr' => 2,
            'result' => ['type' => 'omni_purchase', 'value' => 6],
            'cpa' => 50000, 'roas' => 3.46,
        ])
        ->and($cbo['adsets'][0])->toMatchArray(['id' => '222', 'budget_level' => 'campaign', 'daily_budget' => null])
        ->and($abo)->toMatchArray(['id' => '112', 'budget_level' => 'adset', 'cbo' => false, 'daily_budget' => null])
        ->and($abo['insights']['result'])->toBeNull()
        ->and($abo['adsets'][0])->toMatchArray(['id' => '223', 'budget_level' => 'adset', 'daily_budget' => 75000])
        ->and($abo['adsets'][0]['insights'])->toMatchArray(['result' => ['type' => 'lead', 'value' => 5], 'cpa' => 10000, 'roas' => null]);

    Http::assertSent(fn (Request $request) => str_contains($request->url(), 'act_123/campaigns')
        && str_contains($request['fields'], 'insights.date_preset(last_30d)'));
});

test('campaigns rejects an unknown date preset and a project without meta', function () {
    fakeMeta([]);

    [$exitCode, $json] = runAdsBot('ads:bot-campaigns', ['--project' => $this->project->id, '--date-preset' => 'kemarin']);
    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid');

    $other = Project::create(['name' => 'Tanpa Meta', 'client' => 'X', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    [$exitCode, $json] = runAdsBot('ads:bot-campaigns', ['--project' => $other->id]);
    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('not_connected');

    Http::assertNothingSent();
});

test('preview shows the expected budget without writing to meta', function () {
    fakeMeta(['GET 111' => campaignGraph()]);

    [$exitCode, $json] = runAdsBot('ads:bot-preview', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--budget-type' => 'daily', '--amount' => '200000', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->toBe(0)
        ->and($json['executed'])->toBeFalse()
        ->and($json['object'])->toBe(['type' => 'campaign', 'id' => '111', 'name' => 'Promo Oktober'])
        ->and($json['before']['daily_budget'])->toBe(150000)
        ->and($json['after']['daily_budget'])->toBe(200000)
        ->and($json['change'])->toBe(['field' => 'daily_budget', 'from' => 150000, 'to' => 200000, 'percent' => 33.3, 'currency' => 'IDR'])
        ->and(metaPosts())->toBe([]);
});

test('action sets an ad set budget in usd cents and logs before and after', function () {
    $this->config->update(['currency' => 'USD']);
    Log::spy();

    fakeMeta([
        'GET 222' => [adsetGraph(['daily_budget' => '2000']), adsetGraph(['daily_budget' => '2550'])],
        'POST 222' => ['success' => true],
    ]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => 'adset',
        '--object-id' => '222', '--budget-type' => 'daily', '--amount' => '25.50', '--user' => 'owner@example.com',
    ]);

    expect($exitCode)->toBe(0)
        ->and($json['executed'])->toBeTrue()
        ->and($json['before'])->toMatchArray(['daily_budget' => 20, 'budget_level' => 'adset', 'currency' => 'USD'])
        ->and($json['after']['daily_budget'])->toBe(25.5)
        ->and(metaPosts())->toHaveCount(1)
        ->and(metaPosts()[0][1])->toMatchArray(['daily_budget' => '2550']);

    Log::shouldHaveReceived('info')->withArgs(fn (string $message, array $context) => $message === 'Ads bot action executed'
        && $context['user_email'] === 'owner@example.com'
        && $context['before']['daily_budget'] == 20
        && $context['after']['daily_budget'] == 25.5)->once();
});

test('action refuses a budget on the wrong level', function (string $objectType, string $objectId, array $graph) {
    fakeMeta(["GET {$objectId}" => $graph]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => $objectType,
        '--object-id' => $objectId, '--budget-type' => 'daily', '--amount' => '100000', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe('wrong_budget_level')
        ->and(metaPosts())->toBe([]);
})->with([
    'ad set inside a cbo campaign' => fn () => ['adset', '222', adsetGraph(['daily_budget' => null], ['daily_budget' => '150000'])],
    'campaign using ad set budgets' => fn () => ['campaign', '111', campaignGraph(['daily_budget' => null, 'budget_remaining' => null])],
]);

test('action refuses switching between daily and lifetime budgets', function () {
    fakeMeta(['GET 111' => campaignGraph()]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--budget-type' => 'lifetime', '--amount' => '1000000', '--user' => 'admin@example.com',
    ]);

    expect($json['code'])->toBe('budget_type_mismatch')->and(metaPosts())->toBe([]);
});

test('action refuses a zero budget', function () {
    fakeMeta(['GET 111' => campaignGraph()]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--budget-type' => 'daily', '--amount' => '0', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid_amount')->and(metaPosts())->toBe([]);
});

test('action refuses objects from another ad account', function () {
    fakeMeta(['GET 111' => campaignGraph(['account_id' => '999'])]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_status', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--status' => 'PAUSED', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe('not_owned')
        ->and(metaPosts())->toBe([]);
});

test('action and preview refuse users without an admin role', function (string $command, string $email, string $code) {
    fakeMeta([]);

    [$exitCode, $json] = runAdsBot($command, [
        'action' => 'set_status', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--status' => 'PAUSED', '--user' => $email,
    ]);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe($code);
    Http::assertNothingSent();
})->with([
    'staff on action' => ['ads:bot-action', 'staff@example.com', 'forbidden'],
    'staff on preview' => ['ads:bot-preview', 'staff@example.com', 'forbidden'],
    'unknown user' => ['ads:bot-action', 'nobody@example.com', 'invalid'],
]);

test('action pauses a campaign', function () {
    Log::spy();
    fakeMeta([
        'GET 111' => [campaignGraph(), campaignGraph(['status' => 'PAUSED', 'effective_status' => 'PAUSED'])],
        'POST 111' => ['success' => true],
    ]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'set_status', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--status' => 'paused', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->toBe(0)
        ->and($json['before']['status'])->toBe('ACTIVE')
        ->and($json['after']['status'])->toBe('PAUSED')
        ->and($json['change'])->toBe(['field' => 'status', 'from' => 'ACTIVE', 'to' => 'PAUSED'])
        ->and(metaPosts()[0][1])->toMatchArray(['status' => 'PAUSED']);
});

test('action duplicates a campaign paused with a deep copy and a new name', function () {
    Log::spy();
    fakeMeta([
        'GET 111' => campaignGraph(),
        'POST 111/copies' => ['copied_campaign_id' => '333', 'ad_object_ids' => []],
        'POST 333' => ['success' => true],
        'GET 333' => campaignGraph(['id' => '333', 'name' => 'Promo November', 'status' => 'PAUSED', 'effective_status' => 'PAUSED']),
    ]);

    [$exitCode, $json] = runAdsBot('ads:bot-action', [
        'action' => 'duplicate_campaign', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--name' => 'Promo November', '--user' => 'admin@example.com',
    ]);

    $posts = metaPosts();

    expect($exitCode)->toBe(0)
        ->and($json['before']['id'])->toBe('111')
        ->and($json['after'])->toMatchArray(['id' => '333', 'name' => 'Promo November', 'status' => 'PAUSED'])
        ->and($posts[0][0])->toEndWith('/111/copies')
        ->and($posts[0][1])->toMatchArray(['deep_copy' => 'true', 'status_option' => 'PAUSED'])
        ->and($posts[1][0])->toEndWith('/333')
        ->and($posts[1][1])->toMatchArray(['name' => 'Promo November']);
});

test('duplicate is only allowed for campaigns', function () {
    fakeMeta([]);

    [$exitCode, $json] = runAdsBot('ads:bot-preview', [
        'action' => 'duplicate_campaign', '--project' => $this->project->id, '--object-type' => 'adset',
        '--object-id' => '222', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid');
    Http::assertNothingSent();
});

test('meta api errors are passed through as json', function () {
    Log::spy();
    fakeMeta([
        'GET 111' => campaignGraph(),
        'POST 111' => ['__status' => 400, '__body' => ['error' => [
            'message' => 'Invalid parameter', 'error_user_msg' => 'Budget terlalu kecil.', 'code' => 100,
            'error_subcode' => 1885272, 'fbtrace_id' => 'Abc123',
        ]]],
    ]);

    [$exitCode, $json, $raw] = runAdsBot('ads:bot-action', [
        'action' => 'set_budget', '--project' => $this->project->id, '--object-type' => 'campaign',
        '--object-id' => '111', '--budget-type' => 'daily', '--amount' => '1000', '--user' => 'admin@example.com',
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json)->toBe([
            'error' => 'Budget terlalu kecil.', 'code' => 'meta_api', 'meta_code' => 100,
            'meta_subcode' => 1885272, 'http_status' => 400, 'fbtrace_id' => 'Abc123',
        ])
        ->and($raw)->not->toContain('secret-meta-token');

    Log::shouldHaveReceived('warning')->withArgs(fn (string $message) => $message === 'Ads bot action failed')->once();
});
