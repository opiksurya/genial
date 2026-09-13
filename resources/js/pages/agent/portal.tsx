import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    ShieldCheck,
    Wallet,
    TrendingUp,
    CheckCircle2,
    Clock,
    Building2,
    Users,
    Sparkles,
    Copy,
    Check,
    Calendar,
    ArrowUpRight,
    Award
} from 'lucide-react';

interface Agent {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    commission_rate: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    notes?: string;
}

interface Commission {
    id: number;
    client_name: string;
    income_amount: number;
    commission_rate: number;
    commission_amount: number;
    payment_status: 'unpaid' | 'paid';
    paid_at?: string;
    income?: {
        name: string;
        date: string;
        invoice_number?: string;
    };
    project?: {
        name: string;
    };
}

interface ClientSummary {
    client_name: string;
    total_invoices: number;
    total_paid_amount: number;
}

interface ProjectSummary {
    id: number;
    name: string;
    client: string;
    category?: string;
    status: string;
}

interface Props {
    agent: Agent;
    commissions: Commission[];
    clients: ClientSummary[];
    projects: ProjectSummary[];
    stats: {
        total_client_income: number;
        total_commission: number;
        paid_commission: number;
        unpaid_commission: number;
    };
}

export default function AgentPortal({ agent, commissions, clients, projects, stats }: Props) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'commissions' | 'clients'>('commissions');

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return '';
        const cleanDate = dateStr.split('T')[0];
        try {
            const [y, m, d] = cleanDate.split('-');
            if (y && m && d) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const mIdx = parseInt(m, 10) - 1;
                return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
            }
        } catch (e) {}
        return cleanDate;
    };

    const copyCurrentUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
            <Head title={`Portal Agent - ${agent.name} | Genial Digital Solution`} />

            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-900/20 via-indigo-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Header / Navbar */}
            <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="font-black text-white text-base tracking-tight flex items-center gap-2">
                                GENIAL AGENT PORTAL
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Official Partner
                                </span>
                            </div>
                            <div className="text-xs text-slate-400">Portal Transparansi Fee Komisi Agent</div>
                        </div>
                    </div>

                    <button
                        onClick={copyCurrentUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Link Portal Tersalin!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-purple-400" />
                                <span>Simpan Link Portal Ini</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-950/60 to-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Selamat Datang, Partner Genial!</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Halo, {agent.name} 👋
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Halaman ini khusus disiapkan untuk Anda memantau seluruh histori transaksi client yang Anda bawakan, beserta hak fee komisi <strong className="text-purple-300 font-bold">{agent.commission_rate}%</strong> setiap bulannya secara nyata & transparan.
                            </p>
                        </div>

                        {/* Rate Badge Card */}
                        <div className="bg-slate-900/80 backdrop-blur-md border border-purple-500/30 p-5 rounded-2xl shrink-0 flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rate Komisi Agent</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                    {agent.commission_rate}%
                                </div>
                                <div className="text-[10px] text-emerald-400 font-medium">Tiap Pembayaran Client</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>TOTAL OMZET CLIENT</span>
                            <Building2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-2xl font-black text-white mt-2">
                            {formatIDR(stats.total_client_income)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Akumulasi pembayaran dari client Anda</p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 border border-purple-500/30 p-5 shadow-lg relative overflow-hidden">
                        <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
                            <span>TOTAL HAK KOMISI ({agent.commission_rate}%)</span>
                            <Wallet className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-2xl font-black text-purple-300 mt-2">
                            {formatIDR(stats.total_commission)}
                        </div>
                        <p className="text-[11px] text-purple-400/80 mt-1">Total komisi yang berhak Anda terima</p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
                        <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                            <span>KOMISI SUDAH DICAIRKAN</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400 mt-2">
                            {formatIDR(stats.paid_commission)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Telah ditransfer ke rekening Anda</p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
                        <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                            <span>KOMISI PENDING (AKAN CAIR)</span>
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-amber-400 mt-2">
                            {formatIDR(stats.unpaid_commission)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Menunggu jadwal pencairan bulan ini</p>
                    </div>
                </div>

                {/* Bank Details & Information */}
                {agent.bank_name && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-semibold uppercase">Rekening Tujuan Pencairan Komisi</div>
                                <div className="text-sm font-bold text-white font-mono mt-0.5">
                                    {agent.bank_name} - {agent.bank_account_number} ({agent.bank_account_name})
                                </div>
                            </div>
                        </div>
                        <div className="text-[11px] text-slate-400">
                            *Jika ada perubahan rekening, harap hubungi Admin Genial Digital Solution.
                        </div>
                    </div>
                )}

                {/* Main Content Tabs & Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveTab('commissions')}
                                className={`text-sm font-bold pb-3 -mb-3 transition-all ${
                                    activeTab === 'commissions'
                                        ? 'text-purple-400 border-b-2 border-purple-500'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Histori Transaksi Komisi ({commissions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`text-sm font-bold pb-3 -mb-3 transition-all ${
                                    activeTab === 'clients'
                                        ? 'text-purple-400 border-b-2 border-purple-500'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Daftar Client ({clients.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab 1: Histori Transaksi Komisi */}
                    {activeTab === 'commissions' && (
                        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-xs min-w-[850px]">
                                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="p-4">Tanggal & Invoice</th>
                                            <th className="p-4">Nama Client</th>
                                            <th className="p-4">Deskripsi Pembayaran</th>
                                            <th className="p-4">Pembayaran Client</th>
                                            <th className="p-4">Fee Rate</th>
                                            <th className="p-4">Hak Komisi Anda</th>
                                            <th className="p-4">Status Pencairan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80">
                                        {commissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                                    Belum ada transaksi komisi yang tercatat.
                                                </td>
                                            </tr>
                                        ) : (
                                            commissions.map((comm) => (
                                                <tr key={comm.id} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                                                        <div>{formatDateDisplay(comm.income?.date)}</div>
                                                        <div className="text-[10px] text-purple-400 font-semibold">{comm.income?.invoice_number || '-'}</div>
                                                    </td>
                                                    <td className="p-4 font-bold text-white text-sm">
                                                        {comm.client_name || '-'}
                                                    </td>
                                                    <td className="p-4 text-slate-300">
                                                        <div>{comm.income ? comm.income.name : 'Pembayaran Client'}</div>
                                                        {comm.project && (
                                                            <div className="text-[10px] text-indigo-400 mt-0.5">Project: {comm.project.name}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-mono font-medium text-slate-200">
                                                        {formatIDR(comm.income_amount)}
                                                    </td>
                                                    <td className="p-4 font-bold text-purple-400">
                                                        {comm.commission_rate}%
                                                    </td>
                                                    <td className="p-4 font-mono font-black text-purple-300 text-sm">
                                                        {formatIDR(comm.commission_amount)}
                                                    </td>
                                                    <td className="p-4">
                                                        {comm.payment_status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Dicairkan (Paid)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                <Clock className="w-3 h-3" />
                                                                Proses Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Daftar Client */}
                    {activeTab === 'clients' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clients.length === 0 ? (
                                <div className="col-span-full p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-500">
                                    Belum ada client yang terhubung dengan akun Agent Anda.
                                </div>
                            ) : (
                                clients.map((cl, idx) => (
                                    <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <h4 className="font-extrabold text-white text-base">{cl.client_name}</h4>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                                            <div>
                                                <div className="text-[10px] text-slate-400">Total Transaksi</div>
                                                <div className="font-bold text-slate-200 mt-0.5">{cl.total_invoices} Invoices</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400">Total Omzet Client</div>
                                                <div className="font-bold text-purple-400 mt-0.5">{formatIDR(cl.total_paid_amount)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4">
                    Genial Digital Solution &copy; 2026. All rights reserved. Agent Portal System.
                </div>
            </footer>
        </div>
    );
}
