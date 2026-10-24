<?php

use App\Actions\FinanceFlow\CreateExpense;
use App\Actions\FinanceFlow\CreateIncome;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use App\Models\SubAllocation;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('Admin');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
});

test('web income store records the income, agent commission and transaction for the signed in user', function () {
    $agent = Agent::create(['name' => 'Budi', 'commission_rate' => 10]);

    $this->actingAs($this->admin)
        ->from(route('finance.income.index'))
        ->post(route('finance.income.store'), [
            'name' => 'Website company profile',
            'agent_id' => $agent->id,
            'client_name' => 'PT Maju',
            'amount' => 2000000,
            'date' => '2026-10-01',
            'status' => 'paid',
        ])
        ->assertRedirect(route('finance.income.index'))
        ->assertSessionHas('success');

    $income = Income::sole();
    expect($income->created_by)->toBe($this->admin->id);

    $this->assertDatabaseHas('agent_commissions', [
        'income_id' => $income->id,
        'agent_id' => $agent->id,
        'client_name' => 'PT Maju',
        'commission_rate' => 10,
        'commission_amount' => 200000,
        'payment_status' => 'unpaid',
    ]);
    $this->assertDatabaseHas('financial_transactions', [
        'type' => 'income',
        'reference_type' => Income::class,
        'reference_id' => $income->id,
        'activity_name' => 'Added Income: Website company profile',
        'user_id' => $this->admin->id,
        'status' => 'completed',
    ]);
});

test('web income store keeps returning validation errors', function () {
    $this->actingAs($this->admin)
        ->post(route('finance.income.store'), ['name' => '', 'amount' => -5, 'status' => 'lunas'])
        ->assertSessionHasErrors(['name', 'amount', 'date', 'status']);

    expect(Income::count())->toBe(0)
        ->and(FinancialTransaction::count())->toBe(0);
});

test('web expense store takes the category and allocation from the chosen sub allocation', function () {
    $allocation = Allocation::create(['name' => 'Operasional', 'percentage' => 40]);
    $sub = SubAllocation::create(['allocation_id' => $allocation->id, 'name' => 'Internet', 'percentage' => 50]);

    $this->actingAs($this->admin)
        ->post(route('finance.expense.store'), [
            'name' => 'Indihome Oktober',
            'category' => 'Lainnya',
            'sub_allocation_id' => $sub->id,
            'amount' => 350000,
            'date' => '2026-10-05',
        ])
        ->assertSessionHas('success');

    $expense = Expense::sole();
    expect($expense->category)->toBe('Internet')
        ->and($expense->allocation_id)->toBe($allocation->id)
        ->and($expense->approval_status)->toBe('approved')
        ->and($expense->created_by)->toBe($this->admin->id);

    $this->assertDatabaseHas('financial_transactions', [
        'type' => 'expense',
        'reference_id' => $expense->id,
        'activity_name' => 'Added Expense: [Internet] Indihome Oktober',
        'user_id' => $this->admin->id,
    ]);
});

test('expense store uses the allocation name and clears the sub allocation for a main allocation', function () {
    $allocation = Allocation::create(['name' => 'Marketing', 'percentage' => 20]);

    $expense = app(CreateExpense::class)->create($this->admin, [
        'name' => 'Iklan Meta',
        'category' => 'Lainnya',
        'allocation_id' => $allocation->id,
        'amount' => 500000,
        'date' => '2026-10-06',
    ]);

    expect($expense->category)->toBe('Marketing')
        ->and($expense->sub_allocation_id)->toBeNull();
});

test('income action fills the client name from the project', function () {
    $project = Project::create([
        'name' => 'Toko Online',
        'client' => 'CV Sinar',
        'start_date' => '2026-10-01',
        'end_date' => '2026-12-01',
    ]);

    $income = app(CreateIncome::class)->create($this->admin, [
        'name' => 'DP Toko Online',
        'project_id' => $project->id,
        'amount' => 1000000,
        'date' => '2026-10-02',
        'status' => 'partial',
    ]);

    expect($income->client_name)->toBe('CV Sinar');
});

test('income action rejects invalid data without saving', function () {
    app(CreateIncome::class)->create($this->admin, ['name' => 'Tanpa nominal', 'date' => '2026-10-02', 'status' => 'paid']);
})->throws(ValidationException::class);

test('web income destroy removes the agent commission and its payout expense', function () {
    $income = Income::create(['name' => 'Proyek A', 'amount' => 1000000, 'date' => '2026-10-01']);
    $agent = Agent::create(['name' => 'Sari']);
    $payout = Expense::create(['name' => 'Komisi Agent Sari', 'category' => 'Komisi Agent', 'amount' => 50000, 'date' => '2026-10-03']);
    FinancialTransaction::create(['type' => 'expense', 'reference_type' => Expense::class, 'reference_id' => $payout->id, 'activity_name' => 'Payout', 'amount' => 50000]);
    AgentCommission::create(['agent_id' => $agent->id, 'income_id' => $income->id, 'commission_amount' => 50000, 'expense_id' => $payout->id]);

    $this->actingAs($this->admin)
        ->delete(route('finance.income.destroy', $income))
        ->assertSessionHas('success');

    $this->assertModelMissing($income);
    $this->assertModelMissing($payout);
    expect(AgentCommission::count())->toBe(0)
        ->and(FinancialTransaction::where('reference_id', $payout->id)->count())->toBe(0);
});

test('expense page still reports allocation usage', function () {
    Income::create(['name' => 'Proyek', 'amount' => 1000000, 'date' => '2026-10-01']);
    $operational = Allocation::create(['name' => 'Operasional', 'percentage' => 40]);
    $internet = SubAllocation::create(['allocation_id' => $operational->id, 'name' => 'Internet', 'percentage' => 50]);
    $marketing = Allocation::create(['name' => 'Marketing', 'percentage' => 10, 'sort_order' => 1]);
    Expense::create(['name' => 'Wifi', 'category' => 'Internet', 'sub_allocation_id' => $internet->id, 'allocation_id' => $operational->id, 'amount' => 250000, 'date' => '2026-10-02']);
    Expense::create(['name' => 'Iklan', 'category' => 'Marketing', 'amount' => 30000, 'date' => '2026-10-02']);

    $this->actingAs($this->admin)
        ->get(route('finance.expense.index'))
        ->assertInertia(fn ($page) => $page
            ->has('allocationCategories', 2)
            ->where('allocationCategories.0.key', 'sub:'.$internet->id)
            ->where('allocationCategories.0.budget_ceiling', 200000)
            ->where('allocationCategories.0.total_spent', 250000)
            ->where('allocationCategories.0.is_over_budget', true)
            ->where('allocationCategories.1.key', 'alloc:'.$marketing->id)
            ->where('allocationCategories.1.total_spent', 30000)
            ->where('allocationCategories.1.remaining_budget', 70000)
            ->where('allocationCategories.1.is_over_budget', false));
});
