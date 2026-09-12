<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncomeController extends Controller
{
    public function index()
    {
        $incomes = Income::with(['project', 'expenses', 'creator'])
            ->latest('date')
            ->get()
            ->map(function ($inc) {
                $totalExp = $inc->expenses->sum('amount');
                $inc->total_expenses = (float)$totalExp;
                $inc->real_money = (float)max(0, $inc->amount - $totalExp);
                return $inc;
            });

        $projects = Project::select('id', 'name', 'client')->get();

        $totalIncome = Income::sum('amount');
        $totalPaid = Income::where('status', 'paid')->sum('amount');
        $totalPending = Income::where('status', 'pending')->sum('amount');

        return Inertia::render('finance/income', [
            'incomes' => $incomes,
            'projects' => $projects,
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
            'client_name' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'status' => 'required|in:pending,paid,partial',
            'invoice_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $income->update($validated);

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
        $income->delete();
        return redirect()->back()->with('success', 'Income berhasil dihapus!');
    }
}
