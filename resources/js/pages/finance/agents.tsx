import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Users,
    Plus,
    CheckCircle2,
    Clock,
    Link as LinkIcon,
    Copy,
    Check,
    Edit3,
    Trash2,
    RefreshCw,
    X,
    ExternalLink,
    Percent,
    Building2,
    DollarSign,
    Search,
    ShieldCheck
} from 'lucide-react';

interface Commission {
    id: number;
    agent_id: number;
    income_id: number;
    client_name: string;
    income_amount: number;
    commission_rate: number;
    commission_amount: number;
    payment_status: 'unpaid' | 'paid';
    paid_at?: string;
    income?: {
        name: string;
        date: string;
    };
    agent?: {
        name: string;
    };
}

interface Agent {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    access_token: string;
    portal_url: string;
    commission_rate: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    status: 'active' | 'inactive';
    notes?: string;
    total_income?: number;
    total_commission?: number;
    paid_commission?: number;
    unpaid_commission?: number;
}

interface Props {
    agents: Agent[];
    commissions: Commission[];
    stats: {
        total_agents: number;
        total_commission: number;
        paid_commission: number;
        unpaid_commission: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Agent & Komisi Portal', href: '/finance/agents' },
];

export default function AgentManagement({ agents, commissions, stats }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'agents' | 'commissions'>('agents');

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        commission_rate: '5.00',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        status: 'active',
        notes: '',
    });

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleCopyPortalUrl = (agent: Agent) => {
        navigator.clipboard.writeText(agent.portal_url);
        setCopiedTokenId(agent.id);
        setTimeout(() => setCopiedTokenId(null), 2500);
    };

    const handleOpenCreateModal = () => {
        setEditingAgent(null);
        reset();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (agent: Agent) => {
        setEditingAgent(agent);
        setData({
            name: agent.name,
            email: agent.email || '',
            phone: agent.phone || '',
            commission_rate: String(agent.commission_rate),
            bank_name: agent.bank_name || '',
            bank_account_number: agent.bank_account_number || '',
            bank_account_name: agent.bank_account_name || '',
            status: agent.status,
            notes: agent.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAgent) {
            put(`/finance/agents/${editingAgent.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post('/finance/agents', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus agent ini? Data histori komisi akan terhapus.')) {
            router.delete(`/finance/agents/${id}`);
        }
    };

    const handleRegenerateToken = (id: number) => {
        if (confirm('Regenerate token akan mengubah URL portal agent ini. URL lama tidak bisa diakses lagi. Lanjutkan?')) {
            router.post(`/finance/agents/${id}/regenerate-token`);
        }
    };

    const handleTogglePayCommission = (comm: Commission) => {
        const nextStatus = comm.payment_status === 'paid' ? 'unpaid' : 'paid';
        router.put(`/finance/agent-commissions/${comm.id}/pay`, {
            status: nextStatus
        });
    };

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.phone && a.phone.includes(searchQuery))
    );

    const filteredCommissions = commissions.filter(c =>
        c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.agent && c.agent.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.income && c.income.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Agent & Portal Komisi - Genial FinanceFlow" />

            <div className="space-y-8 p-4 sm:p-6 w-full max-w-full min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Agent Portal & Fee Komisi</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold shrink-0">
                                Passwordless Portal Access
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Kelola Agent/Partner yang berhak mendapatkan fee komisi 5% (atau rate custom) dari tiap pembayaran client per bulan.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Agent Baru</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Agent Aktif</span>
                        <div className="text-2xl font-black text-foreground mt-1">{stats.total_agents} Agent</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Komisi Terakumulasi</span>
                        <div className="text-2xl font-black text-purple-400 mt-1">{formatIDR(stats.total_commission)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Komisi Sudah Dicairkan (Paid)</span>
                        <div className="text-2xl font-bold text-emerald-500 mt-1">{formatIDR(stats.paid_commission)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Komisi Belum Dicairkan (Pending)</span>
                        <div className="text-2xl font-bold text-amber-500 mt-1">{formatIDR(stats.unpaid_commission)}</div>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border w-full">
                    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('agents')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'agents'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Daftar Agent ({agents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('commissions')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'commissions'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Histori Transaksi Komisi ({commissions.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari agent, client, email, hp..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Tab Content: Agents List */}
                {activeTab === 'agents' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredAgents.length === 0 ? (
                            <div className="col-span-full p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground">
                                Belum ada Agent yang terdaftar. Klik <strong>"Tambah Agent Baru"</strong> untuk memulai.
                            </div>
                        ) : (
                            filteredAgents.map((agent) => (
                                <div key={agent.id} className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4 relative flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-extrabold text-foreground text-base">{agent.name}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        agent.status === 'active' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {agent.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-purple-400 font-semibold mt-0.5">
                                                    Komisi Rate: {agent.commission_rate}%
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(agent)}
                                                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Edit Agent"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(agent.id)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                                                    title="Hapus Agent"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Contact & Bank Details */}
                                        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-xl border border-border/50">
                                            {agent.email && <div>📧 {agent.email}</div>}
                                            {agent.phone && <div>📱 {agent.phone}</div>}
                                            {agent.bank_name && (
                                                <div className="text-foreground font-mono text-[11px] pt-1 border-t border-border/40">
                                                    🏦 {agent.bank_name} - {agent.bank_account_number} ({agent.bank_account_name})
                                                </div>
                                            )}
                                        </div>

                                        {/* Agent Stats */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-xl">
                                                <div className="text-[10px] text-muted-foreground uppercase font-medium">Total Omzet Client</div>
                                                <div className="font-bold text-foreground text-xs mt-0.5">{formatIDR(agent.total_income || 0)}</div>
                                            </div>
                                            <div className="bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-xl">
                                                <div className="text-[10px] text-purple-400 uppercase font-medium">Total Hak Komisi</div>
                                                <div className="font-bold text-purple-400 text-xs mt-0.5">{formatIDR(agent.total_commission || 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portal Token URL Section */}
                                    <div className="pt-3 border-t border-border space-y-2">
                                        <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3 text-purple-400" />
                                                Secret Token URL Portal
                                            </span>
                                            <button
                                                onClick={() => handleRegenerateToken(agent.id)}
                                                className="text-[10px] text-amber-500 hover:underline flex items-center gap-1"
                                                title="Reset Access Token URL"
                                            >
                                                <RefreshCw className="w-2.5 h-2.5" />
                                                Reset
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={agent.portal_url}
                                                className="w-full text-[10px] font-mono bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground select-all focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleCopyPortalUrl(agent)}
                                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm"
                                            >
                                                {copiedTokenId === agent.id ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                                                        <span>Tersalin!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span>Copy Link</span>
                                                    </>
                                                )}
                                            </button>
                                            <a
                                                href={agent.portal_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground shrink-0"
                                                title="Buka Portal Agent"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Tab Content: Commissions History Table */}
                {activeTab === 'commissions' && (
                    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm w-full">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left text-xs min-w-[900px]">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                    <tr>
                                        <th className="p-4">Agent Name</th>
                                        <th className="p-4">Client Name</th>
                                        <th className="p-4">Sumber Income / Invoice</th>
                                        <th className="p-4">Nominal Pembayaran Client</th>
                                        <th className="p-4">Rate (%)</th>
                                        <th className="p-4">Nominal Fee Komisi</th>
                                        <th className="p-4">Status Pencairan</th>
                                        <th className="p-4 text-right">Aksi Payout</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredCommissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                Belum ada transaksi komisi yang tercatat dari pembayaran client.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCommissions.map((comm) => (
                                            <tr key={comm.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-bold text-foreground">
                                                    {comm.agent ? comm.agent.name : 'Unknown Agent'}
                                                </td>
                                                <td className="p-4 font-medium text-foreground">
                                                    {comm.client_name || '-'}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <div>{comm.income ? comm.income.name : 'Direct Income'}</div>
                                                    {comm.income?.date && (
                                                        <div className="text-[10px] text-slate-400">{comm.income.date.split('T')[0]}</div>
                                                    )}
                                                </td>
                                                <td className="p-4 font-mono font-medium text-foreground">
                                                    {formatIDR(comm.income_amount)}
                                                </td>
                                                <td className="p-4 font-bold text-purple-400">
                                                    {comm.commission_rate}%
                                                </td>
                                                <td className="p-4 font-mono font-black text-purple-400 text-sm">
                                                    {formatIDR(comm.commission_amount)}
                                                </td>
                                                <td className="p-4">
                                                    {comm.payment_status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Lunas (Paid)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                            <Clock className="w-3 h-3" />
                                                            Belum Cair (Unpaid)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleTogglePayCommission(comm)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                            comm.payment_status === 'paid'
                                                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20'
                                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                        }`}
                                                    >
                                                        {comm.payment_status === 'paid' ? 'Batalkan Paid' : 'Tandai Lunas'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Agent Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingAgent ? 'Edit Data Agent' : 'Tambah Agent Baru'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Nama Lengkap Agent *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Surya Pratama"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Email</label>
                                    <input
                                        type="email"
                                        placeholder="agent@example.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">No WhatsApp / HP</label>
                                    <input
                                        type="text"
                                        placeholder="081234567890"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Commission Rate (%) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        placeholder="5.00"
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs text-purple-400 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Standard: 5.00%</span>
                                </div>
                                {editingAgent && (
                                    <div>
                                        <label className="text-xs font-semibold text-foreground">Status Agent</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as any)}
                                            className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-border">
                                <label className="text-xs font-bold text-foreground block mb-2">Informasi Rekening Pencairan Komisi</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama Bank (BCA/Mandiri)"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        className="px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="No Rekening"
                                        value={data.bank_account_number}
                                        onChange={(e) => setData('bank_account_number', e.target.value)}
                                        className="px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Atas Nama"
                                        value={data.bank_account_name}
                                        onChange={(e) => setData('bank_account_name', e.target.value)}
                                        className="px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Catatan Tambahan</label>
                                <textarea
                                    rows={2}
                                    placeholder="Catatan mengenai permohonan agent atau kesepakatan..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Data Agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
