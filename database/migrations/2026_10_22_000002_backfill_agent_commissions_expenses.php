<?php

use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure AgentCommission exists for any Income with agent_id
        if (Schema::hasTable('incomes') && Schema::hasTable('agents') && Schema::hasTable('agent_commissions')) {
            $incomesWithAgent = Income::whereNotNull('agent_id')->get();
            foreach ($incomesWithAgent as $income) {
                $agent = Agent::find($income->agent_id);
                if ($agent) {
                    $rate = $agent->commission_rate ?? 5.00;
                    AgentCommission::firstOrCreate(
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
                }
            }

            // 2. Convert all unlinked agent commissions into Expenses
            $commissions = AgentCommission::with(['agent', 'income', 'project'])
                ->whereNull('expense_id')
                ->get();

            foreach ($commissions as $commission) {
                $agentName = $commission->agent ? $commission->agent->name : 'Agent';
                $income = $commission->income;
                $date = $commission->paid_at
                    ? $commission->paid_at->toDateString()
                    : ($income && $income->date ? Carbon::parse($income->date)->toDateString() : now()->toDateString());

                $expense = Expense::where('income_id', $commission->income_id)
                    ->where('name', 'like', 'Komisi Agent%')
                    ->first();

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
                }

                $commission->update([
                    'payment_status' => 'paid',
                    'paid_at' => $commission->paid_at ?? now(),
                    'expense_id' => $expense->id,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed for data backfill
    }
};
