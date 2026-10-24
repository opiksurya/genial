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
    Settings,
} from 'lucide-react';
import { useState } from 'react';
import { AdsSection } from '@/components/shopee/ads-section';
import { ContentSection } from '@/components/shopee/content-section';
import { formatDate } from '@/components/shopee/format';
import { SalesSection } from '@/components/shopee/sales-section';
import { StorefrontSection } from '@/components/shopee/storefront-section';
import { SummarySection } from '@/components/shopee/summary-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientShopeeConnectModal } from '@/components/projects/client-shopee-connect-modal';
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
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    const isShopeeConnected = Boolean(
        selectedProject?.shopee_config?.status === 'connected' ||
        selectedProject?.shopeeConfig?.status === 'connected'
    );

    const rangeLabel = `${formatDate(analytics.range.start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${formatDate(analytics.range.end, { day: 'numeric', month: 'short', year: 'numeric' })}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Shopee Analytics - ${analytics.storeName}`} />

            <div className="w-full min-w-0 space-y-4 p-4 sm:p-5">
                {/* Header Section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/60">
                    {/* Left: Brand & Store Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-sm shadow-orange-500/25">
                            <ShoppingBag className="size-4.5 stroke-[2.2]" aria-hidden />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Shopee Analytics</h1>
                                <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                                    <Store className="size-3" aria-hidden />
                                    {analytics.storeName}
                                </span>
                                {analytics.isDummy ? (
                                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[10px] gap-1 px-1.5 py-0 rounded-full">
                                        <FlaskConical className="size-2.5" aria-hidden />
                                        Simulasi
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] gap-1 px-1.5 py-0 rounded-full">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live API
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                                {selectedProject && (
                                    <span>
                                        Klien: <strong className="font-semibold text-foreground">{selectedProject.client || selectedProject.name}</strong>
                                    </span>
                                )}
                                <span className="text-border">•</span>
                                <span className="flex items-center gap-1">
                                    <CalendarRange className="size-3 text-orange-600 dark:text-orange-400" aria-hidden />
                                    {rangeLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls Toolbar - Strictly Right Aligned */}
                    <div className="flex items-center justify-end gap-2 ml-auto shrink-0 flex-wrap sm:flex-nowrap">
                        {/* Shopee API Connection Button */}
                        {isShopeeConnected ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsConnectModalOpen(true)}
                                disabled={!selectedProject}
                                className="h-8 rounded-lg border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100/50 dark:text-emerald-400 gap-1.5 shadow-2xs cursor-pointer"
                                title="Kelola Kredensial Shopee API"
                            >
                                <Settings className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                                <span>Kelola Shopee</span>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsConnectModalOpen(true)}
                                disabled={!selectedProject}
                                className="h-8 rounded-lg bg-[#EE4D2D] hover:bg-[#d73211] text-white px-3 text-xs font-bold gap-1.5 shadow-sm shadow-orange-500/25 cursor-pointer"
                                title="Hubungkan Shopee API"
                            >
                                <ShoppingBag className="size-3.5" aria-hidden />
                                <span>Hubungkan Shopee</span>
                            </Button>
                        )}

                        {/* Project / Client Switcher */}
                        {projects.length > 0 && (
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
                                <SelectTrigger className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-2xs hover:border-orange-500/40 cursor-pointer min-w-[140px] max-w-[200px]">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Building2 className="size-3.5 shrink-0 text-orange-600" aria-hidden />
                                        <SelectValue placeholder="Pilih Project" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent align="end" className="w-[220px]">
                                    {projects.map((proj) => (
                                        <SelectItem key={proj.id} value={String(proj.id)} className="cursor-pointer text-xs py-1.5">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold text-foreground">{proj.name}</span>
                                                {proj.client && proj.client !== proj.name && (
                                                    <span className="text-[10px] text-muted-foreground">Klien: {proj.client}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Period Navigation ("Tab Hari") */}
                        <nav aria-label="Filter periode" className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs h-8">
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
                                        'rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-150',
                                        option.value === period
                                            ? 'bg-orange-600 text-white font-bold shadow-2xs'
                                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                                    )}
                                >
                                    {option.value} Hari
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Simulation Mode Banner - Compact */}
                {analytics.isDummy && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 min-w-0">
                            <FlaskConical className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                            <span className="truncate">
                                <strong>Mode Simulasi ({analytics.storeName})</strong>: Data terisolasi per project.{' '}
                                {!isShopeeConnected && (
                                    <button
                                        type="button"
                                        onClick={() => setIsConnectModalOpen(true)}
                                        className="underline font-bold text-orange-700 dark:text-orange-400 hover:text-orange-800 cursor-pointer"
                                    >
                                        Hubungkan Shopee API sekarang
                                    </button>
                                )}
                            </span>
                        </div>
                        {selectedProject && (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                                Project: {selectedProject.name}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Navigation Segmented Tabs - Compact */}
                <div role="tablist" aria-label="Bagian analitik" className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/50 p-1 shadow-2xs max-w-full h-9">
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
                                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer',
                                    isActive
                                        ? 'bg-card text-foreground shadow-2xs font-bold border border-border/60'
                                        : 'text-muted-foreground hover:bg-card/40 hover:text-foreground',
                                )}
                            >
                                <Icon className={cn('size-3.5 transition-colors', isActive ? 'text-orange-600' : 'text-muted-foreground')} aria-hidden />
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

                {/* Client Shopee API Connect Modal */}
                <ClientShopeeConnectModal
                    project={selectedProject as any}
                    isOpen={isConnectModalOpen}
                    onClose={() => setIsConnectModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}

