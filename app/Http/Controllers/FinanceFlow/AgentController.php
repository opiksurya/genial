<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
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

        $commission->update([
            'payment_status' => $status,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);

        $textStatus = $status === 'paid' ? 'Lunas (Paid)' : 'Belum Lunas (Unpaid)';
        return redirect()->back()->with('success', 'Status pencairan komisi Rp ' . number_format($commission->commission_amount, 0, ',', '.') . ' diubah menjadi ' . $textStatus . '!');
    }
}
