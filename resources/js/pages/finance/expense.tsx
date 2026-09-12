import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Receipt, 
    Plus, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    Search, 
    Filter, 
    FileText, 
    Trash2, 
    Edit3, 
    X,
    Building,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';

interface Income {
    id: number;
    name: string;
    amount: number;
}

interface Project {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    category: string;
    name: string;
    description?: string;
    amount: number;
    date: string;
    proof_attachment?: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    income_id?: number;
    project_id?: number;
    income?: Income;
    project?: Project;
    creator?: { name: string };
    approver?: { name: string };
}

interface Props {
    expenses: Expense[];
    incomes: Income[];
    projects: Project[];
    categorySummary: Record<string, number>;
    categories: string[];
    stats: {
        totalExpense: number;
        approvedExpense: number;
        pendingExpense: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Expense Management', href: '/finance/expense' },
];

export default function ExpenseManagement({ expenses, incomes, projects, categorySummary, categories, stats }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        category: 'Operational',
        income_id: '',
        project_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        proof_attachment: '',
    });

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleOpenCreateModal = () => {
        setEditingExpense(null);
        reset();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (exp: Expense) => {
        setEditingExpense(exp);
        setData({
            name: exp.name,
            category: exp.category,
            income_id: exp.income_id ? String(exp.income_id) : '',
            project_id: exp.project_id ? String(exp.project_id) : '',
            amount: String(exp.amount),
            date: exp.date,
            description: exp.description || '',
            proof_attachment: exp.proof_attachment || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            put(`/finance/expense/${editingExpense.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post('/finance/expense', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleApprove = (id: number, status: 'approved' | 'rejected') => {
        router.put(`/finance/expense/${id}/approve`, { status });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data expense ini?')) {
            router.delete(`/finance/expense/${id}`);
        }
    };

    const filteredExpenses = expenses.filter((exp) => {
        const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense Management - Genial FinanceFlow" />

            <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Expense Management</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold">
                                Expense Deduction
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pencatatan seluruh biaya operasional, budget iklan (Ads), gaji, freelancer, dan langganan software.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-95 self-start md:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambahkan Expense</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Outflow Expense</span>
                        <div className="text-2xl font-black text-rose-500 mt-1">{formatIDR(stats.totalExpense)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Approved Expense</span>
                        <div className="text-2xl font-bold text-emerald-500 mt-1">{formatIDR(stats.approvedExpense)}</div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Pending Approval</span>
                        <div className="text-2xl font-bold text-amber-500 mt-1">{formatIDR(stats.pendingExpense)}</div>
                    </div>
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            selectedCategory === 'all'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Semua Kategori
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                                selectedCategory === cat
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {cat} <span className="ml-1 opacity-70">({formatIDR(categorySummary[cat] || 0)})</span>
                        </button>
                    ))}
                </div>

                {/* Expenses Table */}
                <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-4">Tanggal</th>
                                    <th className="p-4">Kategori & Nama Expense</th>
                                    <th className="p-4">Linked Income / Project</th>
                                    <th className="p-4">Jumlah Nominal</th>
                                    <th className="p-4">Approval Status</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Belum ada data pengeluaran yang dicatat.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-mono text-muted-foreground">{exp.date}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold">
                                                        {exp.category}
                                                    </span>
                                                    <span className="font-bold text-foreground text-sm">{exp.name}</span>
                                                </div>
                                                {exp.description && (
                                                    <div className="text-[11px] text-muted-foreground mt-1 max-w-md">
                                                        {exp.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {exp.income && (
                                                    <div className="text-xs font-semibold text-emerald-500">
                                                        Income: {exp.income.name}
                                                    </div>
                                                )}
                                                {exp.project && (
                                                    <div className="text-xs font-semibold text-indigo-400">
                                                        Project: {exp.project.name}
                                                    </div>
                                                )}
                                                {!exp.income && !exp.project && (
                                                    <span className="text-slate-400 font-italic">Umum / Operational</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-rose-500 text-sm">
                                                {formatIDR(exp.amount)}
                                            </td>
                                            <td className="p-4">
                                                {exp.approval_status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Approved
                                                    </span>
                                                )}
                                                {exp.approval_status === 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                            <Clock className="w-3 h-3" />
                                                            Pending
                                                        </span>
                                                        <button
                                                            onClick={() => handleApprove(exp.id, 'approved')}
                                                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                )}
                                                {exp.approval_status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                        <XCircle className="w-3 h-3" />
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(exp)}
                                                        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
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

            {/* Create / Edit Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingExpense ? 'Edit Expense' : 'Catat Pengeluaran Baru'}
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
                                <label className="text-xs font-semibold text-foreground">Kategori Expense *</label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Expense Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Meta Ads Campaign Budget"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Link ke Income (Optional)</label>
                                    <select
                                        value={data.income_id}
                                        onChange={(e) => setData('income_id', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="">-- Pilih Income --</option>
                                        {incomes.map((inc) => (
                                            <option key={inc.id} value={inc.id}>{inc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Link ke Project (Optional)</label>
                                    <select
                                        value={data.project_id}
                                        onChange={(e) => setData('project_id', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="">-- Pilih Project --</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Nominal (IDR) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="5000000"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Tanggal Pengeluaran *</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Deskripsi / Catatan</label>
                                <textarea
                                    rows={2}
                                    placeholder="Rincian biaya atau keperluan pengeluaran..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
