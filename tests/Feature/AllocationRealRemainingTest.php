<?php

use App\Models\Allocation;
use App\Models\Expense;
use App\Models\Income;
use App\Models\SubAllocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('Admin');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    Income::create(['name' => 'Fee klien', 'amount' => 1000000, 'date' => '2026-10-01', 'status' => 'paid']);

    $this->allocation = Allocation::create(['name' => 'OPEX', 'percentage' => 100]);
    $this->gaji = SubAllocation::create(['allocation_id' => $this->allocation->id, 'name' => 'Gaji', 'percentage' => 50, 'sort_order' => 0]);
    $this->marketing = SubAllocation::create(['allocation_id' => $this->allocation->id, 'name' => 'Marketing', 'percentage' => 30, 'sort_order' => 1]);
    $this->vendor = SubAllocation::create(['allocation_id' => $this->allocation->id, 'name' => 'Vendor', 'percentage' => 20, 'sort_order' => 2]);
});

function spendOn(SubAllocation $sub, float $amount): void
{
    Expense::create([
        'allocation_id' => $sub->allocation_id,
        'sub_allocation_id' => $sub->id,
        'category' => $sub->name,
        'name' => 'Belanja '.$sub->name,
        'amount' => $amount,
        'date' => '2026-10-02',
    ]);
}

test('real remaining of the subs adds up to the parent remaining when another sub is covered by cross subsidy', function () {
    spendOn($this->gaji, 100000);
    spendOn($this->vendor, 500000);

    $this->actingAs($this->admin)
        ->get(route('finance.allocation.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('allocations.0.remaining_budget', 400000)
            ->where('allocations.0.sub_allocations.0.remaining_budget', 400000)
            ->where('allocations.0.sub_allocations.0.real_remaining_budget', fn ($value) => abs($value - 400000 * 4 / 7) < 0.01)
            ->where('allocations.0.sub_allocations.0.subsidy_contribution', fn ($value) => abs($value - 400000 * 3 / 7) < 0.01)
            ->where('allocations.0.sub_allocations.1.real_remaining_budget', fn ($value) => abs($value - 300000 * 4 / 7) < 0.01)
            ->where('allocations.0.sub_allocations.2.real_remaining_budget', 0)
            ->where('allocations.0.sub_allocations', fn ($subs) => abs(collect($subs)->sum('real_remaining_budget') - 400000) < 0.01)
        );
});

test('real remaining equals the quota remaining when no sub is over budget', function () {
    spendOn($this->gaji, 100000);

    $this->actingAs($this->admin)
        ->get(route('finance.allocation.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('allocations.0.sub_allocations.0.real_remaining_budget', 400000)
            ->where('allocations.0.sub_allocations.0.subsidy_contribution', 0)
        );
});

test('real remaining is zero for every sub when the parent itself is over budget', function () {
    spendOn($this->vendor, 1200000);

    $this->actingAs($this->admin)
        ->get(route('finance.allocation.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('allocations.0.sub_allocations', fn ($subs) => collect($subs)->every(fn ($sub) => $sub['real_remaining_budget'] == 0))
        );
});
