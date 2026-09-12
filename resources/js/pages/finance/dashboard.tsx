import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Wallet, 
    PieChart as PieChartIcon, 
    ArrowUpRight, 
    ArrowDownRight, 
    CheckCircle2, 
    Clock, 
    Activity,
    Plus,
    FileText,
    Percent,
    Sparkles
} from 'lucide-react';

interface KpiData {
    totalRevenue: number;
    totalExpense: number;
    netRealMoney: number;
    allocatedFunds: number;
    remainingBalance: number;
    thisMonthRevenue: number;
    thisMonthExpense: number;
    thisMonthProfit: number;
    cashPosition: number;
}

interface TrendItem {
    month: string;
    income: number;
    expense: number;
    profit: number;
}

interface AllocationItem {
    name: string;
    percentage: number;
    amount: number;
}

interface TransactionItem {
    id: number;
    type: string;
    activity_name: string;
    amount: number;
    status: string;
    created_at: string;
    user?: {
        name: string;
    };
}

interface Props {
    kpis: KpiData;
    trends: TrendItem[];
    allocationDistribution: AllocationItem[];
    recentTransactions: TransactionItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Finance Dashboard', href: '/finance/dashboard' },
];

export default function FinanceDashboard({ kpis, trends, allocationDistribution, recentTransactions }: Props) {
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const maxTrendVal = Math.max(...trends.map(t => Math.max(t.income, t.expense, t.profit)), 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance Dashboard - Genial FinanceFlow" />

            <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-8 border border-emerald-500/20 shadow-2xl">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                                <Sparkles className="w-3.5 h-3.5" />
                                Genial FinanceFlow Engine v1.0
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">
                                Management Keuangan Real-Time
                            </h1>
                            <p className="mt-1 text-slate-300 text-sm max-w-xl">
                                Pantau arus uang masuk, efisiensi operasional, net profit bersih, dan distribusi alokasi otomatis bisnis digital agency Anda.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/finance/income"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Income</span>
                            </Link>
                            <Link
                                href="/finance/expense"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4 text-rose-400" />
                                <span>Tambah Expense</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    {/* Total Revenue */}
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold text-foreground">{formatIDR(kpis.totalRevenue)}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Akumulasi Uang Masuk</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Expense */}
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expense</span>
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatIDR(kpis.totalExpense)}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>Biaya Operasional & Ads</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Real Money */}
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-900/20 via-card to-card border border-emerald-500/30 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Net Real Money</span>
                            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-emerald-500">{formatIDR(kpis.netRealMoney)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Revenue minus Expenses
                            </div>
                        </div>
                    </div>

                    {/* Allocated Funds */}
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocated Funds</span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <PieChartIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold text-foreground">{formatIDR(kpis.allocatedFunds)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Dana Terbagi ke Tim & Profit
                            </div>
                        </div>
                    </div>

                    {/* Remaining Balance */}
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining Balance</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatIDR(kpis.remainingBalance)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Sisa Uang Belum Dialokasi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-white">
                        <span className="text-xs text-slate-400 font-medium">Revenue Bulan Ini</span>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{formatIDR(kpis.thisMonthRevenue)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-white">
                        <span className="text-xs text-slate-400 font-medium">Expense Bulan Ini</span>
                        <div className="text-xl font-bold text-rose-400 mt-1">{formatIDR(kpis.thisMonthExpense)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-white">
                        <span className="text-xs text-slate-400 font-medium">Profit Bersih Bulan Ini</span>
                        <div className="text-xl font-bold text-indigo-400 mt-1">{formatIDR(kpis.thisMonthProfit)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-white">
                        <span className="text-xs text-slate-400 font-medium">Cash Position</span>
                        <div className="text-xl font-bold text-amber-400 mt-1">{formatIDR(kpis.cashPosition)}</div>
                    </div>
                </div>

                {/* Charts & Distribution Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial Trend Visualizer */}
                    <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Tren Keuangan 6 Bulan Terakhir</h3>
                                <p className="text-xs text-muted-foreground">Perbandingan Income, Expense, & Real Profit</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span>Income</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span>Expense</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span>Profit</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom SVG Bar Chart */}
                        <div className="space-y-4 pt-4">
                            {trends.map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="w-20 text-muted-foreground">{item.month}</span>
                                        <div className="flex items-center gap-4 text-slate-300">
                                            <span className="text-emerald-400">{formatIDR(item.income)}</span>
                                            <span className="text-rose-400">{formatIDR(item.expense)}</span>
                                            <span className="text-indigo-400">{formatIDR(item.profit)}</span>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden flex gap-0.5">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-l transition-all duration-500"
                                            style={{ width: `${(item.income / maxTrendVal) * 100}%` }}
                                        />
                                        <div 
                                            className="h-full bg-rose-500 transition-all duration-500"
                                            style={{ width: `${(item.expense / maxTrendVal) * 100}%` }}
                                        />
                                        <div 
                                            className="h-full bg-indigo-500 rounded-r transition-all duration-500"
                                            style={{ width: `${(item.profit / maxTrendVal) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allocation Distribution Card */}
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Distribusi Alokasi Dana</h3>
                                    <p className="text-xs text-muted-foreground">Persentase Pembagian Real Money</p>
                                </div>
                                <Link
                                    href="/finance/allocation"
                                    className="text-xs font-semibold text-emerald-500 hover:underline"
                                >
                                    Kelola &rarr;
                                </Link>
                            </div>

                            {allocationDistribution.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xs">
                                    Belum ada pembagian alokasi. Klik tombol di kanan atas untuk membuat alokasi.
                                </div>
                            ) : (
                                <div className="space-y-4 my-4">
                                    {allocationDistribution.map((alloc, idx) => {
                                        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'];
                                        const color = colors[idx % colors.length];
                                        return (
                                            <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="font-semibold text-foreground flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                                        {alloc.name}
                                                    </span>
                                                    <span className="font-mono font-bold text-emerald-500">{alloc.percentage}%</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                    <span>Estimasi Dana</span>
                                                    <span className="font-semibold text-foreground">{formatIDR(alloc.amount)}</span>
                                                </div>
                                                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div className={`h-full ${color}`} style={{ width: `${alloc.percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Total alokasi otomatis dikalkulasi dari <strong>Net Real Money Available</strong>.</span>
                        </div>
                    </div>
                </div>

                {/* Financial Activity Log Table */}
                <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Log Aktivitas Keuangan Terbaru</h3>
                            <p className="text-xs text-muted-foreground">Financial Activity & Audit Log</p>
                        </div>
                        <Activity className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-3">Tanggal</th>
                                    <th className="p-3">Aktivitas</th>
                                    <th className="p-3">User</th>
                                    <th className="p-3">Nominal</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                            Belum ada aktivitas transaksi recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-3 font-semibold text-foreground">{tx.activity_name}</td>
                                            <td className="p-3 text-muted-foreground">{tx.user?.name || 'System'}</td>
                                            <td className="p-3 font-mono font-bold text-foreground">{formatIDR(tx.amount)}</td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
