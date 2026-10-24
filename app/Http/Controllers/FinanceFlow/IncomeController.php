<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Actions\FinanceFlow\CreateIncome;
use App\Actions\FinanceFlow\DeleteIncome;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Expense;
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

    public function store(Request $request, CreateIncome $createIncome)
    {
        $createIncome->create($request->user(), $request->all());

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
                $comm = AgentCommission::updateOrCreate(
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

                // If already paid, sync the associated expense amount as well
                if ($comm->payment_status === 'paid' && $comm->expense_id) {
                    Expense::where('id', $comm->expense_id)->update([
                        'amount' => $comm->commission_amount,
                        'description' => 'Pencairan komisi referral ' . $agent->name . ' (' . (float)$comm->commission_rate . '%) dari pemasukan ' . $income->name,
                    ]);
                    FinancialTransaction::where('reference_type', Expense::class)
                        ->where('reference_id', $comm->expense_id)
                        ->update(['amount' => $comm->commission_amount]);
                }
            }
        } else {
            // Agent removed from income: cleanup commission & its expense if any
            $existingComm = AgentCommission::where('income_id', $income->id)->first();
            if ($existingComm) {
                if ($existingComm->expense_id) {
                    FinancialTransaction::where('reference_type', Expense::class)
                        ->where('reference_id', $existingComm->expense_id)
                        ->delete();
                    Expense::where('id', $existingComm->expense_id)->delete();
                }
                $existingComm->delete();
            }
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

    public function destroy(Income $income, DeleteIncome $deleteIncome)
    {
        $deleteIncome->delete($income);

        return redirect()->back()->with('success', 'Income berhasil dihapus!');
    }
}
