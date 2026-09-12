<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Expense;
use App\Models\Income;
use App\Models\FinancialTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FinanceDashboardController extends Controller
{
    public function index()
    {
        $totalRevenue = Income::sum('amount');
        $totalExpense = Expense::sum('amount');
        $netRealMoney = max(0, $totalRevenue - $totalExpense);
        
        $allocatedFunds = Allocation::whereNull('parent_id')->sum('amount');
        $remainingBalance = max(0, $netRealMoney - $allocatedFunds);

        $now = now();
        $thisMonthRevenue = Income::whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $thisMonthExpense = Expense::whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $thisMonthProfit = max(0, $thisMonthRevenue - $thisMonthExpense);
        $cashPosition = $netRealMoney;

        // Income, Expense, Profit Trends (last 6 months)
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthName = $monthDate->format('M Y');
            
            $inc = Income::whereYear('date', $monthDate->year)->whereMonth('date', $monthDate->month)->sum('amount');
            $exp = Expense::whereYear('date', $monthDate->year)->whereMonth('date', $monthDate->month)->sum('amount');
            $prf = max(0, $inc - $exp);

            $trends[] = [
                'month' => $monthName,
                'income' => (float)$inc,
                'expense' => (float)$exp,
                'profit' => (float)$prf,
            ];
        }

        // Allocation distribution summary
        $allocations = Allocation::whereNull('parent_id')
            ->select('name', 'percentage', 'amount')
            ->get();

        $recentTransactions = FinancialTransaction::with('user')
            ->latest()
            ->take(8)
            ->get();

        return Inertia::render('finance/dashboard', [
            'kpis' => [
                'totalRevenue' => (float)$totalRevenue,
                'totalExpense' => (float)$totalExpense,
                'netRealMoney' => (float)$netRealMoney,
                'allocatedFunds' => (float)$allocatedFunds,
                'remainingBalance' => (float)$remainingBalance,
                'thisMonthRevenue' => (float)$thisMonthRevenue,
                'thisMonthExpense' => (float)$thisMonthExpense,
                'thisMonthProfit' => (float)$thisMonthProfit,
                'cashPosition' => (float)$cashPosition,
            ],
            'trends' => $trends,
            'allocationDistribution' => $allocations,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
