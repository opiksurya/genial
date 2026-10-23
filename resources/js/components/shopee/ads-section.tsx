import { HorizontalBarList, LineCompareChart } from '@/components/shopee/charts';
import { formatDate, formatNumber, formatPercent, formatRatio, formatRupiah, formatRupiahCompact } from '@/components/shopee/format';
import { SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/shopee/shared';
import type { ShopeeAds } from '@/types/shopee';

export function AdsSection({ ads }: { ads: ShopeeAds }) {
    const { totals } = ads;
    const campaignsByRoas = [...ads.campaigns].sort((a, b) => b.roas - a.roas);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
                <StatTile label="Biaya Iklan" value={formatRupiah(totals.spend)} />
                <StatTile label="Impresi" value={formatNumber(totals.impressions)} />
                <StatTile label="Klik" value={formatNumber(totals.clicks)} />
                <StatTile label="CTR" value={formatPercent(totals.ctr)} hint="Klik / impresi" />
                <StatTile label="CPC" value={formatRupiah(totals.cpc)} hint="Biaya / klik" />
                <StatTile label="Konversi" value={formatNumber(totals.conversions)} hint={`${formatPercent(totals.conversionRate)} dari klik`} />
                <StatTile label="Omzet Iklan" value={formatRupiah(totals.revenue)} />
                <StatTile label="ROAS" value={formatRatio(totals.roas)} hint="Omzet iklan / biaya" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SectionCard title="Biaya vs Omzet Iklan Harian" description="Keduanya dalam Rupiah pada sumbu yang sama." className="xl:col-span-2">
                    <LineCompareChart
                        ariaLabel="Grafik garis biaya iklan dan omzet iklan harian"
                        labels={ads.daily.map((day) => formatDate(day.date))}
                        tooltipTitles={ads.daily.map((day) => formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' }))}
                        axisFormatter={formatRupiahCompact}
                        valueFormatter={formatRupiah}
                        series={[
                            { key: 'revenue', label: 'Omzet iklan', values: ads.daily.map((day) => day.revenue) },
                            { key: 'spend', label: 'Biaya iklan', values: ads.daily.map((day) => day.spend) },
                        ]}
                    />
                </SectionCard>

                <SectionCard title="ROAS per Kampanye" description="Omzet iklan dibagi biaya iklan.">
                    <HorizontalBarList
                        items={campaignsByRoas.map((campaign) => ({
                            key: campaign.id,
                            label: campaign.name,
                            value: campaign.roas,
                            valueLabel: formatRatio(campaign.roas),
                        }))}
                    />
                </SectionCard>
            </div>

            <SectionCard title="Performa Kampanye" description="Konversi dihitung dari pesanan selesai yang diatribusikan ke iklan.">
                <TableWrapper>
                    <thead>
                        <tr>
                            <Th>Kampanye</Th>
                            <Th align="right">Anggaran/Hari</Th>
                            <Th align="right">Biaya</Th>
                            <Th align="right">Impresi</Th>
                            <Th align="right">Klik</Th>
                            <Th align="right">CTR</Th>
                            <Th align="right">CPC</Th>
                            <Th align="right">Konversi</Th>
                            <Th align="right">Omzet</Th>
                            <Th align="right">ROAS</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {ads.campaigns.map((campaign) => (
                            <tr key={campaign.id} className="hover:bg-muted/30">
                                <Td>
                                    <div className="font-semibold">{campaign.name}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {campaign.id} · {campaign.type}
                                    </div>
                                </Td>
                                <Td align="right">{formatRupiah(campaign.dailyBudget)}</Td>
                                <Td align="right">{formatRupiah(campaign.spend)}</Td>
                                <Td align="right">{formatNumber(campaign.impressions)}</Td>
                                <Td align="right">{formatNumber(campaign.clicks)}</Td>
                                <Td align="right">{formatPercent(campaign.ctr)}</Td>
                                <Td align="right">{formatRupiah(campaign.cpc)}</Td>
                                <Td align="right">{formatNumber(campaign.conversions)}</Td>
                                <Td align="right">{formatRupiah(campaign.revenue)}</Td>
                                <Td align="right" className="font-semibold">
                                    {formatRatio(campaign.roas)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-border font-semibold">
                            <Td>Total</Td>
                            <Td align="right">–</Td>
                            <Td align="right">{formatRupiah(totals.spend)}</Td>
                            <Td align="right">{formatNumber(totals.impressions)}</Td>
                            <Td align="right">{formatNumber(totals.clicks)}</Td>
                            <Td align="right">{formatPercent(totals.ctr)}</Td>
                            <Td align="right">{formatRupiah(totals.cpc)}</Td>
                            <Td align="right">{formatNumber(totals.conversions)}</Td>
                            <Td align="right">{formatRupiah(totals.revenue)}</Td>
                            <Td align="right">{formatRatio(totals.roas)}</Td>
                        </tr>
                    </tfoot>
                </TableWrapper>
            </SectionCard>
        </div>
    );
}
