<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancialReportController extends Controller
{
    public function index(Request $request)
    {
        $activeTab = $request->query('tab', 'monthly');

        // 1. Monthly Report
        $monthlyReport = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $inc = Income::whereYear('date', $date->year)->whereMonth('date', $date->month)->sum('amount');
            $exp = Expense::whereYear('date', $date->year)->whereMonth('date', $date->month)->sum('amount');
            $monthlyReport[] = [
                'month' => $date->format('F Y'),
                'year' => $date->year,
                'month_num' => $date->month,
                'revenue' => (float)$inc,
                'expense' => (float)$exp,
                'net_profit' => (float)max(0, $inc - $exp),
            ];
        }

        // 2. Project Profit Report
        $projectProfitReport = Project::with(['incomes', 'expenses'])
            ->get()
            ->map(function ($project) {
                $rev = $project->incomes ? $project->incomes->sum('amount') : 0;
                $exp = $project->expenses ? $project->expenses->sum('amount') : 0;
                $profit = max(0, $rev - $exp);
                $margin = $rev > 0 ? round(($profit / $rev) * 100, 1) : 0;

                return [
                    'id' => $project->id,
                    'project_name' => $project->name,
                    'client' => $project->client,
                    'category' => $project->category,
                    'status' => $project->status,
                    'revenue' => (float)$rev,
                    'expense' => (float)$exp,
                    'profit' => (float)$profit,
                    'margin' => $margin,
                ];
            });

        // 3. Client Profitability Report
        $clientProfitability = Income::with('expenses')
            ->selectRaw('client_name, sum(amount) as total_revenue')
            ->whereNotNull('client_name')
            ->groupBy('client_name')
            ->get()
            ->map(function ($item) {
                $clientIncomes = Income::where('client_name', $item->client_name)->pluck('id');
                $clientExpenses = Expense::whereIn('income_id', $clientIncomes)->sum('amount');
                $profit = max(0, $item->total_revenue - $clientExpenses);
                $margin = $item->total_revenue > 0 ? round(($profit / $item->total_revenue) * 100, 1) : 0;

                return [
                    'client_name' => $item->client_name,
                    'total_revenue' => (float)$item->total_revenue,
                    'total_expense' => (float)$clientExpenses,
                    'net_profit' => (float)$profit,
                    'margin' => $margin,
                ];
            });

        // 4. Expense Analysis
        $expenseAnalysis = Expense::groupBy('category')
            ->selectRaw('category, count(*) as count, sum(amount) as total_amount')
            ->get()
            ->map(function ($exp) {
                return [
                    'category' => $exp->category,
                    'count' => $exp->count,
                    'total_amount' => (float)$exp->total_amount,
                ];
            });

        // 5. Allocation Report
        $totalIncome = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $realMoney = max(0, $totalIncome - $totalExpense);

        $allocationReport = Allocation::whereNull('parent_id')
            ->with('subAllocations')
            ->get()
            ->map(function ($alloc) use ($realMoney) {
                $amount = ($alloc->percentage / 100) * $realMoney;
                return [
                    'id' => $alloc->id,
                    'name' => $alloc->name,
                    'percentage' => (float)$alloc->percentage,
                    'amount' => (float)$amount,
                    'sub_allocations' => $alloc->subAllocations->map(function ($sub) use ($amount) {
                        return [
                            'name' => $sub->name,
                            'percentage' => (float)$sub->percentage,
                            'amount' => (float)(($sub->percentage / 100) * $amount),
                        ];
                    }),
                ];
            });

        return Inertia::render('finance/reports', [
            'activeTab' => $activeTab,
            'monthlyReport' => $monthlyReport,
            'projectProfitReport' => $projectProfitReport,
            'clientProfitability' => $clientProfitability,
            'expenseAnalysis' => $expenseAnalysis,
            'allocationReport' => $allocationReport,
            'summary' => [
                'totalRevenue' => (float)$totalIncome,
                'totalExpense' => (float)$totalExpense,
                'realMoney' => (float)$realMoney,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->query('type', 'monthly');
        $format = $request->query('format', 'csv');

        $fileName = 'finance_flow_' . $type . '_' . date('Y-m-d') . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'monthly') {
                fputcsv($handle, ['Bulan', 'Revenue (IDR)', 'Expense (IDR)', 'Profit Bersih (IDR)']);
                for ($i = 11; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $inc = Income::whereYear('date', $date->year)->whereMonth('date', $date->month)->sum('amount');
                    $exp = Expense::whereYear('date', $date->year)->whereMonth('date', $date->month)->sum('amount');
                    fputcsv($handle, [$date->format('F Y'), $inc, $exp, max(0, $inc - $exp)]);
                }
            } elseif ($type === 'project') {
                fputcsv($handle, ['Nama Project', 'Client', 'Kategori', 'Status', 'Revenue', 'Expense', 'Profit', 'Margin (%)']);
                $projects = Project::with(['incomes', 'expenses'])->get();
                foreach ($projects as $proj) {
                    $rev = $proj->incomes ? $proj->incomes->sum('amount') : 0;
                    $exp = $proj->expenses ? $proj->expenses->sum('amount') : 0;
                    $profit = max(0, $rev - $exp);
                    $margin = $rev > 0 ? round(($profit / $rev) * 100, 1) : 0;
                    fputcsv($handle, [$proj->name, $proj->client, $proj->category, $proj->status, $rev, $exp, $profit, $margin]);
                }
            } elseif ($type === 'expense') {
                fputcsv($handle, ['Category', 'Jumlah Transaksi', 'Total Nominal (IDR)']);
                $expenses = Expense::groupBy('category')->selectRaw('category, count(*) as count, sum(amount) as total')->get();
                foreach ($expenses as $exp) {
                    fputcsv($handle, [$exp->category, $exp->count, $exp->total]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
