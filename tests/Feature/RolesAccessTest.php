<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Agent'] as $roleName) {
        Role::findOrCreate($roleName);
    }
});

dataset('forbidden roles', ['Admin', 'Staff', 'Client', 'Agent', null]);

test('super admin can open the roles page', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');

    $this->actingAs($user)
        ->get(route('roles.index'))
        ->assertOk();
});

test('super admin can create a role', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');

    $this->actingAs($user)
        ->post(route('roles.store'), ['name' => 'Marketing'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('roles', ['name' => 'Marketing']);
});

test('other users are forbidden from the roles page', function (?string $roleName) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route('roles.index'))
        ->assertForbidden();
})->with('forbidden roles');

test('other users cannot change roles', function (?string $roleName) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $staffRole = Role::findByName('Staff');
    $unusedRole = Role::findOrCreate('Temporary');

    $this->actingAs($user)
        ->post(route('roles.store'), ['name' => 'Hacker'])
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('roles.update', $staffRole), ['name' => 'Renamed'])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('roles.destroy', $unusedRole))
        ->assertForbidden();

    $this->assertDatabaseMissing('roles', ['name' => 'Hacker']);
    $this->assertDatabaseMissing('roles', ['name' => 'Renamed']);
    $this->assertDatabaseHas('roles', ['id' => $staffRole->id, 'name' => 'Staff']);
    $this->assertModelExists($unusedRole);
})->with('forbidden roles');

test('guests are redirected to login', function () {
    $this->get(route('roles.index'))
        ->assertRedirect(route('login'));
});

test('roles access is shared with the frontend', function (?string $roleName, bool $canManageRoles) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('canManageRoles', $canManageRoles));
})->with([
    'super admin' => ['Super Admin', true],
    'admin' => ['Admin', false],
    'staff' => ['Staff', false],
    'client' => ['Client', false],
    'agent' => ['Agent', false],
    'no role' => [null, false],
]);
