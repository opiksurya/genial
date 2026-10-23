import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Building2, CalendarRange, FlaskConical, LayoutDashboard, Megaphone, PlaySquare, ShoppingBag, Store } from 'lucide-react';
import { useState } from 'react';
import { AdsSection } from '@/components/shopee/ads-section';
import { ContentSection } from '@/components/shopee/content-section';
import { formatDate } from '@/components/shopee/format';
import { SalesSection } from '@/components/shopee/sales-section';
import { StorefrontSection } from '@/components/shopee/storefront-section';
import { SummarySection } from '@/components/shopee/summary-section';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Shopee Analytics</h1>
                            {analytics.isDummy && (
                                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                    <FlaskConical aria-hidden />
                                    Data Dummy
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            <span className="font-bold text-foreground">{analytics.storeName}</span> · Analisis penjualan, iklan, konten, dan etalase toko.
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarRange className="size-3.5" aria-hidden />
                            {rangeLabel}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Project / Client Switcher */}
                        {projects.length > 0 && (
                            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-2xs">
                                <span className="flex items-center gap-1 pl-2 text-xs font-bold text-muted-foreground">
                                    <Building2 className="size-3.5 text-orange-600" aria-hidden />
                                    <span className="hidden sm:inline">Project:</span>
                                </span>
                                <select
                                    value={selectedProjectId ?? ''}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        router.get(
                                            shopeeIndex(),
                                            {
                                                period,
                                                ...(pId ? { project_id: pId } : {}),
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                    className="h-8 rounded-lg border-0 bg-transparent pr-7 pl-1 text-xs font-extrabold text-foreground focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                    aria-label="Pilih Project / Klien"
                                >
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id} className="bg-popover text-popover-foreground">
                                            {proj.name} {proj.client && proj.client !== proj.name ? `(${proj.client})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Period Navigation */}
                        <nav aria-label="Filter periode" className="flex w-fit items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-2xs">
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
                                        'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                                        option.value === period
                                            ? 'bg-orange-600 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {option.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {analytics.isDummy && (
                    <Alert className="border-amber-500/40 bg-amber-500/5">
                        <FlaskConical className="text-amber-600 dark:text-amber-400" aria-hidden />
                        <AlertTitle className="flex flex-wrap items-center gap-2">
                            <span>Data Dummy Simulasi</span>
                            {selectedProject && (
                                <Badge variant="outline" className="text-[11px] font-bold border-amber-500/30">
                                    Project: {selectedProject.name}
                                </Badge>
                            )}
                        </AlertTitle>
                        <AlertDescription>
                            Menampilkan simulasi analitik toko <strong>{analytics.storeName}</strong>. Setiap project memiliki toko, angka penjualan, dan performa iklan yang terisolasi secara konsisten. Nanti saat dihubungkan ke akun Shopee resmi klien, data akan otomatis ditarik dari Shopee Open API.
                        </AlertDescription>
                    </Alert>
                )}

                <div role="tablist" aria-label="Bagian analitik" className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            onClick={() => setTab(key)}
                            className={cn(
                                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                                tab === key
                                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Icon className="size-4" aria-hidden />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

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
