import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    PieChart as PieChartIcon, 
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
    ArrowDown,
    Sparkles,
    GripVertical,
    Users,
    Building2,
    Award,
    ShieldAlert
} from 'lucide-react';

interface SubAllocation {
    id?: number;
    name: string;
    percentage: number;
    amount?: number;
    calculated_amount?: number;
    sort_order?: number;
}

interface Allocation {
    id: number;
    name: string;
    percentage: number;
    amount: number;
    calculated_amount?: number;
    parent_id?: number;
    sub_allocations?: SubAllocation[];
}

interface Props {
    allocations: Allocation[];
    realMoneyAvailable: number;
    totalPercentage: number;
    isPercentage100: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'FinanceFlow', href: '/finance/dashboard' },
    { title: 'Allocation Management', href: '/finance/allocation' },
];

export default function AllocationManagement({ allocations, realMoneyAvailable, totalPercentage, isPercentage100 }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedParentAlloc, setSelectedParentAlloc] = useState<Allocation | null>(null);

    // Create Main Allocation Form
    const { data: mainData, setData: setMainData, post: postMain, reset: resetMain, processing: mainProcessing } = useForm({
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
        }).format(val);
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

    const handleOpenSubModal = (alloc: Allocation) => {
        setSelectedParentAlloc(alloc);
        const existing = alloc.sub_allocations || [];
        if (existing.length > 0) {
            setSubItems(existing.map(s => ({ id: s.id, name: s.name, percentage: Number(s.percentage) })));
        } else {
            // Default sample sub-allocation if empty
            setSubItems([
                { name: 'Designer', percentage: 30 },
                { name: 'Developer', percentage: 40 },
                { name: 'Project Manager', percentage: 20 },
                { name: 'Bonus', percentage: 10 },
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
        if (confirm('Hapus pembagian dana alokasi ini?')) {
            router.delete(`/finance/allocation/${id}`);
        }
    };

    const subTotalPercentage = subItems.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    const isSub100 = Math.abs(subTotalPercentage - 100) < 0.01;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Allocation Management - Genial FinanceFlow" />

            <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Money Allocation System</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                                Dynamic Split Engine
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sistem pembagian persentase dana bersih (Net Real Money) & pembagian bertingkat (Multi-Level Allocation).
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 self-start md:self-auto shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambahkan Pembagian Dana</span>
                    </button>
                </div>

                {/* 100% Validation Alert Banner */}
                {!isPercentage100 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-start gap-3 shadow-md animate-pulse">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">Peringatan: Total Persentase Alokasi Tidak Sama Dengan 100%!</h4>
                            <p className="text-xs text-amber-300/80 mt-0.5">
                                Total persentase saat ini adalah <strong>{totalPercentage}%</strong>. Harap sesuaikan persentase agar total akumulasi tepat <strong>100%</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Real Money Summary Bar */}
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 p-6 border border-indigo-500/20 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">NET REAL MONEY TERSEDIA</span>
                            <div className="text-3xl font-black text-emerald-400 tracking-tight mt-0.5">
                                {formatIDR(realMoneyAvailable)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                        <div>
                            <span className="text-xs text-slate-400 font-medium">Total Akumulasi Persentase</span>
                            <div className="text-xl font-bold flex items-center gap-2 mt-0.5">
                                <span className={isPercentage100 ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                                    {totalPercentage}%
                                </span>
                                {isPercentage100 ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Allocations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {allocations.map((alloc) => {
                        const calculatedAmount = alloc.calculated_amount || ((alloc.percentage / 100) * realMoneyAvailable);

                        return (
                            <div
                                key={alloc.id}
                                className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-foreground text-base group-hover:text-indigo-400 transition-colors">
                                            {alloc.name}
                                        </h3>
                                        <button
                                            onClick={() => handleDeleteAllocation(alloc.id)}
                                            className="p-1 text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className="text-3xl font-black text-indigo-500 font-mono">
                                            {alloc.percentage}%
                                        </span>
                                        <span className="text-sm font-bold text-foreground font-mono">
                                            {formatIDR(calculatedAmount)}
                                        </span>
                                    </div>

                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${alloc.percentage}%` }}
                                        />
                                    </div>

                                    {/* Sub Allocations Preview */}
                                    <div className="space-y-2 pt-3 border-t border-border">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase">
                                            <span>Sub-Allocation ({alloc.sub_allocations?.length || 0})</span>
                                        </div>
                                        {alloc.sub_allocations && alloc.sub_allocations.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {alloc.sub_allocations.map((sub, sIdx) => {
                                                    const subCalc = sub.calculated_amount || ((sub.percentage / 100) * calculatedAmount);
                                                    return (
                                                        <div key={sIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border">
                                                            <span className="text-foreground font-medium">{sub.name}</span>
                                                            <div className="text-right">
                                                                <span className="font-mono text-indigo-400 font-bold mr-2">{sub.percentage}%</span>
                                                                <span className="font-mono text-muted-foreground text-[11px]">{formatIDR(subCalc)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-muted-foreground italic py-1">
                                                Belum ada sub-alokasi internal.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleOpenSubModal(alloc)}
                                    className="mt-5 w-full py-2 px-3 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Manage Sub Allocation</span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Multi Level Allocation Hierarchy Tree Visualizer */}
                <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Multi Level Allocation Tree</h3>
                            <p className="text-xs text-muted-foreground">Struktur Pembagian Dana Bertingkat Real-Time</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                            Hierarchical Flow
                        </span>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-6">
                        {/* Level 1: Revenue */}
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>Income Client (Revenue)</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                            <div className="p-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                                NET REAL MONEY ({formatIDR(realMoneyAvailable)})
                            </div>
                        </div>

                        {/* Level 2: Main Business Allocation */}
                        <div className="pl-6 border-l-2 border-slate-800 space-y-4">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Allocation Level</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {allocations.map((alloc, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-indigo-400">{alloc.name}</span>
                                            <span className="font-mono text-emerald-400 font-bold">{alloc.percentage}%</span>
                                        </div>
                                        <div className="text-sm font-mono font-bold text-white">
                                            {formatIDR(alloc.calculated_amount || ((alloc.percentage / 100) * realMoneyAvailable))}
                                        </div>

                                        {/* Level 3: Individual Sub Allocation */}
                                        {alloc.sub_allocations && alloc.sub_allocations.length > 0 && (
                                            <div className="pt-2 border-t border-slate-800 space-y-1">
                                                <span className="text-[10px] text-slate-400 uppercase">Team / Individual Level</span>
                                                {alloc.sub_allocations.map((sub, sidx) => (
                                                    <div key={sidx} className="flex items-center justify-between text-[11px] text-slate-300">
                                                        <span>{sub.name} ({sub.percentage}%)</span>
                                                        <span className="font-mono font-semibold text-slate-400">
                                                            {formatIDR(sub.calculated_amount || ((sub.percentage / 100) * (alloc.calculated_amount || 0)))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Main Allocation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="text-lg font-bold text-foreground">Tambah Pembagian Dana Baru</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMain} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Nama Alokasi *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Company Profit / Marketing Budget"
                                    value={mainData.name}
                                    onChange={(e) => setMainData('name', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Persentase (%) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    placeholder="30"
                                    value={mainData.percentage}
                                    onChange={(e) => setMainData('percentage', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={mainProcessing}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                                >
                                    Simpan Alokasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Sub Allocation Modal */}
            {isSubModalOpen && selectedParentAlloc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Manage Sub Allocation</h3>
                                <p className="text-xs text-muted-foreground">
                                    Bagian: <strong className="text-indigo-400">{selectedParentAlloc.name}</strong> ({selectedParentAlloc.percentage}%)
                                </p>
                            </div>
                            <button onClick={() => setIsSubModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isSub100 && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                                Total persentase sub-alokasi saat ini: <strong>{subTotalPercentage}%</strong> (Ideal: 100%).
                            </div>
                        )}

                        <form onSubmit={handleSaveSubAllocations} className="space-y-4">
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {subItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border">
                                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Kategori / Peran (Designer, Dev, etc.)"
                                            value={item.name}
                                            onChange={(e) => {
                                                const updated = [...subItems];
                                                updated[idx].name = e.target.value;
                                                setSubItems(updated);
                                            }}
                                            className="flex-1 px-3 py-1.5 bg-muted/60 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-1 w-28">
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                max="100"
                                                value={item.percentage}
                                                onChange={(e) => {
                                                    const updated = [...subItems];
                                                    updated[idx].percentage = Number(e.target.value);
                                                    setSubItems(updated);
                                                }}
                                                className="w-full px-2 py-1.5 bg-muted/60 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                                            />
                                            <span className="text-xs text-muted-foreground font-bold">%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubRow(idx)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddSubRow}
                                className="w-full py-2 rounded-xl border border-dashed border-border hover:border-indigo-500 text-xs font-semibold text-muted-foreground hover:text-indigo-400 transition-colors"
                            >
                                + Tambah Kategori Internal
                            </button>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsSubModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                                >
                                    Simpan Sub Alokasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
