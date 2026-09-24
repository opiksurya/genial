import React, { useState } from 'react';
import { X, Plus, Calendar, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ContentItem } from './content-detail-modal';

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: string;
    initialPlatform?: string;
    projects: { id: number; name: string; client?: string }[];
}

export function CreateContentModal({
    isOpen,
    onClose,
    initialDate,
    initialPlatform,
    projects,
}: CreateContentModalProps) {
    if (!isOpen) return null;

    const [form, setForm] = useState<Partial<ContentItem>>({
        title: '',
        scheduled_date: initialDate || new Date().toISOString().split('T')[0],
        scheduled_time: '19:00',
        platform: initialPlatform && initialPlatform !== 'all' ? initialPlatform : 'TikTok',
        format: 'Video',
        pillar: 'Product Showcase',
        status: 'Draft',
        reference_link: '',
        visual_detail: '',
        wording: '',
        copywriting: '',
        hashtags: '',
    });

    const [isSaving, setIsSaving] = useState(false);

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
                                Buat postingan baru secara manual
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
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Judul Konten <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Format
                            </label>
                            <select
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Video">Video</option>
                                <option value="Carousel">Carousel</option>
                                <option value="Image">Image</option>
                                <option value="Story">Story</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pilar Konten
                            </label>
                            <select
                                value={form.pillar}
                                onChange={(e) => setForm({ ...form, pillar: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Product Showcase">Product Showcase</option>
                                <option value="Edukasi">Edukasi</option>
                                <option value="Behind The Scene">Behind The Scene</option>
                                <option value="Promo">Promo</option>
                                <option value="Testimonial">Testimonial</option>
                                <option value="Tips & Trik">Tips & Trik</option>
                                <option value="Tren">Tren</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                            >
                                <option value="Draft">Draft</option>
                                <option value="In Progress">In Progress</option>
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
