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
    Award,
    Share2,
    ExternalLink,
    HelpCircle,
    ChevronRight,
    Landmark,
    MessageCircle,
    Receipt,
    Percent,
    AlertCircle
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
    whatsapp_number?: string;
    stats: {
        total_client_income: number;
        total_commission: number;
        paid_commission: number;
        unpaid_commission: number;
    };
}

export default function AgentPortal({
    agent,
    commissions,
    clients,
    projects,
    whatsapp_number = '6281234567890',
    stats
}: Props) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedBank, setCopiedBank] = useState(false);
    const [activeTab, setActiveTab] = useState<'commissions' | 'clients' | 'info'>('commissions');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return '-';
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
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Portal Agent - ${agent.name}`,
                    text: `Portal Transparansi Fee Komisi Agent ${agent.name} di Genial Digital Solution`,
                    url: window.location.href
                });
            } catch (err) {
                copyCurrentUrl();
            }
        } else {
            copyCurrentUrl();
        }
    };

    const copyBankNumber = () => {
        if (agent.bank_account_number && navigator.clipboard) {
            navigator.clipboard.writeText(agent.bank_account_number);
            setCopiedBank(true);
            setTimeout(() => setCopiedBank(false), 2500);
        }
    };

    const filteredCommissions = commissions.filter(comm => {
        if (statusFilter === 'paid') return comm.payment_status === 'paid';
        if (statusFilter === 'unpaid') return comm.payment_status === 'unpaid';
        return true;
    });

    const waHelpMessage = encodeURIComponent(
        `Halo Admin Genial, saya ${agent.name} (Agent Partner). Saya ingin menanyakan perihal update fee komisi agent saya.`
    );
    const waUrl = `https://wa.me/${whatsapp_number.replace(/[^0-9]/g, '')}?text=${waHelpMessage}`;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white flex justify-center">
            <Head title={`Portal Komisi - ${agent.name} | Genial Partner`} />

            {/* Ambient Background Glow for Desktop Viewers */}
            <div className="fixed inset-0 pointer-events-none flex justify-center overflow-hidden">
                <div className="w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -top-24 absolute" />
                <div className="w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] top-1/2 absolute" />
            </div>

            {/* Mobile App Container (Optimized for Mobile Phone HP & Centered on Desktop) */}
            <div className="w-full max-w-md min-h-screen bg-slate-900/95 border-x border-slate-800/80 shadow-2xl relative flex flex-col z-10 pb-28">

                {/* Top App Bar Header */}
                <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-sm tracking-tight text-white">GENIAL AGENT</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Official
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                                Portal Transparansi Komisi
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleShare}
                            title="Bagikan / Simpan Link"
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all active:scale-95 flex items-center gap-1 text-xs"
                        >
                            {copiedLink ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[11px] text-emerald-400 font-bold">Tersalin</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 text-purple-400" />
                                    <span className="text-[11px] font-semibold">Simpan</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="p-4 space-y-4 flex-1">

                    {/* Agent Greeting & Partner Tag */}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            <div className="text-xs text-slate-400">Selamat datang,</div>
                            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                                {agent.name}
                                <span className="inline-block animate-pulse">👋</span>
                            </h1>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Partner Aktif
                            </span>
                            <div className="text-[10px] text-purple-300 font-semibold mt-0.5">
                                Rate Komisi: {agent.commission_rate}%
                            </div>
                        </div>
                    </div>

                    {/* Digital Wallet Card (Fintech Style Card) */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 border border-purple-500/30 p-5 shadow-xl shadow-purple-950/40 text-white">
                        {/* Shimmer Pattern Backdrop */}
                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                        {/* Card Top Label */}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-1.5 text-xs text-purple-200/90 font-bold tracking-wider uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Total Hak Komisi</span>
                            </div>
                            <div className="px-2 py-0.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black text-white">
                                {agent.commission_rate}% FEE
                            </div>
                        </div>

                        {/* Main Balance */}
                        <div className="mt-3 relative z-10">
                            <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm font-mono">
                                {formatIDR(stats.total_commission)}
                            </div>
                            <div className="text-[11px] text-purple-200/75 mt-0.5">
                                Akumulasi total komisi dari seluruh pembayaran client
                            </div>
                        </div>

                        {/* Card Sub-stats Split */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/10 relative z-10">
                            <div className="bg-slate-950/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5">
                                <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold uppercase">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Sudah Cair</span>
                                </div>
                                <div className="text-sm font-black text-emerald-400 font-mono mt-0.5 truncate">
                                    {formatIDR(stats.paid_commission)}
                                </div>
                            </div>

                            <div className="bg-slate-950/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5">
                                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold uppercase">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>Pending (Akan Cair)</span>
                                </div>
                                <div className="text-sm font-black text-amber-400 font-mono mt-0.5 truncate">
                                    {formatIDR(stats.unpaid_commission)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stat: Total Omzet Client */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Total Omzet Client
                                </div>
                                <div className="text-base font-black text-white font-mono mt-0.5">
                                    {formatIDR(stats.total_client_income)}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-purple-400 font-semibold">
                                {clients.length} Client Aktif
                            </div>
                            <div className="text-[10px] text-slate-400">
                                {commissions.length} Transaksi
                            </div>
                        </div>
                    </div>

                    {/* Bank Account Info Card (with One-Tap Copy) */}
                    {agent.bank_name && (
                        <div className="rounded-2xl bg-slate-900 border border-slate-800/90 p-3.5 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                    <Landmark className="w-4 h-4 text-purple-400" />
                                    <span>Rekening Pencairan Komisi</span>
                                </div>
                                <button
                                    onClick={copyBankNumber}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold transition-all active:scale-95"
                                >
                                    {copiedBank ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3 text-purple-400" />
                                            <span>Salin No. Rek</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-black text-xs">
                                            {agent.bank_name}
                                        </span>
                                        <span className="font-mono text-sm font-black text-white tracking-wide">
                                            {agent.bank_account_number}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mt-1">
                                        a.n. <strong className="text-slate-200">{agent.bank_account_name || agent.name}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Pencairan komisi otomatis ditransfer langsung ke rekening ini.</span>
                            </div>
                        </div>
                    )}

                    {/* Segmented Tab Bar (Phone Navigation) */}
                    <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
                        <button
                            onClick={() => setActiveTab('commissions')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                                activeTab === 'commissions'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Transaksi ({commissions.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                                activeTab === 'clients'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Client ({clients.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                                activeTab === 'info'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Info</span>
                        </button>
                    </div>

                    {/* TAB 1: Transaksi Komisi (Mobile Card Feed) */}
                    {activeTab === 'commissions' && (
                        <div className="space-y-3">
                            {/* Filter Pills */}
                            {commissions.length > 0 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                            statusFilter === 'all'
                                                ? 'bg-slate-700 text-white'
                                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        Semua ({commissions.length})
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('paid')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                                            statusFilter === 'paid'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Sudah Cair</span>
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('unpaid')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                                            statusFilter === 'unpaid'
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>Pending</span>
                                    </button>
                                </div>
                            )}

                            {filteredCommissions.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-slate-800">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3">
                                        <Receipt className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-white text-sm">Belum Ada Transaksi</div>
                                    <div className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                        Transaksi pembayaran client yang Anda referensikan akan muncul otomatis di sini secara realtime.
                                    </div>
                                </div>
                            ) : (
                                filteredCommissions.map(comm => (
                                    <div
                                        key={comm.id}
                                        className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-4 space-y-3 hover:border-purple-500/40 transition-all shadow-md"
                                    >
                                        {/* Card Header: Date & Status */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                                                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                                <span>{formatDateDisplay(comm.income?.date)}</span>
                                                {comm.income?.invoice_number && (
                                                    <span className="text-purple-400 font-semibold">• {comm.income.invoice_number}</span>
                                                )}
                                            </div>

                                            {comm.payment_status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Dicairkan
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        {/* Client & Description */}
                                        <div>
                                            <div className="font-bold text-white text-base">
                                                {comm.client_name || 'Client Genial'}
                                            </div>
                                            <div className="text-xs text-slate-300 mt-0.5">
                                                {comm.income?.name || 'Pembayaran Layanan / Project'}
                                            </div>
                                            {comm.project && (
                                                <div className="text-[10px] text-indigo-400 font-medium mt-0.5">
                                                    Project: {comm.project.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial Receipt Strip */}
                                        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-medium">Pembayaran Client</div>
                                                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                                                    {formatIDR(comm.income_amount)}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-[10px] text-purple-300 font-semibold flex items-center justify-end gap-1">
                                                    <span>Hak Komisi ({comm.commission_rate}%)</span>
                                                </div>
                                                <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 font-mono mt-0.5">
                                                    + {formatIDR(comm.commission_amount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 2: Daftar Client (Mobile Card Feed) */}
                    {activeTab === 'clients' && (
                        <div className="space-y-3">
                            {clients.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-slate-800">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-white text-sm">Belum Ada Client Terhubung</div>
                                    <div className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                        Ketika client yang Anda bawa melakukan transaksi, data client otomatis tercatat di sini.
                                    </div>
                                </div>
                            ) : (
                                clients.map((cl, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-4 space-y-3 hover:border-purple-500/40 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                {cl.client_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm truncate">
                                                    {cl.client_name}
                                                </div>
                                                <div className="text-[10px] text-emerald-400 font-medium">
                                                    {cl.total_invoices} Transaksi Terverifikasi
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                                            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
                                                <div className="text-[10px] text-slate-400 font-medium">Total Omzet Client</div>
                                                <div className="font-bold text-slate-200 font-mono mt-0.5 truncate">
                                                    {formatIDR(cl.total_paid_amount)}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
                                                <div className="text-[10px] text-purple-300 font-medium">Est. Komisi ({agent.commission_rate}%)</div>
                                                <div className="font-bold text-purple-400 font-mono mt-0.5 truncate">
                                                    {formatIDR(cl.total_paid_amount * (agent.commission_rate / 100))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 3: Info & Panduan Pencairan */}
                    {activeTab === 'info' && (
                        <div className="space-y-3 text-xs">
                            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span>Ketentuan & Jadwal Pencairan</span>
                                </div>
                                <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                        <span>
                                            Komisi Anda dihitung otomatis <strong className="text-white">{agent.commission_rate}%</strong> dari setiap pembayaran invoice client yang berhasil masuk.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                        <span>
                                            Pencairan dilakukan secara berkala ke rekening terdaftar Anda di atas.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                        <span>
                                            Jika ingin merubah nomor rekening atau butuh konfirmasi transfer, silakan hubungi Admin Genial melalui tombol WhatsApp di bawah.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-purple-500/20 p-4 text-center space-y-2">
                                <Award className="w-7 h-7 text-purple-400 mx-auto" />
                                <div className="font-bold text-white text-sm">Genial Agent Partnership</div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Terima kasih atas kemitraan dan kepercayaan Anda bersama Genial Digital Solution. Kami berkomitmen menjaga transparansi penuh untuk setiap hasil kolaborasi kita.
                                </p>
                            </div>
                        </div>
                    )}
                </main>

                {/* Sticky Mobile Bottom Bar (Help & Actions) */}
                <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none p-3">
                    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-2xl pointer-events-auto flex items-center gap-2">
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                        >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>Hubungi Admin via WA</span>
                        </a>

                        <button
                            onClick={copyCurrentUrl}
                            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 shrink-0"
                            title="Salin Link Halaman Portal Ini"
                        >
                            {copiedLink ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[11px] text-emerald-400 font-bold">Tersimpan</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-[11px]">Salin Link</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Minimalist */}
                <footer className="mt-auto px-4 py-6 text-center text-[10px] text-slate-500 border-t border-slate-800/60">
                    Genial Digital Solution &copy; 2026. Official Agent Portal.
                </footer>
            </div>
        </div>
    );
}
