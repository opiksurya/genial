<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\SubAllocation;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AllocationController extends Controller
{
    public function index()
    {
        $totalIncome = (float) Income::sum('amount');
        $totalExpense = (float) Expense::sum('amount');
        $realMoneyAvailable = max(0, $totalIncome - $totalExpense);

        // Basis Plafon Anggaran:
        // Plafon anggaran dihitung dari Total Pemasukan / Omzet Masuk ($totalIncome).
        // Ini memastikan plafon mencerminkan porsi riil pendapatan bisnis dan mencegah
        // paradoks sirkular di mana plafon terus menyusut saat ada pengeluaran.
        $budgetPool = $totalIncome;

        // Skenario A: Metric Pelacakan Anggaran & Subsidi Silang
        $totalRealOverBudgetNominal = 0;
        $totalRealOverBudgetCount = 0;
        $totalCrossSubsidyNominal = 0;
        $totalCrossSubsidyCount = 0;
        $totalSpentAll = 0;

        // Fetch top-level allocations with sub-allocations
        $allocations = Allocation::whereNull('parent_id')
            ->with(['subAllocations', 'children.subAllocations', 'income', 'project'])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($alloc) use ($budgetPool, &$totalRealOverBudgetNominal, &$totalRealOverBudgetCount, &$totalCrossSubsidyNominal, &$totalCrossSubsidyCount, &$totalSpentAll) {
                // calculate nominal based on percentage of total budget pool (income)
                $calculatedAmount = (float)(($alloc->percentage / 100) * $budgetPool);
                $alloc->calculated_amount = $calculatedAmount;
                
                $allocSpent = 0;

                if ($alloc->subAllocations->count() > 0) {
                    $alloc->subAllocations->transform(function ($sub) use ($calculatedAmount, &$allocSpent) {
                        $subBudget = (float)(($sub->percentage / 100) * $calculatedAmount);
                        $sub->calculated_amount = $subBudget;

                        // Calculate total expenses for this sub allocation
                        $spent = (float)Expense::where(function ($q) use ($sub) {
                            $q->where('sub_allocation_id', $sub->id)
                              ->orWhere(function ($sq) use ($sub) {
                                  $sq->whereNull('sub_allocation_id')->where('category', $sub->name);
                              });
                        })->sum('amount');

                        $isOver = $spent > $subBudget;
                        $overNominal = max(0, $spent - $subBudget);
                        $overPct = ($isOver && $subBudget > 0) 
                            ? round((($spent - $subBudget) / $subBudget) * 100, 1) 
                            : ($isOver ? 100.0 : 0.0);
                        $utilRate = $subBudget > 0 
                            ? round(($spent / $subBudget) * 100, 1) 
                            : ($spent > 0 ? 100.0 : 0.0);

                        $sub->total_spent = $spent;
                        $sub->remaining_budget = $subBudget - $spent;
                        $sub->is_over_budget = $isOver;
                        $sub->over_budget_amount = $overNominal;
                        $sub->over_budget_percentage = $overPct;
                        $sub->utilization_rate = $utilRate;

                        $allocSpent += $spent;
                        return $sub;
                    });
                } else {
                    $spent = (float)Expense::where(function ($q) use ($alloc) {
                        $q->where('allocation_id', $alloc->id)
                          ->orWhere(function ($sq) use ($alloc) {
                              $sq->whereNull('allocation_id')->where('category', $alloc->name);
                          });
                    })->sum('amount');

                    $allocSpent = $spent;
                }

                $totalSpentAll += $allocSpent;

                $allocIsOver = $allocSpent > $calculatedAmount;
                $allocOverNominal = max(0, $allocSpent - $calculatedAmount);
                $allocOverPct = ($allocIsOver && $calculatedAmount > 0) 
                    ? round((($allocSpent - $calculatedAmount) / $calculatedAmount) * 100, 1) 
                    : ($allocIsOver ? 100.0 : 0.0);
                $allocUtilRate = $calculatedAmount > 0 
                    ? round(($allocSpent / $calculatedAmount) * 100, 1) 
                    : ($allocSpent > 0 ? 100.0 : 0.0);

                $alloc->total_spent = $allocSpent;
                $alloc->remaining_budget = $calculatedAmount - $allocSpent;
                $alloc->is_over_budget = $allocIsOver;
                $alloc->over_budget_amount = $allocOverNominal;
                $alloc->over_budget_percentage = $allocOverPct;
                $alloc->utilization_rate = $allocUtilRate;

                if ($allocIsOver) {
                    $totalRealOverBudgetNominal += $allocOverNominal;
                    $totalRealOverBudgetCount++;
                }

                // Skenario A: Tandai apakah kelebihan sub-pos tertutup aman oleh subsidi silang
                if ($alloc->subAllocations->count() > 0) {
                    $alloc->subAllocations->transform(function ($sub) use ($alloc, $allocIsOver, &$totalCrossSubsidyNominal, &$totalCrossSubsidyCount) {
                        if ($sub->is_over_budget) {
                            if (!$allocIsOver) {
                                // Sub-pos over, tapi kuota induk masih sisa -> AMAN TERTUTUP SUBSIDI SILANG
                                $sub->is_covered_by_subsidy = true;
                                $sub->covered_by_allocation_name = $alloc->name;
                                $sub->deficit_type = 'cross_subsidy';
                                $totalCrossSubsidyNominal += $sub->over_budget_amount;
                                $totalCrossSubsidyCount++;
                            } else {
                                // Pos induknya pun jebol -> DEFISIT RIIL
                                $sub->is_covered_by_subsidy = false;
                                $sub->deficit_type = 'real_deficit';
                            }
                        } else {
                            $sub->is_covered_by_subsidy = false;
                            $sub->deficit_type = 'safe';
                        }
                        return $sub;
                    });
                }

                return $alloc;
            });

        $totalPercentage = $allocations->sum('percentage');
        $isPercentage100 = abs($totalPercentage - 100.0) < 0.01;

        $incomes = Income::select('id', 'name', 'amount')->get();
        $projects = Project::select('id', 'name', 'client')->get();

        return Inertia::render('finance/allocation', [
            'allocations' => $allocations,
            'totalIncome' => (float)$totalIncome,
            'totalExpense' => (float)$totalExpense,
            'realMoneyAvailable' => (float)$realMoneyAvailable,
            'totalPercentage' => (float)$totalPercentage,
            'isPercentage100' => $isPercentage100,
            'totalOverBudgetNominal' => (float)$totalRealOverBudgetNominal,
            'totalOverBudgetCount' => $totalRealOverBudgetCount,
            'totalCrossSubsidyCount' => $totalCrossSubsidyCount,
            'totalCrossSubsidyNominal' => (float)$totalCrossSubsidyNominal,
            'totalSpentAll' => (float)$totalSpentAll,
            'incomes' => $incomes,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
            'income_id' => 'nullable|exists:incomes,id',
            'project_id' => 'nullable|exists:projects,id',
            'parent_id' => 'nullable|exists:allocations,id',
        ]);

        $validated['created_by'] = auth()->id();

        // Calculate amount from total Income (Budget Pool)
        $totalIncome = (float) Income::sum('amount');
        $validated['amount'] = ($validated['percentage'] / 100) * $totalIncome;

        $allocation = Allocation::create($validated);

        FinancialTransaction::create([
            'type' => 'allocation',
            'reference_type' => Allocation::class,
            'reference_id' => $allocation->id,
            'activity_name' => 'Created Allocation: ' . $allocation->name . ' (' . $allocation->percentage . '%)',
            'user_id' => auth()->id(),
            'amount' => $allocation->amount,
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', 'Pembagian dana berhasil ditambahkan!');
    }

    public function update(Request $request, Allocation $allocation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        $totalIncome = (float) Income::sum('amount');
        $validated['amount'] = ($validated['percentage'] / 100) * $totalIncome;

        $allocation->update($validated);

        return redirect()->back()->with('success', 'Pembagian dana berhasil diperbarui!');
    }

    public function storeSub(Request $request, Allocation $allocation)
    {
        $validated = $request->validate([
            'sub_allocations' => 'required|array',
            'sub_allocations.*.id' => 'nullable|integer',
            'sub_allocations.*.name' => 'required|string|max:255',
            'sub_allocations.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        // Calculate parent nominal based on total Income
        $totalIncome = (float) Income::sum('amount');
        $parentAmount = ($allocation->percentage / 100) * $totalIncome;

        // Delete removed ones
        $existingIds = collect($validated['sub_allocations'])->pluck('id')->filter();
        SubAllocation::where('allocation_id', $allocation->id)
            ->whereNotIn('id', $existingIds)
            ->delete();

        foreach ($validated['sub_allocations'] as $index => $sub) {
            $subAmount = ($sub['percentage'] / 100) * $parentAmount;
            
            if (!empty($sub['id'])) {
                SubAllocation::where('id', $sub['id'])->update([
                    'name' => $sub['name'],
                    'percentage' => $sub['percentage'],
                    'amount' => $subAmount,
                    'sort_order' => $index,
                ]);
            } else {
                SubAllocation::create([
                    'allocation_id' => $allocation->id,
                    'name' => $sub['name'],
                    'percentage' => $sub['percentage'],
                    'amount' => $subAmount,
                    'sort_order' => $index,
                ]);
            }
        }

        FinancialTransaction::create([
            'type' => 'allocation',
            'reference_type' => Allocation::class,
            'reference_id' => $allocation->id,
            'activity_name' => 'Updated Sub Allocation for ' . $allocation->name,
            'user_id' => auth()->id(),
            'amount' => $parentAmount,
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', 'Sub-alokasi berhasil disimpan!');
    }

    public function destroy(Allocation $allocation)
    {
        $allocation->delete();
        return redirect()->back()->with('success', 'Alokasi berhasil dihapus!');
    }
}
