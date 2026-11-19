<?php

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectMetaConfig;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    Http::fake();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Toko Saya', 'client' => 'Saya', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->ownConfig = ProjectMetaConfig::create([
        'project_id' => $this->own->id,
        'is_default' => true,
        'ad_account_id' => 'act_111',
        'app_id' => '555',
        'app_secret' => 'secret-own',
        'access_token' => 'token-own',
        'account_name' => 'Akun Saya',
        'status' => 'connected',
    ]);
    $this->otherConfig = ProjectMetaConfig::create([
        'project_id' => $this->other->id,
        'is_default' => true,
        'ad_account_id' => 'act_999888',
        'app_id' => '777',
        'app_secret' => 'secret-other',
        'access_token' => 'token-other',
        'account_name' => 'Akun Rahasia CV',
        'status' => 'connected',
    ]);

    $this->member = function (string $role): User {
        $user = User::factory()->create()->assignRole($role);
        ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $user->id, 'role' => 'Member']);

        return $user;
    };
});

test('a client cannot list ad accounts through the meta accounts endpoint', function (string $role) {
    $response = $this->actingAs(($this->member)($role))
        ->getJson(route('projects.meta.accounts.index', $this->own));

    $response->assertForbidden();
    expect($response->getContent())->not->toContain('act_999888')->not->toContain('Akun Rahasia CV');
})->with(['Client', 'Reviewer']);

test('a client cannot re-point their project at another ad account', function (string $role) {
    $this->actingAs(($this->member)($role));
    $count = ProjectMetaConfig::count();

    $this->postJson(route('projects.meta.accounts.store', $this->own), ['ad_account_id' => 'act_999888'])->assertForbidden();
    $this->postJson(route('projects.meta.update', $this->own), ['ad_account_id' => 'act_999888', 'app_id' => '1', 'app_secret' => 'x', 'access_token' => 'y'])->assertForbidden();

    expect($this->ownConfig->fresh()->ad_account_id)->toBe('act_111')
        ->and(ProjectMetaConfig::count())->toBe($count);
})->with(['Client', 'Reviewer']);

test('a client cannot reach the other meta management endpoints', function (string $role) {
    $this->actingAs(($this->member)($role));

    $this->postJson(route('projects.meta.test', $this->own))->assertForbidden();
    $this->postJson(route('projects.meta.sync', $this->own))->assertForbidden();
    $this->deleteJson(route('projects.meta.destroy', $this->own))->assertForbidden();
    $this->postJson(route('projects.meta.accounts.default', [$this->own, $this->ownConfig]))->assertForbidden();
    $this->deleteJson(route('projects.meta.accounts.destroy', [$this->own, $this->ownConfig]))->assertForbidden();
    $this->get(route('projects.meta.oauth.redirect', $this->own))->assertRedirect(route('client.dashboard'));
    $this->get(route('projects.meta.oauth.callback', $this->own))->assertRedirect(route('client.dashboard'));

    expect($this->ownConfig->fresh())->not->toBeNull();
})->with(['Client', 'Reviewer']);

test('the app-wide meta connect and callback routes are closed to clients', function (string $role, string $name) {
    $this->actingAs(($this->member)($role));

    $this->get(route($name))->assertRedirect(route('client.dashboard'));
    $this->getJson(route($name))->assertForbidden();
})->with(['Client', 'Reviewer'])->with(['meta-ads.connect', 'meta-ads.callback']);

test('the read-only campaigns endpoint and the analytics page stay reachable', function (string $role) {
    $this->actingAs(($this->member)($role));

    $response = $this->get(route('projects.meta.campaigns', $this->own));
    expect($response->getStatusCode())->not->toBe(403);
    expect($response->isRedirect() && str_contains((string) $response->headers->get('Location'), 'client/dashboard'))->toBeFalse();

    $this->get(route('meta-ads.index'))->assertOk();
})->with(['Client', 'Reviewer']);
