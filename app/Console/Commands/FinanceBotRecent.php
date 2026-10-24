<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithFinanceBot;
use App\Models\Expense;
use App\Models\Income;
use Illuminate\Console\Command;
use InvalidArgumentException;

class FinanceBotRecent extends Command
{
    use InteractsWithFinanceBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:bot-recent {--limit=5 : Jumlah input terakhir (1-50)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Print the latest incomes and expenses (newest first) as JSON for the Telegram bot';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 50]]);
        if ($limit === false) {
            throw new InvalidArgumentException('Opsi --limit harus angka 1 sampai 50.');
        }

        $incomes = Income::with('creator:id,name')->latest()->latest('id')->take($limit)->get()
            ->map(fn (Income $income): array => [
                'id' => $income->id,
                'type' => 'income',
                'name' => $income->name,
                'amount' => (float) $income->amount,
                'date' => $income->date?->toDateString(),
                'category' => null,
                'status' => $income->status,
                'created_by' => $income->creator?->name,
                'created_at' => $income->created_at?->toIso8601String(),
            ]);

        $expenses = Expense::with('creator:id,name')->latest()->latest('id')->take($limit)->get()
            ->map(fn (Expense $expense): array => [
                'id' => $expense->id,
                'type' => 'expense',
                'name' => $expense->name,
                'amount' => (float) $expense->amount,
                'date' => $expense->date?->toDateString(),
                'category' => $expense->category,
                'status' => $expense->approval_status,
                'created_by' => $expense->creator?->name,
                'created_at' => $expense->created_at?->toIso8601String(),
            ]);

        return [
            'items' => $incomes->concat($expenses)
                ->sortByDesc('created_at')
                ->take($limit)
                ->values()
                ->all(),
        ];
    }
}
