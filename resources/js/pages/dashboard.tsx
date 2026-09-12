import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    TrendingUp, 
    Users, 
    ShieldCheck, 
    Activity, 
    MessageSquare, 
    ArrowUpRight, 
    CheckCircle2, 
    Plus,
    Sliders,
    Globe,
    Sparkles,
    Building2,
    Calendar,
    PhoneCall
} from 'lucide-react';

interface Lead {
    id: number;
    name: string;
    whatsapp: string;
    website_marketplace: string;
    business_type: string;
    target_sales: string;
    whatsapp_link: string;
    created_at: string;
}

interface Props {
    stats: {
        total_leads: number;
        total_users: number;
        total_roles: number;
        meta_pixel_active: boolean;
        meta_pixel_id: string;
    };
    recentLeads: Lead[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ stats, recentLeads }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Executive Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Hero Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Genial Digital Operations</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Executive Dashboard
                            </h1>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Pantau masuknya prospek (Leads), pengelolaan tim & peran akses, serta status pelacakan Meta Ads Pixel & CAPI secara real-time.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Link
                                href="/users"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-all shadow-md"
                            >
                                <Users className="w-4 h-4 text-slate-900" />
                                <span>Kelola Users</span>
                            </Link>
                            <Link
                                href="/settings/pixel"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md"
                            >
                                <Sliders className="w-4 h-4" />
                                <span>Setting Meta Pixel</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Leads Card */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Leads Audit</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{stats?.total_leads || 0}</span>
                            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Live Leads
                            </span>
                        </div>
                    </div>

                    {/* Total Users Card */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tim & Pengguna</span>
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{stats?.total_users || 0}</span>
                            <span className="text-xs text-muted-foreground">User Terdaftar</span>
                        </div>
                    </div>

                    {/* Roles & Access Card */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role & Hak Akses</span>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-foreground">{stats?.total_roles || 0}</span>
                            <span className="text-xs text-muted-foreground">Tingkat Akses</span>
                        </div>
                    </div>

                    {/* Meta Pixel & CAPI Card */}
                    <div className="p-5 rounded-2xl border border-sidebar-border bg-card shadow-sm hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta Pixel & CAPI</span>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-[13px] font-bold text-foreground">
                                {stats?.meta_pixel_active ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-bold border border-slate-500/20">
                                        Non-aktif
                                    </span>
                                )}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {stats?.meta_pixel_id ? `ID: ${stats.meta_pixel_id}` : 'Belum di-set'}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Recent Leads Table & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recent Leads Table (2 cols) */}
                    <div className="lg:col-span-2 rounded-2xl border border-sidebar-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                        <span>Prospek Audit Terbaru (Leads)</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Daftar pengaju audit digital terbaru dari landing page</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                    Top 5 Terbaru
                                </span>
                            </div>

                            {recentLeads && recentLeads.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-sidebar-border">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Nama / WhatsApp</th>
                                                <th className="px-5 py-3 font-semibold">Website / Marketplace</th>
                                                <th className="px-5 py-3 font-semibold">Bisnis</th>
                                                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border">
                                            {recentLeads.map((lead) => (
                                                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-foreground">{lead.name}</div>
                                                        <div className="text-xs text-muted-foreground">{lead.whatsapp}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                                                        {lead.website_marketplace}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                                        <span className="px-2 py-0.5 rounded-md bg-muted font-medium text-foreground">
                                                            {lead.business_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <a
                                                            href={lead.whatsapp_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                                                        >
                                                            <PhoneCall className="w-3 h-3" />
                                                            <span>Follow Up WA</span>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-sm space-y-2">
                                    <Building2 className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                    <p>Belum ada data pengajuan audit.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Control Panel (1 col) */}
                    <div className="rounded-2xl border border-sidebar-border bg-card p-5 shadow-sm space-y-5">
                        <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>Aksi Cepat Sistem</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Akses fitur navigasi utama dalam 1 klik</p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/users"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-sidebar-border hover:border-primary/40 hover:bg-muted/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Tambah / Kelola User</div>
                                        <div className="text-[11px] text-muted-foreground">Buat akun tim baru</div>
                                    </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>

                            <Link
                                href="/roles"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-sidebar-border hover:border-primary/40 hover:bg-muted/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Atur Roles & Permissions</div>
                                        <div className="text-[11px] text-muted-foreground">Atur hak akses Super Admin, Staff</div>
                                    </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>

                            <Link
                                href="/settings/pixel"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-sidebar-border hover:border-primary/40 hover:bg-muted/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                        <Sliders className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Meta Pixel & CAPI</div>
                                        <div className="text-[11px] text-muted-foreground">Atur Pixel ID & Token CAPI</div>
                                    </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>

                            <a
                                href="/"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-sidebar-border hover:border-primary/40 hover:bg-muted/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Buka Landing Page</div>
                                        <div className="text-[11px] text-muted-foreground">Lihat tampilan publik website</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                        </div>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
