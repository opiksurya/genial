<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(): Response
    {
        $agents = Agent::with(['commissions.income', 'commissions.project'])
            ->latest()
            ->get()
            ->map(function ($agent) {
                $agent->total_income = (float) $agent->commissions->sum('income_amount');
                $agent->total_commission = (float) $agent->commissions->sum('commission_amount');
                $agent->paid_commission = (float) $agent->commissions->where('payment_status', 'paid')->sum('commission_amount');
                $agent->unpaid_commission = (float) $agent->commissions->where('payment_status', 'unpaid')->sum('commission_amount');
                return $agent;
            });

        $commissions = AgentCommission::with(['agent', 'income', 'project'])
            ->latest()
            ->get();

        $stats = [
            'total_agents' => $agents->count(),
            'total_commission' => (float) AgentCommission::sum('commission_amount'),
            'paid_commission' => (float) AgentCommission::where('payment_status', 'paid')->sum('commission_amount'),
            'unpaid_commission' => (float) AgentCommission::where('payment_status', 'unpaid')->sum('commission_amount'),
        ];

        return Inertia::render('finance/agents', [
            'agents' => $agents,
            'commissions' => $commissions,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['access_token'] = Str::random(40);
        $agent = Agent::create($validated);

        return redirect()->back()->with('success', 'Agent baru "' . $agent->name . '" berhasil ditambahkan dengan komisi ' . $agent->commission_rate . '%!');
    }

    public function update(Request $request, Agent $agent)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        $agent->update($validated);

        return redirect()->back()->with('success', 'Data Agent "' . $agent->name . '" berhasil diperbarui!');
    }

    public function destroy(Agent $agent)
    {
        $name = $agent->name;
        // Clean up expenses from paid commissions
        foreach ($agent->commissions as $comm) {
            if ($comm->expense_id) {
                FinancialTransaction::where('reference_type', Expense::class)
                    ->where('reference_id', $comm->expense_id)
                    ->delete();
                Expense::where('id', $comm->expense_id)->delete();
            }
        }
        $agent->delete();

        return redirect()->back()->with('success', 'Agent "' . $name . '" berhasil dihapus.');
    }

    public function regenerateToken(Agent $agent)
    {
        $agent->update([
            'access_token' => Str::random(40),
        ]);

        return redirect()->back()->with('success', 'Secret Access Token untuk Agent "' . $agent->name . '" berhasil dibuat ulang!');
    }

    public function payCommission(Request $request, AgentCommission $commission)
    {
        $status = $request->input('status', 'paid');
        $commission->load(['agent', 'income', 'project']);

        if ($status === 'paid') {
            $agentName = $commission->agent ? $commission->agent->name : 'Agent';
            $projectName = $commission->project ? $commission->project->name : ($commission->income ? $commission->income->name : 'Project');
            $date = now()->toDateString();

            // Find matching sub-allocation for agent commission
            $subAlloc = \App\Models\SubAllocation::where('name', 'like', '%Komisi Agent%')
                ->orWhere('name', 'like', '%Agent%')
                ->orWhere('name', 'Freelancer')
                ->first();

            // Create or update Expense linked directly to this income
            $expense = Expense::updateOrCreate(
                ['id' => $commission->expense_id],
                [
                    'income_id' => $commission->income_id,
                    'project_id' => $commission->project_id,
                    'allocation_id' => $subAlloc ? $subAlloc->allocation_id : null,
                    'sub_allocation_id' => $subAlloc ? $subAlloc->id : null,
                    'category' => $subAlloc ? $subAlloc->name : 'Freelancer',
                    'name' => 'Komisi Agent: ' . $agentName,
                    'description' => 'Pencairan komisi referral ' . $agentName . ' (' . (float)$commission->commission_rate . '%) dari pemasukan ' . ($commission->income->name ?? $projectName),
                    'amount' => $commission->commission_amount,
                    'date' => $date,
                    'approval_status' => 'approved',
                    'approved_by' => auth()->id(),
                    'created_by' => auth()->id(),
                ]
            );

            // Record Financial Transaction
            FinancialTransaction::updateOrCreate(
                [
                    'reference_type' => Expense::class,
                    'reference_id' => $expense->id,
                ],
                [
                    'type' => 'expense',
                    'activity_name' => 'Pencairan Komisi Agent: ' . $agentName,
                    'user_id' => auth()->id(),
                    'amount' => $expense->amount,
                    'status' => 'completed',
                ]
            );

            $commission->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'expense_id' => $expense->id,
            ]);

            $msg = 'Status komisi Rp ' . number_format($commission->commission_amount, 0, ',', '.') . ' diubah menjadi Lunas (Paid) dan otomatis tercatat di Pengeluaran (Expense)!';
        } else {
            // Revert / Batalkan Paid: delete associated Expense & FinancialTransaction
            if ($commission->expense_id) {
                FinancialTransaction::where('reference_type', Expense::class)
                    ->where('reference_id', $commission->expense_id)
                    ->delete();
                Expense::where('id', $commission->expense_id)->delete();
            }

            $commission->update([
                'payment_status' => 'unpaid',
                'paid_at' => null,
                'expense_id' => null,
            ]);

            $msg = 'Status komisi diubah menjadi Belum Cair (Unpaid) dan catatan pengeluaran terkait telah dihapus.';
        }

        return redirect()->back()->with('success', $msg);
    }
}
