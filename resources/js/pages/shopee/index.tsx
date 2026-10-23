import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarRange,
    FlaskConical,
    LayoutDashboard,
    Megaphone,
    PlaySquare,
    ShoppingBag,
    Store,
} from 'lucide-react';
import { useState } from 'react';
import { AdsSection } from '@/components/shopee/ads-section';
import { ContentSection } from '@/components/shopee/content-section';
import { formatDate } from '@/components/shopee/format';
import { SalesSection } from '@/components/shopee/sales-section';
import { StorefrontSection } from '@/components/shopee/storefront-section';
import { SummarySection } from '@/components/shopee/summary-section';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as shopeeIndex } from '@/routes/shopee';
import type { BreadcrumbItem } from '@/types';
import type { ShopeeAnalytics, ShopeePeriodOption, ShopeeProjectOption } from '@/types/shopee';

type TabKey = 'summary' | 'sales' | 'ads' | 'content' | 'storefront';

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'summary', label: 'Ringkasan', icon: LayoutDashboard },
    { key: 'sales', label: 'Penjualan', icon: ShoppingBag },
    { key: 'ads', label: 'Iklan', icon: Megaphone },
    { key: 'content', label: 'Konten', icon: PlaySquare },
    { key: 'storefront', label: 'Etalase', icon: Store },
];

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Shopee Analytics', href: shopeeIndex() }];

interface Props {
    period: number;
    periodOptions: ShopeePeriodOption[];
    projects?: ShopeeProjectOption[];
    selectedProjectId?: number | null;
    selectedProject?: ShopeeProjectOption | null;
    analytics: ShopeeAnalytics;
}

export default function ShopeeAnalyticsPage({
    period,
    periodOptions,
    projects = [],
    selectedProjectId = null,
    selectedProject = null,
    analytics,
}: Props) {
    const [tab, setTab] = useState<TabKey>('summary');
    const rangeLabel = `${formatDate(analytics.range.start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${formatDate(analytics.range.end, { day: 'numeric', month: 'short', year: 'numeric' })}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Shopee Analytics - ${analytics.storeName}`} />

            <div className="w-full min-w-0 space-y-6 p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-2 border-b border-border/60">
                    {/* Left: Brand & Store Identity */}
                    <div className="flex items-start gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25">
                            <ShoppingBag className="size-6 stroke-[2.2]" aria-hidden />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Shopee Analytics</h1>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                                    <Store className="size-3.5" aria-hidden />
                                    {analytics.storeName}
                                </span>
                                {analytics.isDummy && (
                                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] gap-1 px-2.5 py-0.5 rounded-full">
                                        <FlaskConical className="size-3" aria-hidden />
                                        Simulasi
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {selectedProject && (
                                    <span className="font-medium">
                                        Klien: <strong className="font-bold text-foreground">{selectedProject.client || selectedProject.name}</strong>
                                    </span>
                                )}
                                <span className="text-border">•</span>
                                <span className="flex items-center gap-1.5 font-medium">
                                    <CalendarRange className="size-3.5 text-orange-600 dark:text-orange-400" aria-hidden />
                                    {rangeLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls Toolbar */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Project / Client Switcher */}
                        {projects.length > 0 && (
                            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-2.5 py-1 shadow-2xs">
                                <Building2 className="size-3.5 shrink-0 text-orange-600" aria-hidden />
                                <span className="hidden sm:inline text-xs font-bold text-muted-foreground">Project:</span>
                                <Select
                                    value={selectedProjectId ? String(selectedProjectId) : (projects[0] ? String(projects[0].id) : undefined)}
                                    onValueChange={(val) => {
                                        router.get(
                                            shopeeIndex(),
                                            {
                                                period,
                                                ...(val ? { project_id: val } : {}),
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="h-8 border-0 bg-transparent px-1.5 py-0 text-xs font-black text-foreground shadow-none focus-visible:ring-0 focus:ring-0 cursor-pointer">
                                        <SelectValue placeholder="Pilih Project" />
                                    </SelectTrigger>
                                    <SelectContent align="end" className="w-[220px]">
                                        {projects.map((proj) => (
                                            <SelectItem key={proj.id} value={String(proj.id)} className="cursor-pointer text-xs py-2">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold text-foreground">{proj.name}</span>
                                                    {proj.client && proj.client !== proj.name && (
                                                        <span className="text-[10px] text-muted-foreground font-normal">Klien: {proj.client}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Period Navigation */}
                        <nav aria-label="Filter periode" className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-2xs">
                            {periodOptions.map((option) => (
                                <Link
                                    key={option.value}
                                    href={shopeeIndex({
                                        query: {
                                            period: option.value,
                                            ...(selectedProjectId ? { project_id: selectedProjectId } : {}),
                                        },
                                    })}
                                    preserveState
                                    preserveScroll
                                    prefetch
                                    aria-current={option.value === period ? 'page' : undefined}
                                    className={cn(
                                        'rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-150',
                                        option.value === period
                                            ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                    )}
                                >
                                    {option.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Simulation Mode Banner */}
                {analytics.isDummy && (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <FlaskConical className="size-4.5" aria-hidden />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                                            Mode Simulasi Toko Aktif
                                        </span>
                                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                            {analytics.storeName}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                        Data metrik terisolasi dan konsisten per project. Statistik toko akan otomatis beralih ke Shopee Open API resmi klien saat integrasi dihubungkan.
                                    </p>
                                </div>
                            </div>
                            {selectedProject && (
                                <div className="shrink-0 pl-12 sm:pl-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                                        <Building2 className="size-3.5" aria-hidden />
                                        Project: {selectedProject.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Segmented Tabs */}
                <div role="tablist" aria-label="Bagian analitik" className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-muted/60 p-1.5 shadow-2xs max-w-full">
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const isActive = tab === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setTab(key)}
                                className={cn(
                                    'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer',
                                    isActive
                                        ? 'bg-card text-foreground shadow-xs font-extrabold border border-border/60'
                                        : 'text-muted-foreground hover:bg-card/50 hover:text-foreground',
                                )}
                            >
                                <Icon className={cn('size-4 transition-colors', isActive ? 'text-orange-600' : 'text-muted-foreground')} aria-hidden />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Panel Content */}
                <div role="tabpanel">
                    {tab === 'summary' && <SummarySection analytics={analytics} />}
                    {tab === 'sales' && <SalesSection sales={analytics.sales} />}
                    {tab === 'ads' && <AdsSection ads={analytics.ads} />}
                    {tab === 'content' && <ContentSection content={analytics.content} />}
                    {tab === 'storefront' && <StorefrontSection storefront={analytics.storefront} />}
                </div>
            </div>
        </AppLayout>
    );
}

