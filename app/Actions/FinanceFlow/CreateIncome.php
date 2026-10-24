<?php

namespace App\Actions\FinanceFlow;

use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CreateIncome
{
    /**
     * Validate and store a new income, syncing the agent commission and the transaction log.
     *
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function create(User $user, array $input): Income
    {
        $validated = Validator::make($input, [
            'name' => 'required|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'agent_id' => 'nullable|exists:agents,id',
            'client_name' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'status' => 'required|in:pending,paid,partial',
            'invoice_number' => 'nullable|string|max:255',
            'attachment' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ])->validate();

        $validated['created_by'] = $user->id;

        if (empty($validated['client_name']) && ! empty($validated['project_id'])) {
            $project = Project::find($validated['project_id']);
            if ($project) {
                $validated['client_name'] = $project->client;
            }
        }

        return DB::transaction(function () use ($validated, $user): Income {
            $income = Income::create($validated);

            if (! empty($income->agent_id)) {
                $agent = Agent::find($income->agent_id);
                if ($agent) {
                    $rate = $agent->commission_rate ?? 5.00;
                    AgentCommission::updateOrCreate(
                        ['income_id' => $income->id],
                        [
                            'agent_id' => $agent->id,
                            'project_id' => $income->project_id,
                            'client_name' => $income->client_name ?? ($income->project ? $income->project->client : 'Client'),
                            'income_amount' => $income->amount,
                            'commission_rate' => $rate,
                            'commission_amount' => ($income->amount * $rate) / 100,
                            'payment_status' => 'unpaid',
                        ]
                    );
                }
            }

            FinancialTransaction::create([
                'type' => 'income',
                'reference_type' => Income::class,
                'reference_id' => $income->id,
                'activity_name' => 'Added Income: '.$income->name,
                'user_id' => $user->id,
                'amount' => $income->amount,
                'status' => 'completed',
            ]);

            return $income;
        });
    }
}
