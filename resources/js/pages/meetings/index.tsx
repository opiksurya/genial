import { Head, router, useForm } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Calendar as CalendarIcon,
    CalendarCheck,
    CalendarPlus,
    Video,
    MapPin,
    Phone,
    Users,
    Clock,
    ExternalLink,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    X,
    Edit2,
    Trash2,
    Sparkles,
    CalendarDays,
    Share2,
    CheckCircle2,
    AlertCircle,
    Info,
    Download
} from 'lucide-react';

interface ProjectOption {
    id: number;
    name: string;
    client: string;
}

interface MeetingItem {
    id: number;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    date: string;
    start_hour: string;
    end_hour: string;
    platform: 'google_meet' | 'zoom' | 'offline' | 'phone';
    meeting_link?: string | null;
    location?: string | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    attendees?: string[];
    google_calendar_url: string;
    project?: ProjectOption | null;
    user?: { id: number; name: string; email: string } | null;
}

interface UpcomingMeeting {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    platform: 'google_meet' | 'zoom' | 'offline' | 'phone';
    meeting_link?: string | null;
    status: string;
    google_calendar_url: string;
    project_name?: string | null;
}

interface Props {
    meetings: MeetingItem[];
    projects: ProjectOption[];
    upcomingMeetings: UpcomingMeeting[];
    calendarFeedUrl: string;
    filters: {
        platform: string;
        project_id: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Agenda Meeting', href: '/meetings' },
];

const PLATFORM_CONFIG: Record<string, { label: string; icon: any; color: string; badge: string }> = {
    google_meet: {
        label: 'Google Meet',
        icon: Video,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    zoom: {
        label: 'Zoom Meeting',
        icon: Video,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
    },
    offline: {
        label: 'Tatap Muka / Kantor',
        icon: MapPin,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    },
    phone: {
        label: 'Telepon / WhatsApp Call',
        icon: Phone,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
    },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    scheduled: { label: 'Terjadwal', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    in_progress: { label: 'Berlangsung', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse' },
    completed: { label: 'Selesai', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Dibatalkan', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 line-through' },
};

export default function MeetingCalendarIndex({
    meetings = [],
    projects = [],
    upcomingMeetings = [],
    calendarFeedUrl,
    filters,
}: Props) {
    // View state
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [currentDate, setCurrentDate] = useState(() => new Date());

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState(filters.platform || 'all');
    const [projectFilter, setProjectFilter] = useState(filters.project_id || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [copiedFeed, setCopiedFeed] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [autoSyncGCal, setAutoSyncGCal] = useState(true);

    // Form
    const createForm = useForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        platform: 'google_meet',
        meeting_link: '',
        location: '',
        project_id: '',
        status: 'scheduled',
    });

    const editForm = useForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        platform: 'google_meet',
        meeting_link: '',
        location: '',
        project_id: '',
        status: 'scheduled',
    });

    // Calendar Calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Helper: Generate Google Calendar direct event URL from form input
    const generateGoogleCalendarUrl = (data: {
        title: string;
        description: string;
        start_time: string;
        end_time: string;
        platform: string;
        meeting_link: string;
        location: string;
        project_id: string;
    }) => {
        if (!data.start_time || !data.end_time) return null;
        try {
            const start = new Date(data.start_time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            const end = new Date(data.end_time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            const text = encodeURIComponent(data.title || 'Agenda Meeting Genial');

            const detailsParts: string[] = [];
            if (data.description) detailsParts.push(data.description);
            if (data.meeting_link) detailsParts.push(`Link Meeting: ${data.meeting_link}`);
            if (data.project_id) {
                const proj = projects.find((p) => String(p.id) === String(data.project_id));
                if (proj) detailsParts.push(`Project: ${proj.name} (${proj.client})`);
            }
            detailsParts.push('Dibuat otomatis via Genial Digital Solution');
            const details = encodeURIComponent(detailsParts.join('\n\n'));
            const loc = encodeURIComponent(data.meeting_link || data.location || 'Online');

            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${loc}`;
        } catch {
            return null;
        }
    };

    // Filtered meetings
    const filteredMeetings = useMemo(() => {
        return meetings.filter((m) => {
            const matchesSearch =
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.project && m.project.name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesPlatform = platformFilter === 'all' || m.platform === platformFilter;
            const matchesProject = projectFilter === 'all' || String(m.project?.id) === projectFilter;
            const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

            return matchesSearch && matchesPlatform && matchesProject && matchesStatus;
        });
    }, [meetings, searchQuery, platformFilter, projectFilter, statusFilter]);

    // Calendar grid computation
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Sunday = 0, Monday = 1... Convert to Mon=0..Sun=6
        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        const totalDays = lastDayOfMonth.getDate();

        // Days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const d = prevMonthLastDay - i;
            const m = month === 0 ? 11 : month - 1;
            const y = month === 0 ? year - 1 : year;
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                day: d,
                dateStr,
                isCurrentMonth: false,
                isToday: false,
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateStr,
                isCurrentMonth: true,
                isToday: dateStr === todayStr,
            });
        }

        // Fill remaining days of the week
        const remaining = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            const m = month === 11 ? 0 : month + 1;
            const y = month === 11 ? year + 1 : year;
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateStr,
                isCurrentMonth: false,
                isToday: false,
            });
        }

        return days;
    }, [year, month]);

    // Open create modal for specific date
    const openCreateModalForDate = (dateStr: string) => {
        const defaultStart = `${dateStr}T10:00`;
        const defaultEnd = `${dateStr}T11:00`;
        createForm.setData({
            title: '',
            description: '',
            start_time: defaultStart,
            end_time: defaultEnd,
            platform: 'google_meet',
            meeting_link: 'https://meet.google.com/new',
            location: '',
            project_id: '',
            status: 'scheduled',
        });
        setIsCreateOpen(true);
    };

    // Open detail
    const openDetailModal = (meeting: MeetingItem) => {
        setSelectedMeeting(meeting);
        setIsDetailOpen(true);
    };

    // Open edit from detail
    const startEdit = (meeting: MeetingItem) => {
        editForm.setData({
            title: meeting.title,
            description: meeting.description || '',
            start_time: meeting.start_time ? meeting.start_time.slice(0, 16) : '',
            end_time: meeting.end_time ? meeting.end_time.slice(0, 16) : '',
            platform: meeting.platform,
            meeting_link: meeting.meeting_link || '',
            location: meeting.location || '',
            project_id: meeting.project ? String(meeting.project.id) : '',
            status: meeting.status,
        });
        setIsDetailOpen(false);
    };

    // Form handlers
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Otomatis sinkronkan & buka langsung di Google Calendar tanpa perlu klik tombol lagi
        if (autoSyncGCal) {
            const gCalUrl = generateGoogleCalendarUrl(createForm.data);
            if (gCalUrl) {
                window.open(gCalUrl, '_blank', 'noopener,noreferrer');
            }
        }

        // 2. Simpan agenda ke database
        createForm.post('/meetings', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeeting) return;
        editForm.put(`/meetings/${selectedMeeting.id}`, {
            onSuccess: () => {
                setSelectedMeeting(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus agenda meeting ini?')) {
            router.delete(`/meetings/${id}`, {
                onSuccess: () => {
                    setIsDetailOpen(false);
                    setSelectedMeeting(null);
                },
            });
        }
    };

    const copyToClipboard = (text: string, type: 'feed' | 'link') => {
        navigator.clipboard.writeText(text);
        if (type === 'feed') {
            setCopiedFeed(true);
            setTimeout(() => setCopiedFeed(false), 2000);
        } else {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    // Meeting statistics
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const thisMonthMeetings = meetings.filter((m) => m.date && m.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
        const todayMeetings = meetings.filter((m) => m.date === todayStr && m.status !== 'cancelled');
        const googleMeetCount = meetings.filter((m) => m.platform === 'google_meet').length;
        const completedCount = meetings.filter((m) => m.status === 'completed').length;

        return {
            totalMonth: thisMonthMeetings.length,
            today: todayMeetings.length,
            googleMeet: googleMeetCount,
            completed: completedCount,
        };
    }, [meetings, year, month]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agenda Meeting & Google Calendar Sync" />

            <div className="w-full space-y-6 p-4 sm:p-6">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-sidebar-border rounded-2xl p-5 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <CalendarCheck className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Agenda Meeting & Kalender
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Kelola jadwal rapat dan otomatis sinkronkan ke Google Calendar saat mengisi form agenda.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Auto-Sync Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Auto-Sync Google Calendar: Aktif</span>
                            <button
                                type="button"
                                onClick={() => setIsSyncModalOpen(true)}
                                className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
                                title="Pengaturan Kalender & Feed Langganan"
                            >
                                (Info)
                            </button>
                        </div>

                        {/* Create Meeting Button */}
                        <button
                            onClick={() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                openCreateModalForDate(todayStr);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-primary/20"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            <span>Jadwalkan Meeting</span>
                        </button>
                    </div>
                </div>

                {/* KPI METRIC CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Meeting Bulan Ini</span>
                            <CalendarIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">{stats.totalMonth}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{monthNames[month]} {year}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Meeting Hari Ini</span>
                            <Clock className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-500 mt-2">{stats.today}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Perlu dihadiri hari ini</p>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Google Meet</span>
                            <Video className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">{stats.googleMeet}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Siap 1-klik Google Calendar</p>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Selesai Terlaksana</span>
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">{stats.completed}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Riwayat rapat terekam</p>
                    </div>
                </div>

                {/* UPCOMING MEETING BANNER (IF ANY TODAY / SOON) */}
                {upcomingMeetings.length > 0 && (
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Agenda Terdekat</h3>
                            </div>
                            <span className="text-[11px] text-muted-foreground">Tersinkron dengan Google Calendar</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {upcomingMeetings.slice(0, 3).map((up) => {
                                const cfg = PLATFORM_CONFIG[up.platform] || PLATFORM_CONFIG.google_meet;
                                const Icon = cfg.icon;
                                const dateFormatted = new Date(up.start_time).toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div key={up.id} className="p-3 rounded-xl border border-sidebar-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badge}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                                <span className="text-[11px] font-medium text-muted-foreground">{dateFormatted}</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground line-clamp-1">{up.title}</h4>
                                            {up.project_name && (
                                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">Project: {up.project_name}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-sidebar-border text-[11px]">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-500" />
                                                Otomatis Sinkron
                                            </span>
                                            {up.meeting_link && (
                                                <a
                                                    href={up.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all"
                                                >
                                                    <Video className="w-3 h-3" />
                                                    Join
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CONTROLS & FILTER BAR */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-sidebar-border rounded-xl p-3">
                    <div className="flex items-center gap-2">
                        {/* Month Navigator */}
                        <div className="flex items-center border border-sidebar-border rounded-lg bg-background p-0.5">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                title="Bulan Sebelumnya"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-xs sm:text-sm font-bold text-foreground min-w-[130px] text-center select-none">
                                {monthNames[month]} {year}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                title="Bulan Berikutnya"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleToday}
                            className="px-2.5 py-1.5 rounded-lg border border-sidebar-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all"
                        >
                            Hari Ini
                        </button>
                    </div>

                    {/* View Switcher & Search */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 sm:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari agenda meeting..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-sidebar-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-sidebar-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="all">Semua Platform</option>
                            <option value="google_meet">Google Meet</option>
                            <option value="zoom">Zoom</option>
                            <option value="offline">Tatap Muka</option>
                            <option value="phone">Telepon</option>
                        </select>

                        <div className="flex border border-sidebar-border rounded-lg p-0.5 bg-background">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Kalender
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Daftar
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CALENDAR VIEW */}
                {viewMode === 'calendar' ? (
                    <div className="bg-card border border-sidebar-border rounded-2xl overflow-hidden shadow-sm">
                        {/* Day Names Header */}
                        <div className="grid grid-cols-7 border-b border-sidebar-border bg-muted/40 text-center py-2.5 text-xs font-semibold text-muted-foreground">
                            <span>Senin</span>
                            <span>Selasa</span>
                            <span>Rabu</span>
                            <span>Kamis</span>
                            <span>Jumat</span>
                            <span className="text-amber-500">Sabtu</span>
                            <span className="text-rose-500">Minggu</span>
                        </div>

                        {/* Calendar Day Cells */}
                        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-sidebar-border bg-card">
                            {calendarDays.map((cd, idx) => {
                                const dayMeetings = filteredMeetings.filter((m) => m.date === cd.dateStr);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => openCreateModalForDate(cd.dateStr)}
                                        className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                                            cd.isCurrentMonth
                                                ? cd.isToday
                                                    ? 'bg-primary/5 font-semibold'
                                                    : 'hover:bg-muted/30'
                                                : 'bg-muted/20 text-muted-foreground/40'
                                        }`}
                                    >
                                        {/* Cell Header: Day Number */}
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                                                    cd.isToday
                                                        ? 'bg-primary text-primary-foreground font-bold'
                                                        : cd.isCurrentMonth
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/40'
                                                }`}
                                            >
                                                {cd.day}
                                            </span>

                                            {/* Hover plus icon */}
                                            <span className="opacity-0 group-hover:opacity-100 text-primary transition-opacity">
                                                <CalendarPlus className="w-3.5 h-3.5" />
                                            </span>
                                        </div>

                                        {/* Meeting Chips */}
                                        <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[85px]">
                                            {dayMeetings.slice(0, 3).map((m) => {
                                                const cfg = PLATFORM_CONFIG[m.platform] || PLATFORM_CONFIG.google_meet;
                                                const Icon = cfg.icon;

                                                return (
                                                    <div
                                                        key={m.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDetailModal(m);
                                                        }}
                                                        className={`px-1.5 py-1 rounded text-[10px] font-medium border truncate flex items-center gap-1 transition-transform hover:scale-[1.02] shadow-xs ${cfg.badge}`}
                                                        title={`${m.title} (${m.start_hour} - ${m.end_hour})`}
                                                    >
                                                        <Icon className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="font-bold shrink-0">{m.start_hour}</span>
                                                        <span className="truncate">{m.title}</span>
                                                    </div>
                                                );
                                            })}

                                            {dayMeetings.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground font-semibold pl-1">
                                                    +{dayMeetings.length - 3} agenda lagi
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="bg-card border border-sidebar-border rounded-2xl overflow-hidden shadow-sm divide-y divide-sidebar-border">
                        {filteredMeetings.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-foreground">Tidak Ada Agenda Meeting</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Belum ada agenda rapat yang cocok dengan filter atau kata kunci pencarian.
                                </p>
                                <button
                                    onClick={() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        openCreateModalForDate(todayStr);
                                    }}
                                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    Jadwalkan Meeting Baru
                                </button>
                            </div>
                        ) : (
                            filteredMeetings.map((m) => {
                                const cfg = PLATFORM_CONFIG[m.platform] || PLATFORM_CONFIG.google_meet;
                                const st = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;
                                const Icon = cfg.icon;

                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => openDetailModal(m)}
                                        className="p-4 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2.5 rounded-xl border ${cfg.color} shrink-0 mt-0.5`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-bold text-foreground">{m.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${st.badge}`}>
                                                        {st.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badge}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground mt-1.5">
                                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                                        {new Date(m.start_time).toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {m.start_hour} - {m.end_hour} WIB
                                                    </span>
                                                    {m.project && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-primary font-medium">
                                                                Project: {m.project.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {m.description && (
                                                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 max-w-2xl">
                                                        {m.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            {m.meeting_link && (
                                                <a
                                                    href={m.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs"
                                                >
                                                    <Video className="w-3.5 h-3.5" />
                                                    Join Meet
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* MODAL 1: DETAIL MEETING */}
                {isDetailOpen && selectedMeeting && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-sidebar-border pb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PLATFORM_CONFIG[selectedMeeting.platform]?.badge}`}>
                                            {PLATFORM_CONFIG[selectedMeeting.platform]?.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_CONFIG[selectedMeeting.status]?.badge}`}>
                                            {STATUS_CONFIG[selectedMeeting.status]?.label}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">{selectedMeeting.title}</h3>
                                </div>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Details Info */}
                            <div className="space-y-3.5 text-xs text-foreground">
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-sidebar-border">
                                    <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                        <div className="font-semibold">
                                            {new Date(selectedMeeting.start_time).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {selectedMeeting.start_hour} - {selectedMeeting.end_hour} WIB
                                        </div>
                                    </div>
                                </div>

                                {selectedMeeting.meeting_link && (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-sidebar-border space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-muted-foreground">Link Rapat:</span>
                                            <button
                                                onClick={() => copyToClipboard(selectedMeeting.meeting_link || '', 'link')}
                                                className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                            >
                                                {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                {copiedLink ? 'Tersalin' : 'Salin Link'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={selectedMeeting.meeting_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary underline truncate flex-1 font-mono text-[11px]"
                                            >
                                                {selectedMeeting.meeting_link}
                                            </a>
                                            <a
                                                href={selectedMeeting.meeting_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Buka
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedMeeting.location && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-sidebar-border">
                                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>Lokasi: {selectedMeeting.location}</span>
                                    </div>
                                )}

                                {selectedMeeting.project && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-semibold text-foreground">Project Terkait:</span>
                                        <span>{selectedMeeting.project.name} ({selectedMeeting.project.client})</span>
                                    </div>
                                )}

                                {selectedMeeting.description && (
                                    <div className="space-y-1 pt-1">
                                        <span className="font-semibold text-foreground">Agenda / Catatan:</span>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-sidebar-border whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
                                            {selectedMeeting.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Google Calendar Status & Link */}
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-sidebar-border space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <CalendarCheck className="w-4 h-4 text-emerald-500" />
                                        Sinkronisasi Google Calendar
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Auto-Sync Aktif
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Agenda ini otomatis disinkronkan saat dibuat. Anda dapat membukanya kembali di Google Calendar atau mengunduh kalender .ICS:
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                    <a
                                        href={selectedMeeting.google_calendar_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border border-sidebar-border bg-background hover:bg-muted text-foreground font-semibold text-xs transition-all shadow-xs"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                        Buka di Google Calendar
                                    </a>
                                    <a
                                        href={`/meetings/${selectedMeeting.id}/download-ics`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-all"
                                        title="Download format .ics"
                                    >
                                        <Download className="w-3.5 h-3.5 text-primary" />
                                        .ICS
                                    </a>
                                </div>
                            </div>

                            {/* Modal Footer (Edit & Delete) */}
                            <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
                                <button
                                    onClick={() => handleDelete(selectedMeeting.id)}
                                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hapus
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsDetailOpen(false)}
                                        className="px-3.5 py-1.5 rounded-lg border border-sidebar-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                                    >
                                        Tutup
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(selectedMeeting)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Edit Agenda
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 2: CREATE MEETING */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <CalendarPlus className="w-5 h-5 text-primary" />
                                    <span>Jadwalkan Meeting Baru</span>
                                </h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Judul / Topik Meeting *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Weekly Performance Review, Kickoff Campaign..."
                                        value={createForm.data.title}
                                        onChange={(e) => createForm.setData('title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {createForm.errors.title && <p className="text-rose-500 text-[11px] mt-1">{createForm.errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Waktu Mulai *</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={createForm.data.start_time}
                                            onChange={(e) => {
                                                const start = e.target.value;
                                                createForm.setData('start_time', start);
                                                // Auto set end time + 1 hour if empty or before start
                                                if (start && (!createForm.data.end_time || createForm.data.end_time <= start)) {
                                                    const startDate = new Date(start);
                                                    startDate.setHours(startDate.getHours() + 1);
                                                    const endIso = startDate.toISOString().slice(0, 16);
                                                    createForm.setData('end_time', endIso);
                                                }
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Waktu Selesai *</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={createForm.data.end_time}
                                            onChange={(e) => createForm.setData('end_time', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Platform Meeting</label>
                                        <select
                                            value={createForm.data.platform}
                                            onChange={(e) => {
                                                const p = e.target.value;
                                                createForm.setData('platform', p);
                                                if (p === 'google_meet' && !createForm.data.meeting_link) {
                                                    createForm.setData('meeting_link', 'https://meet.google.com/new');
                                                }
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="google_meet">Google Meet</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="offline">Tatap Muka / Kantor</option>
                                            <option value="phone">Telepon / WhatsApp</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Project Terkait (Opsional)</label>
                                        <select
                                            value={createForm.data.project_id}
                                            onChange={(e) => createForm.setData('project_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">-- Tanpa Project --</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.client})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-semibold text-foreground">Link Pertemuan / Meeting URL</label>
                                        <button
                                            type="button"
                                            onClick={() => createForm.setData('meeting_link', 'https://meet.google.com/new')}
                                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            Generate Google Meet
                                        </button>
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/xxx-xxxx-xxx atau https://zoom.us/..."
                                        value={createForm.data.meeting_link}
                                        onChange={(e) => createForm.setData('meeting_link', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Lokasi Fisik (Jika Offline)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ruang Meeting Genial Lt. 2 / Cafe Starbucks"
                                        value={createForm.data.location}
                                        onChange={(e) => createForm.setData('location', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Deskripsi Agenda & Poin Pembahasan</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Tuliskan poin-poin yang akan dibahas..."
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                                    />
                                </div>

                                {/* Auto-Sync Google Calendar Confirmation Card */}
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                                <span>Otomatis Masuk Google Calendar</span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">Otomatis</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Saat tombol simpan ditekan, agenda otomatis langsung sinkron ke Google Calendar tanpa perlu klik tombol lagi.
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={autoSyncGCal}
                                            onChange={(e) => setAutoSyncGCal(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-sidebar-border">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-sidebar-border text-muted-foreground font-semibold hover:bg-muted"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                        Simpan Agenda
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 3: EDIT MEETING */}
                {selectedMeeting && editForm.data.title && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-primary" />
                                    <span>Edit Agenda Meeting</span>
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedMeeting(null);
                                        editForm.reset();
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Judul / Topik Meeting *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.title}
                                        onChange={(e) => editForm.setData('title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Waktu Mulai *</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={editForm.data.start_time}
                                            onChange={(e) => editForm.setData('start_time', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Waktu Selesai *</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={editForm.data.end_time}
                                            onChange={(e) => editForm.setData('end_time', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Platform</label>
                                        <select
                                            value={editForm.data.platform}
                                            onChange={(e) => editForm.setData('platform', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="google_meet">Google Meet</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="offline">Tatap Muka</option>
                                            <option value="phone">Telepon</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Status</label>
                                        <select
                                            value={editForm.data.status}
                                            onChange={(e) => editForm.setData('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="scheduled">Terjadwal</option>
                                            <option value="in_progress">Berlangsung</option>
                                            <option value="completed">Selesai</option>
                                            <option value="cancelled">Dibatalkan</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Project</label>
                                        <select
                                            value={editForm.data.project_id}
                                            onChange={(e) => editForm.setData('project_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">-- Tanpa Project --</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Link Pertemuan</label>
                                    <input
                                        type="url"
                                        value={editForm.data.meeting_link}
                                        onChange={(e) => editForm.setData('meeting_link', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Lokasi Fisik (Jika Offline)</label>
                                    <input
                                        type="text"
                                        value={editForm.data.location}
                                        onChange={(e) => editForm.setData('location', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Deskripsi Agenda & Poin Pembahasan</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-sidebar-border">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMeeting(null);
                                            editForm.reset();
                                        }}
                                        className="px-4 py-2 rounded-xl border border-sidebar-border text-muted-foreground font-semibold hover:bg-muted"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 4: GOOGLE CALENDAR SYNC GUIDE & SUBSCRIPTION */}
                {isSyncModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex items-start justify-between gap-4 border-b border-sidebar-border pb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-base font-bold text-foreground">Koneksi ke Google Calendar</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Ada 2 cara menghubungkan agenda Genial ke Google Calendar Anda:
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsSyncModalOpen(false)}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Fitur Utama: Otomatis saat Simpan Form */}
                            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                        Auto-Sync Langsung Saat Isi Form (Aktif)
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Anda tidak perlu repot menekan tombol sinkronisasi lagi. Setiap kali Anda mengisi form dan menekan tombol <b>&quot;Simpan Agenda&quot;</b>, jadwal meeting akan <b>langsung otomatis masuk ke Google Calendar</b> Anda secara instan.
                                </p>
                            </div>

                            {/* Opsi Tambahan: Langganan Kalender Otomatis (Live Sync Background) */}
                            <div className="p-4 rounded-xl border border-sidebar-border bg-muted/20 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">★</span>
                                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                        Opsional: Langganan Kalender Live (HP & Laptop)
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Jika Anda ingin semua meeting di Genial otomatis muncul di kalender bawaan HP atau Google Calendar secara permanen di latar belakang, cukup hubungkan link kalender berikut 1x saja:
                                </p>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={calendarFeedUrl}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background font-mono text-[11px] text-foreground select-all"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(calendarFeedUrl, 'feed')}
                                        className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shrink-0 shadow-xs"
                                    >
                                        {copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedFeed ? 'Tersalin!' : 'Salin URL'}
                                    </button>
                                </div>

                                <div className="pt-1">
                                    <a
                                        href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarFeedUrl.replace(/^http:\/\//, 'webcal://').replace(/^https:\/\//, 'webcal://'))}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        1-Klik Hubungkan Otomatis ke Google Calendar
                                    </a>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-sidebar-border">
                                <button
                                    onClick={() => setIsSyncModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
                                >
                                    Mengerti & Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
