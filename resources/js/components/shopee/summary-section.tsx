import {
    CalendarRange,
    Coins,
    Flame,
    Megaphone,
    PlaySquare,
    Radio,
    Receipt,
    RotateCcw,
    ShoppingBag,
    Store,
    Target,
    TrendingUp,
} from 'lucide-react';
import { BarTrendChart, HorizontalBarList, SERIES_BG, StackedShareBar } from '@/components/shopee/charts';
import { formatDate, formatKpiValue, formatNumber, formatRupiah, formatRupiahCompact } from '@/components/shopee/format';
import { ChangeBadge, SectionCard } from '@/components/shopee/shared';
import { cn } from '@/lib/utils';
import type { ShopeeAnalytics, ShopeeChannelKey } from '@/types/shopee';

const CHANNEL_ICONS: Record<ShopeeChannelKey, typeof Store> = {
    organic: Store,
    ads: Megaphone,
    live: Radio,
    video: PlaySquare,
};

const KPI_CONFIG: Record<
    string,
    {
        icon: typeof Coins;
        bgClass: string;
        hoverBorder: string;
    }
> = {
    revenue: {
        icon: Coins,
        bgClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        hoverBorder: 'hover:border-orange-500/40',
    },
    orders: {
        icon: ShoppingBag,
        bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        hoverBorder: 'hover:border-blue-500/40',
    },
    aov: {
        icon: Receipt,
        bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        hoverBorder: 'hover:border-emerald-500/40',
    },
    conversionRate: {
        icon: Target,
        bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        hoverBorder: 'hover:border-purple-500/40',
    },
    adsSpend: {
        icon: Megaphone,
        bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        hoverBorder: 'hover:border-indigo-500/40',
    },
    roas: {
        icon: Flame,
        bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-500/40',
    },
    contentRevenue: {
        icon: PlaySquare,
        bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        hoverBorder: 'hover:border-rose-500/40',
    },
    cancellationRate: {
        icon: RotateCcw,
        bgClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        hoverBorder: 'hover:border-slate-500/40',
    },
};

export function SummarySection({ analytics }: { analytics: ShopeeAnalytics }) {
    const { summary, sales, range } = analytics;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                                'group relative flex flex-col justify-between min-w-0 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                                config.hoverBorder,
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {kpi.label}
                                </span>
                                <div className={cn('rounded-xl p-2 transition-transform duration-200 group-hover:scale-110', config.bgClass)}>
                                    <Icon className="size-4" aria-hidden />
                                </div>
                            </div>

                            <div className="mt-3 truncate text-2xl font-black tracking-tight text-foreground tabular-nums sm:text-3xl">
                                {formatKpiValue(kpi.value, kpi.format)}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-2.5">
                                <ChangeBadge change={kpi.change} higherIsBetter={kpi.higherIsBetter} />
                                <span className="truncate text-[11px] font-medium text-muted-foreground">
                                    sebelumnya {formatKpiValue(kpi.previous, kpi.format)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground shadow-2xs">
                <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                    Perbandingan dengan periode sebelumnya:{' '}
                    <strong className="font-semibold text-foreground">
                        {formatDate(range.previousStart, { day: 'numeric', month: 'short', year: 'numeric' })} –{' '}
                        {formatDate(range.previousEnd, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SectionCard title="Tren Omzet Harian" description="Omzet dari pesanan selesai per hari." className="xl:col-span-2">
                    <BarTrendChart
                        ariaLabel="Grafik batang omzet harian"
                        axisFormatter={formatRupiahCompact}
                        data={sales.daily.map((day) => ({
                            key: day.date,
                            axisLabel: formatDate(day.date),
                            tooltipTitle: formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' }),
                            value: day.revenue,
                            tooltipLines: [
                                { label: 'Omzet', value: formatRupiah(day.revenue) },
                                { label: 'Pesanan selesai', value: formatNumber(day.completed) },
                            ],
                        }))}
                    />
                </SectionCard>

                <SectionCard title="Sumber Omzet" description="Kontribusi tiap kanal terhadap omzet.">
                    <StackedShareBar
                        ariaLabel="Komposisi omzet per kanal"
                        segments={summary.channels.map((channel, index) => {
                            const Icon = CHANNEL_ICONS[channel.channel];

                            return {
                                key: channel.channel,
                                label: channel.label,
                                share: channel.share,
                                swatch: SERIES_BG[index],
                                detail: `${formatRupiah(channel.revenue)} · ${formatNumber(channel.orders)} pesanan`,
                                icon: <Icon className="size-3.5 text-muted-foreground" aria-hidden />,
                            };
                        })}
                    />
                </SectionCard>
            </div>

            <SectionCard title="5 Produk Terlaris" description="Berdasarkan omzet pesanan selesai.">
                <HorizontalBarList
                    items={sales.topProducts.slice(0, 5).map((product) => ({
                        key: String(product.id),
                        label: product.name,
                        sublabel: `${formatNumber(product.units)} unit`,
                        value: product.revenue,
                        valueLabel: `${formatRupiah(product.revenue)} (${product.share.toLocaleString('id-ID')}%)`,
                    }))}
                />
            </SectionCard>
        </div>
    );
}
