import { Clapperboard, Image, Layers, Sparkles } from 'lucide-react';
import { formatPercent, formatRatio, formatRupiah } from '@/components/meta-ads/format';
import { SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/meta-ads/shared';
import type { MetaAdsCreative } from '@/types/meta-ads';

export function CreativesSection({ creatives }: { creatives: MetaAdsCreative[] }) {
    const bestRoasCreative = [...creatives].sort((a, b) => b.roas - a.roas)[0];

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Creative Highlights */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                    label="Format Terbaik (ROAS)"
                    value={bestRoasCreative ? bestRoasCreative.format : '—'}
                    hint={`ROAS tertinggi: ${bestRoasCreative ? formatRatio(bestRoasCreative.roas) : '—'}`}
                    icon={<Sparkles className="size-4 text-amber-500" />}
                />
                <StatTile
                    label="Rata-rata Hook Rate Reels"
                    value="34,5%"
                    hint="Persentase penonton 3 detik pertama"
                    icon={<Clapperboard className="size-4 text-pink-500" />}
                />
                <StatTile
                    label="Rata-rata CTR Format Video"
                    value="2,85%"
                    hint="Rasio klik tayang materi video"
                    icon={<Layers className="size-4 text-blue-500" />}
                />
            </div>

            {/* Creative Performance Table */}
            <SectionCard title="Efektivitas Format Materi Iklan" description="Analisis perbandingan performa materi iklan Video Reels, Carousel, dan Single Image.">
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Format Materi Iklan</Th>
                            <Th align="right">Hook Rate (3s)</Th>
                            <Th align="right">Hold Rate</Th>
                            <Th align="right">CTR (Rasio Klik)</Th>
                            <Th align="right">Biaya Spend</Th>
                            <Th align="right">Nilai Pembelian</Th>
                            <Th align="right">ROAS</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {creatives.map((c) => (
                            <tr key={c.format} className="hover:bg-muted/30 transition-colors">
                                <Td className="font-semibold text-foreground flex items-center gap-2">
                                    {c.format.includes('Video') ? (
                                        <Clapperboard className="size-3.5 text-pink-500 shrink-0" />
                                    ) : c.format.includes('Carousel') ? (
                                        <Layers className="size-3.5 text-blue-500 shrink-0" />
                                    ) : (
                                        <Image className="size-3.5 text-indigo-500 shrink-0" />
                                    )}
                                    <span>{c.format}</span>
                                </Td>
                                <Td align="right">
                                    {c.hookRate !== null ? (
                                        <span className="font-semibold text-foreground">{formatPercent(c.hookRate)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </Td>
                                <Td align="right">
                                    {c.holdRate !== null ? (
                                        <span className="font-semibold text-foreground">{formatPercent(c.holdRate)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </Td>
                                <Td align="right">{formatPercent(c.ctr)}</Td>
                                <Td align="right">{formatRupiah(c.spend)}</Td>
                                <Td align="right" className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(c.revenue)}
                                </Td>
                                <Td align="right" className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatRatio(c.roas)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
