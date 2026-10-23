import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { BarTrendChart, StackedShareBar } from '@/components/shopee/charts';
import { formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/components/shopee/format';
import { EmptyState, SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/shopee/shared';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ShopeeOrderStatus, ShopeeSales } from '@/types/shopee';

const STATUS_STYLE: Record<ShopeeOrderStatus, { swatch: string; icon: typeof CheckCircle2; iconClass: string }> = {
    completed: { swatch: 'bg-emerald-600 dark:bg-emerald-500', icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400' },
    cancelled: { swatch: 'bg-rose-600 dark:bg-rose-500', icon: XCircle, iconClass: 'text-rose-600 dark:text-rose-400' },
    returned: { swatch: 'bg-amber-500 dark:bg-amber-400', icon: RotateCcw, iconClass: 'text-amber-600 dark:text-amber-400' },
};

type Granularity = 'daily' | 'weekly';

export function SalesSection({ sales }: { sales: ShopeeSales }) {
    const [granularity, setGranularity] = useState<Granularity>('daily');
    const { totals } = sales;

    const trendData =
        granularity === 'daily'
            ? sales.daily.map((day) => ({
                  key: day.date,
                  axisLabel: formatDate(day.date),
                  tooltipTitle: formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'short' }),
                  value: day.revenue,
                  tooltipLines: [
                      { label: 'Omzet', value: formatRupiah(day.revenue) },
                      { label: 'Total pesanan', value: formatNumber(day.orders) },
                      { label: 'Pesanan selesai', value: formatNumber(day.completed) },
                  ],
              }))
            : sales.weekly.map((week) => ({
                  key: week.weekStart,
                  axisLabel: formatDate(week.weekStart),
                  tooltipTitle: `${formatDate(week.weekStart)} – ${formatDate(week.weekEnd)}`,
                  value: week.revenue,
                  tooltipLines: [
                      { label: 'Omzet', value: formatRupiah(week.revenue) },
                      { label: 'Total pesanan', value: formatNumber(week.orders) },
                      { label: 'Pesanan selesai', value: formatNumber(week.completed) },
                  ],
              }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <StatTile label="Omzet (Selesai)" value={formatRupiah(totals.revenue)} />
                <StatTile label="Nilai Pesanan Kotor" value={formatRupiah(totals.grossValue)} hint="Termasuk batal & retur" />
                <StatTile label="Total Pesanan" value={formatNumber(totals.orders)} />
                <StatTile label="Pesanan Selesai" value={formatNumber(totals.completed)} />
                <StatTile label="AOV" value={formatRupiah(totals.aov)} hint="Omzet / pesanan selesai" />
                <StatTile label="Unit Terjual" value={formatNumber(totals.units)} />
            </div>

            <SectionCard
                title="Tren Penjualan"
                description="Omzet pesanan selesai. Arahkan kursor ke batang untuk detail."
                action={
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={granularity}
                        onValueChange={(value) => value && setGranularity(value as Granularity)}
                        aria-label="Pilih tampilan tren"
                    >
                        <ToggleGroupItem value="daily" className="px-3 text-xs">
                            Harian
                        </ToggleGroupItem>
                        <ToggleGroupItem value="weekly" className="px-3 text-xs">
                            Mingguan
                        </ToggleGroupItem>
                    </ToggleGroup>
                }
            >
                <BarTrendChart
                    ariaLabel={granularity === 'daily' ? 'Grafik omzet harian' : 'Grafik omzet mingguan'}
                    axisFormatter={formatRupiahCompact}
                    data={trendData}
                />
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SectionCard title="Status Pesanan" description="Komposisi seluruh pesanan pada periode ini.">
                    <StackedShareBar
                        ariaLabel="Komposisi status pesanan"
                        segments={sales.statuses.map((status) => {
                            const style = STATUS_STYLE[status.status];
                            const Icon = style.icon;

                            return {
                                key: status.status,
                                label: status.label,
                                share: status.share,
                                swatch: style.swatch,
                                detail: `${formatNumber(status.orders)} pesanan · ${formatRupiah(status.value)}`,
                                icon: <Icon className={`size-3.5 ${style.iconClass}`} aria-hidden />,
                            };
                        })}
                    />
                </SectionCard>

                <SectionCard title="Ringkasan Mingguan" className="xl:col-span-2">
                    <TableWrapper>
                        <thead>
                            <tr>
                                <Th>Minggu</Th>
                                <Th align="right">Omzet</Th>
                                <Th align="right">Total Pesanan</Th>
                                <Th align="right">Selesai</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sales.weekly.map((week) => (
                                <tr key={week.weekStart} className="hover:bg-muted/30">
                                    <Td className="whitespace-nowrap">
                                        {formatDate(week.weekStart)} – {formatDate(week.weekEnd)}
                                    </Td>
                                    <Td align="right">{formatRupiah(week.revenue)}</Td>
                                    <Td align="right">{formatNumber(week.orders)}</Td>
                                    <Td align="right">{formatNumber(week.completed)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                </SectionCard>
            </div>

            <SectionCard title="Produk Terlaris" description="10 produk dengan omzet tertinggi.">
                {sales.topProducts.length === 0 ? (
                    <EmptyState message="Belum ada penjualan pada periode ini." />
                ) : (
                    <TableWrapper>
                        <thead>
                            <tr>
                                <Th>#</Th>
                                <Th>Produk</Th>
                                <Th>Etalase</Th>
                                <Th align="right">Pesanan</Th>
                                <Th align="right">Unit</Th>
                                <Th align="right">Omzet</Th>
                                <Th align="right">Kontribusi</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sales.topProducts.map((product, index) => (
                                <tr key={product.id} className="hover:bg-muted/30">
                                    <Td className="text-muted-foreground">{index + 1}</Td>
                                    <Td>
                                        <div className="font-semibold">{product.name}</div>
                                        <div className="text-[11px] text-muted-foreground">{product.sku}</div>
                                    </Td>
                                    <Td className="text-muted-foreground">{product.etalase}</Td>
                                    <Td align="right">{formatNumber(product.orders)}</Td>
                                    <Td align="right">{formatNumber(product.units)}</Td>
                                    <Td align="right" className="font-semibold">
                                        {formatRupiah(product.revenue)}
                                    </Td>
                                    <Td align="right">{product.share.toLocaleString('id-ID')}%</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                )}
            </SectionCard>
        </div>
    );
}
