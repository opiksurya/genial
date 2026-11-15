<?php

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectMetaConfig;
use App\Models\ProjectShopeeConfig;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    Http::fake();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Toko Saya', 'client' => 'Saya', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->secrets = [
        'SHP-ACCESS-9f3a1c', 'SHP-REFRESH-7b2d4e', 'SHP-PARTNERKEY-5c8e0a',
        'META-ACCESS-1d6f9b', 'META-APPSECRET-4a7c2e',
    ];

    foreach ([$this->own, $this->other] as $project) {
        ProjectShopeeConfig::create([
            'project_id' => $project->id,
            'partner_id' => '1001',
            'partner_key' => 'SHP-PARTNERKEY-5c8e0a',
            'shop_id' => '2002',
            'shop_name' => 'Toko '.$project->name,
            'access_token' => 'SHP-ACCESS-9f3a1c',
            'refresh_token' => 'SHP-REFRESH-7b2d4e',
            'status' => 'connected',
        ]);
        ProjectMetaConfig::create([
            'project_id' => $project->id,
            'is_default' => true,
            'ad_account_id' => 'act_123',
            'app_id' => '555',
            'app_secret' => 'META-APPSECRET-4a7c2e',
            'access_token' => 'META-ACCESS-1d6f9b',
            'account_name' => 'Akun '.$project->name,
            'status' => 'connected',
        ]);
    }
});

test('no token or secret keys appear', function (string $role, string $route) {
    $user = User::factory()->create()->assignRole($role);
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);

    $content = $this->actingAs($user)->get(route($route))->assertOk()->getContent();

    foreach ($this->secrets as $secret) {
        expect($content)->not->toContain($secret);
    }
    foreach (['access_token', 'refresh_token', 'partner_key', 'app_secret'] as $key) {
        // `has_access_token` (a boolean flag) is deliberately allowed; only the bare key is a leak.
        expect($content)->not->toMatch('/(?<![a-z_])'.$key.'(?![a-z_])/');
    }
})->with(['Client', 'Reviewer'])->with(['shopee.index', 'meta-ads.index']);

test("other clients' project names never appear", function (string $role, string $route) {
    $user = User::factory()->create()->assignRole($role);
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);

    $content = $this->actingAs($user)->get(route($route))->assertOk()->getContent();

    expect($content)->toContain('Toko Saya')
        ->not->toContain('Toko Rahasia')
        ->not->toContain('CV Rahasia');
})->with(['Client', 'Reviewer'])->with(['shopee.index', 'meta-ads.index']);

test('shopeeApp.canManageCredentials is false and metaApp.can_setup is false', function (string $role) {
    $user = User::factory()->create()->assignRole($role);
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);

    $this->actingAs($user)->get(route('shopee.index'))
        ->assertInertia(fn (Assert $page) => $page->where('shopeeApp.canManageCredentials', false));

    $this->actingAs($user)->get(route('meta-ads.index'))
        ->assertInertia(fn (Assert $page) => $page->where('metaApp.can_setup', false));
})->with(['Client', 'Reviewer']);

test('the client sidebar is used on these pages', function (string $role, string $route) {
    $user = User::factory()->create()->assignRole($role);
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);

    $this->actingAs($user)->get(route($route))
        ->assertInertia(fn (Assert $page) => $page->has('portalNav', 6));
})->with(['Client', 'Reviewer'])->with(['shopee.index', 'meta-ads.index']);
