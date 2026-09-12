<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with(['income', 'project', 'creator', 'approver'])
            ->latest('date')
            ->get();

        $incomes = Income::select('id', 'name', 'amount')->get();
        $projects = Project::select('id', 'name')->get();

        $categorySummary = Expense::groupBy('category')
            ->selectRaw('category, sum(amount) as total')
            ->pluck('total', 'category');

        $totalExpense = Expense::sum('amount');
        $approvedExpense = Expense::where('approval_status', 'approved')->sum('amount');
        $pendingExpense = Expense::where('approval_status', 'pending')->sum('amount');

        return Inertia::render('finance/expense', [
            'expenses' => $expenses,
            'incomes' => $incomes,
            'projects' => $projects,
            'categorySummary' => $categorySummary,
            'stats' => [
                'totalExpense' => (float)$totalExpense,
                'approvedExpense' => (float)$approvedExpense,
                'pendingExpense' => (float)$pendingExpense,
            ],
            'categories' => [
                'Operational',
                'Ads Budget',
                'Software Subscription',
                'Salary',
                'Freelancer',
                'Tools',
                'Tax',
                'Other'
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:Operational,Ads Budget,Software Subscription,Salary,Freelancer,Tools,Tax,Other',
            'income_id' => 'nullable|exists:incomes,id',
            'project_id' => 'nullable|exists:projects,id',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'proof_attachment' => 'nullable|string|max:255',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['approval_status'] = 'approved';

        $expense = Expense::create($validated);

        FinancialTransaction::create([
            'type' => 'expense',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'activity_name' => 'Added Expense: [' . $expense->category . '] ' . $expense->name,
            'user_id' => auth()->id(),
            'amount' => $expense->amount,
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', 'Pengeluaran berhasil dicatat!');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:Operational,Ads Budget,Software Subscription,Salary,Freelancer,Tools,Tax,Other',
            'income_id' => 'nullable|exists:incomes,id',
            'project_id' => 'nullable|exists:projects,id',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Data pengeluaran berhasil diperbarui!');
    }

    public function approve(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $expense->update([
            'approval_status' => $validated['status'],
            'approved_by' => auth()->id(),
        ]);

        FinancialTransaction::create([
            'type' => 'expense',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'activity_name' => 'Expense ' . ucfirst($validated['status']) . ': ' . $expense->name,
            'user_id' => auth()->id(),
            'amount' => $expense->amount,
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Status pengeluaran berhasil diubah!');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return redirect()->back()->with('success', 'Pengeluaran berhasil dihapus!');
    }
}
