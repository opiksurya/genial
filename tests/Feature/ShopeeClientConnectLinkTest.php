<?php

use App\Models\Project;
use App\Models\ShopeeConnectLink;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config([
        'services.shopee.partner_id' => '1000001',
        'services.shopee.partner_key' => 'shared-partner-key',
        'services.shopee.sandbox' => true,
        'services.shopee.redirect' => null,
    ]);
    Cache::flush();

    $this->project = Project::create(['name' => 'Toko Batik', 'client' => 'CV Batik', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->user = User::factory()->create();
});

function issueLink(Project $project, ?string $state = null): array
{
    $issued = ShopeeConnectLink::issue($project);

    return [$issued['link'], $issued['token']];
}

/**
 * Put a client-flow OAuth state in place, as the start step does.
 */
function startedState(ShopeeConnectLink $link, string $state = 'client-state-1'): string
{
    Cache::put("shopee_oauth:{$state}", ['flow' => 'client', 'project_id' => $link->project_id, 'link_id' => $link->id], 600);

    return $state;
}

function fakeShopeeTokens(): void
{
    Http::fake([
        '*/api/v2/auth/token/get*' => Http::response(['access_token' => 'new-access', 'refresh_token' => 'new-refresh', 'expire_in' => 14400, 'request_id' => 'r1']),
        '*/api/v2/shop/get_shop_info*' => Http::response(['shop_name' => 'Batik Resmi', 'request_id' => 'r2']),
    ]);
}

// ---------------------------------------------------------------- staff side

test('guests cannot manage connect links', function () {
    $this->postJson(route('projects.shopee.links.store', $this->project))->assertUnauthorized();
    $this->getJson(route('projects.shopee.links.index', $this->project))->assertUnauthorized();
});

test('creating a link returns the address once and stores only a hash of the token', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('projects.shopee.links.store', $this->project), ['days' => 3])
        ->assertCreated();

    $token = basename(parse_url($response->json('url'), PHP_URL_PATH));
    $link = ShopeeConnectLink::sole();

    expect($response->json('url'))->toBe(route('shopee.connect.show', ['token' => $token]))
        ->and($token)->toHaveLength(48)
        ->and($link->token_hash)->toBe(hash('sha256', $token))
        ->and($link->created_by)->toBe($this->user->id)
        ->and($link->expires_at->isBetween(now()->addDays(3)->subMinute(), now()->addDays(3)->addMinute()))->toBeTrue()
        ->and(json_encode($link->getAttributes()))->not->toContain($token);
});

test('a link needs shopee credentials to exist', function () {
    config(['services.shopee.partner_id' => null, 'services.shopee.partner_key' => null]);

    $this->actingAs($this->user)
        ->postJson(route('projects.shopee.links.store', $this->project))
        ->assertUnprocessable();

    expect(ShopeeConnectLink::count())->toBe(0);
});

test('the validity period is bounded', function (int $days) {
    $this->actingAs($this->user)
        ->postJson(route('projects.shopee.links.store', $this->project), ['days' => $days])
        ->assertUnprocessable();
})->with([0, 31]);

test('the list shows only usable links and never their addresses', function () {
    $usable = ShopeeConnectLink::factory()->create(['project_id' => $this->project->id]);
    ShopeeConnectLink::factory()->expired()->create(['project_id' => $this->project->id]);
    ShopeeConnectLink::factory()->used()->create(['project_id' => $this->project->id]);
    ShopeeConnectLink::factory()->revoked()->create(['project_id' => $this->project->id]);

    $response = $this->actingAs($this->user)
        ->getJson(route('projects.shopee.links.index', $this->project))
        ->assertOk();

    expect($response->json('links'))->toHaveCount(1)
        ->and($response->json('links.0.id'))->toBe($usable->id)
        ->and($response->getContent())->not->toContain($usable->token_hash);
});

test('a link can be revoked, but only through its own project', function () {
    $link = ShopeeConnectLink::factory()->create(['project_id' => $this->project->id]);
    $other = Project::create(['name' => 'Toko B', 'client' => 'B', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->actingAs($this->user)
        ->deleteJson(route('projects.shopee.links.destroy', [$other, $link]))
        ->assertNotFound();
    expect($link->fresh()->revoked_at)->toBeNull();

    $this->actingAs($this->user)
        ->deleteJson(route('projects.shopee.links.destroy', [$this->project, $link]))
        ->assertOk();
    expect($link->fresh()->revoked_at)->not->toBeNull()
        ->and($link->fresh()->isUsable())->toBeFalse();
});

// --------------------------------------------------------------- public page

test('a valid link shows the explanation page without any login', function () {
    [, $token] = issueLink($this->project);

    $this->get(route('shopee.connect.show', ['token' => $token]))
        ->assertOk()
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('shopee/connect')
            ->where('status', 'ready')
            ->where('clientName', 'CV Batik')
            ->where('startUrl', route('shopee.connect.start', ['token' => $token]))
            ->missing('partnerKey'));
});

test('unusable and unknown links all answer the same way', function (string $kind) {
    $token = match ($kind) {
        'expired' => issueLinkWith($this->project, 'expired'),
        'used' => issueLinkWith($this->project, 'used'),
        'revoked' => issueLinkWith($this->project, 'revoked'),
        'unknown' => str_repeat('a', 48),
    };

    $this->get(route('shopee.connect.show', ['token' => $token]))
        ->assertStatus(410)
        ->assertInertia(fn (Assert $page) => $page->component('shopee/connect')->where('status', 'invalid')->missing('clientName'));
})->with(['expired', 'used', 'revoked', 'unknown']);

function issueLinkWith(Project $project, string $state): string
{
    ['link' => $link, 'token' => $token] = ShopeeConnectLink::issue($project);
    $link->update(match ($state) {
        'expired' => ['expires_at' => now()->subMinute()],
        'used' => ['used_at' => now()],
        'revoked' => ['revoked_at' => now()],
    });

    return $token;
}

test('a token of the wrong shape is not even routed', function () {
    $this->get('/hubungkan/short')->assertNotFound();
});

// -------------------------------------------------------------------- start

test('starting sends the shop owner to shopee with a state bound to the link and the session', function () {
    [$link, $token] = issueLink($this->project);

    $response = $this->get(route('shopee.connect.start', ['token' => $token]))
        ->assertRedirectContains('https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner')
        ->assertSessionHas('shopee_client_state');

    parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
    parse_str(parse_url($query['redirect'], PHP_URL_QUERY), $redirect);

    expect($query['redirect'])->toStartWith(url('/auth/shopee/callback'))
        ->and(Cache::get('shopee_oauth:'.$redirect['state']))
        ->toMatchArray(['flow' => 'client', 'project_id' => $this->project->id, 'link_id' => $link->id])
        ->and(session('shopee_client_state'))->toBe($redirect['state']);
});

test('starting with an unusable link goes back to the page and creates no state', function () {
    $token = issueLinkWith($this->project, 'used');

    $this->get(route('shopee.connect.start', ['token' => $token]))
        ->assertRedirect(route('shopee.connect.show', ['token' => $token]))
        ->assertSessionMissing('shopee_client_state');
});

// ----------------------------------------------------------------- callback

test('the shop owner connects a shop without an account and the link is spent', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);

    $this->withSession(['shopee_client_state' => $state])
        ->get('/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555')
        ->assertRedirect(route('shopee.connect.done'));

    $config = $this->project->fresh()->shopeeConfig;

    expect($config->status)->toBe('connected')
        ->and($config->shop_id)->toBe('555')
        ->and($config->shop_name)->toBe('Batik Resmi')
        ->and($config->access_token)->toBe('new-access')
        ->and($link->fresh()->used_at)->not->toBeNull()
        ->and($link->fresh()->connected_shop_id)->toBe('555')
        ->and(Cache::has("shopee_oauth:{$state}"))->toBeFalse();
});

test('the result page shows the shop once and then expires', function () {
    $this->withSession(['shopee_connect_result' => ['status' => 'success', 'shop_name' => 'Batik Resmi', 'message' => null]])
        ->get(route('shopee.connect.done'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('status', 'done')->where('shopName', 'Batik Resmi'));

    $this->get(route('shopee.connect.done'))->assertStatus(410);
});

test('a callback from another browser session is refused and nothing is connected', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);

    $this->get('/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555')
        ->assertRedirect(route('shopee.connect.done'))
        ->assertSessionHas('shopee_connect_result.status', 'error');

    expect($this->project->fresh()->shopeeConfig)->toBeNull()
        ->and($link->fresh()->used_at)->toBeNull()
        ->and(Cache::has("shopee_oauth:{$state}"))->toBeTrue();
    Http::assertNothingSent();
});

test('a logged in staff member cannot use a client state without the matching session', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);

    $this->actingAs($this->user)
        ->withSession(['shopee_client_state' => 'something-else'])
        ->get('/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555')
        ->assertSessionHas('shopee_connect_result.status', 'error');

    expect($this->project->fresh()->shopeeConfig)->toBeNull();
});

test('a state can only be used once', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);
    $url = '/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555';

    $this->withSession(['shopee_client_state' => $state])->get($url)->assertRedirect(route('shopee.connect.done'));

    $this->withSession(['shopee_client_state' => $state])->get($url)->assertRedirect(route('login'));
    Http::assertSentCount(2); // one token exchange and one shop info, both from the first call only
});

test('a link revoked after the shop owner started is refused', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);
    $link->update(['revoked_at' => now()]);

    $this->withSession(['shopee_client_state' => $state])
        ->get('/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555')
        ->assertSessionHas('shopee_connect_result.status', 'error');

    expect($this->project->fresh()->shopeeConfig)->toBeNull();
    Http::assertNothingSent();
});

test('cancelling at shopee keeps the link usable', function () {
    fakeShopeeTokens();
    [$link] = issueLink($this->project);
    $state = startedState($link);

    $this->withSession(['shopee_client_state' => $state])
        ->get('/auth/shopee/callback?state='.$state)
        ->assertSessionHas('shopee_connect_result.status', 'error');

    expect($link->fresh()->isUsable())->toBeTrue()
        ->and($this->project->fresh()->shopeeConfig)->toBeNull();
});

test('a shopee error is hidden from the shop owner and the link stays usable', function () {
    Http::fake(['*/api/v2/auth/token/get*' => Http::response(['error' => 'error_auth', 'message' => 'partner key abc is wrong'])]);
    [$link] = issueLink($this->project);
    $state = startedState($link);

    $response = $this->withSession(['shopee_client_state' => $state])
        ->get('/auth/shopee/callback?state='.$state.'&code=auth-code&shop_id=555');

    expect(session('shopee_connect_result.message'))->not->toContain('partner key')
        ->and($link->fresh()->isUsable())->toBeTrue();
});

test('the staff flow still requires a login', function () {
    $this->get('/auth/shopee/callback?state=whatever&code=c&shop_id=1')->assertRedirect(route('login'));
});

test('connect links are removed with their project', function () {
    ShopeeConnectLink::factory()->create(['project_id' => $this->project->id]);

    $this->project->delete();

    expect(ShopeeConnectLink::count())->toBe(0);
});
