import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Building2,
    CalendarRange,
    Clapperboard,
    FlaskConical,
    LayoutDashboard,
    Megaphone,
    Share2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { AudiencesSection } from '@/components/meta-ads/audiences-section';
import { CampaignsSection } from '@/components/meta-ads/campaigns-section';
import { CreativesSection } from '@/components/meta-ads/creatives-section';
import { formatDate } from '@/components/meta-ads/format';
import { PixelSection } from '@/components/meta-ads/pixel-section';
import { SummarySection } from '@/components/meta-ads/summary-section';
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
import { index as metaAdsIndex } from '@/routes/meta-ads';
import type { BreadcrumbItem } from '@/types';
import type { MetaAdsAnalytics, MetaAdsPeriodOption, MetaAdsProjectOption } from '@/types/meta-ads';

type TabKey = 'summary' | 'campaigns' | 'audiences' | 'creatives' | 'pixel';

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'summary', label: 'Ringkasan', icon: LayoutDashboard },
    { key: 'campaigns', label: 'Kampanye', icon: Megaphone },
    { key: 'audiences', label: 'Audiens & Demografi', icon: Users },
    { key: 'creatives', label: 'Format Iklan', icon: Clapperboard },
    { key: 'pixel', label: 'Pixel & CAPI', icon: Activity },
];

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Meta Ads Analytics', href: metaAdsIndex() }];

interface Props {
    period: number;
    periodOptions: MetaAdsPeriodOption[];
    projects?: MetaAdsProjectOption[];
    selectedProjectId?: number | null;
    selectedProject?: MetaAdsProjectOption | null;
    analytics: MetaAdsAnalytics;
}

export default function MetaAdsAnalyticsPage({
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
            <Head title={`Meta Ads Analytics - ${analytics.accountName}`} />

            <div className="w-full min-w-0 space-y-4 p-4 sm:p-5">
                {/* Header Section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/60">
                    {/* Left: Brand Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25">
                            <Share2 className="size-4.5 stroke-[2.2]" aria-hidden />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Meta Ads Analytics</h1>
                                <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                                    <Megaphone className="size-3" aria-hidden />
                                    {analytics.accountName}
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
                                <span className="font-mono text-[11px] text-muted-foreground/80">ID: {analytics.adAccountId}</span>
                                <span className="text-border">•</span>
                                <span className="flex items-center gap-1">
                                    <CalendarRange className="size-3 text-blue-600 dark:text-blue-400" aria-hidden />
                                    {rangeLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls Toolbar - Strictly Right Aligned */}
                    <div className="flex items-center justify-end gap-2 ml-auto shrink-0">
                        {/* Project / Client Switcher */}
                        {projects.length > 0 && (
                            <Select
                                value={selectedProjectId ? String(selectedProjectId) : (projects[0] ? String(projects[0].id) : undefined)}
                                onValueChange={(val) => {
                                    router.get(
                                        metaAdsIndex(),
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
                                <SelectTrigger className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-2xs hover:border-blue-500/40 cursor-pointer min-w-[140px] max-w-[200px]">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Building2 className="size-3.5 shrink-0 text-blue-600" aria-hidden />
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
                                    href={metaAdsIndex({
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
                                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
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
                                <strong>Simulasi Meta Ads ({analytics.accountName})</strong>: Data terisolasi per project. Otomatis menampilkan data real-time saat akun Meta Graph API terhubung di Project Flow.
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
                                <Icon className={cn('size-3.5 transition-colors', isActive ? 'text-blue-600' : 'text-muted-foreground')} aria-hidden />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Panel Content */}
                <div role="tabpanel">
                    {tab === 'summary' && <SummarySection analytics={analytics} />}
                    {tab === 'campaigns' && <CampaignsSection campaigns={analytics.campaigns} />}
                    {tab === 'audiences' && <AudiencesSection audiences={analytics.audiences} />}
                    {tab === 'creatives' && <CreativesSection creatives={analytics.creatives} />}
                    {tab === 'pixel' && <PixelSection pixelHealth={analytics.pixelHealth} />}
                </div>
            </div>
        </AppLayout>
    );
}
