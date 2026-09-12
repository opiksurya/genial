import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    TrendingUp, 
    Plus, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    FileText, 
    Search, 
    Filter,
    DollarSign,
    Building2,
    Calendar,
    Paperclip,
    Edit3,
    Trash2,
    X,
    Sparkles
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
    client: string;
}

interface Income {
    id: number;
    name: string;
    project_id?: number;
    client_name?: string;
    amount: number;
    date: string;
    status: 'pending' | 'paid' | 'partial';
    invoice_number?: string;
    attachment?: string;
    notes?: string;
    total_expenses?: number;
    real_money?: number;
    project?: Project;
}

interface Props {
    incomes: Income[];
    projects: Project[];
    stats: {
        totalIncome: number;
        totalPaid: number;
        totalPending: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Income Management', href: '/finance/income' },
];

export default function IncomeManagement({ incomes, projects, stats }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        project_id: '',
        client_name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        invoice_number: '',
        attachment: '',
        notes: '',
    });

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

    const handleOpenCreateModal = () => {
        setEditingIncome(null);
        reset();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (inc: Income) => {
        setEditingIncome(inc);
        setData({
            name: inc.name,
            project_id: inc.project_id ? String(inc.project_id) : '',
            client_name: inc.client_name || '',
            amount: String(inc.amount),
            date: inc.date,
            status: inc.status,
            invoice_number: inc.invoice_number || '',
            attachment: inc.attachment || '',
            notes: inc.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIncome) {
            put(`/finance/income/${editingIncome.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post('/finance/income', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data income ini?')) {
            router.delete(`/finance/income/${id}`);
        }
    };

    const filteredIncomes = incomes.filter((inc) => {
        const matchesSearch = inc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inc.client_name && inc.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (inc.invoice_number && inc.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const presets = [
        'Client Website Project',
        'Google Ads Management',
        'SEO Monthly Retainer',
        'Marketplace Campaign'
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Income Management - Genial FinanceFlow" />

            <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Income Management</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                                Financial Inflow
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pencatatan seluruh uang masuk bisnis digital agency dari client, project retainer, dan campaign.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 self-start md:self-auto shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambahkan Income</span>
                    </button>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Revenue Inflow</span>
                        <div className="text-2xl font-black text-emerald-500 mt-1">{formatIDR(stats.totalIncome)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Paid (Lunas)</span>
                        <div className="text-2xl font-bold text-foreground mt-1">{formatIDR(stats.totalPaid)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Pending / Invoiced</span>
                        <div className="text-2xl font-bold text-amber-500 mt-1">{formatIDR(stats.totalPending)}</div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari income, client, invoice..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">Semua Status Payment</option>
                            <option value="paid">Paid (Lunas)</option>
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                        </select>
                    </div>
                </div>

                {/* Incomes Table */}
                <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-4">Tanggal & Invoice</th>
                                    <th className="p-4">Income Name & Client</th>
                                    <th className="p-4">Project Link</th>
                                    <th className="p-4">Gross Nominal</th>
                                    <th className="p-4">Expense Deduction</th>
                                    <th className="p-4">Net Real Money</th>
                                    <th className="p-4">Payment Status</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredIncomes.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            Belum ada data income yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIncomes.map((inc) => (
                                        <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-mono text-muted-foreground whitespace-nowrap">
                                                <div>{formatDateDisplay(inc.date)}</div>
                                                <div className="text-[10px] text-emerald-500 font-semibold">{inc.invoice_number || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-foreground text-sm">{inc.name}</div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Building2 className="w-3 h-3 text-slate-400" />
                                                    {inc.client_name || 'Direct Client'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {inc.project ? (
                                                    <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                                                        {inc.project.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground font-italic">Non-Project</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-foreground text-sm">
                                                {formatIDR(inc.amount)}
                                            </td>
                                            <td className="p-4 font-mono font-medium text-rose-500">
                                                - {formatIDR(inc.total_expenses || 0)}
                                            </td>
                                            <td className="p-4 font-mono font-black text-emerald-500 text-sm">
                                                {formatIDR(inc.real_money || 0)}
                                            </td>
                                            <td className="p-4">
                                                {inc.status === 'paid' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Paid
                                                    </span>
                                                )}
                                                {inc.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        <Clock className="w-3 h-3" />
                                                        Pending
                                                    </span>
                                                )}
                                                {inc.status === 'partial' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Partial
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(inc)}
                                                        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inc.id)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create / Edit Income Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingIncome ? 'Edit Income' : 'Tambah Uang Masuk Baru'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Preset Buttons */}
                            {!editingIncome && (
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 block">
                                        Contoh Kategori Income
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {presets.map((p, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setData('name', p)}
                                                className="px-2.5 py-1 rounded-lg bg-muted hover:bg-emerald-500/10 hover:text-emerald-500 border border-border text-[11px] font-medium text-muted-foreground transition-all"
                                            >
                                                + {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-foreground">Income Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Client Website Project"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Project (Optional)</label>
                                    <select
                                        value={data.project_id}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            setData('project_id', pid);
                                            const p = projects.find(proj => String(proj.id) === pid);
                                            if (p && !data.client_name) {
                                                setData('client_name', p.client);
                                            }
                                        }}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Pilih Project --</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Nama Client</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: PT Genial Digital"
                                        value={data.client_name}
                                        onChange={(e) => setData('client_name', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Nominal (IDR) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="20000000"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Tanggal Masuk *</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Payment Status *</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as any)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="paid">Paid (Lunas)</option>
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Invoice Number</label>
                                    <input
                                        type="text"
                                        placeholder="INV-2026-001"
                                        value={data.invoice_number}
                                        onChange={(e) => setData('invoice_number', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                </div>
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
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Income'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
