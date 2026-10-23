import { CheckCircle2, PauseCircle, PlayCircle, Zap } from 'lucide-react';
import { formatNumber, formatPercent, formatRatio, formatRupiah } from '@/components/meta-ads/format';
import { SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/meta-ads/shared';
import { Badge } from '@/components/ui/badge';
import type { MetaAdsCampaign } from '@/types/meta-ads';

export function CampaignsSection({
    campaigns,
    onManageConnection,
}: {
    campaigns: MetaAdsCampaign[];
    onManageConnection?: () => void;
}) {
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
    const totalPurchases = campaigns.reduce((acc, c) => acc + c.purchases, 0);
    const overallRoas = totalSpend > 0 ? round(totalRevenue / totalSpend, 2) : 0;
    const avgCpa = totalPurchases > 0 ? Math.round(totalSpend / totalPurchases) : 0;

    function round(num: number, dec: number) {
        return Math.round(num * 10 ** dec) / 10 ** dec;
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="Kampanye Aktif"
                    value={`${campaigns.filter((c) => c.status === 'ACTIVE').length} dari ${campaigns.length}`}
                    icon={<PlayCircle className="size-4" />}
                />
                <StatTile label="Total Biaya Kampanye" value={formatRupiah(totalSpend)} />
                <StatTile label="Rata-rata ROAS" value={formatRatio(overallRoas)} />
                <StatTile label="Rata-rata CPA" value={formatRupiah(avgCpa)} hint="Biaya per pembelian" />
            </div>

            {/* Campaign Table */}
            <SectionCard
                title="Daftar Kampanye Meta Ads"
                description="Performa real-time kampanye iklan Meta untuk periode ini."
                action={
                    onManageConnection && (
                        <button
                            type="button"
                            onClick={onManageConnection}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/60 transition-colors cursor-pointer"
                        >
                            <Zap className="size-3 text-blue-600" aria-hidden />
                            <span>Koneksi & Sinkronisasi Meta</span>
                        </button>
                    )
                }
            >
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Nama Kampanye</Th>
                            <Th>Status</Th>
                            <Th align="right">Anggaran / Hari</Th>
                            <Th align="right">Spend</Th>
                            <Th align="right">Impresi</Th>
                            <Th align="right">Klik</Th>
                            <Th align="right">CTR</Th>
                            <Th align="right">CPC</Th>
                            <Th align="right">Purchases</Th>
                            <Th align="right">CPA</Th>
                            <Th align="right">Revenue</Th>
                            <Th align="right">ROAS</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {campaigns.map((c) => (
                            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                <Td>
                                    <div className="font-semibold text-foreground text-xs">{c.name}</div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <span>{c.id}</span>
                                        <span>•</span>
                                        <span className="uppercase">{c.objective.replace('OUTCOME_', '')}</span>
                                    </div>
                                </Td>
                                <Td>
                                    {c.status === 'ACTIVE' ? (
                                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] gap-1 px-1.5 py-0">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-muted bg-muted/50 text-muted-foreground text-[10px] gap-1 px-1.5 py-0">
                                            <PauseCircle className="size-2.5" />
                                            Paused
                                        </Badge>
                                    )}
                                </Td>
                                <Td align="right">{c.dailyBudget > 0 ? formatRupiah(c.dailyBudget) : '—'}</Td>
                                <Td align="right" className="font-semibold">{formatRupiah(c.spend)}</Td>
                                <Td align="right">{formatNumber(c.impressions)}</Td>
                                <Td align="right">{formatNumber(c.clicks)}</Td>
                                <Td align="right">{formatPercent(c.ctr)}</Td>
                                <Td align="right">{formatRupiah(c.cpc)}</Td>
                                <Td align="right" className="font-semibold">{formatNumber(c.purchases)}</Td>
                                <Td align="right">{formatRupiah(c.cpa)}</Td>
                                <Td align="right" className="font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(c.revenue)}</Td>
                                <Td align="right" className="font-bold">
                                    <span className={c.roas >= 4 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-foreground'}>
                                        {formatRatio(c.roas)}
                                    </span>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-border font-bold text-xs bg-muted/20">
                            <Td colSpan={3}>Total</Td>
                            <Td align="right">{formatRupiah(totalSpend)}</Td>
                            <Td align="right">{formatNumber(campaigns.reduce((a, b) => a + b.impressions, 0))}</Td>
                            <Td align="right">{formatNumber(campaigns.reduce((a, b) => a + b.clicks, 0))}</Td>
                            <Td align="right">—</Td>
                            <Td align="right">—</Td>
                            <Td align="right">{formatNumber(totalPurchases)}</Td>
                            <Td align="right">{formatRupiah(avgCpa)}</Td>
                            <Td align="right" className="text-emerald-600 dark:text-emerald-400">{formatRupiah(totalRevenue)}</Td>
                            <Td align="right">{formatRatio(overallRoas)}</Td>
                        </tr>
                    </tfoot>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
