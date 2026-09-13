<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentPortalController extends Controller
{
    public function index(string $access_token): Response
    {
        $agent = Agent::where('access_token', $access_token)->firstOrFail();

        $commissions = AgentCommission::with(['income', 'project'])
            ->where('agent_id', $agent->id)
            ->latest()
            ->get();

        $clients = Income::where('agent_id', $agent->id)
            ->whereNotNull('client_name')
            ->select('client_name')
            ->selectRaw('COUNT(id) as total_invoices, SUM(amount) as total_paid_amount')
            ->groupBy('client_name')
            ->get();

        $projects = Project::where('agent_id', $agent->id)
            ->select('id', 'name', 'client', 'category', 'status', 'start_date', 'end_date')
            ->get();

        $totalClientIncome = (float) $commissions->sum('income_amount');
        $totalCommission = (float) $commissions->sum('commission_amount');
        $paidCommission = (float) $commissions->where('payment_status', 'paid')->sum('commission_amount');
        $unpaidCommission = (float) $commissions->where('payment_status', 'unpaid')->sum('commission_amount');

        return Inertia::render('agent/portal', [
            'agent' => $agent,
            'commissions' => $commissions,
            'clients' => $clients,
            'projects' => $projects,
            'stats' => [
                'total_client_income' => $totalClientIncome,
                'total_commission' => $totalCommission,
                'paid_commission' => $paidCommission,
                'unpaid_commission' => $unpaidCommission,
            ],
        ]);
    }
}
