import { Activity, CheckCircle2, Link2, ShieldCheck, Zap } from 'lucide-react';
import { formatNumber } from '@/components/meta-ads/format';
import { SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/meta-ads/shared';
import { Badge } from '@/components/ui/badge';
import type { MetaAdsPixelHealth } from '@/types/meta-ads';

export function PixelSection({ pixelHealth }: { pixelHealth: MetaAdsPixelHealth }) {
    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Status Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                    label="Status Meta Pixel"
                    value={pixelHealth.status}
                    hint={`Pixel ID: ${pixelHealth.pixelId}`}
                    icon={<Activity className="size-4 text-emerald-500" />}
                />
                <StatTile
                    label="Event Match Quality (EMQ)"
                    value={`${pixelHealth.eventMatchQuality} / 10`}
                    hint="Kualitas pencocokan data konversi pelanggan"
                    icon={<ShieldCheck className="size-4 text-blue-500" />}
                />
                <StatTile
                    label="Conversions API (CAPI)"
                    value={pixelHealth.capiActive ? 'Aktif (Server-Side)' : 'Non-aktif'}
                    hint="Pelacakan anti pemblokiran ad-block & iOS"
                    icon={<Zap className="size-4 text-amber-500" />}
                />
            </div>

            {/* Events Breakdown */}
            <SectionCard
                title="Aktivitas Event Pelacakan Meta Pixel & CAPI"
                description="Status penerimaan event konversi dan Event Match Quality per tipe tindakan pelanggan."
            >
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Nama Event</Th>
                            <Th>Metode Integrasi</Th>
                            <Th align="right">Jumlah Terdeteksi</Th>
                            <Th align="right">Match Quality Score</Th>
                            <Th align="right">Status</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {pixelHealth.events.map((evt) => (
                            <tr key={evt.name} className="hover:bg-muted/30 transition-colors">
                                <Td className="font-semibold text-foreground flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    <span>{evt.name}</span>
                                </Td>
                                <Td>
                                    <Badge variant="outline" className="border-border bg-muted/50 text-[10px] font-bold text-muted-foreground">
                                        Browser + Server (CAPI)
                                    </Badge>
                                </Td>
                                <Td align="right" className="font-bold tabular-nums">
                                    {formatNumber(evt.count)}
                                </Td>
                                <Td align="right" className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {evt.matchRate}
                                </Td>
                                <Td align="right">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3" />
                                        Terverifikasi
                                    </span>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
