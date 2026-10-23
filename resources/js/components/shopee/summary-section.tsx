import { Megaphone, PlaySquare, Radio, Store } from 'lucide-react';
import { BarTrendChart, HorizontalBarList, SERIES_BG, StackedShareBar } from '@/components/shopee/charts';
import { formatDate, formatKpiValue, formatNumber, formatRupiah, formatRupiahCompact } from '@/components/shopee/format';
import { ChangeBadge, SectionCard } from '@/components/shopee/shared';
import type { ShopeeAnalytics, ShopeeChannelKey } from '@/types/shopee';

const CHANNEL_ICONS: Record<ShopeeChannelKey, typeof Store> = {
    organic: Store,
    ads: Megaphone,
    live: Radio,
    video: PlaySquare,
};

export function SummarySection({ analytics }: { analytics: ShopeeAnalytics }) {
    const { summary, sales, range } = analytics;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summary.kpis.map((kpi) => (
                    <div key={kpi.key} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="truncate text-xs font-medium text-muted-foreground">{kpi.label}</div>
                        <div className="mt-2 truncate text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                            {formatKpiValue(kpi.value, kpi.format)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <ChangeBadge change={kpi.change} higherIsBetter={kpi.higherIsBetter} />
                            <span className="truncate text-[11px] text-muted-foreground">
                                sebelumnya {formatKpiValue(kpi.previous, kpi.format)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                Dibandingkan dengan periode sebelumnya: {formatDate(range.previousStart, { day: 'numeric', month: 'short', year: 'numeric' })} –{' '}
                {formatDate(range.previousEnd, { day: 'numeric', month: 'short', year: 'numeric' })}.
            </p>

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
