import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    BarChart3, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    TrendingUp, 
    PieChart,
    Briefcase,
    Sparkles,
    Calendar
} from 'lucide-react';

interface ProjectPerf {
    id: number;
    name: string;
    client: string;
    status: string;
    total_tasks: number;
    done_tasks: number;
    delayed_tasks: number;
    completion_rate: number;
}

interface Props {
    metrics: {
        total_tasks: number;
        completed_tasks: number;
        delayed_tasks: number;
        in_progress_tasks: number;
        overall_completion_rate: number;
    };
    projectPerformance: ProjectPerf[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ProjectFlow', href: '/projects/dashboard' },
    { title: 'Reports', href: '/projects/reports' },
];

export default function ProjectReports({ metrics, projectPerformance }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Performance & Burndown Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                            <BarChart3 className="w-7 h-7 text-primary" />
                            <span>Project Reports & Analytics</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Laporan efisiensi eksekusi project, rate penyelesaian task, dan analisis keterlambatan.
                        </p>
                    </div>
                </div>

                {/* Performance Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Overall Completion Rate */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Completion</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{metrics.overall_completion_rate}%</span>
                            <span className="text-xs text-emerald-500 font-bold">Target Selesai</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted mt-3 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.overall_completion_rate}%` }} />
                        </div>
                    </div>

                    {/* Total Completed Tasks */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task Selesai</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{metrics.completed_tasks}</span>
                            <span className="text-xs text-muted-foreground">Dari {metrics.total_tasks} Total Task</span>
                        </div>
                    </div>

                    {/* Delayed Tasks */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task Terlambat</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{metrics.delayed_tasks}</span>
                            <span className="text-xs text-rose-500 font-bold">Butuh Perhatian</span>
                        </div>
                    </div>

                    {/* Tasks In Progress */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">In Progress</span>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{metrics.in_progress_tasks}</span>
                            <span className="text-xs text-amber-500 font-bold">Sedang Dikerjakan</span>
                        </div>
                    </div>

                </div>

                {/* Per-Project Performance Efficiency Table */}
                <div className="rounded-2xl border border-sidebar-border bg-card overflow-hidden shadow-sm space-y-4">
                    <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                <span>Performa per Project Client</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Analisis efisiensi penyelesaian task per project</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Nama Project / Client</th>
                                    <th className="px-6 py-4 font-bold">Total Task</th>
                                    <th className="px-6 py-4 font-bold">Selesai</th>
                                    <th className="px-6 py-4 font-bold">Terlambat</th>
                                    <th className="px-6 py-4 font-bold text-right">Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {projectPerformance.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">Client: {p.client}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-foreground">{p.total_tasks} Task</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-500">{p.done_tasks} Task</td>
                                        <td className="px-6 py-4 font-semibold text-rose-500">{p.delayed_tasks} Task</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${p.completion_rate}%` }} />
                                                </div>
                                                <span className="font-extrabold text-foreground text-xs">{p.completion_rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
