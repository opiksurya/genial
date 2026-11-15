<?php

use App\Http\Middleware\ConfineReviewer;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ShopeeConnectLink;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config([
        'services.shopee.partner_id' => '1000001',
        'services.shopee.partner_key' => 'shared-partner-key',
    ]);

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Demo Shopee Sandbox', 'client' => 'Demo', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->userWith = function (string $role, bool $member = true): User {
        $user = User::factory()->create()->assignRole($role);

        if ($member) {
            ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);
        }

        return $user;
    };
});

// ------------------------------------------------------------ project lists

test('member-only roles see just their own projects on the analytics pages', function (string $role, string $routeName) {
    $user = ($this->userWith)($role);

    $this->actingAs($user)
        ->get(route($routeName, ['project_id' => $this->other->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects', 1)
            ->where('projects.0.id', $this->own->id)
            ->where('selectedProjectId', $this->own->id));
})->with(function () {
    foreach (['Reviewer', 'Client'] as $role) {
        foreach (['shopee.index', 'meta-ads.index'] as $route) {
            yield "$role on $route" => [$role, $route];
        }
    }
});

test('the names of other clients never reach a reviewer', function () {
    $response = $this->actingAs(($this->userWith)('Reviewer'))->get(route('shopee.index'));

    expect($response->getContent())->not->toContain('CV Rahasia')->not->toContain('Toko Rahasia');
});

test('a member-only user without any project sees an empty page, not everyone else’s', function () {
    $this->actingAs(($this->userWith)('Reviewer', member: false))
        ->get(route('shopee.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects', 0)
            ->where('selectedProjectId', null)
            ->where('analytics.isConnected', false));
});

test('staff and admins still see every project', function (string $role) {
    $this->actingAs(($this->userWith)($role, member: false))
        ->get(route('shopee.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('projects', 2));
})->with(['Staff', 'Admin', 'Super Admin']);

// ----------------------------------------------------------- project routes

test('a member-only user cannot reach shopee or meta endpoints of another project', function (string $role) {
    $user = ($this->userWith)($role);
    $link = ShopeeConnectLink::factory()->create(['project_id' => $this->other->id]);
    $project = $this->other;

    $this->actingAs($user);

    $this->postJson(route('projects.shopee.links.store', $project))->assertNotFound();
    $this->getJson(route('projects.shopee.links.index', $project))->assertNotFound();
    $this->deleteJson(route('projects.shopee.links.destroy', [$project, $link]))->assertNotFound();
    $this->post(route('projects.shopee.disconnect', $project))->assertNotFound();
    $this->post(route('projects.shopee.update', $project), ['partner_id' => '1'])->assertNotFound();
    $this->get(route('projects.shopee.oauth.redirect', $project))->assertNotFound();
    $this->getJson(route('projects.meta.accounts.index', $project))->assertNotFound();

    expect($link->fresh()->revoked_at)->toBeNull();
})->with(['Reviewer', 'Client']);

test('a member-only user can use the endpoints of their own project', function (string $role) {
    $user = ($this->userWith)($role);

    $this->actingAs($user)
        ->postJson(route('projects.shopee.links.store', $this->own))
        ->assertCreated();

    $this->actingAs($user)
        ->getJson(route('projects.shopee.links.index', $this->own))
        ->assertOk();
})->with(['Reviewer', 'Client']);

test('staff can use the endpoints of any project', function () {
    $this->actingAs(($this->userWith)('Staff', member: false))
        ->postJson(route('projects.shopee.links.store', $this->other))
        ->assertCreated();
});

test('an unknown project is a 404 and a guest is still sent to login', function () {
    $this->actingAs(($this->userWith)('Staff', member: false))
        ->getJson(route('projects.shopee.links.index', 99999))
        ->assertNotFound();

    auth()->logout();

    $this->getJson(route('projects.shopee.links.index', 99999))->assertUnauthorized();
});

// ------------------------------------------------------- reviewer confinement

test('a reviewer may use the shopee and meta analytics pages', function (string $routeName) {
    $this->actingAs(($this->userWith)('Reviewer'))->get(route($routeName))->assertOk();
})->with(['shopee.index', 'meta-ads.index']);

test('a reviewer is sent to the shopee page instead of anything else', function (string $path) {
    $this->actingAs(($this->userWith)('Reviewer'))
        ->get($path)
        ->assertRedirect(route('shopee.index'));
})->with([
    'dashboard' => '/dashboard',
    'project board' => '/projects/board',
    'finance' => '/finance/dashboard',
    'freelancers' => '/freelancers',
    'content calendar' => '/content-calendar',
    'meetings' => '/meetings',
    'creative services' => '/creative-services',
    'pixel settings' => '/settings/pixel',
    'whatsapp settings' => '/settings/whatsapp',
    'profile' => '/settings/profile',
    'users' => '/users',
]);

test('a reviewer cannot change anything outside the allowed pages', function (string $method, string $path) {
    $this->actingAs(($this->userWith)('Reviewer'))
        ->call($method, $path, ['name' => 'x'])
        ->assertForbidden();
})->with([
    ['PUT', '/settings/pixel'],
    ['PUT', '/settings/whatsapp'],
    ['POST', '/projects/store'],
    ['POST', '/projects/tasks'],
    ['POST', '/users'],
    ['DELETE', '/settings/profile'],
]);

test('a reviewer can still log out', function () {
    $this->actingAs(($this->userWith)('Reviewer'))
        ->post('/logout')
        ->assertRedirect();

    $this->assertGuest();
});

test('the client role keeps its existing access outside the analytics pages', function () {
    $this->actingAs(($this->userWith)('Client'))
        ->get('/projects/board')
        ->assertOk();
});

test('the allowed route list only names routes that exist', function () {
    foreach (ConfineReviewer::ALLOWED_ROUTES as $pattern) {
        $matches = collect(app('router')->getRoutes()->getRoutesByName())
            ->keys()
            ->filter(fn (string $name) => Str::is($pattern, $name));

        expect($matches)->not->toBeEmpty("No route matches {$pattern}");
    }
});
