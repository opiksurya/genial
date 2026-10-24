<?php

use App\Models\Income;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Agent'] as $roleName) {
        Role::findOrCreate($roleName);
    }
});

dataset('finance pages', [
    'finance.dashboard',
    'finance.income.index',
    'finance.expense.index',
    'finance.allocation.index',
    'finance.agents.index',
    'finance.reports.index',
    'finance.reports.export',
    'finance.settings.index',
]);

dataset('allowed roles', ['Super Admin', 'Admin']);

dataset('forbidden roles', ['Staff', 'Client', 'Agent', null]);

test('allowed roles can open finance pages', function (string $roleName, string $routeName) {
    $user = User::factory()->create();
    $user->assignRole($roleName);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk();
})->with('allowed roles')->with('finance pages');

test('other users are forbidden from finance pages', function (?string $roleName, string $routeName) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertForbidden();
})->with('forbidden roles')->with('finance pages');

test('other users cannot change finance data', function (?string $roleName) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $income = Income::create([
        'name' => 'Website project',
        'amount' => 1000000,
        'date' => now()->toDateString(),
    ]);

    $this->actingAs($user)
        ->post(route('finance.settings.store'), ['currency' => 'USD'])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('finance.income.destroy', $income))
        ->assertForbidden();

    $this->assertModelExists($income);
    $this->assertDatabaseMissing('finance_settings', ['key' => 'currency']);
})->with('forbidden roles');

test('guests are redirected to login', function (string $routeName) {
    $this->get(route($routeName))
        ->assertRedirect(route('login'));
})->with('finance pages');

test('finance access is shared with the frontend', function (?string $roleName, bool $canAccessFinance) {
    $user = User::factory()->create();
    if ($roleName !== null) {
        $user->assignRole($roleName);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('canAccessFinance', $canAccessFinance));
})->with([
    'super admin' => ['Super Admin', true],
    'admin' => ['Admin', true],
    'staff' => ['Staff', false],
    'agent' => ['Agent', false],
    'no role' => [null, false],
]);
