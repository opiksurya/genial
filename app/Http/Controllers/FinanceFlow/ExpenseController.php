<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Actions\FinanceFlow\CreateExpense;
use App\Actions\FinanceFlow\DeleteExpense;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use App\Models\SubAllocation;
use App\Services\FinanceFlow\AllocationUsage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index(AllocationUsage $allocationUsage)
    {
        $expenses = Expense::with(['income', 'project', 'creator', 'approver', 'allocation', 'subAllocation'])
            ->latest('date')
            ->get();

        $incomes = Income::select('id', 'name', 'amount')->get();
        $projects = Project::select('id', 'name')->get();

        $totalIncome = (float)Income::sum('amount');
        $totalExpense = (float)Expense::sum('amount');
        $realMoneyAvailable = max(0, $totalIncome - $totalExpense);

        $allocationCategories = $allocationUsage->categories();

        // Category summary for pill filter
        $rawCategorySummary = Expense::groupBy('category')
            ->selectRaw('category, sum(amount) as total')
            ->pluck('total', 'category')
            ->toArray();

        // Calculate is_over_budget for each expense
        $overBudgetCategoryNames = collect($allocationCategories)
            ->where('is_over_budget', true)
            ->pluck('name')
            ->all();

        $overBudgetSubIds = collect($allocationCategories)
            ->where('type', 'sub')
            ->where('is_over_budget', true)
            ->pluck('sub_allocation_id')
            ->all();

        $overBudgetAllocIds = collect($allocationCategories)
            ->where('type', 'main')
            ->where('is_over_budget', true)
            ->pluck('allocation_id')
            ->all();

        $expenses = $expenses->map(function ($exp) use ($overBudgetCategoryNames, $overBudgetSubIds, $overBudgetAllocIds) {
            $isOver = false;
            if ($exp->sub_allocation_id && in_array($exp->sub_allocation_id, $overBudgetSubIds)) {
                $isOver = true;
            } elseif ($exp->allocation_id && in_array($exp->allocation_id, $overBudgetAllocIds)) {
                $isOver = true;
            } elseif (in_array($exp->category, $overBudgetCategoryNames)) {
                $isOver = true;
            }
            $exp->is_over_budget = $isOver;
            return $exp;
        });

        $approvedExpense = (float)Expense::where('approval_status', 'approved')->sum('amount');
        $pendingExpense = (float)Expense::where('approval_status', 'pending')->sum('amount');

        // Build category summary aligned with allocation categories + legacy expenses
        $categorySummary = [];
        foreach ($allocationCategories as $ac) {
            $categorySummary[$ac['name']] = (float)$ac['total_spent'];
        }
        foreach ($rawCategorySummary as $catName => $catTotal) {
            if (!isset($categorySummary[$catName]) && (float)$catTotal > 0) {
                $categorySummary[$catName] = (float)$catTotal;
            }
        }

        $activeAllocationCategoryNames = collect($allocationCategories)
            ->pluck('name')
            ->unique()
            ->values()
            ->all();

        return Inertia::render('finance/expense', [
            'expenses' => $expenses,
            'incomes' => $incomes,
            'projects' => $projects,
            'categorySummary' => $categorySummary,
            'allocationCategories' => $allocationCategories,
            'stats' => [
                'totalExpense' => (float)$totalExpense,
                'approvedExpense' => (float)$approvedExpense,
                'pendingExpense' => (float)$pendingExpense,
                'realMoneyAvailable' => (float)$realMoneyAvailable,
            ],
            'categories' => $activeAllocationCategoryNames,
        ]);
    }

    public function store(Request $request, CreateExpense $createExpense)
    {
        $createExpense->create($request->user(), $request->all());

        return redirect()->back()->with('success', 'Pengeluaran berhasil dicatat!');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
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
        ]);

        // Auto-sync category name with allocation / sub_allocation record
        if ($request->filled('sub_allocation_id')) {
            $sub = SubAllocation::find($request->sub_allocation_id);
            if ($sub) {
                $validated['category'] = $sub->name;
                $validated['allocation_id'] = $sub->allocation_id;
            }
        } elseif ($request->filled('allocation_id')) {
            $alloc = Allocation::find($request->allocation_id);
            if ($alloc) {
                $validated['category'] = $alloc->name;
                $validated['sub_allocation_id'] = null;
            }
        }

        $expense->update($validated);

        return redirect()->back()->with('success', 'Data pengeluaran berhasil diperbarui!');
    }

    public function approve(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $expense->update([
            'approval_status' => $validated['status'],
            'approved_by' => auth()->id(),
        ]);

        FinancialTransaction::create([
            'type' => 'expense',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'activity_name' => 'Expense ' . ucfirst($validated['status']) . ': ' . $expense->name,
            'user_id' => auth()->id(),
            'amount' => $expense->amount,
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Status pengeluaran berhasil diubah!');
    }

    public function destroy(Expense $expense, DeleteExpense $deleteExpense)
    {
        $deleteExpense->delete($expense);

        return redirect()->back()->with('success', 'Pengeluaran berhasil dihapus!');
    }
}
