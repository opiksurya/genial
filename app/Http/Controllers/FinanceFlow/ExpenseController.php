<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use App\Models\SubAllocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with(['income', 'project', 'creator', 'approver', 'allocation', 'subAllocation'])
            ->latest('date')
            ->get();

        $incomes = Income::select('id', 'name', 'amount')->get();
        $projects = Project::select('id', 'name')->get();

        $totalIncome = (float)Income::sum('amount');
        $totalExpense = (float)Expense::sum('amount');
        $realMoneyAvailable = max(0, $totalIncome - $totalExpense);

        // Fetch top-level allocations with sub-allocations
        $allocations = Allocation::whereNull('parent_id')
            ->with(['subAllocations'])
            ->orderBy('sort_order')
            ->get();

        // Build structured allocation categories with budget ceiling & spent tracking
        $allocationCategories = [];

        foreach ($allocations as $alloc) {
            $allocBudget = (float)(($alloc->percentage / 100) * $totalIncome);

            if ($alloc->subAllocations && $alloc->subAllocations->count() > 0) {
                foreach ($alloc->subAllocations as $sub) {
                    $subBudget = (float)(($sub->percentage / 100) * $allocBudget);

                    // Spent calculation: match by sub_allocation_id or category name
                    $spent = (float)Expense::where(function ($q) use ($sub) {
                        $q->where('sub_allocation_id', $sub->id)
                          ->orWhere(function ($sq) use ($sub) {
                              $sq->whereNull('sub_allocation_id')->where('category', $sub->name);
                          });
                    })->sum('amount');

                    $remaining = $subBudget - $spent;

                    $allocationCategories[] = [
                        'key' => 'sub:' . $sub->id,
                        'type' => 'sub',
                        'allocation_id' => $alloc->id,
                        'sub_allocation_id' => $sub->id,
                        'name' => $sub->name,
                        'parent_name' => $alloc->name,
                        'label' => $alloc->name . ' > ' . $sub->name,
                        'percentage' => (float)$sub->percentage,
                        'parent_percentage' => (float)$alloc->percentage,
                        'budget_ceiling' => $subBudget,
                        'total_spent' => $spent,
                        'remaining_budget' => $remaining,
                        'is_over_budget' => $spent > $subBudget,
                    ];
                }
            } else {
                $spent = (float)Expense::where(function ($q) use ($alloc) {
                    $q->where('allocation_id', $alloc->id)
                      ->orWhere(function ($sq) use ($alloc) {
                          $sq->whereNull('allocation_id')->where('category', $alloc->name);
                      });
                })->sum('amount');

                $remaining = $allocBudget - $spent;

                $allocationCategories[] = [
                    'key' => 'alloc:' . $alloc->id,
                    'type' => 'main',
                    'allocation_id' => $alloc->id,
                    'sub_allocation_id' => null,
                    'name' => $alloc->name,
                    'parent_name' => null,
                    'label' => $alloc->name,
                    'percentage' => (float)$alloc->percentage,
                    'parent_percentage' => (float)$alloc->percentage,
                    'budget_ceiling' => $allocBudget,
                    'total_spent' => $spent,
                    'remaining_budget' => $remaining,
                    'is_over_budget' => $spent > $allocBudget,
                ];
            }
        }

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

    public function store(Request $request)
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

        $validated['created_by'] = auth()->id();
        $validated['approval_status'] = 'approved';

        $expense = Expense::create($validated);

        FinancialTransaction::create([
            'type' => 'expense',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'activity_name' => 'Added Expense: [' . $expense->category . '] ' . $expense->name,
            'user_id' => auth()->id(),
            'amount' => $expense->amount,
            'status' => 'completed',
        ]);

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

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return redirect()->back()->with('success', 'Pengeluaran berhasil dihapus!');
    }
}
