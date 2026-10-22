<?php

namespace App\Console\Commands;

use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SyncAgentExpenses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:sync-agent-expenses {--force : Force sync even if already linked to an expense}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync old agent marketing commissions into the expenses table so they are properly recorded';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Agent Commission -> Expense Synchronization...');

        // 1. Check all incomes with agent_id to ensure AgentCommission exists
        $incomesWithAgent = Income::whereNotNull('agent_id')->get();
        $this->line("Found {$incomesWithAgent->count()} incomes with an assigned agent.");

        $createdCommissions = 0;
        foreach ($incomesWithAgent as $income) {
            $agent = Agent::find($income->agent_id);
            if ($agent) {
                $rate = $agent->commission_rate ?? 5.00;
                $comm = AgentCommission::firstOrCreate(
                    ['income_id' => $income->id],
                    [
                        'agent_id' => $agent->id,
                        'project_id' => $income->project_id,
                        'client_name' => $income->client_name ?? ($income->project ? $income->project->client : 'Client'),
                        'income_amount' => $income->amount,
                        'commission_rate' => $rate,
                        'commission_amount' => ($income->amount * $rate) / 100,
                        'payment_status' => 'unpaid',
                    ]
                );
                if ($comm->wasRecentlyCreated) {
                    $createdCommissions++;
                }
            }
        }
        if ($createdCommissions > 0) {
            $this->info("Created {$createdCommissions} missing AgentCommission records.");
        }

        // 2. Query commissions to record as Expense
        $query = AgentCommission::with(['agent', 'income', 'project']);
        if (!$this->option('force')) {
            $query->whereNull('expense_id');
        }

        $commissions = $query->get();
        $this->line("Found {$commissions->count()} commissions to process.");

        $syncedCount = 0;
        foreach ($commissions as $commission) {
            $agentName = $commission->agent ? $commission->agent->name : 'Agent';
            $income = $commission->income;
            $date = $commission->paid_at
                ? $commission->paid_at->toDateString()
                : ($income && $income->date ? Carbon::parse($income->date)->toDateString() : now()->toDateString());

            // Check if matching expense already exists for this income to avoid duplicates
            $expense = null;
            if ($commission->expense_id) {
                $expense = Expense::find($commission->expense_id);
            }

            if (!$expense) {
                $expense = Expense::where('income_id', $commission->income_id)
                    ->where('name', 'like', 'Komisi Agent%')
                    ->first();
            }

            if (!$expense) {
                $expense = Expense::create([
                    'income_id' => $commission->income_id,
                    'project_id' => $commission->project_id,
                    'category' => 'Freelancer',
                    'name' => 'Komisi Agent: ' . $agentName,
                    'description' => 'Pencairan komisi referral ' . $agentName . ' (' . (float)$commission->commission_rate . '%) dari pemasukan ' . ($income->name ?? $commission->client_name ?? 'Project'),
                    'amount' => $commission->commission_amount,
                    'date' => $date,
                    'approval_status' => 'approved',
                    'approved_by' => $income->created_by ?? 1,
                    'created_by' => $income->created_by ?? 1,
                ]);

                FinancialTransaction::updateOrCreate(
                    [
                        'reference_type' => Expense::class,
                        'reference_id' => $expense->id,
                    ],
                    [
                        'type' => 'expense',
                        'activity_name' => 'Pencairan Komisi Agent: ' . $agentName,
                        'user_id' => $expense->created_by ?? 1,
                        'amount' => $expense->amount,
                        'status' => 'completed',
                    ]
                );
            } else {
                // Update existing expense to ensure accurate amount and link
                $expense->update([
                    'amount' => $commission->commission_amount,
                    'category' => 'Freelancer',
                    'income_id' => $commission->income_id,
                    'project_id' => $commission->project_id,
                ]);
            }

            $commission->update([
                'payment_status' => 'paid',
                'paid_at' => $commission->paid_at ?? now(),
                'expense_id' => $expense->id,
            ]);

            $syncedCount++;
            $this->line("✔ [ID: {$commission->id}] {$agentName} - Rp " . number_format($commission->commission_amount, 0, ',', '.') . " -> Expense #{$expense->id}");
        }

        $this->info("Successfully synchronized {$syncedCount} agent commission(s) into Expense records!");
        return Command::SUCCESS;
    }
}
