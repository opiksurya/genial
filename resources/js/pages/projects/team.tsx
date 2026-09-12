import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Users, 
    UserCheck, 
    Briefcase, 
    CheckCircle2, 
    Clock, 
    Shield, 
    Sparkles, 
    Crown,
    Code2,
    Palette,
    Megaphone,
    Search,
    PenTool
} from 'lucide-react';

interface ProjectItem {
    id: number;
    name: string;
    client: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    created_at: string;
    roles?: { name: string }[];
    assigned_tasks_count: number;
    completed_tasks_count: number;
    active_projects: ProjectItem[];
}

interface Props {
    users: UserItem[];
    rolesList: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ProjectFlow', href: '/projects/dashboard' },
    { title: 'Team Management', href: '/projects/team' },
];

const ROLE_ICONS: Record<string, any> = {
    'Project Manager': Crown,
    'Designer': Palette,
    'Developer': Code2,
    'Ads Specialist': Megaphone,
    'SEO Specialist': Search,
    'Content Writer': PenTool,
};

export default function ProjectTeam({ users, rolesList }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team Management & Roles" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                            <UserCheck className="w-7 h-7 text-primary" />
                            <span>Team Management & Role Workload</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Alokasi anggota tim digital marketing agency berdasarkan keahlian spesialisasi & beban task aktif.
                        </p>
                    </div>
                </div>

                {/* Agency Roles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {rolesList.map((r) => {
                        const IconComponent = ROLE_ICONS[r] || Users;
                        return (
                            <div key={r} className="p-3.5 rounded-xl border border-sidebar-border bg-card shadow-sm flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                    <div className="text-[11px] font-bold text-foreground truncate">{r}</div>
                                    <div className="text-[10px] text-muted-foreground">Spesialisasi Tim</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Team Members List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {users.map((u) => (
                        <div key={u.id} className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover border border-sidebar-border" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 text-primary font-bold text-base flex items-center justify-center border border-primary/20 shrink-0">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <h3 className="font-extrabold text-foreground text-base truncate">{u.name}</h3>
                                        <p className="text-xs text-muted-foreground font-mono truncate">{u.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-4">
                                    {u.roles && u.roles.length > 0 ? (
                                        u.roles.map((r, i) => (
                                            <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                {r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Member</span>
                                    )}
                                </div>

                                {/* Workload Metrics */}
                                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-sidebar-border text-xs">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block font-medium">Task Active</span>
                                        <span className="text-base font-extrabold text-amber-500">{u.assigned_tasks_count} Task</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block font-medium">Task Done</span>
                                        <span className="text-base font-extrabold text-emerald-500">{u.completed_tasks_count} Task</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Projects */}
                            <div className="pt-3 border-t border-sidebar-border space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project yang Ditangani:</span>
                                {u.active_projects && u.active_projects.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {u.active_projects.map((p) => (
                                            <span key={p.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-card border border-sidebar-border text-foreground">
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-muted-foreground italic">Belum ada project aktif</span>
                                )}
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </AppLayout>
    );
}
