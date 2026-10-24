<?php

namespace App\Console\Commands;

use App\Actions\FinanceFlow\DeleteExpense;
use App\Actions\FinanceFlow\DeleteIncome;
use App\Concerns\InteractsWithFinanceBot;
use App\Models\Expense;
use App\Models\Income;
use Illuminate\Console\Command;
use InvalidArgumentException;

class FinanceBotDelete extends Command
{
    use InteractsWithFinanceBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:bot-delete
        {type : income atau expense}
        {id : ID data yang dihapus}
        {--user= : Email user pelaku (harus Super Admin)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete an income or expense on behalf of a Super Admin from the Telegram bot';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $type = $this->argument('type');
        if (! in_array($type, ['income', 'expense'], true)) {
            throw new InvalidArgumentException('Tipe harus income atau expense.');
        }

        $this->authorizedUser($this->option('user'), ['Super Admin']);

        $id = filter_var($this->argument('id'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $record = $id === false ? null : ($type === 'income' ? Income::find($id) : Expense::find($id));

        if ($record === null) {
            throw new InvalidArgumentException("Data {$type} dengan ID {$this->argument('id')} tidak ditemukan.");
        }

        $deleted = [
            'id' => $record->id,
            'name' => $record->name,
            'amount' => (float) $record->amount,
            'date' => $record->date?->toDateString(),
        ];

        if ($record instanceof Income) {
            app(DeleteIncome::class)->delete($record);
        } else {
            app(DeleteExpense::class)->delete($record);
        }

        return ['deleted' => true, 'type' => $type, 'record' => $deleted];
    }
}
