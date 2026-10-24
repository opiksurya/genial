<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithFinanceBot;
use App\Models\Expense;
use App\Models\Income;
use App\Services\FinanceFlow\AllocationUsage;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use InvalidArgumentException;

class FinanceBotSummary extends Command
{
    use InteractsWithFinanceBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:bot-summary {--month= : Bulan YYYY-MM; tanpa opsi ini dihitung semua waktu}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Print income, expense, balance and allocation usage as JSON for the Telegram bot';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        [$from, $to] = $this->period($this->option('month'));

        $incomeQuery = Income::query();
        $expenseQuery = Expense::query();
        if ($from !== null) {
            $incomeQuery->whereBetween('date', [$from->toDateString(), $to->toDateString()]);
            $expenseQuery->whereBetween('date', [$from->toDateString(), $to->toDateString()]);
        }

        $totalIncome = (float) $incomeQuery->sum('amount');
        $totalExpense = (float) $expenseQuery->sum('amount');

        return [
            'period' => $from?->format('Y-m') ?? 'all',
            'from' => $from?->toDateString(),
            'to' => $to?->toDateString(),
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'balance' => (float) max(0, $totalIncome - $totalExpense),
            'allocations' => collect(app(AllocationUsage::class)->categories($from, $to))
                ->map(fn (array $category): array => [
                    'label' => $category['label'],
                    'allocation_id' => $category['allocation_id'],
                    'sub_allocation_id' => $category['sub_allocation_id'],
                    'percentage' => $category['percentage'],
                    'budget_ceiling' => $category['budget_ceiling'],
                    'total_spent' => $category['total_spent'],
                    'remaining_budget' => $category['remaining_budget'],
                    'is_over_budget' => $category['is_over_budget'],
                ])->all(),
        ];
    }

    /**
     * @return array{0: CarbonImmutable|null, 1: CarbonImmutable|null}
     */
    private function period(?string $month): array
    {
        if (blank($month)) {
            return [null, null];
        }

        if (! preg_match('/^(\d{4})-(\d{2})$/', $month, $matches) || ! checkdate((int) $matches[2], 1, (int) $matches[1])) {
            throw new InvalidArgumentException('Format --month harus YYYY-MM, contoh 2026-10.');
        }

        $start = CarbonImmutable::create((int) $matches[1], (int) $matches[2], 1)->startOfDay();

        return [$start, $start->endOfMonth()];
    }
}
