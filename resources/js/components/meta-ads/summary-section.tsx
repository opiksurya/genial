import {
    CalendarRange,
    Coins,
    Flame,
    MousePointerClick,
    Percent,
    Receipt,
    ShoppingBag,
    TrendingUp,
    UserCheck,
    Wallet,
} from 'lucide-react';
import { BarTrendChart, HorizontalBarList, LineCompareChart, META_SERIES_BG, StackedShareBar } from '@/components/meta-ads/charts';
import { formatDate, formatKpiValue, formatNumber, formatPercent, formatRatio, formatRupiah, formatRupiahCompact } from '@/components/meta-ads/format';
import { ChangeBadge, SectionCard } from '@/components/meta-ads/shared';
import { cn } from '@/lib/utils';
import type { MetaAdsAnalytics } from '@/types/meta-ads';

const KPI_CONFIG: Record<
    string,
    {
        icon: typeof Coins;
        bgClass: string;
        hoverBorder: string;
    }
> = {
    spend: {
        icon: Wallet,
        bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        hoverBorder: 'hover:border-blue-500/40',
    },
    roas: {
        icon: Flame,
        bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-500/40',
    },
    revenue: {
        icon: Coins,
        bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        hoverBorder: 'hover:border-emerald-500/40',
    },
    purchases: {
        icon: ShoppingBag,
        bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        hoverBorder: 'hover:border-indigo-500/40',
    },
    cpa: {
        icon: Receipt,
        bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        hoverBorder: 'hover:border-purple-500/40',
    },
    leads: {
        icon: UserCheck,
        bgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
        hoverBorder: 'hover:border-teal-500/40',
    },
    clicks: {
        icon: MousePointerClick,
        bgClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        hoverBorder: 'hover:border-sky-500/40',
    },
    ctr: {
        icon: Percent,
        bgClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
        hoverBorder: 'hover:border-pink-500/40',
    },
};

export function SummarySection({ analytics }: { analytics: MetaAdsAnalytics }) {
    const { summary, daily, platforms, placements, range } = analytics;

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summary.kpis.map((kpi) => {
                    const config = KPI_CONFIG[kpi.key] || {
                        icon: TrendingUp,
                        bgClass: 'bg-muted text-muted-foreground',
                        hoverBorder: 'hover:border-muted-foreground/30',
                    };
                    const Icon = config.icon;

                    return (
                        <div
                            key={kpi.key}
                            className={cn(
                                'group relative flex flex-col justify-between min-w-0 rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-2xs transition-all duration-150 hover:border-blue-500/30 hover:shadow-xs',
                                config.hoverBorder,
                            )}
                        >
                            <div className="flex items-start justify-between gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {kpi.label}
                                </span>
                                <div className={cn('rounded-lg p-1.5 transition-transform duration-150 group-hover:scale-105', config.bgClass)}>
                                    <Icon className="size-3.5" aria-hidden />
                                </div>
                            </div>

                            <div className="mt-2 truncate text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-xl">
                                {formatKpiValue(kpi.value, kpi.format)}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2 text-[11px]">
                                <ChangeBadge change={kpi.change} higherIsBetter={kpi.higherIsBetter} />
                                <span className="truncate text-[10px] font-normal text-muted-foreground">
                                    sebelumnya {formatKpiValue(kpi.previous, kpi.format)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comparison Period Indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground shadow-2xs">
                <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                    Perbandingan dengan periode sebelumnya:{' '}
                    <strong className="font-semibold text-foreground">
                        {formatDate(range.previousStart, { day: 'numeric', month: 'short', year: 'numeric' })} –{' '}
                        {formatDate(range.previousEnd, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                </span>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <SectionCard
                    title="Tren Biaya Iklan vs Nilai Pembelian"
                    description="Perbandingan biaya spend harian dan omzet konversi pembelian."
                    className="xl:col-span-2"
                >
                    <LineCompareChart
                        ariaLabel="Grafik perbandingan spend vs revenue harian"
                        labels={daily.map((d) => formatDate(d.date))}
                        tooltipTitles={daily.map((d) => formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' }))}
                        axisFormatter={formatRupiahCompact}
                        valueFormatter={formatRupiah}
                        series={[
                            { key: 'spend', label: 'Biaya Spend', values: daily.map((d) => d.spend) },
                            { key: 'revenue', label: 'Nilai Pembelian', values: daily.map((d) => d.revenue) },
                        ]}
                    />
                </SectionCard>

                <SectionCard title="Distribusi Platform Meta" description="Persentase biaya spend di ekosistem Meta.">
                    <StackedShareBar
                        ariaLabel="Komposisi platform Meta Ads"
                        segments={platforms.map((p, idx) => ({
                            key: p.platform,
                            label: p.label,
                            share: p.share,
                            swatch: META_SERIES_BG[idx] || 'bg-blue-600',
                            detail: `${formatRupiah(p.spend)} · ROAS ${formatRatio(p.roas)}`,
                        }))}
                    />
                </SectionCard>
            </div>

            {/* Placements Share */}
            <SectionCard title="Performa Penempatan Teratas (Placements)" description="Kontribusi omzet dan rasio ROAS berdasarkan penempatan iklan.">
                <HorizontalBarList
                    max={100}
                    items={placements.map((p) => ({
                        key: p.name,
                        label: p.name,
                        sublabel: `${formatRupiah(p.spend)} spend · ROAS ${formatRatio(p.roas)}`,
                        value: p.share,
                        valueLabel: `${p.share}% share`,
                    }))}
                />
            </SectionCard>
        </div>
    );
}
