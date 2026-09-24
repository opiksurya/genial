import React, { useState } from 'react';
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
    DollarSign,
    Search,
    Briefcase,
    Sparkles,
    Video,
    Palette,
    FileText,
    Code,
    Mic,
    Share2,
    Calendar,
    Wallet,
    FolderKanban,
    AlertCircle,
    Send,
    CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';

interface FreelancerAssignment {
    id: number;
    freelancer_id: number;
    project_id?: number | null;
    task_id?: number | null;
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
    freelancer?: {
        id: number;
        name: string;
        role: string;
        phone?: string;
        bank_name?: string;
        bank_account_number?: string;
        bank_account_name?: string;
    };
    project?: {
        id: number;
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
    freelancer_id?: number | null;
    freelancer_fee: number;
    freelancer_status?: string;
    payout_status: 'unpaid' | 'approved' | 'paid';
    paid_at?: string;
    freelancer?: {
        id: number;
        name: string;
        role: string;
        phone?: string;
        bank_name?: string;
        bank_account_number?: string;
        bank_account_name?: string;
    };
    project?: {
        id: number;
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
    portfolio_link?: string;
    rate_per_project: number;
    rate_unit: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    access_token: string;
    portal_url: string;
    status: 'active' | 'inactive';
    notes?: string;
    total_assignments?: number;
    active_assignments?: number;
    completed_assignments?: number;
    total_earnings?: number;
    paid_earnings?: number;
    unpaid_earnings?: number;
    assignments?: FreelancerAssignment[];
}

interface Props {
    freelancers: Freelancer[];
    assignments: FreelancerAssignment[];
    contentPlans?: ContentPlanItem[];
    projects: { id: number; name: string; client?: string }[];
    tasks: { id: number; title: string; project_id?: number }[];
    stats: {
        total_freelancers: number;
        active_freelancers: number;
        total_jobs: number;
        active_jobs: number;
        completed_jobs: number;
        total_fees: number;
        paid_fees: number;
        unpaid_fees: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Freelancer Hub', href: '/freelancers' },
];

export default function FreelancersIndex({ 
    freelancers = [], 
    assignments = [], 
    contentPlans = [],
    projects = [], 
    tasks = [], 
    stats 
}: Props) {
    const [activeTab, setActiveTab] = useState<'freelancers' | 'content_jobs' | 'assignments' | 'payouts'>('freelancers');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);

    // Modal Freelancer
    const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
    const [editingFreelancer, setEditingFreelancer] = useState<Freelancer | null>(null);

    // Modal Assignment
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<FreelancerAssignment | null>(null);

    // Freelancer Form
    const freelancerForm = useForm({
        name: '',
        role: 'Video Editor & Reels',
        email: '',
        phone: '',
        portfolio_link: '',
        rate_per_project: '',
        rate_unit: 'per_project',
        bank_name: 'BCA',
        bank_account_number: '',
        bank_account_name: '',
        status: 'active',
        notes: '',
    });

    // Assignment Form
    const assignmentForm = useForm({
        freelancer_id: '',
        project_id: '',
        task_id: '',
        title: '',
        description: '',
        brief_link: '',
        submission_link: '',
        fee_amount: '',
        deadline: '',
        status: 'assigned',
        payment_status: 'unpaid',
        notes: '',
    });

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleCopyPortalUrl = (freelancer: Freelancer) => {
        navigator.clipboard.writeText(freelancer.portal_url);
        setCopiedTokenId(freelancer.id);
        toast.success(`Magic Link Portal untuk ${freelancer.name} berhasil disalin!`);
        setTimeout(() => setCopiedTokenId(null), 3000);
    };

    const handleOpenCreateFreelancer = () => {
        setEditingFreelancer(null);
        freelancerForm.reset();
        setIsFreelancerModalOpen(true);
    };

    const handleOpenEditFreelancer = (fl: Freelancer) => {
        setEditingFreelancer(fl);
        freelancerForm.setData({
            name: fl.name,
            role: fl.role,
            email: fl.email || '',
            phone: fl.phone || '',
            portfolio_link: fl.portfolio_link || '',
            rate_per_project: fl.rate_per_project ? String(fl.rate_per_project) : '',
            rate_unit: fl.rate_unit || 'per_project',
            bank_name: fl.bank_name || 'BCA',
            bank_account_number: fl.bank_account_number || '',
            bank_account_name: fl.bank_account_name || '',
            status: fl.status || 'active',
            notes: fl.notes || '',
        });
        setIsFreelancerModalOpen(true);
    };

    const handleSubmitFreelancer = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFreelancer) {
            freelancerForm.put(`/freelancers/${editingFreelancer.id}`, {
                onSuccess: () => {
                    setIsFreelancerModalOpen(false);
                    toast.success('Data Freelancer berhasil diupdate!');
                },
            });
        } else {
            freelancerForm.post('/freelancers', {
                onSuccess: () => {
                    setIsFreelancerModalOpen(false);
                    toast.success('Freelancer baru berhasil ditambahkan!');
                },
            });
        }
    };

    const handleDeleteFreelancer = (fl: Freelancer) => {
        if (!confirm(`Hapus freelancer "${fl.name}" beserta riwayat tugasnya?`)) return;
        router.delete(`/freelancers/${fl.id}`, {
            onSuccess: () => toast.success('Freelancer berhasil dihapus.'),
        });
    };

    // Assignment Handlers
    const handleOpenCreateAssignment = (defaultFreelancerId?: number) => {
        setEditingAssignment(null);
        assignmentForm.reset();
        if (defaultFreelancerId) {
            assignmentForm.setData('freelancer_id', String(defaultFreelancerId));
            const fl = freelancers.find(f => f.id === defaultFreelancerId);
            if (fl && fl.rate_per_project) {
                assignmentForm.setData('fee_amount', String(fl.rate_per_project));
            }
        }
        setIsAssignmentModalOpen(true);
    };

    const handleOpenEditAssignment = (item: FreelancerAssignment) => {
        setEditingAssignment(item);
        assignmentForm.setData({
            freelancer_id: String(item.freelancer_id),
            project_id: item.project_id ? String(item.project_id) : '',
            task_id: item.task_id ? String(item.task_id) : '',
            title: item.title,
            description: item.description || '',
            brief_link: item.brief_link || '',
            submission_link: item.submission_link || '',
            fee_amount: String(item.fee_amount),
            deadline: item.deadline || '',
            status: item.status,
            payment_status: item.payment_status,
            notes: item.notes || '',
        });
        setIsAssignmentModalOpen(true);
    };

    const handleSubmitAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAssignment) {
            assignmentForm.put(`/freelancers/assignments/${editingAssignment.id}`, {
                onSuccess: () => {
                    setIsAssignmentModalOpen(false);
                    toast.success('Penugasan job berhasil diupdate!');
                },
            });
        } else {
            assignmentForm.post('/freelancers/assignments', {
                onSuccess: () => {
                    setIsAssignmentModalOpen(false);
                    toast.success('Penugasan job berhasil dibuat!');
                },
            });
        }
    };

    const handleDeleteAssignment = (item: FreelancerAssignment) => {
        if (!confirm(`Hapus penugasan "${item.title}"?`)) return;
        router.delete(`/freelancers/assignments/${item.id}`, {
            onSuccess: () => toast.success('Penugasan job berhasil dihapus.'),
        });
    };

    const handleTogglePayout = (item: FreelancerAssignment, newStatus: 'paid' | 'unpaid') => {
        router.put(`/freelancers/assignments/${item.id}/pay`, {
            status: newStatus,
            record_expense: true,
        }, {
            onSuccess: () => {
                toast.success(newStatus === 'paid' ? 'Honorarium berhasil dicatat LUNAS & masuk Expense!' : 'Status diubah ke Pending');
            }
        });
    };

    // Content Plan Handlers
    const handleApproveContentPlan = (plan: ContentPlanItem) => {
        router.post(`/content-calendar/${plan.id}/approve-freelancer`, {}, {
            onSuccess: () => toast.success(`Konten "${plan.title}" berhasil di-ACC! Upah siap dicairkan.`),
        });
    };

    const handlePayContentPlan = (plan: ContentPlanItem, newStatus: 'paid' | 'unpaid') => {
        router.put(`/content-calendar/${plan.id}/pay-freelancer`, {
            status: newStatus,
            record_expense: true,
        }, {
            onSuccess: () => toast.success(newStatus === 'paid' ? `Upah konten "${plan.title}" dicairkan LUNAS!` : 'Status upah diubah.'),
        });
    };

    // Filters
    const filteredFreelancers = freelancers.filter(fl => {
        const matchesSearch = fl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fl.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (fl.phone && fl.phone.includes(searchQuery));
        const matchesRole = filterRole === 'all' || fl.role.toLowerCase().includes(filterRole.toLowerCase());
        const matchesStatus = filterStatus === 'all' || fl.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const filteredContentPlans = contentPlans.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.freelancer?.name && item.freelancer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.project?.name && item.project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.platform.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const filteredAssignments = assignments.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.freelancer?.name && item.freelancer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.project?.name && item.project.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Freelancer Hub & Talent Pool" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
                
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-1.5 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold border border-white/10">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Terkoneksi dengan Kalender Konten & FinanceFlow</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Briefcase className="w-7 h-7 text-purple-300" />
                            <span>Freelancer Hub</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-purple-100/80 max-w-2xl">
                            Kelola talent freelance, distribusi joblist kalender konten otomatis, review deliverable, ACC hasil kerja, dan pencairan upah ke FinanceFlow Expense.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap relative z-10">
                        <a
                            href="/content-calendar"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-sm"
                        >
                            <CalendarDays className="w-4 h-4 text-purple-300" />
                            <span>Buka Kalender Konten</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleOpenCreateFreelancer}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/30 transition-all cursor-pointer"
                        >
                            <Users className="w-4 h-4" />
                            <span>+ Tambah Freelancer</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-black">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Freelancer</div>
                            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{stats.total_freelancers} <span className="text-xs font-normal text-emerald-600">({stats.active_freelancers} Aktif)</span></div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-black">
                            <FolderKanban className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Job Dalam Pengerjaan</div>
                            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{stats.active_jobs} <span className="text-xs font-normal text-slate-500">/ {stats.total_jobs} Total</span></div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-black">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upah Sudah Dicairkan</div>
                            <div className="text-xl font-black text-emerald-600">{formatIDR(stats.paid_fees)}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-black">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Menunggu Pencairan</div>
                            <div className="text-xl font-black text-amber-600">{formatIDR(stats.unpaid_fees)}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setActiveTab('freelancers')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'freelancers'
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Daftar Freelancer ({freelancers.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('content_jobs')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'content_jobs'
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Job Kalender Konten ({contentPlans.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('assignments')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'assignments'
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Tugas Project Lain ({assignments.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('payouts')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'payouts'
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>ACC & Pencairan Upah</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, role, job..."
                                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary w-48 sm:w-60"
                            />
                        </div>
                    </div>
                </div>

                {/* TAB 1: DAFTAR FREELANCER */}
                {activeTab === 'freelancers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFreelancers.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada freelancer terdaftar</h3>
                                <p className="text-xs text-slate-500 mt-1">Tambahkan talent freelance pertama Anda untuk mulai mendistribusikan job brief.</p>
                                <button
                                    type="button"
                                    onClick={handleOpenCreateFreelancer}
                                    className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                                >
                                    + Tambah Freelancer Sekarang
                                </button>
                            </div>
                        ) : (
                            filteredFreelancers.map((fl) => (
                                <div
                                    key={fl.id}
                                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                                >
                                    <div className="space-y-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-purple-600/20">
                                                    {fl.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <span>{fl.name}</span>
                                                        <span className={`w-2 h-2 rounded-full ${fl.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    </h3>
                                                    <span className="inline-block text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/50 dark:border-purple-800/50 mt-0.5">
                                                        {fl.role}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditFreelancer(fl)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                                    title="Edit Freelancer"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFreelancer(fl)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                                    title="Hapus Freelancer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rate & Bank Info */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                <span>Standar Rate:</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                                    {fl.rate_per_project ? `${formatIDR(Number(fl.rate_per_project))} / job` : 'Sesuai Kesepakatan'}
                                                </span>
                                            </div>
                                            {fl.bank_name && (
                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                    <span>Rekening:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {fl.bank_name} {fl.bank_account_number} ({fl.bank_account_name || fl.name})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact & Portfolio Links */}
                                        <div className="flex items-center gap-2 flex-wrap text-xs">
                                            {fl.phone && (
                                                <a
                                                    href={`https://wa.me/${fl.phone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    <span>WhatsApp</span>
                                                </a>
                                            )}
                                            {fl.portfolio_link && (
                                                <a
                                                    href={fl.portfolio_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>Portfolio</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Magic Link Bar */}
                                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                                            <LinkIcon className="w-3 h-3" />
                                            <span>Magic Portal Link</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyPortalUrl(fl)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                                                title="Salin Magic Link Portal"
                                            >
                                                {copiedTokenId === fl.id ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                        <span>Disalin!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        <span>Salin Link</span>
                                                    </>
                                                )}
                                            </button>

                                            <a
                                                href={fl.portal_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 text-slate-400 hover:text-primary rounded-lg transition-all"
                                                title="Buka Portal Freelancer"
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

                {/* TAB 2: JOB KALENDER KONTEN */}
                {activeTab === 'content_jobs' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Pekerjaan dari Kalender Konten ({filteredContentPlans.length})
                            </h2>
                            <a
                                href="/content-calendar"
                                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                            >
                                + Buka Kalender Konten
                            </a>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Konten & Platform</th>
                                            <th className="px-4 py-3">Freelancer</th>
                                            <th className="px-4 py-3">Jadwal Post</th>
                                            <th className="px-4 py-3">Upah / Fee</th>
                                            <th className="px-4 py-3">Status Freelancer</th>
                                            <th className="px-4 py-3">Hasil Kerja (Link)</th>
                                            <th className="px-4 py-3 text-right">Aksi ACC / Bayar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredContentPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada konten yang ditugaskan ke freelancer. Buka <strong>Kalender Konten</strong> dan pilih freelancer saat membuat/mengedit konten.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredContentPlans.map((plan) => (
                                                <tr key={plan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-all">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-slate-900 dark:text-slate-100">{plan.title}</div>
                                                        <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                                            {plan.platform} • {plan.format} • {plan.pillar}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{plan.freelancer?.name || '-'}</div>
                                                        <div className="text-[11px] text-slate-500">{plan.freelancer?.role}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            {plan.scheduled_date}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                                        {formatIDR(Number(plan.freelancer_fee))}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block capitalize ${
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
                                                            {plan.freelancer_status || 'assigned'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {plan.submission_link ? (
                                                            <a
                                                                href={plan.submission_link}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 hover:bg-emerald-100"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                <span>Buka Hasil</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px] italic">Belum submit</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {plan.freelancer_status !== 'approved' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApproveContentPlan(plan)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    <span>ACC</span>
                                                                </button>
                                                            )}

                                                            {plan.payout_status === 'approved' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePayContentPlan(plan, 'paid')}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                                                                >
                                                                    <Wallet className="w-3 h-3" />
                                                                    <span>Cairkan</span>
                                                                </button>
                                                            )}

                                                            {plan.payout_status === 'paid' && (
                                                                <span className="text-[11px] font-bold text-emerald-600">
                                                                    LUNAS
                                                                </span>
                                                            )}
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
                )}

                {/* TAB 3: TUGAS PROJECT LAIN */}
                {activeTab === 'assignments' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Tugas Project & Custom Job ({filteredAssignments.length})
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleOpenCreateAssignment()}
                                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer"
                            >
                                + Buat Penugasan Job
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Judul Job & Deskripsi</th>
                                            <th className="px-4 py-3">Freelancer</th>
                                            <th className="px-4 py-3">Project</th>
                                            <th className="px-4 py-3">Deadline</th>
                                            <th className="px-4 py-3">Fee / Honor</th>
                                            <th className="px-4 py-3">Status Job</th>
                                            <th className="px-4 py-3">Hasil Kerja</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada penugasan job. Klik tombol "+ Buat Penugasan Job" di atas.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAssignments.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-all">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                                                        {item.description && (
                                                            <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.freelancer?.name || '-'}</div>
                                                        <div className="text-[11px] text-purple-600 dark:text-purple-400">{item.freelancer?.role}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {item.project?.name || 'General Agency'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {item.deadline ? (
                                                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                {item.deadline}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                                        {formatIDR(Number(item.fee_amount))}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block capitalize ${
                                                            item.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                                                                : item.status === 'submitted'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200'
                                                                : item.status === 'revision'
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                                                                : item.status === 'in_progress'
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}>
                                                            {item.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {item.submission_link ? (
                                                            <a
                                                                href={item.submission_link}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 hover:bg-emerald-100"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                <span>Buka Hasil</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">Belum submit</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditAssignment(item)}
                                                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAssignment(item)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
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
                )}

                {/* TAB 4: ACC & PENCAIRAN UPAH */}
                {activeTab === 'payouts' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Wallet className="w-6 h-6 text-amber-600 shrink-0" />
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Alur Pencairan Upah Freelancer Terkoneksi</h3>
                                    <p className="text-[11px] text-slate-500">
                                        1. Freelancer kirim hasil kerja &rarr; 2. Admin klik <strong>ACC (Disetujui)</strong> &rarr; 3. Admin klik <strong>Cairkan Upah</strong> &rarr; Otomatis tercatat di <strong>FinanceFlow &gt; Expense</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Calendar Payouts */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                📅 Upah Pekerjaan Kalender Konten ({contentPlans.length})
                            </h3>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Freelancer & Rekening</th>
                                            <th className="px-4 py-3">Konten</th>
                                            <th className="px-4 py-3">Upah (Fee)</th>
                                            <th className="px-4 py-3">Status Payout</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {contentPlans.map((plan) => (
                                            <tr key={plan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{plan.freelancer?.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        {plan.freelancer?.bank_name} - {plan.freelancer?.bank_account_number}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                    {plan.title}
                                                    <div className="text-[11px] text-purple-600">{plan.platform} ({plan.format})</div>
                                                </td>
                                                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                                    {formatIDR(Number(plan.freelancer_fee))}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {plan.payout_status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Lunas (Paid)</span>
                                                        </span>
                                                    ) : plan.payout_status === 'approved' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <Check className="w-3 h-3" />
                                                            <span>Di-ACC (Siap Cair)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Belum Di-ACC</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {plan.payout_status === 'paid' ? (
                                                        <span className="text-[11px] font-bold text-emerald-600">Lunas</span>
                                                    ) : plan.payout_status === 'approved' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePayContentPlan(plan, 'paid')}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white rounded-xl shadow-sm cursor-pointer"
                                                        >
                                                            <Wallet className="w-3.5 h-3.5" />
                                                            <span>Cairkan Upah</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveContentPlan(plan)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>ACC Sekarang</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL TAMBAH / EDIT FREELANCER */}
            {isFreelancerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span>{editingFreelancer ? 'Edit Data Freelancer' : 'Tambah Freelancer Baru'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsFreelancerModalOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitFreelancer} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    required
                                    value={freelancerForm.data.name}
                                    onChange={(e) => freelancerForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Dimas Bagas"
                                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Spesialisasi / Role *</label>
                                <select
                                    value={freelancerForm.data.role}
                                    onChange={(e) => freelancerForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="Video Editor & Reels">Video Editor & Reels</option>
                                    <option value="Graphic Designer & Canva">Graphic Designer & Canva</option>
                                    <option value="Copywriter & Content Writer">Copywriter & Content Writer</option>
                                    <option value="Voice Over & Talent">Voice Over & Talent</option>
                                    <option value="Web & Landing Page Dev">Web & Landing Page Dev</option>
                                    <option value="Social Media Specialist">Social Media Specialist</option>
                                    <option value="Freelancer General">Freelancer General</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp / HP</label>
                                    <input
                                        type="text"
                                        value={freelancerForm.data.phone}
                                        onChange={(e) => freelancerForm.setData('phone', e.target.value)}
                                        placeholder="081234567890"
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
                                    <input
                                        type="email"
                                        value={freelancerForm.data.email}
                                        onChange={(e) => freelancerForm.setData('email', e.target.value)}
                                        placeholder="email@gmail.com"
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standar Rate (Rp)</label>
                                    <input
                                        type="number"
                                        value={freelancerForm.data.rate_per_project}
                                        onChange={(e) => freelancerForm.setData('rate_per_project', e.target.value)}
                                        placeholder="Contoh: 150000"
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Link Portofolio</label>
                                    <input
                                        type="url"
                                        value={freelancerForm.data.portfolio_link}
                                        onChange={(e) => freelancerForm.setData('portfolio_link', e.target.value)}
                                        placeholder="https://behance.net/..."
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Info Pembayaran / Rekening Bank</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama Bank (BCA/Mandiri)"
                                        value={freelancerForm.data.bank_name}
                                        onChange={(e) => freelancerForm.setData('bank_name', e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="No Rekening"
                                        value={freelancerForm.data.bank_account_number}
                                        onChange={(e) => freelancerForm.setData('bank_account_number', e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Atas Nama"
                                        value={freelancerForm.data.bank_account_name}
                                        onChange={(e) => freelancerForm.setData('bank_account_name', e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsFreelancerModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={freelancerForm.processing}
                                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
                                >
                                    {freelancerForm.processing ? 'Menyimpan...' : 'Simpan Data Freelancer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BUAT / EDIT PENUGASAN JOB */}
            {isAssignmentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                <span>{editingAssignment ? 'Edit Penugasan Job' : 'Tugaskan Job ke Freelancer'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAssignmentModalOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAssignment} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Freelancer *</label>
                                <select
                                    required
                                    value={assignmentForm.data.freelancer_id}
                                    onChange={(e) => {
                                        const flId = e.target.value;
                                        assignmentForm.setData('freelancer_id', flId);
                                        const fl = freelancers.find(f => f.id === Number(flId));
                                        if (fl && fl.rate_per_project && !assignmentForm.data.fee_amount) {
                                            assignmentForm.setData('fee_amount', String(fl.rate_per_project));
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">-- Pilih Freelancer --</option>
                                    {freelancers.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} ({f.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Job / Task *</label>
                                <input
                                    type="text"
                                    required
                                    value={assignmentForm.data.title}
                                    onChange={(e) => assignmentForm.setData('title', e.target.value)}
                                    placeholder="Contoh: Edit 5 Video TikTok Hoof ID Promo Batch Juli"
                                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Klien</label>
                                    <select
                                        value={assignmentForm.data.project_id}
                                        onChange={(e) => assignmentForm.setData('project_id', e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">-- General Agency --</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} {p.client ? `(${p.client})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deadline</label>
                                    <input
                                        type="date"
                                        value={assignmentForm.data.deadline}
                                        onChange={(e) => assignmentForm.setData('deadline', e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Honor / Fee (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={assignmentForm.data.fee_amount}
                                        onChange={(e) => assignmentForm.setData('fee_amount', e.target.value)}
                                        placeholder="Contoh: 250000"
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Pengerjaan</label>
                                    <select
                                        value={assignmentForm.data.status}
                                        onChange={(e) => assignmentForm.setData('status', e.target.value as any)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="assigned">Assigned (Ditugaskan)</option>
                                        <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                                        <option value="submitted">Submitted (Menunggu Review)</option>
                                        <option value="revision">Revision (Perlu Revisi)</option>
                                        <option value="completed">Completed (Selesai)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Link Brief / Asset (Google Drive / Figma)</label>
                                <input
                                    type="url"
                                    value={assignmentForm.data.brief_link}
                                    onChange={(e) => assignmentForm.setData('brief_link', e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan / Detail Instruksi</label>
                                <textarea
                                    rows={3}
                                    value={assignmentForm.data.description}
                                    onChange={(e) => assignmentForm.setData('description', e.target.value)}
                                    placeholder="Tuliskan catatan khusus atau poin-poin brief..."
                                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignmentModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignmentForm.processing}
                                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
                                >
                                    {assignmentForm.processing ? 'Menyimpan...' : 'Simpan Penugasan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
