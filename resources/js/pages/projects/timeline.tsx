import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Clock, 
    Calendar as CalendarIcon, 
    Flag, 
    Layers, 
    User, 
    ChevronLeft, 
    ChevronRight, 
    ZoomIn, 
    ZoomOut,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

interface TaskItem {
    id: number;
    title: string;
    status: string;
    priority: string;
    start_date?: string;
    due_date?: string;
    duration_days?: number;
    assignee?: { name: string };
    dependencies?: { dependsOnTask?: { id: number; title: string } }[];
}

interface MilestoneItem {
    id: number;
    title: string;
    due_date: string;
    is_completed: boolean;
}

interface ProjectItem {
    id: number;
    name: string;
    client: string;
    client_logo?: string;
    category: string;
    start_date: string;
    end_date: string;
    milestones?: MilestoneItem[];
}


interface Props {
    projects: ProjectItem[];
    activeProject?: ProjectItem;
    tasks: TaskItem[];
    todayDate: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ProjectFlow', href: '/projects/dashboard' },
    { title: 'Timeline View', href: '/projects/timeline' },
];

export default function ProjectTimeline({ projects, activeProject, tasks, todayDate }: Props) {
    const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');

    const handleProjectChange = (id: number) => {
        router.get('/projects/timeline', { project_id: id }, { preserveState: true });
    };

    // Calculate calendar days list for current project month
    const daysInTimeline = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 5 + i);
        return d.toISOString().split('T')[0];
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Timeline View & Gantt Chart" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 overflow-hidden">
                
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-7 h-7 text-primary" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-foreground">Timeline View & Gantt Chart</h1>
                                <select
                                    value={activeProject?.id || ''}
                                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-sidebar-border bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                {activeProject?.client_logo ? (
                                    <img src={activeProject.client_logo} alt={activeProject.client} className="w-4 h-4 rounded-full object-cover border border-sidebar-border" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-extrabold flex items-center justify-center border border-primary/30">
                                        {activeProject?.client?.charAt(0) || 'C'}
                                    </div>
                                )}
                                <span>Client: <strong className="text-foreground">{activeProject?.client || '-'}</strong></span>
                                <span>| Monitoring durasi task, milestone deadline, dan hubungan ketergantungan task secara visual.</span>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center p-1 rounded-xl bg-muted border border-sidebar-border text-xs font-semibold">
                            <button
                                onClick={() => setZoomLevel('day')}
                                className={`px-3 py-1 rounded-lg transition-all ${zoomLevel === 'day' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
                            >
                                Skala Harian
                            </button>
                            <button
                                onClick={() => setZoomLevel('week')}
                                className={`px-3 py-1 rounded-lg transition-all ${zoomLevel === 'week' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
                            >
                                Skala Mingguan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Milestones Bar */}
                {activeProject?.milestones && activeProject.milestones.length > 0 && (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-4 text-xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 shrink-0">
                            <Flag className="w-4 h-4" />
                            <span>Milestone Project:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            {activeProject.milestones.map((m) => (
                                <span key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-amber-500/30 font-semibold text-foreground">
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${m.is_completed ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    <span>{m.title}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">({m.due_date})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interactive Gantt Chart Table */}
                <div className="rounded-2xl border border-sidebar-border bg-card overflow-hidden shadow-sm flex flex-col flex-1">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs border-collapse">
                            
                            {/* Calendar Header */}
                            <thead className="bg-muted/60 text-muted-foreground font-bold uppercase tracking-wider border-b border-sidebar-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 min-w-[260px] border-r border-sidebar-border sticky left-0 bg-muted/90 backdrop-blur z-20">
                                        Task & Assignee
                                    </th>
                                    {daysInTimeline.map((dateStr) => {
                                        const isToday = dateStr === todayDate;
                                        const dayNum = dateStr.split('-')[2];
                                        const monthStr = dateStr.split('-')[1];
                                        return (
                                            <th 
                                                key={dateStr}
                                                className={`px-2 py-2 text-center min-w-[45px] border-r border-sidebar-border/50 text-[10px] ${
                                                    isToday ? 'bg-primary/20 text-primary font-extrabold' : ''
                                                }`}
                                            >
                                                <div>{dayNum}/{monthStr}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            {/* Task Duration Horizontal Bars */}
                            <tbody className="divide-y divide-sidebar-border">
                                {tasks.map((task) => {
                                    const taskStart = task.start_date || todayDate;
                                    const taskDue = task.due_date || todayDate;

                                    return (
                                        <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                                            
                                            {/* Task Name Column */}
                                            <td className="px-4 py-3 min-w-[260px] border-r border-sidebar-border sticky left-0 bg-card z-10">
                                                <div className="font-bold text-foreground line-clamp-1">{task.title}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3 text-primary" />
                                                        <span>{task.assignee?.name || 'Unassigned'}</span>
                                                    </span>
                                                    <span>• {task.duration_days} Hari</span>
                                                </div>
                                            </td>

                                            {/* Gantt Bar Grid */}
                                            {daysInTimeline.map((dateStr) => {
                                                const isToday = dateStr === todayDate;
                                                const isStart = dateStr === taskStart;
                                                const isDue = dateStr === taskDue;
                                                const isInRange = dateStr >= taskStart && dateStr <= taskDue;

                                                return (
                                                    <td 
                                                        key={dateStr}
                                                        className={`px-0 py-2 border-r border-sidebar-border/30 relative text-center ${
                                                            isToday ? 'bg-primary/5' : ''
                                                        }`}
                                                    >
                                                        {isToday && (
                                                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary/40 pointer-events-none z-10" title="Today Indicator" />
                                                        )}

                                                        {isInRange && (
                                                            <div 
                                                                className={`h-6 mx-0.5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-all ${
                                                                    task.status === 'DONE' ? 'bg-emerald-500' :
                                                                    task.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                                                    task.priority === 'Urgent' ? 'bg-rose-500' : 'bg-primary'
                                                                }`}
                                                                title={`${task.title} (${task.start_date} - ${task.due_date})`}
                                                            >
                                                                {isStart && <span className="truncate px-1">{task.status}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
