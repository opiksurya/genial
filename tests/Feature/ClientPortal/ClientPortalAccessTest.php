<?php

use App\Http\Middleware\ConfineReviewer;
use App\Models\User;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->withoutVite();

    $this->userWith = fn (string $role): User => User::factory()->create()->assignRole($role);
});

test('guests are sent to login from the client portal', function () {
    $this->get('/client/dashboard')->assertRedirect(route('login'));
});

test('staff, admin and super admin get 403 on the client portal', function (string $role) {
    $this->actingAs(($this->userWith)($role))->get('/client/dashboard')->assertForbidden();
})->with(['Staff', 'Admin', 'Super Admin']);

test('client and reviewer open the client dashboard', function (string $role) {
    $this->actingAs(($this->userWith)($role))->get(route('client.dashboard'))->assertOk();
})->with(['Client', 'Reviewer']);

test('client and reviewer are sent to the client dashboard from any internal page', function (string $role, string $path) {
    $this->actingAs(($this->userWith)($role))
        ->get($path)
        ->assertRedirect(route('client.dashboard'));
})->with(['Client', 'Reviewer'])->with([
    '/dashboard',
    '/projects/board',
    '/finance/dashboard',
    '/freelancers',
    '/meetings',
    '/creative-services',
    '/content-calendar',
    '/users',
    '/settings/pixel',
    '/settings/whatsapp',
]);

test('client and reviewer may open their own profile and password settings', function (string $role) {
    $this->actingAs(($this->userWith)($role));

    $this->get('/settings/profile')->assertOk();
    $this->withSession(['auth.password_confirmed_at' => time()])->get(route('security.edit'))->assertOk();
    $this->delete('/settings/profile')->assertForbidden();
})->with(['Client', 'Reviewer']);

test('login lands a client on the client dashboard', function () {
    $this->actingAs(($this->userWith)('Client'))
        ->get('/dashboard')
        ->assertRedirect(route('client.dashboard'));
});

test('internal staff are not confined', function () {
    $this->actingAs(($this->userWith)('Staff'))->get('/dashboard')->assertOk();
});

test('every route named client.* is guarded by client.portal', function () {
    $clientRoutes = collect(app('router')->getRoutes()->getRoutes())
        ->filter(fn (LaravelRoute $route) => Str::startsWith((string) $route->getName(), 'client.'));

    expect($clientRoutes)->not->toBeEmpty();

    foreach ($clientRoutes as $route) {
        expect(in_array('client.portal', $route->gatherMiddleware(), true))
            ->toBeTrue("Route {$route->getName()} is missing client.portal");
    }
});

test('every other parameterless GET route is closed to clients', function () {
    $routes = collect(app('router')->getRoutes()->getRoutes())
        ->filter(fn (LaravelRoute $route) => in_array('GET', $route->methods(), true)
            && $route->getName() !== null
            && ! str_contains($route->uri(), '{')
            && in_array('confine.reviewer', $route->gatherMiddleware(), true)
            && ! Str::is(ConfineReviewer::ALLOWED_ROUTES, $route->getName()));

    expect($routes)->not->toBeEmpty();

    $client = ($this->userWith)('Client');

    foreach ($routes as $route) {
        $this->actingAs($client)
            ->get('/'.ltrim($route->uri(), '/'))
            ->assertRedirect(route('client.dashboard'));
    }
});
