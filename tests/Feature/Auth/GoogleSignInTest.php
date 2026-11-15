<?php

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    config(['services.google.allow_signup' => true]);

    $this->googleReturns = function (array $overrides = [], bool $verified = true): void {
        $social = (new SocialiteUser)->map(array_merge([
            'id' => 'google-123',
            'name' => 'Budi Klien',
            'email' => 'budi@klien.test',
            'avatar' => 'https://example.test/a.png',
        ], $overrides));
        $social->token = 'access-token';
        $social->refreshToken = 'refresh-token';
        $social->expiresIn = 3600;
        $social->setRaw(['email_verified' => $verified]);

        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->andReturn($social);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    };
});

test('the sign-in redirect asks only for non-sensitive scopes', function () {
    $location = $this->get('/auth/google')->assertRedirect()->headers->get('Location');

    parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

    expect($query['scope'])->toContain('email')
        ->and($query['scope'])->not->toContain('calendar')
        ->and($query)->not->toHaveKey('access_type');
});

test('an unknown google email creates a client account with no project access', function () {
    ($this->googleReturns)();

    $this->get('/auth/google/callback')->assertRedirect();

    $user = User::where('email', 'budi@klien.test')->firstOrFail();

    expect($user->hasRole('Client'))->toBeTrue()
        ->and($user->roles)->toHaveCount(1)
        ->and($user->google_id)->toBe('google-123')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->google_access_token)->toBeNull()
        ->and(ProjectMember::where('user_id', $user->id)->count())->toBe(0);

    $this->assertAuthenticatedAs($user);
});

test('a new google client lands on an empty portal and cannot reach internal pages', function () {
    ($this->googleReturns)();
    Project::create(['name' => 'Milik Orang Lain', 'client' => 'X', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->get('/auth/google/callback');

    $this->get(route('client.projectflow.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->has('projects', 0)->has('tasks', 0));
    $this->get('/users')->assertRedirect(route('client.dashboard'));
    $this->get(route('projects.board'))->assertRedirect(route('client.dashboard'));
});

test('an unverified google email is refused and creates nothing', function () {
    ($this->googleReturns)([], false);

    $this->get('/auth/google/callback')->assertRedirect(route('login'))->assertSessionHasErrors('email');

    expect(User::where('email', 'budi@klien.test')->exists())->toBeFalse();
    $this->assertGuest();
});

test('sign-up can be switched off', function () {
    config(['services.google.allow_signup' => false]);
    ($this->googleReturns)();

    $this->get('/auth/google/callback')->assertRedirect(route('login'))->assertSessionHasErrors('email');

    expect(User::where('email', 'budi@klien.test')->exists())->toBeFalse();
    $this->assertGuest();
});

test('an existing user signs in without losing calendar tokens or roles', function () {
    $user = User::factory()->create(['email' => 'budi@klien.test', 'google_access_token' => 'cal-token', 'google_refresh_token' => 'cal-refresh']);
    $user->assignRole('Staff');
    ($this->googleReturns)();

    $this->get('/auth/google/callback')->assertRedirect();

    $user->refresh();
    expect($user->google_id)->toBe('google-123')
        ->and($user->google_access_token)->toBe('cal-token')
        ->and($user->google_refresh_token)->toBe('cal-refresh')
        ->and($user->hasRole('Staff'))->toBeTrue()
        ->and(User::count())->toBe(1);

    $this->assertAuthenticatedAs($user);
});

test('connecting the calendar still stores the tokens', function () {
    $user = User::factory()->create()->assignRole('Staff');
    ($this->googleReturns)(['email' => $user->email]);

    $this->actingAs($user)->withSession(['google_oauth_mode' => 'calendar_connect'])
        ->get('/auth/google/callback')->assertRedirect('/meetings');

    expect($user->refresh()->google_access_token)->toBe('access-token')
        ->and($user->google_refresh_token)->toBe('refresh-token');
});
