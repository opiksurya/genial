import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Settings as SettingsIcon, Save, DollarSign, ShieldAlert, Percent, Sparkles, CheckCircle2 } from 'lucide-react';

interface FinanceSettingsData {
    currency: string;
    currency_symbol: string;
    auto_allocation: string;
    approval_threshold: string;
    company_profit_default: string;
    marketing_default: string;
    team_reward_default: string;
    reserve_fund_default: string;
}

interface Props {
    settings: FinanceSettingsData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Settings', href: '/finance/settings' },
];

export default function FinanceSettings({ settings }: Props) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        currency: settings.currency || 'IDR',
        currency_symbol: settings.currency_symbol || 'Rp',
        auto_allocation: settings.auto_allocation || '1',
        approval_threshold: settings.approval_threshold || '5000000',
        company_profit_default: settings.company_profit_default || '40',
        marketing_default: settings.marketing_default || '30',
        team_reward_default: settings.team_reward_default || '20',
        reserve_fund_default: settings.reserve_fund_default || '10',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/finance/settings');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="FinanceFlow Settings - Genial Digital Solution" />

            <div className="space-y-8 p-6 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">FinanceFlow Settings</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                                Configuration
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Atur standar mata uang, batasan approval pengeluaran, dan persentase alokasi default bisnis.
                        </p>
                    </div>
                </div>

                {recentlySuccessful && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs font-bold shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pengaturan FinanceFlow berhasil diperbarui!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Settings */}
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Mata Uang & Format
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Kode Mata Uang</label>
                                <select
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                >
                                    <option value="IDR">IDR - Rupiah Indonesia</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="SGD">SGD - Singapore Dollar</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Simbol Mata Uang</label>
                                <input
                                    type="text"
                                    value={data.currency_symbol}
                                    onChange={(e) => setData('currency_symbol', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Approval Threshold */}
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            Batasan Approval Pengeluaran (Expense Approval Threshold)
                        </h3>

                        <div>
                            <label className="text-xs font-semibold text-foreground">
                                Batas Nominal Expense Butuh Approval PM / Owner (IDR)
                            </label>
                            <input
                                type="number"
                                value={data.approval_threshold}
                                onChange={(e) => setData('approval_threshold', e.target.value)}
                                className="mt-1 w-full max-w-md px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Expense melebihi batas ini memerlukan persetujuan dari Finance Admin / Owner sebelum diproses.
                            </p>
                        </div>
                    </div>

                    {/* Default Allocation Rule Ratios */}
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Percent className="w-5 h-5 text-indigo-500" />
                            Persentase Alokasi Default
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Company Profit (%)</label>
                                <input
                                    type="number"
                                    value={data.company_profit_default}
                                    onChange={(e) => setData('company_profit_default', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Marketing Budget (%)</label>
                                <input
                                    type="number"
                                    value={data.marketing_default}
                                    onChange={(e) => setData('marketing_default', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Team Reward (%)</label>
                                <input
                                    type="number"
                                    value={data.team_reward_default}
                                    onChange={(e) => setData('team_reward_default', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Reserve Fund (%)</label>
                                <input
                                    type="number"
                                    value={data.reserve_fund_default}
                                    onChange={(e) => setData('reserve_fund_default', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-mono font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
