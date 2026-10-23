import { AlertTriangle, CheckCircle2, PackageX, TrendingDown } from 'lucide-react';
import { HorizontalBarList } from '@/components/shopee/charts';
import { formatNumber, formatPercent, formatRupiah } from '@/components/shopee/format';
import { EmptyState, SectionCard, TableWrapper, Td, Th } from '@/components/shopee/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShopeeStockStatus, ShopeeStorefront } from '@/types/shopee';

const STOCK_BADGE: Record<ShopeeStockStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    aman: { label: 'Aman', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
    menipis: { label: 'Menipis', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: AlertTriangle },
    habis: { label: 'Habis', className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400', icon: PackageX },
};

function StockBadge({ status }: { status: ShopeeStockStatus }) {
    const badge = STOCK_BADGE[status];
    const Icon = badge.icon;

    return (
        <Badge variant="outline" className={cn('gap-1', badge.className)}>
            <Icon aria-hidden />
            {badge.label}
        </Badge>
    );
}

export function StorefrontSection({ storefront }: { storefront: ShopeeStorefront }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SectionCard title="Kontribusi Omzet per Etalase" description="Total semua etalase = total omzet toko.">
                    <HorizontalBarList
                        max={100}
                        items={storefront.etalase.map((etalase) => ({
                            key: etalase.name,
                            label: etalase.name,
                            sublabel: `${etalase.productCount} produk`,
                            value: etalase.share,
                            valueLabel: `${etalase.share.toLocaleString('id-ID')}%`,
                        }))}
                    />
                </SectionCard>

                <SectionCard title="Performa Etalase" className="xl:col-span-2">
                    <TableWrapper>
                        <thead>
                            <tr>
                                <Th>Etalase</Th>
                                <Th align="right">Stok</Th>
                                <Th align="right">Views</Th>
                                <Th align="right">Pesanan</Th>
                                <Th align="right">Konversi</Th>
                                <Th align="right">Omzet</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {storefront.etalase.map((etalase) => (
                                <tr key={etalase.name} className="hover:bg-muted/30">
                                    <Td className="font-semibold">{etalase.name}</Td>
                                    <Td align="right">{formatNumber(etalase.stock)}</Td>
                                    <Td align="right">{formatNumber(etalase.views)}</Td>
                                    <Td align="right">{formatNumber(etalase.orders)}</Td>
                                    <Td align="right">{formatPercent(etalase.conversionRate)}</Td>
                                    <Td align="right" className="font-semibold">
                                        {formatRupiah(etalase.revenue)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                </SectionCard>
            </div>

            <SectionCard
                title="Produk Tidak Laku"
                description="Produk dengan penjualan sangat rendah pada periode ini. Pertimbangkan promo, bundling, atau perbaiki foto & deskripsi."
            >
                {storefront.slowMoving.length === 0 ? (
                    <EmptyState message="Semua produk terjual dengan baik pada periode ini." />
                ) : (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {storefront.slowMoving.map((product) => (
                            <li key={product.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
                                <TrendingDown className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
                                <div className="min-w-0 text-xs">
                                    <div className="truncate text-sm font-semibold text-foreground">{product.name}</div>
                                    <div className="text-muted-foreground">
                                        {product.etalase} · {formatNumber(product.views)} views · {formatNumber(product.units)} unit terjual · stok{' '}
                                        {formatNumber(product.stock)}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard title="Semua Produk" description="Stok adalah stok saat ini. Estimasi habis dihitung dari rata-rata unit terjual per hari.">
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Produk</Th>
                            <Th>Etalase</Th>
                            <Th align="right">Harga</Th>
                            <Th align="right">Stok</Th>
                            <Th>Status Stok</Th>
                            <Th align="right">Estimasi Habis</Th>
                            <Th align="right">Views</Th>
                            <Th align="right">Konversi</Th>
                            <Th align="right">Unit</Th>
                            <Th align="right">Omzet</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {storefront.products.map((product) => (
                            <tr key={product.id} className="hover:bg-muted/30">
                                <Td>
                                    <div className="font-semibold">{product.name}</div>
                                    <div className="text-[11px] text-muted-foreground">{product.sku}</div>
                                </Td>
                                <Td className="text-muted-foreground">{product.etalase}</Td>
                                <Td align="right">{formatRupiah(product.price)}</Td>
                                <Td align="right">{formatNumber(product.stock)}</Td>
                                <Td>
                                    <StockBadge status={product.stockStatus} />
                                </Td>
                                <Td align="right">{product.daysOfCover === null ? '–' : `${formatNumber(product.daysOfCover)} hari`}</Td>
                                <Td align="right">{formatNumber(product.views)}</Td>
                                <Td align="right">{formatPercent(product.conversionRate)}</Td>
                                <Td align="right">{formatNumber(product.units)}</Td>
                                <Td align="right" className="font-semibold">
                                    {formatRupiah(product.revenue)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
