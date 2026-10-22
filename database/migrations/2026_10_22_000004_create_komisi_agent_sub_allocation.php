<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Allocation;
use App\Models\SubAllocation;
use App\Models\Expense;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $opex = Allocation::whereNull('parent_id')
            ->where(function ($q) {
                $q->where('name', 'like', '%OPEX%')
                  ->orWhere('name', 'like', '%Operasional%');
            })
            ->first();

        if (!$opex) {
            // Fallback to 75% allocation or first allocation
            $opex = Allocation::whereNull('parent_id')->where('percentage', 75)->first()
                ?? Allocation::whereNull('parent_id')->first();
        }

        if ($opex) {
            $existing = SubAllocation::where('allocation_id', $opex->id)
                ->where(function ($q) {
                    $q->where('name', 'like', '%Komisi Agent%')
                      ->orWhere('name', 'like', '%Agent%');
                })
                ->first();

            if (!$existing) {
                $subs = SubAllocation::where('allocation_id', $opex->id)->get();
                $totalSubPct = $subs->sum('percentage');

                if ($totalSubPct + 7.00 > 100.0) {
                    $excessToTrim = ($totalSubPct + 7.00) - 100.0;
                    // Deduct from the largest sub-allocation
                    $largest = SubAllocation::where('allocation_id', $opex->id)
                        ->orderByDesc('percentage')
                        ->first();
                    if ($largest && $largest->percentage > $excessToTrim) {
                        $largest->percentage = round($largest->percentage - $excessToTrim, 2);
                        $largest->save();
                    }
                }

                $existing = SubAllocation::create([
                    'allocation_id' => $opex->id,
                    'name' => 'Komisi Agent',
                    'percentage' => 7.00,
                    'sort_order' => $subs->count() + 1,
                ]);
            }

            // Immediately link all agent commission and freelancer expenses to this sub-allocation
            Expense::where(function ($q) {
                $q->where('name', 'like', 'Komisi Agent%')
                  ->orWhere('category', 'Freelancer')
                  ->orWhere('category', 'like', '%Agent%');
            })->update([
                'allocation_id' => $opex->id,
                'sub_allocation_id' => $existing->id,
                'category' => 'Komisi Agent',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $sub = SubAllocation::where('name', 'Komisi Agent')->first();
        if ($sub) {
            $sub->delete();
        }
    }
};
