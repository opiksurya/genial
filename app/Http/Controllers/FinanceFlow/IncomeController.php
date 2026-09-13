<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncomeController extends Controller
{
    public function index()
    {
        $incomes = Income::with(['project', 'expenses', 'creator', 'agent'])
            ->latest('date')
            ->get()
            ->map(function ($inc) {
                $totalExp = $inc->expenses->sum('amount');
                $inc->total_expenses = (float)$totalExp;
                $inc->real_money = (float)max(0, $inc->amount - $totalExp);
                return $inc;
            });

        $projects = Project::select('id', 'name', 'client')->get();
        $agents = Agent::where('status', 'active')->select('id', 'name', 'commission_rate')->get();

        $totalIncome = Income::sum('amount');
        $totalPaid = Income::where('status', 'paid')->sum('amount');
        $totalPending = Income::where('status', 'pending')->sum('amount');

        return Inertia::render('finance/income', [
            'incomes' => $incomes,
            'projects' => $projects,
            'agents' => $agents,
            'stats' => [
                'totalIncome' => (float)$totalIncome,
                'totalPaid' => (float)$totalPaid,
                'totalPending' => (float)$totalPending,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
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
        ]);

        $validated['created_by'] = auth()->id();

        if (empty($validated['client_name']) && !empty($validated['project_id'])) {
            $project = Project::find($validated['project_id']);
            if ($project) {
                $validated['client_name'] = $project->client;
            }
        }

        $income = Income::create($validated);

        // Sync Agent Commission if Agent is attached
        if (!empty($income->agent_id)) {
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
            'activity_name' => 'Added Income: ' . $income->name,
            'user_id' => auth()->id(),
            'amount' => $income->amount,
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', 'Uang masuk berhasil ditambahkan!');
    }

    public function update(Request $request, Income $income)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'agent_id' => 'nullable|exists:agents,id',
            'client_name' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'status' => 'required|in:pending,paid,partial',
            'invoice_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $income->update($validated);

        // Sync Agent Commission
        if (!empty($income->agent_id)) {
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
                    ]
                );
            }
        } else {
            AgentCommission::where('income_id', $income->id)->delete();
        }

        FinancialTransaction::create([
            'type' => 'income',
            'reference_type' => Income::class,
            'reference_id' => $income->id,
            'activity_name' => 'Updated Income: ' . $income->name,
            'user_id' => auth()->id(),
            'amount' => $income->amount,
            'status' => 'updated',
        ]);

        return redirect()->back()->with('success', 'Data income berhasil diperbarui!');
    }

    public function destroy(Income $income)
    {
        AgentCommission::where('income_id', $income->id)->delete();
        $income->delete();
        return redirect()->back()->with('success', 'Income berhasil dihapus!');
    }
}

