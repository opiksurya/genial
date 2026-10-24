<?php

use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use App\Models\SubAllocation;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

/**
 * Run a finance bot command and decode its JSON output.
 *
 * @param  array<string, mixed>  $parameters
 * @return array{0: int, 1: array<string, mixed>}
 */
function runFinanceBot(string $command, array $parameters = []): array
{
    $exitCode = Artisan::call($command, $parameters);

    return [$exitCode, json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR)];
}

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff'] as $roleName) {
        Role::findOrCreate($roleName);
    }

    $this->superAdmin = User::factory()->create(['email' => 'owner@example.com']);
    $this->superAdmin->assignRole('Super Admin');

    $this->admin = User::factory()->create(['email' => 'admin@example.com']);
    $this->admin->assignRole('Admin');

    $this->staff = User::factory()->create(['email' => 'staff@example.com']);
    $this->staff->assignRole('Staff');
});

test('context lists the finance choices for the bot', function () {
    $operational = Allocation::create(['name' => 'Operasional', 'percentage' => 40]);
    $child = Allocation::create(['name' => 'Kantor', 'percentage' => 10, 'parent_id' => $operational->id]);
    $sub = SubAllocation::create(['allocation_id' => $operational->id, 'name' => 'Internet', 'percentage' => 50]);
    $project = Project::create(['name' => 'Toko Online', 'client' => 'CV Sinar', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $activeAgent = Agent::create(['name' => 'Budi']);
    Agent::create(['name' => 'Lama', 'status' => 'inactive']);
    Expense::create(['name' => 'Wifi', 'category' => 'Internet', 'amount' => 1, 'date' => '2026-10-01']);

    [$exitCode, $json] = runFinanceBot('finance:bot-context');

    expect($exitCode)->toBe(0)
        ->and($json['allocations'])->toContain(['id' => $child->id, 'name' => 'Kantor', 'parent_id' => $operational->id, 'parent' => 'Operasional'])
        ->and($json['sub_allocations'])->toBe([['id' => $sub->id, 'name' => 'Internet', 'allocation_id' => $operational->id]])
        ->and($json['projects'])->toBe([['id' => $project->id, 'name' => 'Toko Online', 'client' => 'CV Sinar']])
        ->and($json['agents'])->toBe([['id' => $activeAgent->id, 'name' => 'Budi']])
        ->and($json['expense_categories'])->toBe(['Internet'])
        ->and($json['income_default_status'])->toBe('paid');
});

test('store saves an income like the web, with agent commission, transaction and telegram marker', function () {
    $agent = Agent::create(['name' => 'Budi', 'commission_rate' => 10]);

    [$exitCode, $json] = runFinanceBot('finance:bot-store', [
        'type' => 'income',
        '--user' => 'admin@example.com',
        '--data' => json_encode([
            'name' => 'Website company profile',
            'agent_id' => $agent->id,
            'client_name' => 'PT Maju',
            'amount' => 2000000,
            'date' => '2026-10-01',
            'status' => 'paid',
            'notes' => 'DP 50%',
        ]),
    ]);

    $income = Income::sole();

    expect($exitCode)->toBe(0)
        ->and($json['type'])->toBe('income')
        ->and($json['record']['id'])->toBe($income->id)
        ->and($json['record']['creator']['name'])->toBe($this->admin->name)
        ->and($income->notes)->toBe("DP 50%\n[via Telegram]")
        ->and($income->created_by)->toBe($this->admin->id);

    $this->assertDatabaseHas('agent_commissions', [
        'income_id' => $income->id,
        'agent_id' => $agent->id,
        'commission_amount' => 200000,
        'payment_status' => 'unpaid',
    ]);
    $this->assertDatabaseHas('financial_transactions', [
        'reference_type' => Income::class,
        'reference_id' => $income->id,
        'activity_name' => 'Added Income: Website company profile',
        'user_id' => $this->admin->id,
        'status' => 'completed',
    ]);
});

test('store creates the same commission and transaction as the web form', function () {
    $agent = Agent::create(['name' => 'Budi', 'commission_rate' => 7.5]);
    $data = ['name' => 'Proyek SEO', 'agent_id' => $agent->id, 'amount' => 3000000, 'date' => '2026-10-10', 'status' => 'pending'];

    $this->actingAs($this->admin)->post(route('finance.income.store'), $data);
    runFinanceBot('finance:bot-store', ['type' => 'income', '--user' => 'admin@example.com', '--data' => json_encode($data)]);

    $columns = ['agent_id', 'project_id', 'client_name', 'income_amount', 'commission_rate', 'commission_amount', 'payment_status'];
    [$viaWeb, $viaBot] = AgentCommission::orderBy('id')->get()->map->only($columns)->all();
    expect($viaBot)->toBe($viaWeb);

    [$webLog, $botLog] = FinancialTransaction::orderBy('id')->get()
        ->map->only(['type', 'reference_type', 'activity_name', 'user_id', 'amount', 'status'])->all();
    expect($botLog)->toBe($webLog);
});

test('store saves an expense with the sub allocation category and a copied attachment', function () {
    Storage::fake('public');
    $allocation = Allocation::create(['name' => 'Operasional', 'percentage' => 40]);
    $sub = SubAllocation::create(['allocation_id' => $allocation->id, 'name' => 'Internet', 'percentage' => 50]);
    $receipt = tempnam(sys_get_temp_dir(), 'receipt');
    file_put_contents($receipt, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='));

    [$exitCode, $json] = runFinanceBot('finance:bot-store', [
        'type' => 'expense',
        '--user' => 'owner@example.com',
        '--attachment' => $receipt,
        '--data' => json_encode([
            'name' => 'Indihome Oktober',
            'category' => 'Internet',
            'sub_allocation_id' => $sub->id,
            'amount' => 350000,
            'date' => '2026-10-05',
        ]),
    ]);

    $expense = Expense::sole();

    expect($exitCode)->toBe(0)
        ->and($expense->category)->toBe('Internet')
        ->and($expense->allocation_id)->toBe($allocation->id)
        ->and($expense->description)->toBe('[via Telegram]')
        ->and($expense->proof_attachment)->toStartWith('finance_attachments/')
        ->and($json['attachment_url'])->toEndWith($expense->proof_attachment);
    Storage::disk('public')->assertExists($expense->proof_attachment);
    $this->assertDatabaseHas('financial_transactions', [
        'reference_type' => Expense::class,
        'reference_id' => $expense->id,
        'activity_name' => 'Added Expense: [Internet] Indihome Oktober',
        'user_id' => $this->superAdmin->id,
    ]);

    unlink($receipt);
});

test('store rejects an attachment that is not an image or pdf', function () {
    Storage::fake('public');
    $secrets = tempnam(sys_get_temp_dir(), 'env');
    file_put_contents($secrets, "APP_KEY=secret\n");

    [$exitCode, $json] = runFinanceBot('finance:bot-store', [
        'type' => 'expense',
        '--user' => 'admin@example.com',
        '--attachment' => $secrets,
        '--data' => json_encode(['name' => 'Tes', 'category' => 'Lain', 'amount' => 1, 'date' => '2026-10-05']),
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe('invalid')
        ->and(Expense::count())->toBe(0)
        ->and(Storage::disk('public')->allFiles())->toBe([]);

    unlink($secrets);
});

test('store returns validation errors and saves nothing', function () {
    Storage::fake('public');
    $receipt = tempnam(sys_get_temp_dir(), 'receipt');
    file_put_contents($receipt, '%PDF-1.4 test');

    [$exitCode, $json] = runFinanceBot('finance:bot-store', [
        'type' => 'income',
        '--user' => 'admin@example.com',
        '--attachment' => $receipt,
        '--data' => json_encode(['name' => '', 'amount' => 'banyak', 'status' => 'lunas']),
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe('validation')
        ->and($json['errors'])->toHaveKeys(['name', 'amount', 'date', 'status'])
        ->and(Income::count())->toBe(0)
        ->and(FinancialTransaction::count())->toBe(0)
        ->and(Storage::disk('public')->allFiles())->toBe([]);

    unlink($receipt);
});

test('store rejects bad input before saving', function (array $parameters, string $code) {
    [$exitCode, $json] = runFinanceBot('finance:bot-store', $parameters);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe($code)
        ->and($json)->toHaveKey('error')
        ->and(Income::count() + Expense::count())->toBe(0);
})->with([
    'unknown type' => [['type' => 'transfer', '--user' => 'admin@example.com', '--data' => '{"name":"x"}'], 'invalid'],
    'missing user' => [['type' => 'income', '--data' => '{"name":"x"}'], 'invalid'],
    'unknown user' => [['type' => 'income', '--user' => 'nobody@example.com', '--data' => '{"name":"x"}'], 'invalid'],
    'broken json' => [['type' => 'income', '--user' => 'admin@example.com', '--data' => '{name:'], 'invalid'],
]);

test('store refuses users without finance access', function (?string $email) {
    $noRole = User::factory()->create(['email' => 'norole@example.com']);

    [$exitCode, $json] = runFinanceBot('finance:bot-store', [
        'type' => 'expense',
        '--user' => $email,
        '--data' => json_encode(['name' => 'Tes', 'category' => 'Lain', 'amount' => 1, 'date' => '2026-10-05']),
    ]);

    expect($exitCode)->not->toBe(0)
        ->and($json['code'])->toBe('forbidden')
        ->and(Expense::count())->toBe(0);
})->with(['staff@example.com', 'norole@example.com']);

test('summary matches the dashboard totals and reports allocation usage', function () {
    Income::create(['name' => 'Okt', 'amount' => 1000000, 'date' => '2026-10-01']);
    Income::create(['name' => 'Sep', 'amount' => 500000, 'date' => '2026-09-30']);
    $marketing = Allocation::create(['name' => 'Marketing', 'percentage' => 10]);
    Expense::create(['name' => 'Iklan', 'category' => 'Marketing', 'allocation_id' => $marketing->id, 'amount' => 30000, 'date' => '2026-10-31']);
    Expense::create(['name' => 'Iklan lama', 'category' => 'Marketing', 'allocation_id' => $marketing->id, 'amount' => 2000000, 'date' => '2026-09-01']);

    [$exitCode, $month] = runFinanceBot('finance:bot-summary', ['--month' => '2026-10']);
    [, $allTime] = runFinanceBot('finance:bot-summary');

    expect($exitCode)->toBe(0)
        ->and($month)->toMatchArray(['period' => '2026-10', 'from' => '2026-10-01', 'to' => '2026-10-31', 'total_income' => 1000000, 'total_expense' => 30000, 'balance' => 970000])
        ->and($month['allocations'][0])->toMatchArray(['label' => 'Marketing', 'budget_ceiling' => 100000, 'total_spent' => 30000, 'remaining_budget' => 70000, 'is_over_budget' => false])
        ->and($allTime)->toMatchArray(['period' => 'all', 'total_income' => 1500000, 'total_expense' => 2030000, 'balance' => 0])
        ->and($allTime['allocations'][0]['is_over_budget'])->toBeTrue();
});

test('summary rejects an invalid month', function () {
    [$exitCode, $json] = runFinanceBot('finance:bot-summary', ['--month' => '2026-13']);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid');
});

test('recent merges incomes and expenses newest first', function () {
    $this->travelTo('2026-10-01 08:00');
    Income::create(['name' => 'Lama', 'amount' => 1, 'date' => '2026-10-01', 'created_by' => $this->admin->id]);
    $this->travelTo('2026-10-02 08:00');
    $expense = Expense::create(['name' => 'Wifi', 'category' => 'Internet', 'amount' => 350000, 'date' => '2026-10-02', 'created_by' => $this->superAdmin->id]);
    $this->travelTo('2026-10-03 08:00');
    $income = Income::create(['name' => 'Baru', 'amount' => 2000000, 'date' => '2026-10-03', 'created_by' => $this->admin->id]);

    [$exitCode, $json] = runFinanceBot('finance:bot-recent', ['--limit' => 2]);

    expect($exitCode)->toBe(0)
        ->and($json['items'])->toHaveCount(2)
        ->and($json['items'][0])->toMatchArray(['id' => $income->id, 'type' => 'income', 'name' => 'Baru', 'amount' => 2000000, 'date' => '2026-10-03', 'created_by' => $this->admin->name])
        ->and($json['items'][1])->toMatchArray(['id' => $expense->id, 'type' => 'expense', 'name' => 'Wifi', 'category' => 'Internet', 'created_by' => $this->superAdmin->name]);
});

test('recent rejects an invalid limit', function () {
    [$exitCode, $json] = runFinanceBot('finance:bot-recent', ['--limit' => 0]);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid');
});

test('delete lets a super admin remove an income with its commission like the web', function () {
    $income = Income::create(['name' => 'Proyek A', 'amount' => 1000000, 'date' => '2026-10-01']);
    $agent = Agent::create(['name' => 'Sari']);
    $payout = Expense::create(['name' => 'Komisi Agent Sari', 'category' => 'Komisi Agent', 'amount' => 50000, 'date' => '2026-10-03']);
    AgentCommission::create(['agent_id' => $agent->id, 'income_id' => $income->id, 'commission_amount' => 50000, 'expense_id' => $payout->id]);

    [$exitCode, $json] = runFinanceBot('finance:bot-delete', ['type' => 'income', 'id' => $income->id, '--user' => 'owner@example.com']);

    expect($exitCode)->toBe(0)
        ->and($json)->toMatchArray(['deleted' => true, 'type' => 'income'])
        ->and($json['record']['name'])->toBe('Proyek A')
        ->and(AgentCommission::count())->toBe(0);
    $this->assertModelMissing($income);
    $this->assertModelMissing($payout);
});

test('delete removes an expense for a super admin', function () {
    $expense = Expense::create(['name' => 'Wifi', 'category' => 'Internet', 'amount' => 1, 'date' => '2026-10-02']);

    [$exitCode] = runFinanceBot('finance:bot-delete', ['type' => 'expense', 'id' => $expense->id, '--user' => 'owner@example.com']);

    expect($exitCode)->toBe(0);
    $this->assertModelMissing($expense);
});

test('delete is refused for anyone but a super admin', function (string $email) {
    $expense = Expense::create(['name' => 'Wifi', 'category' => 'Internet', 'amount' => 1, 'date' => '2026-10-02']);

    [$exitCode, $json] = runFinanceBot('finance:bot-delete', ['type' => 'expense', 'id' => $expense->id, '--user' => $email]);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('forbidden');
    $this->assertModelExists($expense);
})->with(['admin@example.com', 'staff@example.com']);

test('delete reports a missing record', function () {
    [$exitCode, $json] = runFinanceBot('finance:bot-delete', ['type' => 'income', 'id' => 999, '--user' => 'owner@example.com']);

    expect($exitCode)->not->toBe(0)->and($json['code'])->toBe('invalid');
});
