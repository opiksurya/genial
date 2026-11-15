<?php

use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Models\User;
use App\Services\Shopee\ShopeeApiException;
use App\Services\Shopee\ShopeeClientService;
use App\Services\Shopee\ShopeeTokenService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.shopee.partner_id' => '1000001',
        'services.shopee.partner_key' => 'shared-partner-key',
        'services.shopee.sandbox' => true,
        'services.shopee.redirect' => null,
        'services.shopee.webhook_url' => null,
    ]);

    $this->project = Project::create(['name' => 'Toko Batik', 'client' => 'CV Batik', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->user = User::factory()->create();
});

function connectedConfig(Project $project, array $overrides = []): ProjectShopeeConfig
{
    return ProjectShopeeConfig::create(array_merge([
        'project_id' => $project->id,
        'shop_id' => '555',
        'shop_name' => 'Toko Batik',
        'access_token' => 'old-access',
        'refresh_token' => 'old-refresh',
        'token_expires_at' => now()->addHour(),
        'refresh_expires_at' => now()->addDays(20),
        'status' => 'connected',
    ], $overrides));
}

test('a project without its own app uses the shared app credentials', function () {
    $config = new ProjectShopeeConfig(['project_id' => $this->project->id]);

    expect($config->resolvedPartnerId())->toBe('1000001')
        ->and($config->resolvedPartnerKey())->toBe('shared-partner-key')
        ->and($config->resolvedIsSandbox())->toBeTrue()
        ->and($config->hasCredentials())->toBeTrue();
});

test('a project with its own partner id never borrows the shared key', function () {
    $config = new ProjectShopeeConfig(['project_id' => $this->project->id, 'partner_id' => '2000002', 'is_sandbox' => false]);

    expect($config->resolvedPartnerId())->toBe('2000002')
        ->and($config->resolvedPartnerKey())->toBeNull()
        ->and($config->hasCredentials())->toBeFalse()
        ->and($config->resolvedIsSandbox())->toBeFalse();
});

test('the signature follows the Shopee v2 base string', function () {
    $public = ShopeeClientService::generateSignature(1, '/api/v2/x', 100, 'k');
    $shop = ShopeeClientService::generateSignature(1, '/api/v2/x', 100, 'k', 'tok', 9);

    expect($public)->toBe(hash_hmac('sha256', '1/api/v2/x100', 'k'))
        ->and($shop)->toBe(hash_hmac('sha256', '1/api/v2/x100tok9', 'k'));
});

test('connecting redirects to Shopee with a state tied to the user and project', function () {
    $response = $this->actingAs($this->user)
        ->get(route('projects.shopee.oauth.redirect', $this->project));

    $response->assertRedirectContains('https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner');

    parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
    parse_str(parse_url($query['redirect'], PHP_URL_QUERY), $redirect);

    expect($query['redirect'])->toStartWith(url('/auth/shopee/callback'))
        ->and($redirect['state'])->toHaveLength(40)
        ->and(Cache::get('shopee_oauth:'.$redirect['state']))
        ->toMatchArray(['project_id' => $this->project->id, 'user_id' => $this->user->id]);
});

test('the return url cannot point to another site', function () {
    $response = $this->actingAs($this->user)
        ->get(route('projects.shopee.oauth.redirect', ['project' => $this->project, 'return_url' => 'https://evil.example/phish']));

    parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
    parse_str(parse_url($query['redirect'], PHP_URL_QUERY), $redirect);

    expect(Cache::get('shopee_oauth:'.$redirect['state'])['return_url'])
        ->toBe(route('shopee.index', ['project_id' => $this->project->id]));
});

test('the callback stores tokens for the project in the state and then discards the state', function () {
    Http::fake([
        '*/api/v2/auth/token/get*' => Http::response(['access_token' => 'new-access', 'refresh_token' => 'new-refresh', 'expire_in' => 14400, 'request_id' => 'r1']),
        '*/api/v2/shop/get_shop_info*' => Http::response(['shop_name' => 'Batik Resmi', 'request_id' => 'r2']),
    ]);
    Cache::put('shopee_oauth:abc', ['project_id' => $this->project->id, 'user_id' => $this->user->id, 'return_url' => '/shopee'], 600);

    $this->actingAs($this->user)
        ->get('/auth/shopee/callback?state=abc&code=auth-code&shop_id=555')
        ->assertRedirect('/shopee')
        ->assertSessionHas('success');

    $config = $this->project->fresh()->shopeeConfig;

    expect($config->status)->toBe('connected')
        ->and($config->shop_id)->toBe('555')
        ->and($config->shop_name)->toBe('Batik Resmi')
        ->and($config->access_token)->toBe('new-access')
        ->and($config->shopee_raw_data)->not->toHaveKey('access_token')
        ->and($config->shopee_raw_data)->not->toHaveKey('refresh_token')
        ->and(Cache::has('shopee_oauth:abc'))->toBeFalse();
});

test('the callback rejects an unknown state', function () {
    $this->actingAs($this->user)
        ->get('/auth/shopee/callback?state=forged&code=auth-code&shop_id=555')
        ->assertRedirect(route('shopee.index'))
        ->assertSessionHas('error');

    expect($this->project->fresh()->shopeeConfig)->toBeNull();
});

test('the callback rejects a state that belongs to another user', function () {
    Cache::put('shopee_oauth:abc', ['project_id' => $this->project->id, 'user_id' => $this->user->id, 'return_url' => '/shopee'], 600);

    $this->actingAs(User::factory()->create())
        ->get('/auth/shopee/callback?state=abc&code=auth-code&shop_id=555')
        ->assertSessionHas('error');

    expect($this->project->fresh()->shopeeConfig)->toBeNull();
});

test('guests cannot use the callback', function () {
    $this->get('/auth/shopee/callback?state=abc&code=c&shop_id=1')->assertRedirect(route('login'));
});

test('refreshing rotates both tokens and extends the expiry', function () {
    Http::fake(['*/api/v2/auth/access_token/get*' => Http::response(['access_token' => 'fresh-access', 'refresh_token' => 'fresh-refresh', 'expire_in' => 14400])]);
    $config = connectedConfig($this->project, ['token_expires_at' => now()->subMinute()]);

    expect(app(ShopeeTokenService::class)->refresh($config))->toBeTrue();

    $config = $config->fresh();
    expect($config->access_token)->toBe('fresh-access')
        ->and($config->refresh_token)->toBe('fresh-refresh')
        ->and($config->token_expires_at->isFuture())->toBeTrue()
        ->and($config->status)->toBe('connected');
});

test('a rejected refresh token flags the connection for re-authorization', function () {
    Http::fake(['*/api/v2/auth/access_token/get*' => Http::response(['error' => 'error_auth', 'message' => 'Invalid refresh_token'])]);
    $config = connectedConfig($this->project, ['token_expires_at' => now()->subMinute()]);

    expect(app(ShopeeTokenService::class)->refresh($config))->toBeFalse();

    expect($config->fresh()->status)->toBe('error')
        ->and($config->fresh()->error_message)->toBe('Invalid refresh_token');
});

test('a transient refresh failure keeps the connection', function () {
    Http::fake(['*/api/v2/auth/access_token/get*' => Http::response(['error' => 'error_server', 'message' => 'Try later'])]);
    $config = connectedConfig($this->project, ['token_expires_at' => now()->subMinute()]);

    app(ShopeeTokenService::class)->refresh($config);

    expect($config->fresh()->status)->toBe('connected');
});

test('an expired refresh token is not even tried', function () {
    Http::fake();
    $config = connectedConfig($this->project, ['refresh_expires_at' => now()->subDay()]);

    expect(app(ShopeeTokenService::class)->refresh($config))->toBeFalse();

    Http::assertNothingSent();
    expect($config->fresh()->status)->toBe('error');
});

test('an api call refreshes an expiring token first', function () {
    Http::fake([
        '*/api/v2/auth/access_token/get*' => Http::response(['access_token' => 'fresh-access', 'refresh_token' => 'fresh-refresh', 'expire_in' => 14400]),
        '*/api/v2/shop/get_shop_info*' => Http::response(['shop_name' => 'Batik', 'request_id' => 'r1']),
    ]);
    $config = connectedConfig($this->project, ['token_expires_at' => now()->addMinutes(2)]);

    $response = app(ShopeeTokenService::class)->call($config, 'GET', '/api/v2/shop/get_shop_info');

    expect($response['shop_name'])->toBe('Batik');
    Http::assertSent(fn ($request) => str_contains($request->url(), '/shop/get_shop_info') && str_contains($request->url(), 'access_token=fresh-access'));
});

test('an api call retries once with a new token after an auth error', function () {
    Http::fake([
        '*/api/v2/auth/access_token/get*' => Http::response(['access_token' => 'fresh-access', 'refresh_token' => 'fresh-refresh', 'expire_in' => 14400]),
        '*/api/v2/order/get_order_list*' => Http::sequence()
            ->push(['error' => 'error_auth', 'message' => 'access_token expired'])
            ->push(['response' => ['order_list' => []], 'request_id' => 'r9']),
    ]);
    $config = connectedConfig($this->project);

    $response = app(ShopeeTokenService::class)->call($config, 'GET', '/api/v2/order/get_order_list');

    expect($response['request_id'])->toBe('r9')
        ->and($config->fresh()->access_token)->toBe('fresh-access');
});

test('an api error other than auth is thrown to the caller', function () {
    Http::fake(['*/api/v2/product/get_item_list*' => Http::response(['error' => 'error_param', 'message' => 'bad page_size'])]);
    $config = connectedConfig($this->project);

    app(ShopeeTokenService::class)->call($config, 'GET', '/api/v2/product/get_item_list');
})->throws(ShopeeApiException::class, 'bad page_size');

test('the refresh command only touches tokens that expire within the hour', function () {
    Http::fake(['*/api/v2/auth/access_token/get*' => Http::response(['access_token' => 'fresh-access', 'refresh_token' => 'fresh-refresh', 'expire_in' => 14400])]);
    $soon = connectedConfig($this->project, ['token_expires_at' => now()->addMinutes(20)]);
    $other = Project::create(['name' => 'Toko B', 'client' => 'B', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $later = connectedConfig($other, ['token_expires_at' => now()->addHours(3)]);

    $this->artisan('shopee:refresh-tokens')->assertSuccessful();

    expect($soon->fresh()->access_token)->toBe('fresh-access')
        ->and($later->fresh()->access_token)->toBe('old-access');
});

test('the smoke test calls the core apis for a connected shop', function () {
    Http::fake(['*/api/v2/*' => Http::response(['response' => [], 'request_id' => 'rq'])]);
    connectedConfig($this->project);

    $this->artisan('shopee:smoke-test', ['project' => $this->project->id])->assertSuccessful();

    foreach (['get_shop_info', 'get_profile', 'get_order_list', 'get_item_list', 'get_channel_list'] as $endpoint) {
        Http::assertSent(fn ($request) => str_contains($request->url(), $endpoint));
    }
});

test('the smoke test fails when a call is rejected', function () {
    Http::fake(['*/api/v2/*' => Http::response(['error' => 'error_permission', 'message' => 'no permission'])]);
    connectedConfig($this->project);

    $this->artisan('shopee:smoke-test', ['project' => $this->project->id])->assertFailed();
});

function signedPush(array $payload, string $key = 'shared-partner-key'): array
{
    $body = json_encode($payload);
    $signature = hash_hmac('sha256', url('/webhooks/shopee').'|'.$body, $key);

    return [$body, $signature];
}

test('a correctly signed push is acknowledged', function () {
    [$body, $signature] = signedPush(['code' => 3, 'shop_id' => 555, 'timestamp' => 1794700000, 'data' => []]);

    $this->call('POST', '/webhooks/shopee', [], [], [], ['HTTP_AUTHORIZATION' => $signature, 'CONTENT_TYPE' => 'application/json'], $body)
        ->assertOk()
        ->assertJson(['status' => 'ok']);
});

test('a push signed with the key of the shops own app is acknowledged', function () {
    connectedConfig($this->project, ['partner_id' => '2000002', 'partner_key' => 'own-key']);
    [$body, $signature] = signedPush(['code' => 3, 'shop_id' => 555, 'timestamp' => 1794700000], 'own-key');

    $this->call('POST', '/webhooks/shopee', [], [], [], ['HTTP_AUTHORIZATION' => $signature, 'CONTENT_TYPE' => 'application/json'], $body)
        ->assertOk();
});

test('a push with a wrong or missing signature is rejected', function () {
    [$body] = signedPush(['code' => 3, 'shop_id' => 555]);

    $this->call('POST', '/webhooks/shopee', [], [], [], ['HTTP_AUTHORIZATION' => 'forged', 'CONTENT_TYPE' => 'application/json'], $body)
        ->assertUnauthorized();

    $this->call('POST', '/webhooks/shopee', [], [], [], ['CONTENT_TYPE' => 'application/json'], $body)
        ->assertUnauthorized();
});

test('tokens are never exposed in the shopee page props', function () {
    connectedConfig($this->project, ['partner_id' => '2000002', 'partner_key' => 'own-secret-key']);

    $response = $this->actingAs($this->user)->get(route('shopee.index', ['project_id' => $this->project->id]));

    expect($response->getContent())
        ->not->toContain('old-access')
        ->not->toContain('old-refresh')
        ->not->toContain('own-secret-key');
});
