<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

test('guests get a 401 instead of a redirect', function () {
    $response = $this->get(route('claude-office.auth'));

    $response->assertUnauthorized();
});

test('users without the Super Admin role are forbidden', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('claude-office.auth'));

    $response->assertForbidden();
});

test('super admins are allowed', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::create(['name' => 'Super Admin']));
    $this->actingAs($user);

    $response = $this->get(route('claude-office.auth'));

    $response->assertNoContent();
});

test('the Claude Office url is shared only with super admins', function () {
    config(['services.claude_office.url' => 'https://office.example.test']);
    Role::create(['name' => 'Super Admin']);

    $member = User::factory()->create();
    $this->actingAs($member)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('claudeOfficeUrl', null));

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');
    $this->actingAs($superAdmin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('claudeOfficeUrl', 'https://office.example.test'));
});
