<?php

namespace App\Actions\FinanceFlow;

use App\Models\Expense;

class DeleteExpense
{
    /**
     * Delete an expense.
     */
    public function delete(Expense $expense): void
    {
        $expense->delete();
    }
}
