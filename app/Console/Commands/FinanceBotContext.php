<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithFinanceBot;
use App\Models\Agent;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\Project;
use App\Models\SubAllocation;
use Illuminate\Console\Command;

class FinanceBotContext extends Command
{
    use InteractsWithFinanceBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:bot-context';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Print the FinanceFlow choices (allocations, projects, agents, categories) as JSON for the Telegram bot';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $allocations = Allocation::with('parent:id,name')->orderBy('sort_order')->orderBy('id')->get();

        return [
            'allocations' => $allocations->map(fn (Allocation $allocation): array => [
                'id' => $allocation->id,
                'name' => $allocation->name,
                'parent_id' => $allocation->parent_id,
                'parent' => $allocation->parent?->name,
            ])->values()->all(),
            'sub_allocations' => SubAllocation::orderBy('allocation_id')->orderBy('sort_order')->get(['id', 'name', 'allocation_id'])
                ->map(fn (SubAllocation $sub): array => [
                    'id' => $sub->id,
                    'name' => $sub->name,
                    'allocation_id' => $sub->allocation_id,
                ])->all(),
            'projects' => Project::orderBy('name')->get(['id', 'name', 'client'])
                ->map(fn (Project $project): array => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'client' => $project->client,
                ])->all(),
            'agents' => Agent::where('status', 'active')->orderBy('name')->get(['id', 'name'])
                ->map(fn (Agent $agent): array => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                ])->all(),
            'expense_categories' => Expense::query()->distinct()->orderBy('category')->pluck('category')->filter()->values()->all(),
            'income_statuses' => ['pending', 'paid', 'partial'],
            'income_default_status' => 'paid',
        ];
    }
}
