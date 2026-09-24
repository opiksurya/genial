import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Briefcase,
    Sparkles,
    CheckCircle2,
    Clock,
    ExternalLink,
    Send,
    Wallet,
    Calendar,
    FolderKanban,
    AlertCircle,
    Check,
    Copy,
    Share2,
    FileText,
    Link as LinkIcon,
    ChevronRight,
    Building2,
    Layers,
    X,
    Play,
    CalendarDays,
    Video,
    Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface FreelancerAssignment {
    id: number;
    title: string;
    description?: string;
    brief_link?: string;
    submission_link?: string;
    fee_amount: number;
    deadline?: string;
    status: 'assigned' | 'in_progress' | 'submitted' | 'revision' | 'completed';
    payment_status: 'unpaid' | 'paid';
    paid_at?: string;
    notes?: string;
    created_at: string;
    project?: {
        name: string;
        client?: string;
    };
}

interface ContentPlanItem {
    id: number;
    title: string;
    scheduled_date: string;
    scheduled_time?: string;
    platform: string;
    format: string;
    pillar: string;
    status: string;
    reference_link?: string;
    submission_link?: string;
    freelancer_notes?: string;
    freelancer_fee: number;
    freelancer_status?: 'unassigned' | 'assigned' | 'in_progress' | 'submitted' | 'revision' | 'approved';
    payout_status: 'unpaid' | 'approved' | 'paid';
    paid_at?: string;
    visual_detail?: string;
    wording?: string;
    copywriting?: string;
    hashtags?: string;
    notes?: string;
    project?: {
        name: string;
        client?: string;
    };
}

interface Freelancer {
    id: number;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    rate_per_project: number;
    rate_unit: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    access_token: string;
    status: string;
}

interface Props {
    freelancer: Freelancer;
    assignments: FreelancerAssignment[];
    contentPlans?: ContentPlanItem[];
    stats: {
        total_earnings: number;
        paid_earnings: number;
        approved_pending_earnings?: number;
        unpaid_earnings: number;
        active_jobs: number;
        completed_jobs: number;
    };
}

export default function FreelancerPortal({ 
    freelancer, 
    assignments = [], 
    contentPlans = [],
    stats 
}: Props) {
    const [selectedAssignment, setSelectedAssignment] = useState<FreelancerAssignment | null>(null);
    const [selectedContentPlan, setSelectedContentPlan] = useState<ContentPlanItem | null>(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | 'contents' | 'projects'>('all');
    const [filterTab, setFilterTab] = useState<'active' | 'completed' | 'all'>('active');

    const submitForm = useForm({
        submission_link: '',
        notes: '',
        freelancer_notes: '',
    });

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleOpenSubmitAssignmentModal = (item: FreelancerAssignment) => {
        setSelectedContentPlan(null);
        setSelectedAssignment(item);
        submitForm.setData({
            submission_link: item.submission_link || '',
            notes: item.notes || '',
            freelancer_notes: '',
        });
        setIsSubmitModalOpen(true);
    };

    const handleOpenSubmitContentModal = (plan: ContentPlanItem) => {
        setSelectedAssignment(null);
        setSelectedContentPlan(plan);
        submitForm.setData({
            submission_link: plan.submission_link || '',
            notes: '',
            freelancer_notes: plan.freelancer_notes || '',
        });
        setIsSubmitModalOpen(true);
    };

    const handleSubmitDeliverable = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedContentPlan) {
            submitForm.post(`/freelancer/portal/${freelancer.access_token}/contents/${selectedContentPlan.id}/submit`, {
                onSuccess: () => {
                    setIsSubmitModalOpen(false);
                    toast.success('Hasil video/konten berhasil dikirim! Menunggu ACC admin.');
                },
                onError: () => {
                    toast.error('Pastikan link URL valid (contoh: https://drive.google.com/...)');
                }
            });
        } else if (selectedAssignment) {
            submitForm.post(`/freelancer/portal/${freelancer.access_token}/tasks/${selectedAssignment.id}/submit`, {
                onSuccess: () => {
                    setIsSubmitModalOpen(false);
                    toast.success('Hasil pekerjaan berhasil dikirim ke tim Genial! Menunggu review admin.');
                },
                onError: () => {
                    toast.error('Pastikan link URL valid (contoh: https://drive.google.com/...)');
                }
            });
        }
    };

    const handleStartContentPlan = (plan: ContentPlanItem) => {
        router.put(`/freelancer/portal/${freelancer.access_token}/contents/${plan.id}/status`, {
            status: 'in_progress',
        }, {
            onSuccess: () => toast.success('Status pengerjaan konten dimulai (In Progress)!'),
        });
    };

    const handleStartAssignment = (item: FreelancerAssignment) => {
        router.put(`/freelancer/portal/${freelancer.access_token}/tasks/${item.id}/status`, {
            status: 'in_progress',
        }, {
            onSuccess: () => toast.success('Status pengerjaan task dimulai (In Progress)!'),
        });
    };

    const filteredContents = contentPlans.filter((item) => {
        if (filterTab === 'active') {
            return ['assigned', 'in_progress', 'submitted', 'revision', undefined].includes(item.freelancer_status);
        }
        if (filterTab === 'completed') {
            return item.freelancer_status === 'approved';
        }
        return true;
    });

    const filteredAssignments = assignments.filter((item) => {
        if (filterTab === 'active') {
            return ['assigned', 'in_progress', 'submitted', 'revision'].includes(item.status);
        }
        if (filterTab === 'completed') {
            return item.status === 'completed';
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
            <Head title={`Freelancer Portal - ${freelancer.name} | Genial Digital Solution`} />

            {/* Top Navigation */}
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-primary flex items-center justify-center text-white font-black shadow-md shadow-purple-500/20">
                            G
                        </div>
                        <div>
                            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">GENIAL</span>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 ml-1.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50 dark:border-purple-800/50">
                                Freelancer Workspace
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="hidden sm:inline">Selamat Datang,</span>
                        <strong className="text-slate-900 dark:text-slate-200 font-bold">{freelancer.name}</strong>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                
                {/* Hero Profile Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white shadow-2xl relative overflow-hidden border border-purple-800/40">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
                                {freelancer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold border border-white/10">
                                    <Sparkles className="w-3 h-3 text-yellow-300" />
                                    <span>{freelancer.role}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                    {freelancer.name}
                                </h1>
                                <p className="text-xs text-purple-200/80">
                                    Portal resmi pengerjaan konten kalender, akses brief, pengiriman deliverable, ACC admin, dan pencairan upah.
                                </p>
                            </div>
                        </div>

                        {/* Bank info pill */}
                        {freelancer.bank_name && (
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1 shrink-0">
                                <div className="text-[11px] text-purple-200 uppercase font-semibold">Rekening Pencairan Upah:</div>
                                <div className="font-bold text-white text-sm">
                                    {freelancer.bank_name} - {freelancer.bank_account_number}
                                </div>
                                <div className="text-purple-200/90 text-[11px]">
                                    a.n. {freelancer.bank_account_name || freelancer.name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earnings & Progress Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Akumulasi Upah</div>
                            <div className="text-lg font-black text-slate-900 dark:text-slate-100">{formatIDR(stats.total_earnings)}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sudah Ditransfer (Lunas)</div>
                            <div className="text-lg font-black text-emerald-600">{formatIDR(stats.paid_earnings)}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                            <Check className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Di-ACC (Siap Cair)</div>
                            <div className="text-lg font-black text-blue-600">{formatIDR(stats.approved_pending_earnings || 0)}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Belum Di-ACC / Belum Cair</div>
                            <div className="text-lg font-black text-amber-600">{formatIDR(stats.unpaid_earnings)}</div>
                        </div>
                    </div>
                </div>

                {/* Category & Status Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFilterCategory('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filterCategory === 'all'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            Semua Job ({contentPlans.length + assignments.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterCategory('contents')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                filterCategory === 'contents'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Konten Kalender ({contentPlans.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterCategory('projects')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                filterCategory === 'projects'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Project Tasks ({assignments.length})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFilterTab('active')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${filterTab === 'active' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200' : 'text-slate-500'}`}
                        >
                            Aktif
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('completed')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${filterTab === 'completed' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'text-slate-500'}`}
                        >
                            Selesai & ACC
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${filterTab === 'all' ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200' : 'text-slate-500'}`}
                        >
                            Semua Status
                        </button>
                    </div>
                </div>

                {/* SECTION 1: KONTEN KALENDER JOBS */}
                {(filterCategory === 'all' || filterCategory === 'contents') && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-purple-600" />
                            <span>Job Kalender Konten ({filteredContents.length})</span>
                        </h2>

                        <div className="space-y-4">
                            {filteredContents.length === 0 ? (
                                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                                    Tidak ada pekerjaan kalender konten pada filter ini.
                                </div>
                            ) : (
                                filteredContents.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                                                        {plan.platform} • {plan.format}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-md border border-purple-200/50">
                                                        {plan.pillar}
                                                    </span>

                                                    {/* Status Freelancer Badge */}
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                                        plan.freelancer_status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                                                            : plan.freelancer_status === 'submitted'
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200'
                                                            : plan.freelancer_status === 'revision'
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                                                            : plan.freelancer_status === 'in_progress'
                                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                        {plan.freelancer_status === 'approved' ? '✅ Disetujui (ACC) Admin' : plan.freelancer_status === 'submitted' ? '⏳ Menunggu ACC Admin' : (plan.freelancer_status || 'Ditugaskan')}
                                                    </span>

                                                    {/* Payout Status Badge */}
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        plan.payout_status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : plan.payout_status === 'approved'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {plan.payout_status === 'paid' ? '💰 Upah LUNAS' : plan.payout_status === 'approved' ? '✨ ACC (Siap Cair)' : '⏳ Upah Pending'}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-0.5">
                                                    {plan.title}
                                                </h3>

                                                {/* Brief details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                                                    {plan.visual_detail && (
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                                                            <div className="text-[11px] font-bold text-slate-500 uppercase">Arahan Visual / Shooting:</div>
                                                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{plan.visual_detail}</p>
                                                        </div>
                                                    )}
                                                    {plan.wording && (
                                                        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl space-y-1 border border-purple-100 dark:border-purple-900/40">
                                                            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">Wording Hook di Layar:</div>
                                                            <p className="text-purple-900 dark:text-purple-200 font-medium leading-relaxed">{plan.wording}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="sm:text-right shrink-0">
                                                <div className="text-xs text-slate-400 font-medium">Upah Konten:</div>
                                                <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                                                    {formatIDR(Number(plan.freelancer_fee))}
                                                </div>
                                                <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-medium">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Target Post: <strong>{plan.scheduled_date}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {plan.reference_link && (
                                                    <a
                                                        href={plan.reference_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-primary font-bold border border-slate-200 dark:border-slate-700 hover:border-primary shadow-xs transition-all"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>Link Inspirasi / Reference</span>
                                                    </a>
                                                )}

                                                {plan.submission_link && (
                                                    <a
                                                        href={plan.submission_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Deliverable Video / File Terkirim</span>
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(!plan.freelancer_status || plan.freelancer_status === 'assigned') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartContentPlan(plan)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                                                    >
                                                        <Play className="w-3.5 h-3.5" />
                                                        <span>Mulai Kerjakan</span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSubmitContentModal(plan)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    <span>{plan.submission_link ? 'Update / Kirim Revisi Hasil' : 'Submit Hasil Kerja (Link) ✨'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* SECTION 2: TUGAS PROJECT LAIN */}
                {(filterCategory === 'all' || filterCategory === 'projects') && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-indigo-600" />
                            <span>Tugas Project / Desain Lain ({filteredAssignments.length})</span>
                        </h2>

                        <div className="space-y-4">
                            {filteredAssignments.length === 0 ? (
                                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                                    Tidak ada tugas project lain pada filter ini.
                                </div>
                            ) : (
                                filteredAssignments.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                                                        {item.project?.name || 'General Agency'}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                                        item.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : item.status === 'submitted'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : item.status === 'revision'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : item.status === 'in_progress'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                                                    }`}>
                                                        Status: {item.status.replace('_', ' ')}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        item.payment_status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.payment_status === 'paid' ? '💰 Honor LUNAS' : '⏳ Pembayaran Pending'}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-1">
                                                    {item.title}
                                                </h3>

                                                {item.description && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="sm:text-right shrink-0">
                                                <div className="text-xs text-slate-400 font-medium">Honor Task:</div>
                                                <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                                                    {formatIDR(Number(item.fee_amount))}
                                                </div>
                                                {item.deadline && (
                                                    <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Deadline: <strong>{item.deadline}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {item.brief_link && (
                                                    <a
                                                        href={item.brief_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-primary font-bold border border-slate-200 dark:border-slate-700 hover:border-primary shadow-xs transition-all"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>Buka Brief & Asset Task</span>
                                                    </a>
                                                )}

                                                {item.submission_link && (
                                                    <a
                                                        href={item.submission_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Deliverable Terkirim</span>
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.status === 'assigned' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartAssignment(item)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                                                    >
                                                        <Play className="w-3.5 h-3.5" />
                                                        <span>Mulai Kerjakan</span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSubmitAssignmentModal(item)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    <span>{item.submission_link ? 'Kirim Revisi / Update Link' : 'Submit Hasil Kerja ✨'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
                <p>Genial Digital Solution &copy; 2026. All rights reserved. Freelancer Portal & Content Workflow System.</p>
            </footer>

            {/* SUBMIT WORK MODAL */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 to-purple-500/5">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Submit Hasil Kerja Freelancer
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitDeliverable} className="p-6 space-y-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs text-purple-900 dark:text-purple-200 border border-purple-200/50">
                                <strong>Job:</strong> {selectedContentPlan ? `${selectedContentPlan.title} (${selectedContentPlan.platform} - ${selectedContentPlan.format})` : selectedAssignment?.title}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Link Hasil Deliverable (Google Drive / Figma / Loom / Video Render) *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={submitForm.data.submission_link}
                                    onChange={(e) => submitForm.setData('submission_link', e.target.value)}
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <p className="text-[11px] text-slate-500">Pastikan akses link Google Drive diset ke <em>"Anyone with the link can view/edit"</em>.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Catatan / Pesan ke Tim Genial (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={selectedContentPlan ? submitForm.data.freelancer_notes : submitForm.data.notes}
                                    onChange={(e) => {
                                        if (selectedContentPlan) {
                                            submitForm.setData('freelancer_notes', e.target.value);
                                        } else {
                                            submitForm.setData('notes', e.target.value);
                                        }
                                    }}
                                    placeholder="Contoh: Sudah selesai render 1080x1920 MP4, audio sudah dibersihkan..."
                                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitForm.processing}
                                    className="px-5 py-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitForm.processing ? 'Mengirim...' : 'Kirim Hasil Kerja Sekarang 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
