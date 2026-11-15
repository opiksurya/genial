<?php

use App\Http\Middleware\ConfineReviewer;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->project = Project::create(['name' => 'Proyek Klien', 'client' => 'Klien', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->expectedNav = [
        ['key' => 'dashboard', 'title' => 'Dashboard', 'href' => route('client.dashboard', absolute: false)],
        ['key' => 'meetings', 'title' => 'Agenda Meeting', 'href' => route('client.meetings.index', absolute: false)],
        ['key' => 'freelancers', 'title' => 'Freelancer Hub', 'href' => route('client.freelancers.index', absolute: false)],
        ['key' => 'catalog', 'title' => 'Katalog Digital Kreatif', 'href' => route('client.catalog.index', absolute: false)],
        ['key' => 'shopee', 'title' => 'Shopee Analytics', 'href' => route('shopee.index', absolute: false)],
        ['key' => 'meta-ads', 'title' => 'Meta Ads Analytics', 'href' => route('meta-ads.index', absolute: false)],
    ];

    $this->memberOf = function (string $role): User {
        $user = User::factory()->create()->assignRole($role);
        ProjectMember::create(['project_id' => $this->project->id, 'user_id' => $user->id, 'role' => 'Member']);

        return $user;
    };
});

test('client and reviewer get exactly the six client menus in order', function (string $role, string $routeName) {
    $this->actingAs(($this->memberOf)($role))
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('portalNav', $this->expectedNav));
})->with(function () {
    foreach (['Client', 'Reviewer'] as $role) {
        foreach (['client.dashboard', 'shopee.index', 'meta-ads.index'] as $route) {
            yield "$role on $route" => [$role, $route];
        }
    }
});

test('no portalNav item points to an internal route', function () {
    $response = $this->actingAs(($this->memberOf)('Client'))->get(route('client.dashboard'))->assertOk();

    $items = $response->viewData('page')['props']['portalNav'];
    expect($items)->toHaveCount(6);

    foreach ($items as $item) {
        $name = app('router')->getRoutes()->match(Request::create($item['href']))->getName();

        expect(Str::is(ConfineReviewer::ALLOWED_ROUTES, $name))->toBeTrue("{$item['href']} resolves to {$name}");
    }
});

test('staff and admins get null', function (string $role) {
    $this->actingAs(User::factory()->create()->assignRole($role))
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('portalNav', null));
})->with(['Staff', 'Admin', 'Super Admin']);
