<?php

namespace App\Http\Controllers\FinanceFlow;

use App\Http\Controllers\Controller;
use App\Models\FinanceSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceSettingController extends Controller
{
    public function index()
    {
        $settings = [
            'currency' => FinanceSetting::get('currency', 'IDR'),
            'currency_symbol' => FinanceSetting::get('currency_symbol', 'Rp'),
            'auto_allocation' => FinanceSetting::get('auto_allocation', '1'),
            'approval_threshold' => FinanceSetting::get('approval_threshold', '5000000'),
            'company_profit_default' => FinanceSetting::get('company_profit_default', '40'),
            'marketing_default' => FinanceSetting::get('marketing_default', '30'),
            'team_reward_default' => FinanceSetting::get('team_reward_default', '20'),
            'reserve_fund_default' => FinanceSetting::get('reserve_fund_default', '10'),
        ];

        return Inertia::render('finance/settings', [
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|string|max:10',
            'currency_symbol' => 'required|string|max:10',
            'auto_allocation' => 'required|in:0,1',
            'approval_threshold' => 'required|numeric|min:0',
            'company_profit_default' => 'required|numeric|min:0|max:100',
            'marketing_default' => 'required|numeric|min:0|max:100',
            'team_reward_default' => 'required|numeric|min:0|max:100',
            'reserve_fund_default' => 'required|numeric|min:0|max:100',
        ]);

        foreach ($validated as $key => $value) {
            FinanceSetting::set($key, $value);
        }

        return redirect()->back()->with('success', 'Pengaturan FinanceFlow berhasil disimpan!');
    }
}
