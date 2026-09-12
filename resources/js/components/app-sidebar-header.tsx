import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Globe, ShieldCheck } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-sidebar-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Active</span>
                </span>

                <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-sidebar-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
                >
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden md:inline">Website</span>
                </a>
            </div>
        </header>
    );
}
