import React, { useState } from 'react';
import { 
    X, 
    ExternalLink, 
    Sparkles, 
    Trash2, 
    Loader2, 
    Copy, 
    Check, 
    Calendar,
    Share2,
    Video,
    Layers,
    Image as ImageIcon,
    Tag,
    UserCheck,
    DollarSign,
    CheckCircle2,
    Clock,
    Wallet,
    Send,
    AlertCircle
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export interface ContentItem {
    id?: number;
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
    freelancer_fee?: number;
    freelancer_status?: 'unassigned' | 'assigned' | 'in_progress' | 'submitted' | 'revision' | 'approved';
    payout_status?: 'unpaid' | 'approved' | 'paid';
    paid_at?: string;
    freelancer?: {
        id: number;
        name: string;
        role: string;
        phone?: string;
        rate_per_project?: number;
        bank_name?: string;
        bank_account_number?: string;
    };
    visual_detail?: string;
    wording?: string;
    copywriting?: string;
    hashtags?: string;
    notes?: string;
    brand_name?: string;
    project_id?: number | null;
}

interface FreelancerOption {
    id: number;
    name: string;
    role: string;
    rate_per_project?: number;
    bank_name?: string;
    bank_account_number?: string;
}

interface CreativeServiceOption {
    id: number;
    name: string;
    category: string;
    format: string;
    client_price: number;
    freelancer_cost: number;
    unit: string;
    deliverables?: string;
}

interface ContentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ContentItem | null;
    freelancers?: FreelancerOption[];
    creativeServices?: CreativeServiceOption[];
    onItemUpdated?: (updated: ContentItem) => void;
}

export function ContentDetailModal({ isOpen, onClose, item, freelancers = [], creativeServices = [], onItemUpdated }: ContentDetailModalProps) {
    const [form, setForm] = useState<ContentItem>(() => item || {
        title: '',
        scheduled_date: '',
        platform: 'TikTok',
        format: 'Video',
        pillar: 'Product Showcase',
        status: 'Draft',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [refineInstruction, setRefineInstruction] = useState('');
    const [copied, setCopied] = useState(false);

    // Update internal state when item changes
    React.useEffect(() => {
        if (item) {
            setForm({ ...item });
        }
    }, [item]);

    // Format date string for display (e.g. "Wednesday, 08 July 2026")
    const formattedDate = React.useMemo(() => {
        try {
            if (!form?.scheduled_date) return '';
            const d = new Date(form.scheduled_date + 'T00:00:00');
            return d.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return form?.scheduled_date || '';
        }
    }, [form?.scheduled_date]);

    if (!isOpen || !item) return null;

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleFreelancerChange = (flIdStr: string) => {
        if (!flIdStr) {
            setForm({
                ...form,
                freelancer_id: null,
                freelancer_fee: 0,
                freelancer_status: 'unassigned',
            });
            return;
        }
        const flId = Number(flIdStr);
        const fl = freelancers.find(f => f.id === flId);
        setForm({
            ...form,
            freelancer_id: flId,
            freelancer_fee: fl?.rate_per_project ? Number(fl.rate_per_project) : form.freelancer_fee || 0,
            freelancer_status: form.freelancer_status === 'unassigned' ? 'assigned' : form.freelancer_status,
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        if (form.id) {
            router.put(`/content-calendar/${form.id}`, form as any, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    toast.success('Revisi konten berhasil disimpan!');
                    if (onItemUpdated) onItemUpdated(form);
                    onClose();
                },
                onError: () => {
                    setIsSaving(false);
                    toast.error('Gagal menyimpan konten. Periksa inputan.');
                }
            });
        }
    };

    const handleApproveWork = () => {
        if (!form.id) return;
        setIsApproving(true);
        router.post(`/content-calendar/${form.id}/approve-freelancer`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsApproving(false);
                setForm({
                    ...form,
                    freelancer_status: 'approved',
                    payout_status: 'approved',
                    status: 'Scheduled',
                });
                toast.success('Hasil kerja freelancer di-ACC! Upah siap dicairkan.');
            },
            onError: () => {
                setIsApproving(false);
                toast.error('Gagal meng-ACC pekerjaan.');
            }
        });
    };

    const handlePayFee = (status: 'paid' | 'unpaid') => {
        if (!form.id) return;
        setIsPaying(true);
        router.put(`/content-calendar/${form.id}/pay-freelancer`, {
            status,
            record_expense: true,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsPaying(false);
                setForm({
                    ...form,
                    payout_status: status,
                });
                toast.success(status === 'paid' ? 'Upah berhasil dicairkan & masuk Expense FinanceFlow!' : 'Status upah diubah.');
            },
            onError: () => {
                setIsPaying(false);
                toast.error('Gagal memproses pembayaran.');
            }
        });
    };

    const handleDelete = () => {
        if (!form.id) {
            onClose();
            return;
        }
        if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return;

        setIsDeleting(true);
        router.delete(`/content-calendar/${form.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                toast.success('Konten berhasil dihapus.');
                onClose();
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Gagal menghapus konten.');
            }
        });
    };

    const copyCaption = () => {
        const fullText = `${form.copywriting || ''}\n\n${form.hashtags || ''}`;
        navigator.clipboard.writeText(fullText.trim());
        setCopied(true);
        toast.success('Copywriting & Hashtag disalin ke clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAiRefine = async (presetInstruction?: string) => {
        const instruction = presetInstruction || refineInstruction;
        if (!instruction.trim()) return;

        setIsRefining(true);
        try {
            const res = await fetch('/content-calendar/refine-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    title: form.title,
                    platform: form.platform,
                    format: form.format,
                    pillar: form.pillar,
                    visual_detail: form.visual_detail,
                    wording: form.wording,
                    copywriting: form.copywriting,
                    hashtags: form.hashtags,
                    instruction,
                }),
            });

            const data = await res.json();
            if (data.success && data.data) {
                setForm({
                    ...form,
                    ...data.data,
                });
                toast.success('Konten berhasil di-refine dengan AI! Periksa perubahan di bawah.');
                setRefineInstruction('');
            } else {
                toast.error('Gagal refine konten.');
            }
        } catch {
            toast.error('Terjadi kesalahan saat memproses AI.');
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Header with Badges */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Select */}
                        <div className="relative">
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className={`appearance-none font-bold text-xs uppercase px-2.5 py-1 pr-6 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all ${
                                    form.status === 'Revisi' || form.status === 'Revision'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                        : form.status === 'In Progress'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                        : form.status === 'Scheduled'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                        : form.status === 'Published'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <option value="Draft">DRAFT</option>
                                <option value="In Progress">IN PROGRESS</option>
                                <option value="Revisi">REVISI</option>
                                <option value="Scheduled">SCHEDULED</option>
                                <option value="Published">PUBLISHED</option>
                            </select>
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-500">▼</span>
                        </div>

                        {/* Format Tag */}
                        <select
                            value={form.format}
                            onChange={(e) => setForm({ ...form, format: e.target.value })}
                            className="font-bold text-xs uppercase px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="Video">VIDEO</option>
                            <option value="Carousel">CAROUSEL</option>
                            <option value="Image">IMAGE</option>
                            <option value="Story">STORY</option>
                        </select>

                        {/* Pillar Tag */}
                        <div className="flex items-center gap-1">
                            <select
                                value={['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial', 'Tips & Trik', 'Tren'].includes(form.pillar) ? form.pillar : '__custom__'}
                                onChange={(e) => {
                                    if (e.target.value === '__custom__') {
                                        const customVal = prompt('Masukkan nama Pilar Konten / Tema custom:', form.pillar);
                                        if (customVal && customVal.trim()) {
                                            setForm({ ...form, pillar: customVal.trim() });
                                        }
                                    } else {
                                        setForm({ ...form, pillar: e.target.value });
                                    }
                                }}
                                className="font-bold text-xs uppercase px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            >
                                <option value="Product Showcase">PRODUCT SHOWCASE</option>
                                <option value="Edukasi">EDUKASI</option>
                                <option value="Behind The Scene">BEHIND THE SCENE</option>
                                <option value="Promo">PROMO</option>
                                <option value="Testimonial">TESTIMONIAL</option>
                                <option value="Tips & Trik">TIPS & TRIK</option>
                                <option value="Tren">TREN</option>
                                {!['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial', 'Tips & Trik', 'Tren'].includes(form.pillar) && (
                                    <option value={form.pillar}>{form.pillar.toUpperCase()}</option>
                                )}
                                <option value="__custom__">+ CUSTOM PILAR...</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Title & Schedule Info */}
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Judul Konten..."
                            className="w-full text-xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-0 border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:outline-none focus:ring-0 px-0 py-1 transition-all"
                        />
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span>Jadwal: {formattedDate}</span>
                            <span>•</span>
                            <div className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                <span>{form.platform}</span>
                            </div>
                        </div>
                    </div>

                    {/* FREELANCER ASSIGNMENT & ACC / PAYOUT SECTION */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-indigo-50/50 to-slate-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/60 space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                                    Penugasan Freelancer & Pencairan Upah
                                </span>
                            </div>

                            {form.freelancer_id && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                    form.freelancer_status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                        : form.freelancer_status === 'submitted'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                                        : form.freelancer_status === 'revision'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                                        : form.freelancer_status === 'in_progress'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                    Status: {form.freelancer_status || 'assigned'}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pilih Freelancer</label>
                                <select
                                    value={form.freelancer_id ? String(form.freelancer_id) : ''}
                                    onChange={(e) => handleFreelancerChange(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                >
                                    <option value="">-- Tanpa Freelancer (Internal) --</option>
                                    {freelancers.map((fl) => (
                                        <option key={fl.id} value={fl.id}>
                                            {fl.name} ({fl.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Upah / Fee per Konten (Rp)</label>
                                <input
                                    type="number"
                                    value={form.freelancer_fee || ''}
                                    onChange={(e) => setForm({ ...form, freelancer_fee: Number(e.target.value) })}
                                    placeholder="Contoh: 150000"
                                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-bold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Deliverable Review & Admin Action Bar */}
                        {form.freelancer_id && (
                            <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-purple-100 dark:border-purple-900/60 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[11px] text-slate-500">Hasil Kerja / Deliverable Freelancer:</div>
                                        {form.submission_link ? (
                                            <a
                                                href={form.submission_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-0.5"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Buka File / Google Drive Hasil Kerja</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Freelancer belum mengunggah link hasil kerja</span>
                                        )}
                                        {form.freelancer_notes && (
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                                "{form.freelancer_notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* ACC & Cairkan Upah Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {form.freelancer_status !== 'approved' && (
                                            <button
                                                type="button"
                                                onClick={handleApproveWork}
                                                disabled={isApproving}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                <span>ACC / Setujui Konten</span>
                                            </button>
                                        )}

                                        {form.payout_status === 'approved' && (
                                            <button
                                                type="button"
                                                onClick={() => handlePayFee('paid')}
                                                disabled={isPaying}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {isPaying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                                                <span>Cairkan Upah ({formatIDR(Number(form.freelancer_fee))})</span>
                                            </button>
                                        )}

                                        {form.payout_status === 'paid' && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200">
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Upah LUNAS (Paid)</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reference Link */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Reference Link
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="url"
                                value={form.reference_link || ''}
                                onChange={(e) => setForm({ ...form, reference_link: e.target.value })}
                                placeholder="https://www.tiktok.com/search?q=..."
                                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                            {form.reference_link && (
                                <a
                                    href={form.reference_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-all whitespace-nowrap"
                                >
                                    <span>Buka Link Inspirasi</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* 2-Column Grid: Visual Detail & Wording */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Visual Detail */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Visual Detail / Arahan
                            </label>
                            <textarea
                                rows={4}
                                value={form.visual_detail || ''}
                                onChange={(e) => setForm({ ...form, visual_detail: e.target.value })}
                                placeholder="Detail kamera, adegan, angle shooting atau slide carousel..."
                                className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-y transition-all"
                            />
                        </div>

                        {/* Wording On-Screen */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Wording (Teks di Video/Gambar)
                            </label>
                            <textarea
                                rows={4}
                                value={form.wording || ''}
                                onChange={(e) => setForm({ ...form, wording: e.target.value })}
                                placeholder="Teks hook yang dicantumkan di layar video atau gambar..."
                                className="w-full p-3 text-xs font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-y transition-all"
                            />
                        </div>
                    </div>

                    {/* Copywriting / Caption */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Copywriting / Caption
                            </label>
                            <button
                                type="button"
                                onClick={copyCaption}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-primary transition-all cursor-pointer"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Disalin!' : 'Salin Caption'}</span>
                            </button>
                        </div>
                        <textarea
                            rows={3}
                            value={form.copywriting || ''}
                            onChange={(e) => setForm({ ...form, copywriting: e.target.value })}
                            placeholder="Tulis caption lengkap untuk postingan..."
                            className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-y transition-all"
                        />
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Hashtags
                        </label>
                        <input
                            type="text"
                            value={form.hashtags || ''}
                            onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                            placeholder="#jaketcustom #konveksijaket #apparel"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                    </div>

                    {/* AI Assistant Refine Box */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 border border-primary/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                                AI Content Refiner
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleAiRefine('Buat hook wording lebih viral dan penasaran')}
                                    disabled={isRefining}
                                    className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-800 hover:bg-primary/10 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    🔥 Hook Viral
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAiRefine('Tambahkan CTA yang lebih persuasif')}
                                    disabled={isRefining}
                                    className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-800 hover:bg-primary/10 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    🚀 Kuatkan CTA
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={refineInstruction}
                                onChange={(e) => setRefineInstruction(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiRefine()}
                                placeholder="Contoh: Buat copywriting lebih santai, tambahkan tips cuci taslan..."
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                            />
                            <button
                                type="button"
                                onClick={() => handleAiRefine()}
                                disabled={isRefining || !refineInstruction.trim()}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>Refine</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        {form.id && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                            >
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                <span>Hapus</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-primary/20 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Simpan Revisi</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
