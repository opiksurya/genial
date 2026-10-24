<?php

namespace App\Actions\FinanceFlow;

use App\Models\Allocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\SubAllocation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CreateExpense
{
    /**
     * Validate and store a new approved expense and log the transaction.
     *
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function create(User $user, array $input): Expense
    {
        $validated = Validator::make($input, [
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'allocation_id' => 'nullable|exists:allocations,id',
            'sub_allocation_id' => 'nullable|exists:sub_allocations,id',
            'income_id' => 'nullable|exists:incomes,id',
            'project_id' => 'nullable|exists:projects,id',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'proof_attachment' => 'nullable|string|max:255',
        ])->validate();

        if (filled($input['sub_allocation_id'] ?? null)) {
            $sub = SubAllocation::find($input['sub_allocation_id']);
            if ($sub) {
                $validated['category'] = $sub->name;
                $validated['allocation_id'] = $sub->allocation_id;
            }
        } elseif (filled($input['allocation_id'] ?? null)) {
            $alloc = Allocation::find($input['allocation_id']);
            if ($alloc) {
                $validated['category'] = $alloc->name;
                $validated['sub_allocation_id'] = null;
            }
        }

        $validated['created_by'] = $user->id;
        $validated['approval_status'] = 'approved';

        return DB::transaction(function () use ($validated, $user): Expense {
            $expense = Expense::create($validated);

            FinancialTransaction::create([
                'type' => 'expense',
                'reference_type' => Expense::class,
                'reference_id' => $expense->id,
                'activity_name' => 'Added Expense: ['.$expense->category.'] '.$expense->name,
                'user_id' => $user->id,
                'amount' => $expense->amount,
                'status' => 'completed',
            ]);

            return $expense;
        });
    }
}
