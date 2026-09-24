import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Calendar as CalendarIcon, 
    Sparkles, 
    Plus, 
    ChevronLeft, 
    ChevronRight, 
    SlidersHorizontal, 
    Trash2, 
    Layers, 
    Video, 
    FileText, 
    Share2, 
    CheckCircle2, 
    Clock, 
    Filter,
    LayoutGrid,
    List,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

import { ContentDetailModal, ContentItem } from '@/components/content-calendar/content-detail-modal';
import { GeneratePlanModal } from '@/components/content-calendar/generate-plan-modal';
import { AiSettingsModal } from '@/components/content-calendar/ai-settings-modal';
import { CreateContentModal } from '@/components/content-calendar/create-content-modal';

interface Props {
    items: ContentItem[];
    currentMonth: number;
    currentYear: number;
    currentPlatform: string;
    currentStatus: string;
    currentProjectId?: string | number | null;
    projects: { id: number; name: string; client?: string }[];
    freelancers?: { id: number; name: string; role: string; rate_per_project?: number }[];
    creativeServices?: {
        id: number;
        name: string;
        category: string;
        format: string;
        client_price: number;
        freelancer_cost: number;
        unit: string;
        deliverables?: string;
    }[];
    aiSettings: {
        default_provider: string;
        gemini_api_key_set: boolean;
        claude_api_key_set: boolean;
        openai_api_key_set: boolean;
        openrouter_api_key_set: boolean;
        gemini_model: string;
        claude_model: string;
        openai_model: string;
    };
    stats: {
        total: number;
        draft: number;
        in_progress?: number;
        revisi?: number;
        scheduled: number;
        published: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Kalender Konten (AI)',
        href: '/content-calendar',
    },
];

const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_HEADER = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const PLATFORM_TABS = [
    { id: 'all', label: 'Semua Platform' },
    { id: 'TikTok', label: 'TikTok' },
    { id: 'Shopee Video', label: 'Shopee Video' },
    { id: 'Instagram Reels', label: 'Instagram Reels' },
    { id: 'YouTube Shorts', label: 'YouTube Shorts' },
    { id: 'Instagram Feed', label: 'Instagram Feed' },
];

export default function ContentCalendarIndex({
    items = [],
    currentMonth,
    currentYear,
    currentPlatform = 'all',
    currentStatus = 'all',
    currentProjectId,
    projects = [],
    freelancers = [],
    creativeServices = [],
    aiSettings,
    stats,
}: Props) {
    // Modal states
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isAiSettingsModalOpen, setIsAiSettingsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createInitialDate, setCreateInitialDate] = useState<string>('');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const safeMonth = Number(currentMonth) || (new Date().getMonth() + 1);
    const safeYear = Number(currentYear) || new Date().getFullYear();

    // Month Navigation
    const handlePrevMonth = () => {
        let prevM = safeMonth - 1;
        let prevY = safeYear;
        if (prevM < 1) {
            prevM = 12;
            prevY -= 1;
        }
        router.get('/content-calendar', {
            month: prevM,
            year: prevY,
            platform: currentPlatform || 'all',
            status: currentStatus || 'all',
            project_id: currentProjectId || '',
        }, { preserveScroll: true });
    };

    const handleNextMonth = () => {
        let nextM = safeMonth + 1;
        let nextY = safeYear;
        if (nextM > 12) {
            nextM = 1;
            nextY += 1;
        }
        router.get('/content-calendar', {
            month: nextM,
            year: nextY,
            platform: currentPlatform || 'all',
            status: currentStatus || 'all',
            project_id: currentProjectId || '',
        }, { preserveScroll: true });
    };

    const handlePlatformChange = (platformId: string) => {
        router.get('/content-calendar', {
            month: safeMonth,
            year: safeYear,
            platform: platformId,
            status: currentStatus || 'all',
            project_id: currentProjectId || '',
        }, { preserveScroll: true });
    };

    const handleClearMonth = () => {
        const monthLabel = MONTH_NAMES_ID[safeMonth - 1] || `Bulan ${safeMonth}`;
        if (!confirm(`Hapus semua ${items.length} konten pada ${monthLabel} ${safeYear}?`)) return;
        router.post('/content-calendar/clear-month', {
            month: safeMonth,
            year: safeYear,
        }, {
            onSuccess: () => toast.success('Kalender bulan ini berhasil dibersihkan.'),
        });
    };

    const handleSeedDemoData = () => {
        router.get('/content-calendar', {
            month: safeMonth,
            year: safeYear,
            platform: currentPlatform || 'all',
            seed_demo: 1,
        }, {
            onSuccess: () => toast.success('Contoh konten rencana bulan ini berhasil dimuat!'),
        });
    };

    const handleOpenCard = (item: ContentItem) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    };

    const handleAddForDate = (dateStr: string) => {
        setCreateInitialDate(dateStr);
        setIsCreateModalOpen(true);
    };

    // Calculate calendar grid days
    const calendarDays = useMemo(() => {
        const m = Number(currentMonth) || (new Date().getMonth() + 1);
        const y = Number(currentYear) || new Date().getFullYear();
        const firstDayOfMonth = new Date(y, m - 1, 1);
        const daysInMonth = new Date(y, m, 0).getDate();
        
        // Day of week for 1st day (0 = Sunday, 1 = Monday, ... 6 = Saturday)
        const startDayOfWeek = firstDayOfMonth.getDay();

        const grid: {
            dayNumber: number | null;
            dateString: string | null;
            isCurrentMonth: boolean;
            items: ContentItem[];
        }[] = [];

        // Leading empty days
        for (let i = 0; i < startDayOfWeek; i++) {
            grid.push({
                dayNumber: null,
                dateString: null,
                isCurrentMonth: false,
                items: [],
            });
        }

        // Days in month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayItems = (items || []).filter((item) => {
                if (!item || !item.scheduled_date) return false;
                const itemDateOnly = String(item.scheduled_date).substring(0, 10);
                return itemDateOnly === dateStr;
            });

            grid.push({
                dayNumber: d,
                dateString: dateStr,
                isCurrentMonth: true,
                items: dayItems,
            });
        }

        // Trailing empty days to complete 7-day grid rows
        const remainingCells = (7 - (grid.length % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            grid.push({
                dayNumber: null,
                dateString: null,
                isCurrentMonth: false,
                items: [],
            });
        }

        return grid;
    }, [items, currentMonth, currentYear]);

    // Format header title (e.g. "July 2026" or "Juli 2026")
    const monthTitle = `${MONTH_NAMES_EN[safeMonth - 1] || 'Month'} ${safeYear}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kalender Konten (AI)" />

            <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                
                {/* Top Header Card matching screenshot 2 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-primary/15 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                Kalender Konten (AI)
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                Rencanakan jadwal posting sosial media secara otomatis
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {items.length === 0 && (
                            <button
                                type="button"
                                onClick={handleSeedDemoData}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Muat Data Demo ({monthTitle})</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsAiSettingsModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                            title="Pengaturan AI API Key"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                            <span>AI Settings</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setCreateInitialDate(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
                                setIsCreateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Konten</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-primary/25 rounded-xl transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>+ Generate Plan (AI)</span>
                        </button>
                    </div>
                </div>

                {/* Platform Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    {PLATFORM_TABS.map((tab) => {
                        const isActive = currentPlatform === tab.id || (tab.id === 'all' && currentPlatform === 'all');
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handlePlatformChange(tab.id)}
                                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-primary/10 text-primary border-b-2 border-primary font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Calendar Navigation & Month Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {monthTitle}
                        </h2>

                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                                aria-label="Bulan Sebelumnya"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                                aria-label="Bulan Berikutnya"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Pill & Tools */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium">
                            <span>Total: <strong>{items.length}</strong> Konten</span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400">Draft: {stats?.draft || 0}</span>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400">In Progress: {stats?.in_progress || 0}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">Revisi: {stats?.revisi || 0}</span>
                            <span>•</span>
                            <span className="text-purple-600 dark:text-purple-400">Scheduled: {stats?.scheduled || 0}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Published: {stats?.published || 0}</span>
                        </div>

                        {items.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearMonth}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Kosongkan Bulan</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Calendar Grid matching screenshot 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {DAYS_HEADER.map((day, idx) => (
                            <div key={day} className={`py-3 ${idx < 6 ? 'border-r border-slate-200 dark:border-slate-800' : ''}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid Cells */}
                    <div className="grid grid-cols-7 auto-rows-fr divide-y divide-slate-200 dark:divide-slate-800">
                        {calendarDays.map((cell, index) => {
                            const isRightBorder = (index + 1) % 7 !== 0;

                            if (!cell.isCurrentMonth || cell.dayNumber === null) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className={`min-h-[110px] md:min-h-[125px] p-2 bg-slate-50/30 dark:bg-slate-900/40 ${
                                            isRightBorder ? 'border-r border-slate-200 dark:border-slate-800' : ''
                                        }`}
                                    />
                                );
                            }

                            return (
                                <div
                                    key={`day-${cell.dayNumber}`}
                                    className={`group min-h-[110px] md:min-h-[125px] p-2 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex flex-col justify-between relative ${
                                        isRightBorder ? 'border-r border-slate-200 dark:border-slate-800' : ''
                                    }`}
                                >
                                    {/* Date Number & Quick Add Button */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {cell.dayNumber}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => cell.dateString && handleAddForDate(cell.dateString)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                                            title="Tambah konten di tanggal ini"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Content Items List in this day */}
                                    <div className="space-y-1.5 flex-1">
                                        {cell.items.map((item, itemIdx) => {
                                            const isRevisi = item.status === 'Revisi' || item.status === 'Revision';
                                            const isPublished = item.status === 'Published';
                                            const isScheduled = item.status === 'Scheduled';
                                            const isInProgress = item.status === 'In Progress';

                                            return (
                                                <div
                                                    key={item.id || itemIdx}
                                                    onClick={() => handleOpenCard(item)}
                                                    className={`group/card p-2 rounded-lg border shadow-xs cursor-pointer transition-all transform hover:-translate-y-0.5 ${
                                                        isRevisi
                                                            ? 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100/90 dark:hover:bg-amber-900/50 border-amber-300/80 dark:border-amber-800/60'
                                                            : isPublished
                                                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/50 border-emerald-300/80 dark:border-emerald-800/60'
                                                            : isScheduled
                                                            ? 'bg-purple-50/90 dark:bg-purple-950/40 hover:bg-purple-100/90 dark:hover:bg-purple-900/50 border-purple-300/80 dark:border-purple-800/60'
                                                            : isInProgress
                                                            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/50 border-indigo-300/80 dark:border-indigo-800/60'
                                                            : 'bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/90 dark:hover:bg-blue-900/50 border-blue-200/80 dark:border-blue-800/60'
                                                    }`}
                                                >
                                                    <h4 className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                                                        {item.title}
                                                    </h4>
                                                    
                                                    <div className="flex items-center justify-between gap-1 mt-1 text-[10px] font-medium">
                                                        <span className={isRevisi ? 'text-amber-700 dark:text-amber-300' : isPublished ? 'text-emerald-700 dark:text-emerald-300' : isScheduled ? 'text-purple-700 dark:text-purple-300' : 'text-blue-600 dark:text-blue-400'}>
                                                            {item.format} • <strong className="capitalize">{item.status}</strong>
                                                        </span>
                                                        {item.freelancer && item.freelancer.name && (
                                                            <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.5 rounded" title={`Ditugaskan ke: ${item.freelancer.name}`}>
                                                                👤 {item.freelancer.name.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {cell.items.length === 0 && (
                                            <div
                                                onClick={() => cell.dateString && handleAddForDate(cell.dateString)}
                                                className="h-full min-h-[50px] rounded-lg border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                            >
                                                <span>+ Tambah</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Modals */}
            <ContentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                freelancers={freelancers}
                creativeServices={creativeServices}
                onItemUpdated={(updated) => {
                    setSelectedItem(updated);
                }}
            />

            <GeneratePlanModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                currentMonth={currentMonth}
                currentYear={currentYear}
                projects={projects}
                aiSettings={aiSettings}
                onOpenAiSettings={() => {
                    setIsGenerateModalOpen(false);
                    setIsAiSettingsModalOpen(true);
                }}
            />

            <AiSettingsModal
                isOpen={isAiSettingsModalOpen}
                onClose={() => setIsAiSettingsModalOpen(false)}
                settings={aiSettings}
            />

            <CreateContentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialDate={createInitialDate}
                initialPlatform={currentPlatform}
                projects={projects}
                freelancers={freelancers}
                creativeServices={creativeServices}
            />
        </AppLayout>
    );
}
