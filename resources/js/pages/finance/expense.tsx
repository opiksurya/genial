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
    Trash2, 
    Edit3, 
    X,
    AlertTriangle,
    Scale,
    Coins,
    Layers,
    Info,
    Wallet,
    ArrowUpRight
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

interface AllocationCategory {
    key: string;
    type: 'sub' | 'main';
    allocation_id: number;
    sub_allocation_id: number | null;
    name: string;
    parent_name: string | null;
    label: string;
    percentage: number;
    parent_percentage: number;
    budget_ceiling: number;
    total_spent: number;
    remaining_budget: number;
    is_over_budget: boolean;
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
    allocation_id?: number;
    sub_allocation_id?: number;
    income?: Income;
    project?: Project;
    allocation?: { id: number; name: string };
    sub_allocation?: { id: number; name: string };
    creator?: { name: string };
    approver?: { name: string };
    is_over_budget?: boolean;
}

interface Props {
    expenses: Expense[];
    incomes: Income[];
    projects: Project[];
    categorySummary: Record<string, number>;
    allocationCategories: AllocationCategory[];
    categories: string[];
    stats: {
        totalExpense: number;
        approvedExpense: number;
        pendingExpense: number;
        realMoneyAvailable?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Expense Management', href: '/finance/expense' },
];

export default function ExpenseManagement({ 
    expenses, 
    incomes, 
    projects, 
    categorySummary, 
    allocationCategories = [], 
    categories = [], 
    stats 
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        category: '',
        allocation_id: '',
        sub_allocation_id: '',
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
        }).format(val || 0);
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

    // Group allocation categories by parent allocation name
    const groupedAllocations = allocationCategories.reduce((acc, item) => {
        const groupName = item.parent_name 
            ? `📌 Alokasi: ${item.parent_name} (${item.parent_percentage}%)` 
            : '💼 Pos Alokasi Utama';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(item);
        return acc;
    }, {} as Record<string, AllocationCategory[]>);

    const handleOpenCreateModal = () => {
        setEditingExpense(null);
        reset();
        if (allocationCategories.length > 0) {
            const first = allocationCategories[0];
            setSelectedCategoryKey(first.key);
            setData({
                name: '',
                category: first.name,
                allocation_id: String(first.allocation_id),
                sub_allocation_id: first.sub_allocation_id ? String(first.sub_allocation_id) : '',
                income_id: '',
                project_id: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                proof_attachment: '',
            });
        } else {
            setSelectedCategoryKey('');
            setData({
                name: '',
                category: '',
                allocation_id: '',
                sub_allocation_id: '',
                income_id: '',
                project_id: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                proof_attachment: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (exp: Expense) => {
        setEditingExpense(exp);
        
        // Find matching key in allocationCategories
        let foundKey = '';
        if (exp.sub_allocation_id) {
            foundKey = `sub:${exp.sub_allocation_id}`;
        } else if (exp.allocation_id) {
            foundKey = `alloc:${exp.allocation_id}`;
        } else {
            const match = allocationCategories.find(
                (ac) => ac.name.toLowerCase() === exp.category.toLowerCase()
            );
            if (match) {
                foundKey = match.key;
            } else if (allocationCategories.length > 0) {
                // If legacy category does not match, default to first allocation pos
                foundKey = allocationCategories[0].key;
            }
        }

        setSelectedCategoryKey(foundKey);
        
        const activeAllocMatch = allocationCategories.find((ac) => ac.key === foundKey);

        setData({
            name: exp.name,
            category: activeAllocMatch ? activeAllocMatch.name : exp.category,
            allocation_id: activeAllocMatch ? String(activeAllocMatch.allocation_id) : (exp.allocation_id ? String(exp.allocation_id) : ''),
            sub_allocation_id: activeAllocMatch?.sub_allocation_id ? String(activeAllocMatch.sub_allocation_id) : (exp.sub_allocation_id ? String(exp.sub_allocation_id) : ''),
            income_id: exp.income_id ? String(exp.income_id) : '',
            project_id: exp.project_id ? String(exp.project_id) : '',
            amount: String(exp.amount),
            date: exp.date,
            description: exp.description || '',
            proof_attachment: exp.proof_attachment || '',
        });
        setIsModalOpen(true);
    };

    const handleCategoryChange = (key: string) => {
        setSelectedCategoryKey(key);
        const allocMatch = allocationCategories.find((ac) => ac.key === key);
        if (allocMatch) {
            setData((prev) => ({
                ...prev,
                category: allocMatch.name,
                allocation_id: String(allocMatch.allocation_id),
                sub_allocation_id: allocMatch.sub_allocation_id ? String(allocMatch.sub_allocation_id) : '',
            }));
        }
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

    // Currently selected allocation category details
    const activeAlloc = allocationCategories.find((ac) => ac.key === selectedCategoryKey);
    
    // When editing, do not count the current expense itself against the remaining budget
    const isEditingThisItem = editingExpense && (
        (activeAlloc?.type === 'sub' && editingExpense.sub_allocation_id === activeAlloc.sub_allocation_id) ||
        (activeAlloc?.type === 'main' && editingExpense.allocation_id === activeAlloc.allocation_id) ||
        (!activeAlloc && editingExpense.category === data.category)
    );

    const adjustedSpent = activeAlloc 
        ? Math.max(0, activeAlloc.total_spent - (isEditingThisItem ? Number(editingExpense.amount || 0) : 0))
        : 0;

    const effectiveRemainingBudget = activeAlloc 
        ? Math.round((activeAlloc.budget_ceiling - adjustedSpent) * 100) / 100
        : null;

    const enteredAmount = Number(data.amount) || 0;
    const isExceedingBudget = activeAlloc && effectiveRemainingBudget !== null && (enteredAmount > effectiveRemainingBudget);
    const excessAmount = isExceedingBudget ? (enteredAmount - (effectiveRemainingBudget || 0)) : 0;

    const filteredExpenses = expenses.filter((exp) => {
        const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense Management - Genial FinanceFlow" />

            <div className="space-y-8 p-4 sm:p-6 w-full max-w-full min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Expense Management</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold shrink-0 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5" />
                                Alokasi Anggaran Real-Time
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Pencatatan pengeluaran operasional yang disinkronisasikan langsung dengan pos alokasi dana dan plafon anggaran.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Catat Pengeluaran Baru</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Total Outflow Expense</span>
                        <div className="text-2xl font-black text-rose-500 mt-1 font-mono">{formatIDR(stats.totalExpense)}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Akumulasi pengeluaran tercatat</p>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Approved Expense</span>
                        <div className="text-2xl font-bold text-emerald-500 mt-1 font-mono">{formatIDR(stats.approvedExpense)}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Pengeluaran terkonfirmasi resmi</p>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Net Real Money Pool</span>
                        <div className="text-2xl font-bold text-indigo-500 mt-1 font-mono">{formatIDR(stats.realMoneyAvailable || 0)}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Basis sumber alokasi dana bersih</p>
                    </div>
                </div>

                {/* Search & Categories Filter */}
                <div className="space-y-3">
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama pengeluaran atau catatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>

                    {/* Categories Pills (Derived purely from active allocations) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full max-w-full scrollbar-none">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                selectedCategory === 'all'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semua Kategori ({expenses.length})
                        </button>
                        {Object.keys(categorySummary).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {cat} <span className="ml-1 opacity-70 font-mono">({formatIDR(categorySummary[cat] || 0)})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs min-w-[750px]">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                                <tr>
                                    <th className="p-4">Tanggal</th>
                                    <th className="p-4">Pos Alokasi & Nama Expense</th>
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
                                            <td className="p-4 font-mono text-muted-foreground whitespace-nowrap">{formatDateDisplay(exp.date)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                                        {exp.sub_allocation 
                                                            ? `${exp.allocation?.name || ''} > ${exp.sub_allocation.name}` 
                                                            : exp.allocation 
                                                            ? exp.allocation.name 
                                                            : exp.category}
                                                    </span>
                                                    <span className="font-bold text-foreground text-sm">{exp.name}</span>

                                                    {/* Soft Warning Badge if category exceeded budget */}
                                                    {exp.is_over_budget && (
                                                        <span 
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                                            title="Total pengeluaran kategori ini telah melampaui plafon alokasi dana yang dianggarkan"
                                                        >
                                                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                            Over Budget
                                                        </span>
                                                    )}
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
                                                    <span className="text-muted-foreground italic text-[11px]">Umum / Operasional</span>
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
                                                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
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
                                                        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                        title="Edit Pengeluaran"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                                                        title="Hapus Pengeluaran"
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

            {/* Create / Edit Expense Modal with Interactive Budget Guardrail */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {editingExpense ? 'Edit Expense' : 'Catat Pengeluaran Baru'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Pos pengeluaran terhubung langsung ke alokasi dana dan plafon anggaran.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {allocationCategories.length === 0 ? (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs space-y-2">
                                <p className="font-bold flex items-center gap-1.5 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Belum Ada Pos Alokasi Dana Dibuat
                                </p>
                                <p className="leading-relaxed opacity-90">
                                    Kategori pengeluaran sekarang wajib mengacu pada alokasi dana perusahaan. Silakan buat pos alokasi dana terlebih dahulu di menu <strong>Allocation Management</strong>.
                                </p>
                                <div className="pt-2">
                                    <a 
                                        href="/finance/allocation" 
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
                                    >
                                        Buka Allocation Management
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Kategori Expense (Berdasarkan Pos Alokasi Dana) */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Pos Alokasi Dana (Kategori) *
                                        </label>
                                        {activeAlloc && (
                                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                Porsi Alokasi: {activeAlloc.percentage}%
                                            </span>
                                        )}
                                    </div>

                                    <select
                                        value={selectedCategoryKey}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="mt-1.5 w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold cursor-pointer"
                                    >
                                        {Object.entries(groupedAllocations).map(([groupTitle, items]) => (
                                            <optgroup key={groupTitle} label={groupTitle}>
                                                {items.map((ac) => (
                                                    <option key={ac.key} value={ac.key}>
                                                        {ac.name} — (Plafon: {formatIDR(ac.budget_ceiling)} | Sisa: {formatIDR(ac.remaining_budget)})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Banner for legacy category migration if editing old record */}
                                {!activeAlloc && editingExpense && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block">
                                                Kategori Lama: "{editingExpense.category}"
                                            </span>
                                            <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">
                                                Pengeluaran ini sebelumnya dicatat dengan kategori lama. Silakan pilih salah satu pos alokasi dana resmi di atas untuk menghubungkan pengeluaran ini ke anggaran alokasi.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* LIVE BUDGET CEILING & REMAINING WIDGET */}
                                {activeAlloc && (
                                    <div className="p-3.5 rounded-xl border bg-muted/40 border-border/80 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-foreground flex items-center gap-1.5">
                                                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                                                Monitoring Kuota: <span className="text-indigo-600 dark:text-indigo-400">{activeAlloc.label}</span>
                                            </span>
                                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                {activeAlloc.percentage}% Pos Dana
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                                            <div className="p-2 rounded-xl bg-card border border-border">
                                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Plafon Budget</span>
                                                <span className="font-mono font-bold text-foreground text-xs block mt-0.5">
                                                    {formatIDR(activeAlloc.budget_ceiling)}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-xl bg-card border border-border">
                                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Sudah Terpakai</span>
                                                <span className="font-mono font-bold text-foreground text-xs block mt-0.5">
                                                    {formatIDR(adjustedSpent)}
                                                </span>
                                            </div>
                                            <div className={`p-2 rounded-xl border ${
                                                effectiveRemainingBudget !== null && effectiveRemainingBudget < 0
                                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                                <span className="block text-[10px] uppercase font-semibold">Sisa Kuota</span>
                                                <span className="font-mono font-bold text-xs block mt-0.5">
                                                    {formatIDR(effectiveRemainingBudget || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Type 1 Soft Warning Alert when entered amount exceeds budget */}
                                        {enteredAmount > 0 && (
                                            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-all duration-200 ${
                                                isExceedingBudget 
                                                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300' 
                                                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                            }`}>
                                                {isExceedingBudget ? (
                                                    <>
                                                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                                        <div className="space-y-0.5">
                                                            <span className="font-bold text-xs block text-rose-700 dark:text-rose-400">
                                                                ⚠️ Perhatian: Melebihi Kuota Anggaran (+{formatIDR(excessAmount)})
                                                            </span>
                                                            <p className="text-[11px] leading-relaxed opacity-90">
                                                                Nominal pengeluaran ini ({formatIDR(enteredAmount)}) melebihi sisa budget alokasi ({formatIDR(effectiveRemainingBudget || 0)}). Transaksi tetap dapat disimpan dengan tanda <strong>Over Budget</strong>.
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-bold text-xs block text-emerald-700 dark:text-emerald-400">
                                                                Budget Tersedia & Aman
                                                            </span>
                                                            <p className="text-[11px] opacity-90">
                                                                Sisa budget alokasi setelah transaksi ini: <strong>{formatIDR((effectiveRemainingBudget || 0) - enteredAmount)}</strong>
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Expense Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Pembayaran Gaji Karyawan / Langganan Server"
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
                                            step="0.01"
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
                                        className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Expense'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
