import { PlaySquare, Radio } from 'lucide-react';
import { SERIES_BG, StackedShareBar } from '@/components/shopee/charts';
import { formatDate, formatDuration, formatNumber, formatPercent, formatRupiah } from '@/components/shopee/format';
import { EmptyState, SectionCard, StatTile, TableWrapper, Td, Th } from '@/components/shopee/shared';
import type { ShopeeContent } from '@/types/shopee';

export function ContentSection({ content }: { content: ShopeeContent }) {
    const { live, video } = content.totals;
    const contentRevenue = content.totals.revenue;
    const share = (value: number) => (contentRevenue === 0 ? 0 : Math.round((value / contentRevenue) * 1000) / 10);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SectionCard title="Omzet dari Konten" description={`${content.totals.shareOfRevenue.toLocaleString('id-ID')}% dari total omzet toko.`}>
                    <div className="mb-4 text-2xl font-bold text-foreground tabular-nums">{formatRupiah(contentRevenue)}</div>
                    <StackedShareBar
                        ariaLabel="Komposisi omzet konten: live dan video"
                        segments={[
                            {
                                key: 'live',
                                label: 'Live',
                                share: share(live.revenue),
                                swatch: SERIES_BG[2],
                                detail: `${formatRupiah(live.revenue)} · ${formatNumber(live.orders)} pesanan`,
                                icon: <Radio className="size-3.5 text-muted-foreground" aria-hidden />,
                            },
                            {
                                key: 'video',
                                label: 'Video',
                                share: share(video.revenue),
                                swatch: SERIES_BG[3],
                                detail: `${formatRupiah(video.revenue)} · ${formatNumber(video.orders)} pesanan`,
                                icon: <PlaySquare className="size-3.5 text-muted-foreground" aria-hidden />,
                            },
                        ]}
                    />
                </SectionCard>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:col-span-2">
                    <StatTile label="Sesi Live" value={formatNumber(live.sessions)} icon={<Radio className="size-4" aria-hidden />} />
                    <StatTile label="Total Durasi Live" value={formatDuration(live.durationMinutes)} />
                    <StatTile label="Penonton Live" value={formatNumber(live.viewers)} hint={`Engagement ${formatPercent(live.engagementRate)}`} />
                    <StatTile label="Video Aktif" value={formatNumber(video.count)} icon={<PlaySquare className="size-4" aria-hidden />} />
                    <StatTile label="Views Video" value={formatNumber(video.views)} hint={`Engagement ${formatPercent(video.engagementRate)}`} />
                    <StatTile label="Pesanan dari Konten" value={formatNumber(content.totals.orders)} />
                </div>
            </div>

            <SectionCard title="Sesi Shopee Live" description="Engagement = (suka + komentar + bagikan) / penonton.">
                {content.liveSessions.length === 0 ? (
                    <EmptyState message="Tidak ada sesi live pada periode ini." />
                ) : (
                    <TableWrapper>
                        <thead>
                            <tr>
                                <Th>Sesi</Th>
                                <Th align="right">Durasi</Th>
                                <Th align="right">Penonton</Th>
                                <Th align="right">Puncak</Th>
                                <Th align="right">Engagement</Th>
                                <Th align="right">Pesanan</Th>
                                <Th align="right">Omzet</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {content.liveSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-muted/30">
                                    <Td>
                                        <div className="font-semibold">{session.title}</div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {session.startTime} WIB
                                        </div>
                                    </Td>
                                    <Td align="right">{formatDuration(session.durationMinutes)}</Td>
                                    <Td align="right">{formatNumber(session.viewers)}</Td>
                                    <Td align="right">{formatNumber(session.peakViewers)}</Td>
                                    <Td align="right">{formatPercent(session.engagementRate)}</Td>
                                    <Td align="right">{formatNumber(session.orders)}</Td>
                                    <Td align="right" className="font-semibold">
                                        {formatRupiah(session.revenue)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                )}
            </SectionCard>

            <SectionCard title="Shopee Video" description="Video yang mendapat views pada periode ini. Engagement = (suka + komentar + bagikan) / views.">
                {content.videos.length === 0 ? (
                    <EmptyState message="Tidak ada video aktif pada periode ini." />
                ) : (
                    <TableWrapper>
                        <thead>
                            <tr>
                                <Th>Video</Th>
                                <Th align="right">Views</Th>
                                <Th align="right">Suka</Th>
                                <Th align="right">Komentar</Th>
                                <Th align="right">Bagikan</Th>
                                <Th align="right">Engagement</Th>
                                <Th align="right">Pesanan</Th>
                                <Th align="right">Omzet</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {content.videos.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30">
                                    <Td>
                                        <div className="font-semibold">{item.title}</div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Tayang {formatDate(item.publishedAt)} · {item.durationSeconds} detik
                                        </div>
                                    </Td>
                                    <Td align="right">{formatNumber(item.views)}</Td>
                                    <Td align="right">{formatNumber(item.likes)}</Td>
                                    <Td align="right">{formatNumber(item.comments)}</Td>
                                    <Td align="right">{formatNumber(item.shares)}</Td>
                                    <Td align="right">{formatPercent(item.engagementRate)}</Td>
                                    <Td align="right">{formatNumber(item.orders)}</Td>
                                    <Td align="right" className="font-semibold">
                                        {formatRupiah(item.revenue)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                )}
            </SectionCard>
        </div>
    );
}
