import React, { useState } from 'react';
import { X, Plus, Calendar, Loader2, UserCheck, DollarSign, ExternalLink, Send, Sparkles } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ContentItem } from './content-detail-modal';

interface FreelancerOption {
    id: number;
    name: string;
    role: string;
    rate_per_project?: number;
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

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: string;
    initialPlatform?: string;
    projects: { id: number; name: string; client?: string }[];
    freelancers?: FreelancerOption[];
    creativeServices?: CreativeServiceOption[];
}

export function CreateContentModal({
    isOpen,
    onClose,
    initialDate,
    initialPlatform,
    projects = [],
    freelancers = [],
    creativeServices = [],
}: CreateContentModalProps) {
    const [form, setForm] = useState<Partial<ContentItem>>({
        title: '',
        scheduled_date: initialDate || new Date().toISOString().split('T')[0],
        scheduled_time: '19:00',
        platform: initialPlatform && initialPlatform !== 'all' ? initialPlatform : 'TikTok',
        format: 'Video',
        pillar: 'Product Showcase',
        status: 'Draft',
        freelancer_id: null,
        freelancer_fee: 0,
        freelancer_status: 'unassigned',
        payout_status: 'unpaid',
        reference_link: '',
        visual_detail: '',
        wording: '',
        copywriting: '',
        hashtags: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [standardBaseFee, setStandardBaseFee] = useState<number>(0);
    const [extraFee, setExtraFee] = useState<number>(0);

    React.useEffect(() => {
        if (isOpen) {
            setForm((prev) => ({
                ...prev,
                scheduled_date: initialDate || prev.scheduled_date || new Date().toISOString().split('T')[0],
                platform: initialPlatform && initialPlatform !== 'all' ? initialPlatform : (prev.platform || 'TikTok'),
            }));
        }
    }, [isOpen, initialDate, initialPlatform]);

    if (!isOpen) return null;

    const selectedService = (creativeServices || []).find((s) => s.id === Number(selectedServiceId));

    const handleCreativeServiceSelect = (serviceIdStr: string) => {
        setSelectedServiceId(serviceIdStr);
        if (!serviceIdStr) {
            setStandardBaseFee(0);
            return;
        }
        const sId = Number(serviceIdStr);
        const service = (creativeServices || []).find((s) => s.id === sId);
        if (!service) return;

        const base = Number(service.freelancer_cost) || 0;
        setStandardBaseFee(base);

        setForm((prev) => ({
            ...prev,
            format: service.format || prev.format || 'Video',
            freelancer_fee: base + extraFee,
            visual_detail: prev.visual_detail?.trim() ? prev.visual_detail : (service.deliverables || ''),
        }));
        toast.info(
            `Komponen dipilih: ${service.name} (Format otomatis: ${service.format}, Upah Dasar: Rp ${base.toLocaleString('id-ID')})`
        );
    };

    const handleExtraFeeChange = (val: number) => {
        setExtraFee(val);
        setForm((prev) => ({
            ...prev,
            freelancer_fee: standardBaseFee + val,
        }));
    };

    const handleFreelancerChange = (flIdStr: string) => {
        if (!flIdStr) {
            setForm({
                ...form,
                freelancer_id: null,
                freelancer_status: 'unassigned',
            });
            return;
        }
        const flId = Number(flIdStr);
        const fl = (freelancers || []).find(f => f.id === flId);
        const defaultRate = standardBaseFee > 0 ? (standardBaseFee + extraFee) : (fl?.rate_per_project ? Number(fl.rate_per_project) : 0);
        
        setForm({
            ...form,
            freelancer_id: flId,
            freelancer_fee: defaultRate,
            freelancer_status: 'assigned',
        });
    };

    const handleSave = () => {
        if (!form.title?.trim()) {
            toast.error('Judul konten wajib diisi');
            return;
        }

        setIsSaving(true);
        router.post('/content-calendar', form as any, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Konten berhasil ditambahkan!');
                onClose();
            },
            onError: () => {
                setIsSaving(false);
                toast.error('Gagal menambahkan konten.');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Tambah Rencana Konten
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Buat postingan baru & tugaskan ke Freelancer
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Preset Komponen Digital Kreatif */}
                    {creativeServices && creativeServices.length > 0 && (
                        <div className="p-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/25 space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Pilih Komponen Digital Kreatif (Auto Format & Standar Upah)
                                </label>
                                <span className="text-[10px] text-primary/70 font-semibold">Database Komponen</span>
                            </div>
                            <select
                                value={selectedServiceId}
                                onChange={(e) => handleCreativeServiceSelect(e.target.value)}
                                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-primary/30 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">-- Pilih Komponen (Atau Buat Manual) --</option>
                                {(creativeServices || []).map((service) => (
                                    <option key={service.id} value={service.id}>
                                        [{service.category || 'Layanan'}] {service.name} — Format: {service.format || 'Video'} (Upah Freelancer: Rp {Number(service.freelancer_cost || 0).toLocaleString('id-ID')})
                                    </option>
                                ))}
                            </select>

                            {selectedService && (
                                <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                                    <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold border border-primary/20">
                                        🎬 Format Otomatis: {selectedService.format}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200">
                                        💰 Standar Upah: Rp {Number(selectedService.freelancer_cost || 0).toLocaleString('id-ID')}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200">
                                        🏷️ Harga Klien: Rp {Number(selectedService.client_price || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Project / Klien Selection */}
                    {projects && projects.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Project / Klien (Opsional)
                            </label>
                            <select
                                value={form.project_id ? String(form.project_id) : ''}
                                onChange={(e) => setForm({ ...form, project_id: e.target.value ? Number(e.target.value) : null })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">-- Pilih Project / Klien --</option>
                                {(projects || []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.client ? `(${p.client})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Judul Konten <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title || ''}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Contoh: Showcase Jaket Windbreaker Custom"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Tanggal Posting
                            </label>
                            <input
                                type="date"
                                value={form.scheduled_date}
                                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Platform
                            </label>
                            <select
                                value={form.platform}
                                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="TikTok">TikTok</option>
                                <option value="Instagram Reels">Instagram Reels</option>
                                <option value="Shopee Video">Shopee Video</option>
                                <option value="YouTube Shorts">YouTube Shorts</option>
                                <option value="Instagram Feed">Instagram Feed</option>
                            </select>
                        </div>
                    </div>

                    {/* Freelancer Assignment & Fee Breakdown Bar */}
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                                    Penugasan Freelancer & Upah
                                </span>
                            </div>
                            {form.freelancer_id && (
                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                                    Ditugaskan
                                </span>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pilih Freelancer</label>
                                <select
                                    value={form.freelancer_id ? String(form.freelancer_id) : ''}
                                    onChange={(e) => handleFreelancerChange(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                >
                                    <option value="">-- Tanpa Freelancer (Dikerjakan Internal) --</option>
                                    {(freelancers || []).map((fl) => (
                                        <option key={fl.id} value={fl.id}>
                                            {fl.name} ({fl.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Upah Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        Upah Tambahan / Bonus (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={extraFee || ''}
                                        onChange={(e) => handleExtraFeeChange(Number(e.target.value) || 0)}
                                        placeholder="0 (Opsional bonus/transport)"
                                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                    <p className="text-[9px] text-slate-500">Standar komponen: Rp {standardBaseFee.toLocaleString('id-ID')}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-purple-900 dark:text-purple-300">
                                        Total Upah yang Dicairkan (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.freelancer_fee || ''}
                                        onChange={(e) => setForm({ ...form, freelancer_fee: Number(e.target.value) || 0 })}
                                        placeholder="Contoh: 150000"
                                        className="w-full px-3 py-1.5 text-xs bg-purple-100/70 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 rounded-xl font-bold text-purple-800 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                    <p className="text-[9px] text-purple-700 dark:text-purple-400 font-semibold">
                                        = Standar (Rp {standardBaseFee.toLocaleString('id-ID')}) + Tambahan (Rp {extraFee.toLocaleString('id-ID')})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Format Konten
                                </label>
                                {selectedService && (
                                    <span className="text-[10px] text-primary font-bold">
                                        (Otomatis: {selectedService.format})
                                    </span>
                                )}
                            </div>
                            <select
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Video">Video</option>
                                <option value="Carousel">Carousel</option>
                                <option value="Image">Image</option>
                                <option value="Story">Story</option>
                                <option value="VoiceOver">VoiceOver</option>
                                <option value="Script">Script</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pilar Konten
                            </label>
                            <select
                                value={['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial', 'Tips & Trik', 'Tren'].includes(form.pillar || '') ? form.pillar : '__custom__'}
                                onChange={(e) => {
                                    if (e.target.value === '__custom__') {
                                        const custom = prompt('Masukkan nama Pilar Konten / Tema kustom:', form.pillar || '');
                                        if (custom && custom.trim()) {
                                            setForm({ ...form, pillar: custom.trim() });
                                        }
                                    } else {
                                        setForm({ ...form, pillar: e.target.value });
                                    }
                                }}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Product Showcase">Product Showcase</option>
                                <option value="Edukasi">Edukasi</option>
                                <option value="Behind The Scene">Behind The Scene</option>
                                <option value="Promo">Promo</option>
                                <option value="Testimonial">Testimonial</option>
                                <option value="Tips & Trik">Tips & Trik</option>
                                <option value="Tren">Tren</option>
                                {form.pillar && !['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial', 'Tips & Trik', 'Tren'].includes(form.pillar) && (
                                    <option value={form.pillar}>{form.pillar}</option>
                                )}
                                <option value="__custom__">+ Custom Pilar...</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Status Konten
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Draft">Draft</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Revisi">Revisi</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Reference Link
                        </label>
                        <input
                            type="url"
                            value={form.reference_link || ''}
                            onChange={(e) => setForm({ ...form, reference_link: e.target.value })}
                            placeholder="https://www.tiktok.com/search?q=..."
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Visual Detail / Arahan
                        </label>
                        <textarea
                            rows={3}
                            value={form.visual_detail || ''}
                            onChange={(e) => setForm({ ...form, visual_detail: e.target.value })}
                            placeholder="Detail kamera atau visual..."
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Wording (Teks di Video/Gambar)
                        </label>
                        <textarea
                            rows={2}
                            value={form.wording || ''}
                            onChange={(e) => setForm({ ...form, wording: e.target.value })}
                            placeholder="Teks hook di layar..."
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Copywriting / Caption
                        </label>
                        <textarea
                            rows={3}
                            value={form.copywriting || ''}
                            onChange={(e) => setForm({ ...form, copywriting: e.target.value })}
                            placeholder="Caption postingan..."
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 rounded-xl transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Tambahkan Konten</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
