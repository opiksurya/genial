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
        $totalIncome = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $realMoneyAvailable = max(0, $totalIncome - $totalExpense);

        // Fetch top-level allocations with sub-allocations
        $allocations = Allocation::whereNull('parent_id')
            ->with(['subAllocations', 'children.subAllocations', 'income', 'project'])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($alloc) use ($realMoneyAvailable) {
                // calculate nominal based on percentage if amount not fixed
                $calculatedAmount = ($alloc->percentage / 100) * $realMoneyAvailable;
                $alloc->calculated_amount = (float)$calculatedAmount;
                
                if ($alloc->subAllocations->count() > 0) {
                    $alloc->subAllocations->map(function ($sub) use ($calculatedAmount) {
                        $sub->calculated_amount = (float)(($sub->percentage / 100) * $calculatedAmount);
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
            'realMoneyAvailable' => (float)$realMoneyAvailable,
            'totalPercentage' => (float)$totalPercentage,
            'isPercentage100' => $isPercentage100,
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

        // Calculate amount from global Real Money
        $totalIncome = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $realMoney = max(0, $totalIncome - $totalExpense);
        $validated['amount'] = ($validated['percentage'] / 100) * $realMoney;

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

        $totalIncome = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $realMoney = max(0, $totalIncome - $totalExpense);
        $validated['amount'] = ($validated['percentage'] / 100) * $realMoney;

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

        // Calculate parent nominal
        $totalIncome = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $realMoney = max(0, $totalIncome - $totalExpense);
        $parentAmount = ($allocation->percentage / 100) * $realMoney;

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
