import { Link } from '@inertiajs/react';
import { 
    LayoutGrid, 
    ShieldCheck, 
    Users, 
    ExternalLink, 
    Sparkles,
    FolderKanban,
    Kanban,
    Clock,
    UserCheck,
    BarChart3
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'ProjectFlow',
        href: '/projects/dashboard',
        icon: FolderKanban,
        items: [
            {
                title: 'Dashboard Project',
                href: '/projects/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Project Board',
                href: '/projects/board',
                icon: Kanban,
            },
            {
                title: 'Timeline View',
                href: '/projects/timeline',
                icon: Clock,
            },
            {
                title: 'Team Management',
                href: '/projects/team',
                icon: UserCheck,
            },
            {
                title: 'Reports',
                href: '/projects/reports',
                icon: BarChart3,
            },
        ],
    },
    {
        title: 'User Management',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Roles & Permissions',
        href: '/roles',
        icon: ShieldCheck,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch className="flex items-center gap-2">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="p-3 space-y-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-xs space-y-2 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            Genial v1.0
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Digital Agency Operations & Lead Management System
                    </p>
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                        <span>Lihat Website Utama</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
