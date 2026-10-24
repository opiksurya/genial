<?php

namespace App\Services\FinanceFlow;

use App\Models\Allocation;
use App\Models\Expense;
use App\Models\Income;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

class AllocationUsage
{
    /**
     * Budget ceiling, spending and remaining budget per allocation category.
     *
     * Allocations with sub-allocations are reported per sub-allocation; the others as a whole.
     * Without a period, all incomes and expenses are counted.
     *
     * @return list<array{key: string, type: string, allocation_id: int, sub_allocation_id: int|null, name: string, parent_name: string|null, label: string, percentage: float, parent_percentage: float, budget_ceiling: float, total_spent: float, remaining_budget: float, is_over_budget: bool}>
     */
    public function categories(?CarbonInterface $from = null, ?CarbonInterface $to = null): array
    {
        $totalIncome = (float) $this->withinPeriod(Income::query(), $from, $to)->sum('amount');

        $allocations = Allocation::whereNull('parent_id')
            ->with(['subAllocations'])
            ->orderBy('sort_order')
            ->get();

        $allocationCategories = [];

        foreach ($allocations as $alloc) {
            $allocBudget = (float) (($alloc->percentage / 100) * $totalIncome);

            if ($alloc->subAllocations && $alloc->subAllocations->count() > 0) {
                foreach ($alloc->subAllocations as $sub) {
                    $subBudget = (float) (($sub->percentage / 100) * $allocBudget);

                    // Spent calculation: match by sub_allocation_id or category name
                    $spent = (float) $this->withinPeriod(Expense::query(), $from, $to)->where(function ($q) use ($sub) {
                        $q->where('sub_allocation_id', $sub->id)
                            ->orWhere(function ($sq) use ($sub) {
                                $sq->whereNull('sub_allocation_id')->where(function ($inner) use ($sub) {
                                    $inner->where('category', $sub->name);
                                    if (stripos($sub->name, 'agent') !== false || stripos($sub->name, 'komisi') !== false) {
                                        $inner->orWhere('category', 'Freelancer')
                                            ->orWhere('name', 'like', 'Komisi Agent%');
                                    }
                                });
                            });
                    })->sum('amount');

                    $allocationCategories[] = [
                        'key' => 'sub:'.$sub->id,
                        'type' => 'sub',
                        'allocation_id' => $alloc->id,
                        'sub_allocation_id' => $sub->id,
                        'name' => $sub->name,
                        'parent_name' => $alloc->name,
                        'label' => $alloc->name.' > '.$sub->name,
                        'percentage' => (float) $sub->percentage,
                        'parent_percentage' => (float) $alloc->percentage,
                        'budget_ceiling' => $subBudget,
                        'total_spent' => $spent,
                        'remaining_budget' => $subBudget - $spent,
                        'is_over_budget' => $spent > $subBudget,
                    ];
                }
            } else {
                $spent = (float) $this->withinPeriod(Expense::query(), $from, $to)->where(function ($q) use ($alloc) {
                    $q->where('allocation_id', $alloc->id)
                        ->orWhere(function ($sq) use ($alloc) {
                            $sq->whereNull('allocation_id')->where('category', $alloc->name);
                        });
                })->sum('amount');

                $allocationCategories[] = [
                    'key' => 'alloc:'.$alloc->id,
                    'type' => 'main',
                    'allocation_id' => $alloc->id,
                    'sub_allocation_id' => null,
                    'name' => $alloc->name,
                    'parent_name' => null,
                    'label' => $alloc->name,
                    'percentage' => (float) $alloc->percentage,
                    'parent_percentage' => (float) $alloc->percentage,
                    'budget_ceiling' => $allocBudget,
                    'total_spent' => $spent,
                    'remaining_budget' => $allocBudget - $spent,
                    'is_over_budget' => $spent > $allocBudget,
                ];
            }
        }

        return $allocationCategories;
    }

    /**
     * Limit a query on a dated finance record to the given period.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function withinPeriod(Builder $query, ?CarbonInterface $from, ?CarbonInterface $to): Builder
    {
        return $query
            ->when($from, fn (Builder $q) => $q->whereDate('date', '>=', $from->toDateString()))
            ->when($to, fn (Builder $q) => $q->whereDate('date', '<=', $to->toDateString()));
    }
}
