import { Users } from 'lucide-react';
import { HorizontalBarList, META_SERIES_BG, StackedShareBar } from '@/components/meta-ads/charts';
import { formatNumber, formatRatio, formatRupiah } from '@/components/meta-ads/format';
import { SectionCard, TableWrapper, Td, Th } from '@/components/meta-ads/shared';
import type { MetaAdsAudience } from '@/types/meta-ads';

export function AudiencesSection({ audiences }: { audiences: MetaAdsAudience }) {
    const { ageGroups, gender, segments } = audiences;

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Age Groups Share */}
                <SectionCard title="Distribusi Kelompok Usia" description="Berdasarkan pengeluaran biaya iklan dan hasil konversi.">
                    <HorizontalBarList
                        max={100}
                        items={ageGroups.map((a) => ({
                            key: a.age,
                            label: `Usia ${a.age}`,
                            sublabel: `${formatRupiah(a.spend)} spend · ${formatNumber(a.purchases)} purchases`,
                            value: a.share,
                            valueLabel: `${a.share}% (ROAS ${formatRatio(a.roas)})`,
                        }))}
                    />
                </SectionCard>

                {/* Gender Share */}
                <SectionCard title="Distribusi Gender" description="Perbandingan audiens Pria dan Wanita.">
                    <StackedShareBar
                        ariaLabel="Distribusi Gender Audiens"
                        segments={gender.map((g, idx) => ({
                            key: g.gender,
                            label: g.gender,
                            share: g.share,
                            swatch: idx === 0 ? 'bg-pink-500' : 'bg-blue-600',
                            detail: `${formatRupiah(g.spend)} · ${formatNumber(g.purchases)} pembelian`,
                            icon: <Users className="size-3 text-muted-foreground" />,
                        }))}
                    />
                </SectionCard>
            </div>

            {/* Audience Segments Table */}
            <SectionCard title="Performa Segmen Audiens & Penargetan" description="Efektivitas tipe penargetan Broad AI, Lookalike, dan Retargeting Pixel.">
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Nama Segmen Audiens</Th>
                            <Th>Tipe Penargetan</Th>
                            <Th align="right">Biaya Spend</Th>
                            <Th align="right">Pembelian</Th>
                            <Th align="right">CPA</Th>
                            <Th align="right">ROAS</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {segments.map((seg) => {
                            const cpa = seg.purchases > 0 ? Math.round(seg.spend / seg.purchases) : 0;
                            return (
                                <tr key={seg.name} className="hover:bg-muted/30 transition-colors">
                                    <Td className="font-semibold text-foreground">{seg.name}</Td>
                                    <Td>
                                        <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                                            {seg.type}
                                        </span>
                                    </Td>
                                    <Td align="right">{formatRupiah(seg.spend)}</Td>
                                    <Td align="right" className="font-semibold">{formatNumber(seg.purchases)}</Td>
                                    <Td align="right">{formatRupiah(cpa)}</Td>
                                    <Td align="right" className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRatio(seg.roas)}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
