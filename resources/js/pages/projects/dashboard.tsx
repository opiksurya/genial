import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    FolderKanban, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Calendar, 
    Users, 
    TrendingUp, 
    Plus, 
    ArrowUpRight,
    Sparkles,
    Briefcase,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';

interface ProjectItem {
    id: number;
    name: string;
    client: string;
    category: string;
    status: string;
    priority: string;
    progress: number;
    start_date: string;
    end_date: string;
    is_overdue: boolean;
    tasks_count: number;
    completed_tasks_count: number;
    manager?: {
        name: string;
        avatar?: string;
    };
}

interface DeadlineTask {
    id: number;
    title: string;
    due_date: string;
    priority: string;
    status: string;
    project?: {
        name: string;
        client: string;
    };
    assignee?: {
        name: string;
    };
}

interface Props {
    stats: {
        active_projects: number;
        completed_projects: number;
        overdue_projects: number;
        pending_tasks: number;
        today_tasks: number;
    };
    projects: ProjectItem[];
    upcomingDeadlines: DeadlineTask[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ProjectFlow',
        href: '/projects/dashboard',
    },
    {
        title: 'Dashboard Project',
        href: '/projects/dashboard',
    },
];

export default function ProjectDashboard({ stats, projects, upcomingDeadlines }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ProjectFlow Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Header Title & Create Project Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                            <FolderKanban className="w-7 h-7 text-primary" />
                            <span>Genial ProjectFlow Dashboard</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Monitoring performa project client digital marketing agency, deadline, dan alokasi tim secara terpusat.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/projects/board"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buka Kanban Board</span>
                        </Link>
                    </div>
                </div>

                {/* 5 KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    {/* Active Projects */}
                    <div className="p-4 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Aktif</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Briefcase className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">{stats?.active_projects || 0}</span>
                            <span className="text-[11px] font-semibold text-blue-500">In Progress</span>
                        </div>
                    </div>

                    {/* Completed Projects */}
                    <div className="p-4 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Selesai</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">{stats?.completed_projects || 0}</span>
                            <span className="text-[11px] font-semibold text-emerald-500">Completed</span>
                        </div>
                    </div>

                    {/* Overdue Projects */}
                    <div className="p-4 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Terlambat</span>
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">{stats?.overdue_projects || 0}</span>
                            <span className="text-[11px] font-semibold text-rose-500">Overdue</span>
                        </div>
                    </div>

                    {/* Pending Tasks */}
                    <div className="p-4 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Task Pending</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">{stats?.pending_tasks || 0}</span>
                            <span className="text-[11px] font-semibold text-amber-500">To Do</span>
                        </div>
                    </div>

                    {/* Today Tasks */}
                    <div className="p-4 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Task Hari Ini</span>
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">{stats?.today_tasks || 0}</span>
                            <span className="text-[11px] font-semibold text-purple-500">Due Today</span>
                        </div>
                    </div>

                </div>

                {/* Projects Grid & Upcoming Deadlines */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Active Projects Cards Grid (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <span>Daftar Project Client</span>
                            </h2>
                            <Link href="/projects/board" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                                <span>Lihat Semua Board</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {projects.map((p) => (
                                <div key={p.id} className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                                {p.category}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                p.is_overdue ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                p.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                            }`}>
                                                {p.is_overdue ? 'Overdue' : p.status}
                                            </span>
                                        </div>

                                        <h3 className="font-extrabold text-foreground text-base line-clamp-1">{p.name}</h3>
                                        <p className="text-xs font-medium text-muted-foreground mt-0.5">Client: <span className="text-foreground">{p.client}</span></p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground font-medium">Progress Selesai</span>
                                            <span className="font-bold text-foreground">{p.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 rounded-full ${
                                                    p.progress === 100 ? 'bg-emerald-500' :
                                                    p.is_overdue ? 'bg-rose-500' : 'bg-primary'
                                                }`}
                                                style={{ width: `${p.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-sidebar-border flex items-center justify-between text-xs text-muted-foreground">
                                        <span>PM: <strong className="text-foreground">{p.manager?.name || 'Unassigned'}</strong></span>
                                        <Link
                                            href={`/projects/board?project_id=${p.id}`}
                                            className="font-bold text-primary hover:underline flex items-center gap-0.5"
                                        >
                                            <span>Buka Task</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Deadlines (1 col) */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <span>Deadline Mendekat (7 Hari)</span>
                        </h2>

                        <div className="rounded-2xl border border-sidebar-border bg-card p-5 shadow-sm space-y-4">
                            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingDeadlines.map((task) => (
                                        <div key={task.id} className="p-3.5 rounded-xl border border-sidebar-border bg-muted/30 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    Due: {task.due_date}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    {task.project?.client}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground line-clamp-1">{task.title}</h4>
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-sidebar-border/50">
                                                <span>Project: {task.project?.name}</span>
                                                <span className="font-semibold text-foreground">{task.assignee?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
                                    <p className="font-semibold">Tidak ada deadline yang kritis minggu ini!</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
