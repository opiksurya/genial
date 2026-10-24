<?php

namespace App\Actions\FinanceFlow;

use App\Models\AgentCommission;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use Illuminate\Support\Facades\DB;

class DeleteIncome
{
    /**
     * Delete an income together with its agent commission and the commission payout expense.
     */
    public function delete(Income $income): void
    {
        DB::transaction(function () use ($income): void {
            $existingComm = AgentCommission::where('income_id', $income->id)->first();
            if ($existingComm) {
                if ($existingComm->expense_id) {
                    FinancialTransaction::where('reference_type', Expense::class)
                        ->where('reference_id', $existingComm->expense_id)
                        ->delete();
                    Expense::where('id', $existingComm->expense_id)->delete();
                }
                $existingComm->delete();
            }

            $income->delete();
        });
    }
}
