import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Plus, 
    AlertTriangle, 
    CheckCircle2, 
    Percent, 
    Wallet, 
    Sliders, 
    Trash2, 
    Edit3, 
    X,
    ChevronRight,
    Building2,
    ShieldAlert,
    PieChart,
    Layers,
    Info,
    ArrowUpRight,
    TrendingUp,
    Scale,
    Sparkles,
    RefreshCw
} from 'lucide-react';

interface SurplusSource {
    id?: number;
    name: string;
    remaining_budget: number;
    percentage: number;
}

interface SubAllocation {
    id?: number;
    name: string;
    percentage: number;
    amount?: number;
    calculated_amount?: number;
    sort_order?: number;
    total_spent?: number;
    remaining_budget?: number;
    is_over_budget?: boolean;
    over_budget_amount?: number;
    over_budget_percentage?: number;
    utilization_rate?: number;
    is_covered_by_subsidy?: boolean;
    covered_by_allocation_name?: string;
    parent_remaining_budget?: number;
    deficit_type?: 'cross_subsidy' | 'real_deficit' | 'safe';
    surplus_sources?: SurplusSource[];
}

interface Allocation {
    id: number;
    name: string;
    percentage: number;
    amount: number;
    calculated_amount?: number;
    parent_id?: number;
    sub_allocations?: SubAllocation[];
    total_spent?: number;
    remaining_budget?: number;
    is_over_budget?: boolean;
    over_budget_amount?: number;
    over_budget_percentage?: number;
    utilization_rate?: number;
}

interface Props {
    allocations: Allocation[];
    totalIncome?: number;
    totalExpense?: number;
    realMoneyAvailable: number;
    totalPercentage: number;
    isPercentage100: boolean;
    totalOverBudgetNominal?: number;
    totalOverBudgetCount?: number;
    totalCrossSubsidyCount?: number;
    totalCrossSubsidyNominal?: number;
    totalSpentAll?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Allocation Management', href: '/finance/allocation' },
];

export default function AllocationManagement({ 
    allocations, 
    totalIncome = 0,
    totalExpense = 0,
    realMoneyAvailable, 
    totalPercentage, 
    isPercentage100,
    totalOverBudgetNominal = 0,
    totalOverBudgetCount = 0,
    totalCrossSubsidyCount = 0,
    totalCrossSubsidyNominal = 0,
    totalSpentAll = 0
}: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedParentAlloc, setSelectedParentAlloc] = useState<Allocation | null>(null);
    const [selectedSubsidySub, setSelectedSubsidySub] = useState<{ sub: SubAllocation; alloc: Allocation } | null>(null);
    const [isSubsidyModalOpen, setIsSubsidyModalOpen] = useState(false);

    // Create Main Allocation Form
    const { data: mainData, setData: setMainData, post: postMain, reset: resetMain, processing: mainProcessing } = useForm({
        name: '',
        percentage: '',
    });

    // Edit Main Allocation Form
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, processing: editProcessing } = useForm({
        name: '',
        percentage: '',
    });

    // Manage Sub Allocation Form
    const [subItems, setSubItems] = useState<{ id?: number; name: string; percentage: number }[]>([]);

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const handleCreateMain = (e: React.FormEvent) => {
        e.preventDefault();
        postMain('/finance/allocation', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetMain();
            }
        });
    };

    const handleOpenEditModal = (alloc: Allocation) => {
        setEditingAllocation(alloc);
        setEditData({
            name: alloc.name,
            percentage: String(alloc.percentage),
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateMain = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAllocation) return;

        putEdit(`/finance/allocation/${editingAllocation.id}`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setEditingAllocation(null);
            }
        });
    };

    const handleOpenSubModal = (alloc: Allocation) => {
        setSelectedParentAlloc(alloc);
        const existing = alloc.sub_allocations || [];
        if (existing.length > 0) {
            setSubItems(existing.map(s => ({ id: s.id, name: s.name, percentage: Number(s.percentage) })));
        } else {
            setSubItems([
                { name: 'Kategori 1', percentage: 50 },
                { name: 'Kategori 2', percentage: 50 },
            ]);
        }
        setIsSubModalOpen(true);
    };

    const handleAddSubRow = () => {
        setSubItems([...subItems, { name: '', percentage: 0 }]);
    };

    const handleRemoveSubRow = (index: number) => {
        setSubItems(subItems.filter((_, idx) => idx !== index));
    };

    const handleSaveSubAllocations = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParentAlloc) return;

        router.post(`/finance/allocation/${selectedParentAlloc.id}/sub`, {
            sub_allocations: subItems
        }, {
            onSuccess: () => {
                setIsSubModalOpen(false);
            }
        });
    };

    const handleDeleteAllocation = (id: number) => {
        if (confirm('Yakin ingin menghapus pembagian dana alokasi ini beserta seluruh sub-alokasinya?')) {
            router.delete(`/finance/allocation/${id}`);
        }
    };

    // Sub modal live stats
    const currentSubTotalPercentage = subItems.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    const subRemainingPercentage = Math.round((100 - currentSubTotalPercentage) * 100) / 100;
    const subExcessPercentage = Math.round((currentSubTotalPercentage - 100) * 100) / 100;
    const isSubModal100 = Math.abs(currentSubTotalPercentage - 100) < 0.01;
    const isSubModalOver = currentSubTotalPercentage > 100;
    const parentBudget = selectedParentAlloc ? (selectedParentAlloc.calculated_amount || ((selectedParentAlloc.percentage / 100) * (totalIncome || realMoneyAvailable))) : 0;
    const excessBudget = isSubModalOver ? ((subExcessPercentage / 100) * parentBudget) : 0;

    // Distribute remaining evenly or to new item
    const handleDistributeRemaining = () => {
        if (subRemainingPercentage <= 0) return;
        setSubItems([...subItems, { name: 'Alokasi Lain-lain', percentage: subRemainingPercentage }]);
    };

    const handleTrimExcess = () => {
        if (currentSubTotalPercentage <= 100 || subItems.length === 0) return;
        const diff = currentSubTotalPercentage - 100;
        const lastItem = subItems[subItems.length - 1];
        const newPct = Math.max(0, Math.round((lastItem.percentage - diff) * 100) / 100);
        const updated = [...subItems];
        updated[updated.length - 1] = { ...lastItem, percentage: newPct };
        setSubItems(updated);
    };

    const handleSplitEvenly = () => {
        if (subItems.length === 0) return;
        const evenPct = Math.round((100 / subItems.length) * 100) / 100;
        let runningTotal = 0;
        const updated = subItems.map((item, idx) => {
            if (idx === subItems.length - 1) {
                return { ...item, percentage: Math.round((100 - runningTotal) * 100) / 100 };
            }
            runningTotal += evenPct;
            return { ...item, percentage: evenPct };
        });
        setSubItems(updated);
    };

    // Main allocations excess stats
    const isMainOver = totalPercentage > 100;
    const mainExcessPct = Math.round((totalPercentage - 100) * 100) / 100;
    const mainExcessAmount = isMainOver ? ((mainExcessPct / 100) * (totalIncome || realMoneyAvailable)) : 0;

    // Theme color palettes for cards
    const cardPalettes = [
        {
            accent: 'from-blue-600 to-indigo-600',
            badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            pillBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            progressBar: 'bg-indigo-600 dark:bg-indigo-500',
            borderHover: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
            subPill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        },
        {
            accent: 'from-violet-600 to-purple-600',
            badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800',
            pillBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            progressBar: 'bg-purple-600 dark:bg-purple-500',
            borderHover: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
            subPill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        },
        {
            accent: 'from-teal-600 to-emerald-600',
            badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200 dark:border-teal-800',
            pillBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            progressBar: 'bg-teal-600 dark:bg-teal-500',
            borderHover: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
            subPill: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
        },
        {
            accent: 'from-amber-600 to-orange-600',
            badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            pillBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            progressBar: 'bg-amber-600 dark:bg-amber-500',
            borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
            subPill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Allocation Management - Genial FinanceFlow" />

            <div className="space-y-8 p-4 sm:p-6 w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                Money Allocation Management
                            </h1>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold shrink-0 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5" />
                                Multi-Level Split Engine
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                            Pembagian persentase dana bersih (Net Real Money) ke pos operasional & sub-alokasi internal secara real-time.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Alokasi Utama</span>
                    </button>
                </div>

                {/* 100% Validation Alert Banner */}
                {!isPercentage100 && (
                    <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm ${
                        isMainOver 
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400' 
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400'
                    }`}>
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isMainOver ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm">
                                {isMainOver 
                                    ? `Perhatian: Total Akumulasi Alokasi Melebihi 100% (Kelebihan +${mainExcessPct}% / +${formatIDR(mainExcessAmount)})!` 
                                    : `Perhatian: Total Akumulasi Alokasi Utama Belum 100%!`}
                            </h4>
                            <p className="text-xs leading-relaxed opacity-90">
                                {isMainOver 
                                    ? `Total persentase alokasi saat ini adalah ${totalPercentage}%. Terdapat kelebihan kuota alokasi sebesar +${mainExcessPct}% (+${formatIDR(mainExcessAmount)}). Harap kurangi persentase alokasi agar pas 100%.`
                                    : `Total persentase saat ini adalah ${totalPercentage}% (Sisa ${(100 - totalPercentage).toFixed(2)}% belum dialokasikan). Harap sesuaikan persentase alokasi utama agar tepat 100% untuk akurasi pelaporan laba/dana.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Top Executive Summary Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-7 border border-indigo-500/20 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-center">
                        {/* Real Money Metric */}
                        <div className="lg:col-span-5 flex items-start sm:items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-inner">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                                        Net Real Money Tersedia
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        Sisa Kas Fisik
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight mt-1 font-mono">
                                    {formatIDR(realMoneyAvailable)}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                                    <span>Basis Omzet: <strong className="text-white font-mono">{formatIDR(totalIncome)}</strong></span>
                                    <span>•</span>
                                    <span>Total Belanja: <strong className="text-rose-300 font-mono">{formatIDR(totalSpentAll)}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Status Summary Metrics */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                            <div className="bg-slate-800/50 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-[11px] text-slate-400 font-medium">Alokasi Utama</span>
                                <div className="text-xl font-black flex items-center gap-1.5 mt-1">
                                    <span className={isPercentage100 ? 'text-emerald-400 font-mono' : isMainOver ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
                                        {totalPercentage}%
                                    </span>
                                    {isPercentage100 ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                        <ShieldAlert className={`w-4 h-4 shrink-0 ${isMainOver ? 'text-rose-400' : 'text-amber-400'}`} />
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
                                    {isPercentage100 
                                        ? 'Alokasi utama 100%' 
                                        : isMainOver 
                                        ? `⚠️ Lebih +${mainExcessPct}%` 
                                        : `Kurang ${(100 - totalPercentage).toFixed(1)}%`}
                                </p>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-[11px] text-slate-400 font-medium">Kelengkapan Sub</span>
                                <div className="text-xl font-black text-white font-mono mt-1">
                                    {allocations.filter(a => {
                                        const subSum = (a.sub_allocations || []).reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
                                        return Math.abs(subSum - 100) < 0.01;
                                    }).length} <span className="text-xs font-normal text-slate-400">/ {allocations.length} Pos</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    Sub-alokasi tepat 100%
                                </p>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-[11px] text-slate-400 font-medium">Status Anggaran</span>
                                <div className="text-xl font-black flex items-center gap-1.5 mt-1">
                                    {totalOverBudgetCount > 0 ? (
                                        <>
                                            <span className="text-rose-400 font-mono text-base font-bold">
                                                {totalOverBudgetCount} Pos Defisit Riil
                                            </span>
                                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-emerald-400 font-mono text-base font-bold">
                                                Semua Pos Aman
                                            </span>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        </>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                                    {totalOverBudgetCount > 0 
                                        ? `Defisit riil +${formatIDR(totalOverBudgetNominal)}` 
                                        : totalCrossSubsidyCount > 0
                                        ? `🔄 ${totalCrossSubsidyCount} sub-pos subsidi silang internal`
                                        : 'Semua belanja dalam kuota'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Allocations Cards Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Daftar Alokasi Dana & Pos Sub-Alokasi</h2>
                            <p className="text-xs text-muted-foreground">
                                Rincian persentase setiap kategori induk dan total persentase seluruh sub-alokasinya.
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border">
                            {allocations.length} Kategori Utama
                        </span>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 ${allocations.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                        {allocations.map((alloc, idx) => {
                            const palette = cardPalettes[idx % cardPalettes.length];
                            const calculatedAmount = alloc.calculated_amount || ((alloc.percentage / 100) * realMoneyAvailable);
                            
                            // Calculate sub allocations stats
                            const subs = alloc.sub_allocations || [];
                            const subTotalPct = subs.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
                            const roundedSubTotalPct = Math.round(subTotalPct * 100) / 100;
                            const isSubCompleted = Math.abs(roundedSubTotalPct - 100) < 0.01;
                            const isSubZero = roundedSubTotalPct === 0;
                            const isSubOver = roundedSubTotalPct > 100;
                            const subRemainingPct = Math.round((100 - roundedSubTotalPct) * 100) / 100;
                            const subExcessPct = Math.round((roundedSubTotalPct - 100) * 100) / 100;
                            const subAllocatedAmount = (roundedSubTotalPct / 100) * calculatedAmount;
                            const subRemainingAmount = Math.max(0, calculatedAmount - subAllocatedAmount);
                            const subExcessAmount = Math.max(0, subAllocatedAmount - calculatedAmount);

                            return (
                                <div
                                    key={alloc.id}
                                    className={`rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-300 ${palette.borderHover} hover:shadow-lg group relative overflow-hidden`}
                                >
                                    {/* Top Accent Gradient Bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${alloc.is_over_budget || isSubOver ? 'from-rose-500 to-red-600' : palette.accent}`} />

                                    <div>
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${palette.badgeBg}`}>
                                                        Alokasi #{idx + 1}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-foreground text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2" title={alloc.name}>
                                                    {alloc.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleOpenEditModal(alloc)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-muted transition-colors cursor-pointer"
                                                    title="Edit Alokasi Ini"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAllocation(alloc.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                    title="Hapus Alokasi Ini"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Main Percentage & Nominal */}
                                        <div className={`rounded-2xl p-4 border transition-colors mb-4 ${
                                            alloc.is_over_budget 
                                                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                                                : 'bg-muted/30 border-border/70'
                                        }`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                                                        Porsi Dana Induk
                                                    </span>
                                                    <span className="text-3xl font-black text-foreground font-mono tracking-tight mt-0.5 block">
                                                        {alloc.percentage}%
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                                                        Plafon Anggaran
                                                    </span>
                                                    <span className="text-base sm:text-lg font-black text-foreground font-mono mt-0.5 block">
                                                        {formatIDR(calculatedAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Micro progress bar */}
                                            <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden mt-3 mb-2.5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        alloc.is_over_budget ? 'bg-rose-500' : palette.progressBar
                                                    }`}
                                                    style={{ width: `${Math.min(100, alloc.is_over_budget ? 100 : (alloc.utilization_rate || alloc.percentage))}%` }}
                                                />
                                            </div>

                                            {/* Executive Status Grid: 2 Columns (Zero overflow!) */}
                                            <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                                        Total Realisasi
                                                    </span>
                                                    <span className={`font-mono font-bold text-sm block truncate mt-0.5 ${
                                                        alloc.is_over_budget ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                                                    }`}>
                                                        {formatIDR(alloc.total_spent || 0)}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    {alloc.is_over_budget ? (
                                                        <div>
                                                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block truncate">
                                                                ⚠️ Over (+{(alloc.over_budget_percentage || 0).toFixed(1)}%)
                                                            </span>
                                                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 block truncate mt-0.5">
                                                                +{formatIDR(alloc.over_budget_amount || 0)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                                                Sisa Anggaran
                                                            </span>
                                                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
                                                                {formatIDR(alloc.remaining_budget || 0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sub-Allocations Section with Prominent Total Sub-Percentage */}
                                        <div className="pt-3 border-t border-border space-y-3">
                                            {/* Sub Allocation Header & TOTAL PERCENTAGE BADGE */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-xs font-bold text-foreground">
                                                        Sub-Alokasi ({subs.length})
                                                    </span>
                                                </div>

                                                {/* Keterangan total persentase sub-alokasi & kelebihan jika > 100% */}
                                                <div>
                                                    {isSubCompleted ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                            <span>Total Sub: <strong>100%</strong> (Lengkap)</span>
                                                        </span>
                                                    ) : isSubZero ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                            <span>Total Sub: <strong>0%</strong> (Kosong)</span>
                                                        </span>
                                                    ) : isSubOver ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-xs animate-pulse">
                                                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                                            <span>Total Sub: <strong>{roundedSubTotalPct}%</strong> (Lebih +{subExcessPct}%)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                            <span>Total Sub: <strong>{roundedSubTotalPct}%</strong> (Sisa {subRemainingPct}%)</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub Distribution Mini Visual Bar */}
                                            <div className="w-full bg-muted/80 rounded-full h-1.5 overflow-hidden flex">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${isSubCompleted ? 'bg-emerald-500' : isSubOver ? 'bg-rose-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${Math.min(100, roundedSubTotalPct)}%` }}
                                                />
                                            </div>

                                            {/* Sub Allocations List */}
                                            {subs.length > 0 ? (
                                                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                                    {subs.map((sub, sIdx) => {
                                                        const subCalc = sub.calculated_amount || ((sub.percentage / 100) * calculatedAmount);
                                                        // Effective percentage from net real money
                                                        const effectivePct = ((sub.percentage / 100) * (alloc.percentage / 100)) * 100;
                                                        const isOver = Boolean(sub.is_over_budget);
                                                        const isCovered = Boolean(sub.is_covered_by_subsidy);
                                                        const spent = sub.total_spent || 0;
                                                        const overNominal = sub.over_budget_amount || 0;
                                                        const overPct = sub.over_budget_percentage || 0;
                                                        const remaining = sub.remaining_budget ?? (subCalc - spent);
                                                        const utilRate = sub.utilization_rate ?? (subCalc > 0 ? (spent / subCalc) * 100 : 0);

                                                        return (
                                                            <div 
                                                                key={sIdx} 
                                                                className={`p-3 rounded-xl border transition-all duration-200 ${
                                                                    isOver 
                                                                        ? isCovered
                                                                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50 shadow-2xs'
                                                                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-2xs' 
                                                                        : 'bg-card border-border/80 hover:bg-muted/40'
                                                                }`}
                                                            >
                                                                {/* Row 1: Sub Name + Over Tag & Budget Allocation */}
                                                                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                                            isOver ? (isCovered ? 'bg-amber-500' : 'bg-rose-500') : 'bg-emerald-500'
                                                                        }`} />
                                                                        <span className="font-semibold text-foreground text-xs truncate" title={sub.name}>
                                                                            {sub.name}
                                                                        </span>
                                                                        {isOver && (
                                                                            isCovered ? (
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedSubsidySub({ sub, alloc });
                                                                                        setIsSubsidyModalOpen(true);
                                                                                    }}
                                                                                    className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                                                                    title="Klik untuk melihat rincian sumber dana penutup & cara pengembalian"
                                                                                >
                                                                                    <RefreshCw className="w-2.5 h-2.5" />
                                                                                    <span>Subsidi Silang</span>
                                                                                    <Info className="w-2.5 h-2.5 opacity-80" />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/25 shrink-0">
                                                                                    Defisit Riil
                                                                                </span>
                                                                            )
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0 text-right">
                                                                        <span className="font-mono text-foreground font-bold text-xs tabular-nums">
                                                                            {formatIDR(subCalc)}
                                                                        </span>
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${palette.subPill}`}>
                                                                            {sub.percentage}%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Row 2: Micro Progress Bar */}
                                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-2">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                                            isOver 
                                                                                ? (isCovered ? 'bg-amber-500' : 'bg-rose-500') 
                                                                                : 'bg-emerald-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, isOver ? 100 : utilRate)}%` }}
                                                                    />
                                                                </div>

                                                                {/* Row 3: 2-Column Grid for Metrics (Guaranteed to NEVER overflow!) */}
                                                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight pt-0.5">
                                                                    <div>
                                                                        <span className="text-muted-foreground block text-[9px] uppercase font-semibold">
                                                                            Terpakai
                                                                        </span>
                                                                        <span className={`font-bold text-[11px] block truncate mt-0.5 ${
                                                                            isOver 
                                                                                ? (isCovered ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400') 
                                                                                : 'text-foreground'
                                                                        }`}>
                                                                            {formatIDR(spent)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-right">
                                                                        {isOver ? (
                                                                            isCovered ? (
                                                                                <>
                                                                                    <span className="text-amber-700 dark:text-amber-400 font-bold block text-[9px] uppercase truncate">
                                                                                        Over (+{overPct > 999 ? '>999%' : `${overPct.toFixed(0)}%`})
                                                                                    </span>
                                                                                    <span className="font-bold text-[11px] text-amber-700 dark:text-amber-400 block truncate mt-0.5">
                                                                                        +{formatIDR(overNominal)}
                                                                                    </span>
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setSelectedSubsidySub({ sub, alloc });
                                                                                            setIsSubsidyModalOpen(true);
                                                                                        }}
                                                                                        className="text-[8.5px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold block truncate mt-0.5 text-right cursor-pointer underline underline-offset-2"
                                                                                        title={`Tertutup sisa kuota ${alloc.name}. Klik untuk rincian sumber & cara balikin.`}
                                                                                    >
                                                                                        Tertutup sisa {alloc.name} (Rincian →)
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="text-rose-600 dark:text-rose-400 font-bold block text-[9px] uppercase truncate">
                                                                                        Defisit (+{overPct > 999 ? '>999%' : `${overPct.toFixed(0)}%`})
                                                                                    </span>
                                                                                    <span className="font-bold text-[11px] text-rose-600 dark:text-rose-400 block truncate mt-0.5">
                                                                                        +{formatIDR(overNominal)}
                                                                                    </span>
                                                                                    <span className="text-[8.5px] text-rose-600 dark:text-rose-400 block truncate mt-0.5 font-bold">
                                                                                        Jebol Plafon Induk
                                                                                    </span>
                                                                                </>
                                                                            )
                                                                        ) : (
                                                                            <>
                                                                                <span className="text-muted-foreground block text-[9px] uppercase font-semibold">
                                                                                    Sisa Kuota
                                                                                </span>
                                                                                <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
                                                                                    {formatIDR(remaining)}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic py-3 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                                                    Belum ada sub-alokasi internal.
                                                </div>
                                            )}

                                            {/* Sub Allocation Breakdown Summary Bar (Mencantumkan lebihnya secara jelas!) */}
                                            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                                                isSubOver 
                                                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' 
                                                    : 'bg-muted/40 border-border/80'
                                            }`}>
                                                <div>
                                                    <span className="text-muted-foreground block">Teralokasi:</span>
                                                    <span className="font-mono font-bold text-foreground">
                                                        {formatIDR(subAllocatedAmount)} <span className="text-muted-foreground font-normal">({roundedSubTotalPct}%)</span>
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`block font-medium ${isSubOver ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-muted-foreground'}`}>
                                                        {isSubOver ? '⚠️ Kelebihan (Over):' : 'Sisa Belum Dibagi:'}
                                                    </span>
                                                    <span className={`font-mono font-bold ${
                                                        isSubCompleted 
                                                            ? 'text-emerald-600 dark:text-emerald-400' 
                                                            : isSubOver 
                                                            ? 'text-rose-600 dark:text-rose-400 text-xs' 
                                                            : 'text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {isSubCompleted 
                                                            ? 'Rp 0 (0%)' 
                                                            : isSubOver 
                                                            ? `+${formatIDR(subExcessAmount)} (+${subExcessPct}%)` 
                                                            : `${formatIDR(subRemainingAmount)} (${subRemainingPct}%)`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleOpenSubModal(alloc)}
                                        className="mt-5 w-full py-2.5 px-4 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs group-hover:bg-indigo-600 group-hover:text-white cursor-pointer active:scale-98"
                                    >
                                        <Sliders className="w-3.5 h-3.5" />
                                        <span>Kelola Sub-Alokasi ({subs.length})</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Multi Level Allocation Hierarchy Tree Visualizer */}
                <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">Multi-Level Allocation Hierarchy Tree</h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                                    Waterfall Flow
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Visualisasi aliran dana dari Net Real Money ke setiap pos alokasi utama dan sub-komponennya.
                            </p>
                        </div>

                        <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-xl border border-border max-w-sm">
                            <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                                <Info className="w-3.5 h-3.5 text-indigo-500" /> Rumus Kalkulasi Sub-Alokasi:
                            </span>
                            Nominal Sub = <code className="text-indigo-600 dark:text-indigo-400 font-mono">Persentase Sub (%) × Nominal Kategori Induk</code>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-6 overflow-x-auto">
                        {/* Level 1: Revenue & Net Real Money */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span>Total Revenue Client</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xs flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                <span>NET REAL MONEY TERSEDIA: {formatIDR(realMoneyAvailable)} (100%)</span>
                            </div>
                        </div>

                        {/* Level 2: Main Business Allocation */}
                        <div className="pl-4 sm:pl-6 border-l-2 border-indigo-500/30 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                                    Level 2: Pos Alokasi Bisnis Utama ({totalPercentage}%) {isMainOver ? `(⚠️ Kelebihan +${mainExcessPct}%)` : ''}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allocations.map((alloc, idx) => {
                                    const calculatedAmount = alloc.calculated_amount || ((alloc.percentage / 100) * realMoneyAvailable);
                                    const subs = alloc.sub_allocations || [];
                                    const subTotalPct = subs.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
                                    const roundedSubTreePct = Math.round(subTotalPct * 100) / 100;
                                    const isSubTreeOver = roundedSubTreePct > 100;

                                    return (
                                        <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-bold text-white text-sm block">{alloc.name}</span>
                                                    <span className="font-mono text-xs text-indigo-400 font-bold">
                                                        {alloc.percentage}% dari Net Real Money
                                                    </span>
                                                </div>
                                                <span className="font-mono text-emerald-400 font-black text-xs">
                                                    {formatIDR(calculatedAmount)}
                                                </span>
                                            </div>

                                            {/* Sub items tree node */}
                                            <div className="pt-2.5 border-t border-slate-800 space-y-2">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400 uppercase font-semibold">Sub-Kategori ({subs.length})</span>
                                                    <span className={`font-mono font-bold ${
                                                        Math.abs(roundedSubTreePct - 100) < 0.01 
                                                            ? 'text-emerald-400' 
                                                            : isSubTreeOver 
                                                            ? 'text-rose-400' 
                                                            : 'text-amber-400'
                                                    }`}>
                                                        Total Sub: {roundedSubTreePct}% {isSubTreeOver ? `(Lebih +${(roundedSubTreePct - 100).toFixed(1)}%)` : ''}
                                                    </span>
                                                </div>

                                                {subs.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {subs.map((sub, sidx) => {
                                                            const subAmount = sub.calculated_amount || ((sub.percentage / 100) * calculatedAmount);
                                                            return (
                                                                <div key={sidx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                                                                    <div className="flex items-center gap-1.5 truncate pr-2">
                                                                        <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0"></span>
                                                                        <span className="text-slate-300 truncate">{sub.name}</span>
                                                                        <span className="text-indigo-400 font-mono text-[11px] shrink-0 font-bold">({sub.percentage}%)</span>
                                                                    </div>
                                                                    <span className="font-mono text-slate-200 font-semibold text-[11px] shrink-0">
                                                                        {formatIDR(subAmount)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 italic block">Belum ada sub-alokasi</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Main Allocation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-foreground">Tambah Pos Alokasi Baru</h3>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMain} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Nama Alokasi *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: OPEX (Beban Operasional) / Dana Lain-lain"
                                    value={mainData.name}
                                    onChange={(e) => setMainData('name', e.target.value)}
                                    className="mt-1.5 w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground">Persentase dari Net Real Money (%) *</label>
                                    <span className="text-[11px] text-muted-foreground">
                                        Tersedia: <strong>{Math.max(0, 100 - totalPercentage).toFixed(1)}%</strong>
                                    </span>
                                </div>
                                <div className="relative mt-1.5">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="30"
                                        value={mainData.percentage}
                                        onChange={(e) => setMainData('percentage', e.target.value)}
                                        className="w-full pl-3.5 pr-8 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">%</span>
                                </div>
                                {mainData.percentage && (
                                    <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                                        Estimasi Nominal: <strong>{formatIDR((Number(mainData.percentage) / 100) * realMoneyAvailable)}</strong>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={mainProcessing}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                                >
                                    {mainProcessing ? 'Menyimpan...' : 'Simpan Alokasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Main Allocation Modal */}
            {isEditModalOpen && editingAllocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                                    <Edit3 className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-foreground">Edit Pos Alokasi Utama</h3>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateMain} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Nama Alokasi *</label>
                                <input
                                    type="text"
                                    required
                                    value={editData.name}
                                    onChange={(e) => setEditData('name', e.target.value)}
                                    className="mt-1.5 w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Persentase dari Net Real Money (%) *</label>
                                <div className="relative mt-1.5">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={editData.percentage}
                                        onChange={(e) => setEditData('percentage', e.target.value)}
                                        className="w-full pl-3.5 pr-8 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">%</span>
                                </div>
                                {editData.percentage && (
                                    <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                                        Nominal Alokasi Baru: <strong>{formatIDR((Number(editData.percentage) / 100) * realMoneyAvailable)}</strong>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                                >
                                    {editProcessing ? 'Menyimpan...' : 'Perbarui Alokasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Sub Allocation Modal */}
            {isSubModalOpen && selectedParentAlloc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-border pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-lg font-bold text-foreground">Kelola Sub-Alokasi</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Membagi porsi dana <strong className="text-indigo-600 dark:text-indigo-400">{selectedParentAlloc.name}</strong> ({selectedParentAlloc.percentage}% = {formatIDR(parentBudget)})
                                </p>
                            </div>
                            <button onClick={() => setIsSubModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* LIVE SUB TOTAL PERCENTAGE STATUS CARD (Mencantumkan lebihnya secara jelas!) */}
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSubModal100 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
                                : isSubModalOver 
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        }`}>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    {isSubModal100 ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <AlertTriangle className={`w-4 h-4 shrink-0 ${isSubModalOver ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                                    )}
                                    <span className="font-bold text-xs">
                                        Total Sub: <span className="font-mono text-sm">{currentSubTotalPercentage.toFixed(2)}%</span> / 100%
                                        {isSubModalOver && (
                                            <span className="ml-1 text-rose-600 dark:text-rose-400 font-bold">
                                                (Kelebihan +{subExcessPercentage.toFixed(2)}%)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <p className="text-[11px] opacity-80 mt-0.5">
                                    {isSubModal100 
                                        ? 'Sempurna! Seluruh 100% dana telah dialokasikan secara proporsional.' 
                                        : isSubModalOver
                                        ? `⚠️ Melebihi kuota dana sebesar +${subExcessPercentage.toFixed(2)}% (+${formatIDR(excessBudget)}) dari anggaran induk.`
                                        : `Sisa ${subRemainingPercentage.toFixed(2)}% (${formatIDR((subRemainingPercentage / 100) * parentBudget)}) belum dialokasikan.`}
                                </p>
                            </div>

                            {/* Quick Action Helpers */}
                            <div className="flex items-center gap-2 shrink-0">
                                {subRemainingPercentage > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleDistributeRemaining}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
                                        title="Buat baris baru untuk sisa persentase"
                                    >
                                        + Sisa {subRemainingPercentage.toFixed(1)}%
                                    </button>
                                )}
                                {isSubModalOver && (
                                    <button
                                        type="button"
                                        onClick={handleTrimExcess}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                                        title="Pangkas kelebihan baris terakhir agar pas 100%"
                                    >
                                        Pangkas Lebih (-{subExcessPercentage.toFixed(1)}%)
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleSplitEvenly}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors cursor-pointer"
                                    title="Bagi rata seluruh baris sub-alokasi"
                                >
                                    Bagi Rata
                                </button>
                            </div>
                        </div>

                        {/* Sub Items Form */}
                        <form onSubmit={handleSaveSubAllocations} className="space-y-4">
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {subItems.map((item, idx) => {
                                    const subItemAmount = ((Number(item.percentage) || 0) / 100) * parentBudget;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border hover:border-indigo-500/40 transition-all">
                                            <span className="w-5 text-center text-xs text-muted-foreground font-mono font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            
                                            <input
                                                type="text"
                                                required
                                                placeholder="Nama Kategori (contoh: Gaji, Server, Marketing)"
                                                value={item.name}
                                                onChange={(e) => {
                                                    const updated = [...subItems];
                                                    updated[idx].name = e.target.value;
                                                    setSubItems(updated);
                                                }}
                                                className="flex-1 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
                                            />

                                            <div className="flex items-center gap-1 w-24 shrink-0">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={item.percentage}
                                                    onChange={(e) => {
                                                        const updated = [...subItems];
                                                        updated[idx].percentage = Number(e.target.value);
                                                        setSubItems(updated);
                                                    }}
                                                    className="w-full px-2 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-right"
                                                />
                                                <span className="text-xs text-muted-foreground font-bold">%</span>
                                            </div>

                                            <div className="w-28 text-right hidden sm:block shrink-0">
                                                <span className="font-mono text-[11px] font-semibold text-foreground/80 tabular-nums">
                                                    {formatIDR(subItemAmount)}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubRow(idx)}
                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                                                title="Hapus Baris Ini"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddSubRow}
                                className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50/10 text-xs font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Kategori Sub-Alokasi</span>
                            </button>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <span className="text-[11px] text-muted-foreground">
                                    Total Sub: <strong className={isSubModal100 ? 'text-emerald-600' : isSubModalOver ? 'text-rose-600' : 'text-amber-600'}>{currentSubTotalPercentage.toFixed(1)}%</strong>
                                    {isSubModalOver && (
                                        <span className="text-rose-600 font-bold ml-1">
                                            (Lebih +{subExcessPercentage.toFixed(1)}%)
                                        </span>
                                    )}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSubModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                                    >
                                        Simpan Sub-Alokasi
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detail Subsidi Silang: Uang Dari Mana & Cara Mengembalikan */}
            {isSubsidyModalOpen && selectedSubsidySub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-foreground">
                                            Rincian Subsidi Silang: {selectedSubsidySub.sub.name}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                            Tertutup Aman
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Pos ini berada di bawah Alokasi Induk: <strong className="text-foreground">{selectedSubsidySub.alloc.name}</strong> ({selectedSubsidySub.alloc.percentage}%)
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsSubsidyModalOpen(false)} 
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Stat Banner: Over Amount & Safe Status */}
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                                    Jatah Awal Kuota
                                </span>
                                <span className="text-sm font-black font-mono text-foreground mt-0.5 block">
                                    {formatIDR(selectedSubsidySub.sub.calculated_amount || 0)} ({selectedSubsidySub.sub.percentage}%)
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                                    Total Realisasi Belanja
                                </span>
                                <span className="text-sm font-black font-mono text-foreground mt-0.5 block">
                                    {formatIDR(selectedSubsidySub.sub.total_spent || 0)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                                    Kelebihan Yang Ditalangi
                                </span>
                                <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5 block">
                                    +{formatIDR(selectedSubsidySub.sub.over_budget_amount || 0)} (+{(selectedSubsidySub.sub.over_budget_percentage || 0).toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        {/* Bagian 1: Ngambil Dananya Dari Mana? */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    1
                                </span>
                                <h4 className="text-sm font-bold text-foreground">
                                    Uangnya Ngambil Dari Mana? (Sumber Dana Penutup)
                                </h4>
                            </div>

                            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-3">
                                <p className="text-muted-foreground leading-relaxed">
                                    Kelebihan belanja sebesar <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">+{formatIDR(selectedSubsidySub.sub.over_budget_amount || 0)}</strong> pada pos <strong>{selectedSubsidySub.sub.name}</strong> secara otomatis diserap dan ditalangi oleh <strong>pos-pos tetangga yang masih memiliki sisa kuota (surplus)</strong> di dalam alokasi <strong className="text-foreground">{selectedSubsidySub.alloc.name}</strong>:
                                </p>

                                {/* Sibling Pos Donor List */}
                                <div className="space-y-2 pt-1">
                                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                                        Pos Donor Yang Menyediakan Sisa Kuota (Surplus):
                                    </span>
                                    {(selectedSubsidySub.sub.surplus_sources && selectedSubsidySub.sub.surplus_sources.length > 0) ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedSubsidySub.sub.surplus_sources.map((src, idx) => (
                                                <div key={idx} className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
                                                    <div className="min-w-0 pr-2">
                                                        <span className="font-semibold text-foreground text-xs block truncate">
                                                            {src.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            Porsi kuota: {src.percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">
                                                            Sisa Kuota
                                                        </span>
                                                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                                            +{formatIDR(src.remaining_budget)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                                            Kuota cadangan alokasi {selectedSubsidySub.alloc.name} siap menyerap.
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                    <span>
                                        Total sisa kuota belanja di alokasi <strong>{selectedSubsidySub.alloc.name}</strong> saat ini adalah <strong className="font-mono">{formatIDR(selectedSubsidySub.alloc.remaining_budget || 0)}</strong> (Sangat mencukupi untuk meng-cover kelebihan pos ini).
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bagian 2: Cara Mengembalikannya Gimana? */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    2
                                </span>
                                <h4 className="text-sm font-bold text-foreground">
                                    Cara Mengembalikannya Gimana? (Alur Penggantian Finansial)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Opsi A: Otomatis Impas */}
                                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                                            A
                                        </span>
                                        <h5 className="font-bold text-xs text-foreground">Otomatis Impas di Kas</h5>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Karena pos ini dan pos penutupnya sama-sama berada di dalam alokasi <strong className="text-foreground">{selectedSubsidySub.alloc.name}</strong>, uang fisik di rekening bank <strong>tidak pernah keluar dari pagu</strong>. Keuangan Anda langsung impas tanpa perlu transfer setor dana fisik.
                                    </p>
                                </div>

                                {/* Opsi B: Rebalance Persentase */}
                                <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                                B
                                            </span>
                                            <h5 className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Rebalance Persentase</h5>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                                            Jika pos <strong>{selectedSubsidySub.sub.name}</strong> memang butuh anggaran lebih besar setiap bulannya, Anda bisa menaikkan % pos ini dan mengurangi % pos surplus agar pas.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSubsidyModalOpen(false);
                                            handleOpenSubModal(selectedSubsidySub.alloc);
                                        }}
                                        className="w-full mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Sliders className="w-3 h-3" />
                                        <span>Atur Persentase Sub</span>
                                    </button>
                                </div>

                                {/* Opsi C: Disiplin Kuota Periode Depan */}
                                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                                            C
                                        </span>
                                        <h5 className="font-bold text-xs text-foreground">Hemat di Periode Depan</h5>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Instruksikan tim/PIC pos <strong>{selectedSubsidySub.sub.name}</strong> agar menghemat belanja sebesar <strong className="font-mono text-foreground">+{formatIDR(selectedSubsidySub.sub.over_budget_amount || 0)}</strong> di bulan berikutnya untuk memulihkan cadangan kuota pos tetangga.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsSubsidyModalOpen(false)}
                                className="px-5 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 cursor-pointer transition-colors"
                            >
                                Tutup Penjelasan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
