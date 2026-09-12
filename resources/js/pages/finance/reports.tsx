import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    FileSpreadsheet, 
    Download, 
    Printer, 
    FileText, 
    Calendar, 
    Briefcase, 
    Users, 
    PieChart, 
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    CheckCircle2
} from 'lucide-react';

interface MonthlyReportItem {
    month: string;
    year: number;
    month_num: number;
    revenue: number;
    expense: number;
    net_profit: number;
}

interface ProjectProfitItem {
    id: number;
    project_name: string;
    client: string;
    category: string;
    status: string;
    revenue: number;
    expense: number;
    profit: number;
    margin: number;
}

interface ClientProfitabilityItem {
    client_name: string;
    total_revenue: number;
    total_expense: number;
    net_profit: number;
    margin: number;
}

interface ExpenseAnalysisItem {
    category: string;
    count: number;
    total_amount: number;
}

interface AllocationReportItem {
    id: number;
    name: string;
    percentage: number;
    amount: number;
    sub_allocations: { name: string; percentage: number; amount: number }[];
}

interface Props {
    activeTab: string;
    monthlyReport: MonthlyReportItem[];
    projectProfitReport: ProjectProfitItem[];
    clientProfitability: ClientProfitabilityItem[];
    expenseAnalysis: ExpenseAnalysisItem[];
    allocationReport: AllocationReportItem[];
    summary: {
        totalRevenue: number;
        totalExpense: number;
        realMoney: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Financial Reports', href: '/finance/reports' },
];

export default function FinancialReports({ 
    activeTab: initialTab, 
    monthlyReport, 
    projectProfitReport, 
    clientProfitability, 
    expenseAnalysis, 
    allocationReport,
    summary 
}: Props) {
    const [tab, setTab] = useState<string>(initialTab || 'monthly');

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleExportCSV = () => {
        window.open(`/finance/reports/export?type=${tab}&format=csv`, '_blank');
    };

    const handleExportExcel = () => {
        window.open(`/finance/reports/export?type=${tab}&format=excel`, '_blank');
    };

    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Financial Reports - Genial FinanceFlow" />

            <div className="space-y-8 p-6 max-w-[1600px] mx-auto print:p-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Financial Reports</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-xs font-semibold">
                                Analytics Suite
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Laporan analisis bulanan, keuntungan per project & client, analisis pengeluaran, dan alokasi dana.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-all"
                        >
                            <Download className="w-4 h-4 text-emerald-500" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-all"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                            <span>Export Excel</span>
                        </button>
                        <button
                            onClick={handlePrintPDF}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak PDF</span>
                        </button>
                    </div>
                </div>

                {/* Tabs Bar */}
                <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none print:hidden">
                    <button
                        onClick={() => setTab('monthly')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'monthly'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Monthly Report</span>
                    </button>
                    <button
                        onClick={() => setTab('project')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'project'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span>Project Profit Report</span>
                    </button>
                    <button
                        onClick={() => setTab('client')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'client'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Client Profitability</span>
                    </button>
                    <button
                        onClick={() => setTab('expense')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'expense'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Expense Analysis</span>
                    </button>
                    <button
                        onClick={() => setTab('allocation')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'allocation'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                    >
                        <PieChart className="w-4 h-4" />
                        <span>Allocation Report</span>
                    </button>
                </div>

                {/* Content Sections */}
                {tab === 'monthly' && (
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Laporan Keuangan Bulanan</h3>
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-3">Periode Bulan</th>
                                    <th className="p-3">Total Revenue</th>
                                    <th className="p-3">Total Expense</th>
                                    <th className="p-3">Net Profit Bersih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {monthlyReport.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                        <td className="p-3 font-semibold text-foreground">{m.month}</td>
                                        <td className="p-3 font-mono text-emerald-500 font-bold">{formatIDR(m.revenue)}</td>
                                        <td className="p-3 font-mono text-rose-500 font-bold">{formatIDR(m.expense)}</td>
                                        <td className="p-3 font-mono text-cyan-500 font-extrabold">{formatIDR(m.net_profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'project' && (
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Laporan Keuntungan Per Project</h3>
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-3">Nama Project</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Revenue</th>
                                    <th className="p-3">Expense</th>
                                    <th className="p-3">Profit</th>
                                    <th className="p-3">Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {projectProfitReport.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                        <td className="p-3 font-bold text-foreground">{p.project_name}</td>
                                        <td className="p-3 text-muted-foreground">{p.client}</td>
                                        <td className="p-3 font-mono text-emerald-500 font-bold">{formatIDR(p.revenue)}</td>
                                        <td className="p-3 font-mono text-rose-500 font-bold">{formatIDR(p.expense)}</td>
                                        <td className="p-3 font-mono text-cyan-500 font-extrabold">{formatIDR(p.profit)}</td>
                                        <td className="p-3 font-mono">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                                                {p.margin}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'client' && (
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Analisis Profitabilitas Client</h3>
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-3">Nama Client</th>
                                    <th className="p-3">Total Revenue</th>
                                    <th className="p-3">Total Expense</th>
                                    <th className="p-3">Net Profit</th>
                                    <th className="p-3">Profit Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {clientProfitability.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                        <td className="p-3 font-bold text-foreground">{c.client_name}</td>
                                        <td className="p-3 font-mono text-emerald-500 font-bold">{formatIDR(c.total_revenue)}</td>
                                        <td className="p-3 font-mono text-rose-500 font-bold">{formatIDR(c.total_expense)}</td>
                                        <td className="p-3 font-mono text-cyan-500 font-extrabold">{formatIDR(c.net_profit)}</td>
                                        <td className="p-3 font-mono font-bold text-indigo-400">{c.margin}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'expense' && (
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Analisis Kategori Pengeluaran</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {expenseAnalysis.map((exp, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-muted/40 border border-border">
                                    <span className="text-xs text-muted-foreground font-semibold">{exp.category}</span>
                                    <div className="text-xl font-extrabold text-rose-500 font-mono mt-1">
                                        {formatIDR(exp.total_amount)}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground mt-1 block">
                                        {exp.count} Transaksi
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'allocation' && (
                    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Laporan Alokasi & Pembagian Dana</h3>
                        <div className="space-y-4">
                            {allocationReport.map((alloc) => (
                                <div key={alloc.id} className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-foreground text-sm">{alloc.name} ({alloc.percentage}%)</span>
                                        <span className="font-mono font-black text-indigo-400">{formatIDR(alloc.amount)}</span>
                                    </div>
                                    {alloc.sub_allocations.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                                            {alloc.sub_allocations.map((sub, idx) => (
                                                <div key={idx} className="p-2 rounded bg-card border border-border text-xs">
                                                    <div className="text-muted-foreground">{sub.name} ({sub.percentage}%)</div>
                                                    <div className="font-mono font-bold text-foreground mt-0.5">{formatIDR(sub.amount)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
