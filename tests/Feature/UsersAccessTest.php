<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Agent'] as $roleName) {
        Role::findOrCreate($roleName);
    }
});

dataset('forbidden roles', ['Admin', 'Staff', 'Client', 'Agent', null]);

function superAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('Super Admin');

    return $user;
}

test('super admin can open the users page', function () {
    $this->actingAs(superAdmin())
        ->get(route('users.index'))
        ->assertOk();
});

test('super admin can create a user', function () {
    $this->actingAs(superAdmin())
        ->post(route('users.store'), [
            'name' => 'New Staff',
            'email' => 'new-staff@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $createdUser = User::where('email', 'new-staff@example.com')->firstOrFail();
    expect($createdUser->hasRole('Staff'))->toBeTrue();
});

test('super admin can update another user', function () {
    $target = User::factory()->create();
    $target->assignRole('Staff');

    $this->actingAs(superAdmin())
        ->put(route('users.update', $target), [
            'name' => 'Renamed User',
            'email' => $target->email,
            'role' => 'Admin',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $target->refresh();
    expect($target->name)->toBe('Renamed User')
        ->and($target->hasRole('Admin'))->toBeTrue()
        ->and($target->hasRole('Staff'))->toBeFalse();
});

test('super admin can delete another user', function () {
    $target = User::factory()->create();

    $this->actingAs(superAdmin())
        ->delete(route('users.destroy', $target))
        ->assertRedirect();

    $this->assertModelMissing($target);
});

test('other users are forbidden from the users page', function (?string $roleName) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertForbidden();
})->with('forbidden roles');

test('other users cannot create, update, or delete users', function (?string $roleName) {
    $user = User::factory()->create(['name' => 'Original Name']);
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $target = User::factory()->create(['name' => 'Target Name']);
    $target->assignRole('Staff');
    $userCount = User::count();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => 'password123',
            'role' => 'Super Admin',
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('users.update', $user), [
            'name' => 'Escalated',
            'email' => $user->email,
            'role' => 'Super Admin',
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => 'Hijacked',
            'email' => $target->email,
            'role' => 'Client',
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('users.destroy', $target))
        ->assertForbidden();

    expect(User::count())->toBe($userCount);
    $this->assertDatabaseMissing('users', ['email' => 'intruder@example.com']);

    $user->refresh();
    expect($user->name)->toBe('Original Name')
        ->and($user->hasRole('Super Admin'))->toBeFalse()
        ->and($user->getRoleNames()->all())->toBe($roleName === null ? [] : [$roleName]);

    $target->refresh();
    expect($target->name)->toBe('Target Name')
        ->and($target->getRoleNames()->all())->toBe(['Staff']);
})->with('forbidden roles');

test('guests are redirected to login', function () {
    $target = User::factory()->create();

    $this->get(route('users.index'))->assertRedirect(route('login'));
    $this->post(route('users.store'), [])->assertRedirect(route('login'));
    $this->put(route('users.update', $target), [])->assertRedirect(route('login'));
    $this->delete(route('users.destroy', $target))->assertRedirect(route('login'));

    $this->assertModelExists($target);
});

test('users access is shared with the frontend', function (?string $roleName, bool $canManageUsers) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('canManageUsers', $canManageUsers));
})->with([
    'super admin' => ['Super Admin', true],
    'admin' => ['Admin', false],
    'staff' => ['Staff', false],
    'client' => ['Client', false],
    'agent' => ['Agent', false],
    'no role' => [null, false],
]);
