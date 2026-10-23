import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import { index as shopeeIndex } from '@/routes/shopee';
import type { BreadcrumbItem } from '@/types';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Eye,
    FlaskConical,
    LayoutGrid,
    Megaphone,
    MousePointerClick,
    Package,
    PlayCircle,
    Radio,
    ShoppingBag,
    Store,
    Target,
    TrendingUp,
    Wallet,
} from 'lucide-react';

interface PeriodOption {
    value: number;
    label: string;
}

interface SummaryTotals {
    revenue: number;
    orders: number;
    aov: number;
    placed_orders: number;
    cancelled_orders: number;
    returned_orders: number;
    views: number;
    conversion_rate: number;
    ad_spend: number;
    ad_revenue: number;
    roas: number;
    live_revenue: number;
    video_revenue: number;
}

interface ProductRow {
    sku: string;
    name: string;
    showcase: string;
    showcase_name: string;
    price: number;
    orders: number;
    revenue: number;
    channel_orders: Record<ChannelKey, number>;
    cancelled_orders: number;
    returned_orders: number;
    views: number;
    conversion_rate: number;
    stock: number;
    stock_days: number | null;
    is_slow_moving: boolean;
}

type ChannelKey = 'organic' | 'ads' | 'live' | 'video';

interface AdStats {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    conversion_rate: number;
    roas: number;
}

interface Campaign extends AdStats {
    id: string;
    name: string;
    type: string;
    target: string;
}

interface LiveSession {
    date: string;
    started_at: string;
    duration_minutes: number;
    viewers: number;
    peak_viewers: number;
    likes: number;
    comments: number;
    shares: number;
    orders: number;
    revenue: number;
}

interface VideoRow {
    id: string;
    title: string;
    product: string;
    published_at: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    orders: number;
    revenue: number;
    engagement_rate: number;
}

interface Showcase {
    key: string;
    name: string;
    product_count: number;
    slow_moving_count: number;
    orders: number;
    revenue: number;
    revenue_share: number;
    views: number;
    conversion_rate: number;
    stock: number;
}

interface Report {
    store_name: string;
    is_dummy: boolean;
    period: {
        days: number;
        label: string;
        start: string;
        end: string;
        previous_start: string;
        previous_end: string;
    };
    summary: { current: SummaryTotals; previous: SummaryTotals };
    sales: {
        daily: { date: string; orders: number; revenue: number }[];
        weekly: { week_start: string; orders: number; revenue: number }[];
        channels: { channel: ChannelKey; label: string; orders: number; revenue: number }[];
        statuses: { status: 'completed' | 'cancelled' | 'returned'; label: string; orders: number; value: number }[];
        top_products: ProductRow[];
    };
    ads: {
        totals: AdStats;
        campaigns: Campaign[];
        daily: { date: string; spend: number; revenue: number }[];
    };
    content: {
        live: {
            totals: {
                sessions: number;
                duration_minutes: number;
                viewers: number;
                average_viewers: number;
                engagement_rate: number;
                orders: number;
                revenue: number;
            };
            sessions: LiveSession[];
        };
        video: {
            totals: { videos: number; views: number; engagement_rate: number; orders: number; revenue: number };
            videos: VideoRow[];
        };
    };
    showcases: Showcase[];
    products: ProductRow[];
}

interface Props {
    period: number;
    periodOptions: PeriodOption[];
    report: Report;
}

type TabKey = 'summary' | 'sales' | 'ads' | 'content' | 'showcases';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Shopee Analytics', href: shopeeIndex() },
];

const TABS: { key: TabKey; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'summary', label: 'Ringkasan', icon: LayoutGrid },
    { key: 'sales', label: 'Penjualan', icon: ShoppingBag },
    { key: 'ads', label: 'Iklan', icon: Megaphone },
    { key: 'content', label: 'Konten', icon: PlayCircle },
    { key: 'showcases', label: 'Etalase', icon: Store },
];

const CHANNEL_COLORS: Record<ChannelKey, string> = {
    organic: 'bg-emerald-500',
    ads: 'bg-orange-500',
    live: 'bg-rose-500',
    video: 'bg-sky-500',
};

const STATUS_COLORS: Record<string, string> = {
    completed: 'bg-emerald-500',
    cancelled: 'bg-rose-500',
    returned: 'bg-amber-500',
};

const formatIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const formatCompactIDR = (value: number) =>
    'Rp ' + new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const formatPercent = (value: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value) + '%';

const formatDate = (date: string, withYear = false) =>
    new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
    });

const changePercent = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;

function ChangeBadge({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
    const change = changePercent(current, previous);

    if (change === null) {
        return <span className="text-[11px] text-muted-foreground">Tidak ada data pembanding</span>;
    }

    const isUp = change >= 0;
    const isGood = lowerIsBetter ? !isUp : isUp;
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {formatPercent(Math.abs(change))}
            <span className="ml-1 font-normal text-muted-foreground">vs periode lalu</span>
        </span>
    );
}

function KpiCard({
    label,
    value,
    icon: Icon,
    current,
    previous,
    lowerIsBetter,
    hint,
}: {
    label: string;
    value: string;
    icon: typeof LayoutGrid;
    current?: number;
    previous?: number;
    lowerIsBetter?: boolean;
    hint?: string;
}) {
    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-sidebar-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="rounded-lg bg-orange-500/10 p-1.5 text-orange-600 dark:text-orange-400">
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{value}</div>
            {current !== undefined && previous !== undefined ? (
                <ChangeBadge current={current} previous={previous} lowerIsBetter={lowerIsBetter} />
            ) : (
                hint && <span className="text-[11px] text-muted-foreground">{hint}</span>
            )}
        </div>
    );
}

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-sidebar-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
                    {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function BarChart({ data, formatValue }: { data: { label: string; value: number }[]; formatValue: (value: number) => string }) {
    const max = Math.max(...data.map((item) => item.value), 1);
    const labelIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

    return (
        <div>
            <div className="flex h-48 items-end gap-px sm:gap-0.5">
                {data.map((item) => (
                    <div key={item.label} className="group relative flex h-full flex-1 items-end">
                        <div
                            className="w-full rounded-t-sm bg-orange-500/80 transition-colors group-hover:bg-orange-500 dark:bg-orange-400/70 dark:group-hover:bg-orange-400"
                            style={{ height: `${Math.max((item.value / max) * 100, 1)}%` }}
                            title={`${item.label}: ${formatValue(item.value)}`}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                {data.map((item, index) => (labelIndexes.has(index) ? <span key={item.label}>{item.label}</span> : null))}
            </div>
        </div>
    );
}

function LineChart({ series, labels }: { series: { name: string; values: number[]; className: string }[]; labels: string[] }) {
    const width = 600;
    const height = 200;
    const max = Math.max(...series.flatMap((line) => line.values), 1);
    const step = labels.length > 1 ? width / (labels.length - 1) : width;
    const labelIndexes = new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1]);

    return (
        <div>
            <div className="mb-3 flex flex-wrap gap-4 text-xs">
                {series.map((line) => (
                    <span key={line.name} className={`inline-flex items-center gap-1.5 ${line.className}`}>
                        <span className="h-0.5 w-4 rounded bg-current" />
                        <span className="text-muted-foreground">{line.name}</span>
                    </span>
                ))}
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-48 w-full" role="img">
                {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                        key={ratio}
                        x1={0}
                        x2={width}
                        y1={height * ratio}
                        y2={height * ratio}
                        className="stroke-sidebar-border"
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
                {series.map((line) => (
                    <polyline
                        key={line.name}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className={line.className}
                        points={line.values.map((value, index) => `${index * step},${height - (value / max) * (height - 8)}`).join(' ')}
                    />
                ))}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                {labels.map((label, index) => (labelIndexes.has(index) ? <span key={label}>{label}</span> : null))}
            </div>
        </div>
    );
}

function StackedBar({ items }: { items: { key: string; label: string; value: number; color: string; detail: string }[] }) {
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

    return (
        <div className="space-y-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {items.map((item) => (
                    <div key={item.key} className={item.color} style={{ width: `${(item.value / total) * 100}%` }} title={item.label} />
                ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-2 text-foreground">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                            {item.label}
                        </span>
                        <span className="text-right text-muted-foreground">
                            {formatPercent((item.value / total) * 100)} · {item.detail}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DataTable({ headers, children }: { headers: { label: string; align?: 'right' }[]; children: React.ReactNode }) {
    return (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                    <tr className="border-b border-sidebar-border text-muted-foreground">
                        {headers.map((header) => (
                            <th key={header.label} className={`px-4 py-2.5 font-semibold sm:px-3 ${header.align === 'right' ? 'text-right' : ''}`}>
                                {header.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border">{children}</tbody>
            </table>
        </div>
    );
}

const cell = 'px-4 py-2.5 sm:px-3';
const numberCell = `${cell} text-right tabular-nums`;

function roasClass(roas: number) {
    if (roas >= 4) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    return roas >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
}

function SummaryTab({ report }: { report: Report }) {
    const { current, previous } = report.summary;
    const cancelRate = (totals: SummaryTotals) =>
        totals.placed_orders > 0 ? ((totals.cancelled_orders + totals.returned_orders) / totals.placed_orders) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Omzet" value={formatCompactIDR(current.revenue)} icon={Wallet} current={current.revenue} previous={previous.revenue} />
                <KpiCard label="Pesanan Selesai" value={formatNumber(current.orders)} icon={ShoppingBag} current={current.orders} previous={previous.orders} />
                <KpiCard label="AOV (Rata-rata Order)" value={formatIDR(current.aov)} icon={TrendingUp} current={current.aov} previous={previous.aov} />
                <KpiCard label="Conversion Rate" value={formatPercent(current.conversion_rate)} icon={Target} current={current.conversion_rate} previous={previous.conversion_rate} />
                <KpiCard label="Kunjungan Produk" value={formatNumber(current.views)} icon={Eye} current={current.views} previous={previous.views} />
                <KpiCard label="Biaya Iklan" value={formatCompactIDR(current.ad_spend)} icon={Megaphone} current={current.ad_spend} previous={previous.ad_spend} lowerIsBetter />
                <KpiCard label="ROAS Iklan" value={`${current.roas.toLocaleString('id-ID')}x`} icon={BarChart3} current={current.roas} previous={previous.roas} />
                <KpiCard
                    label="Batal + Retur"
                    value={formatPercent(Math.round(cancelRate(current) * 100) / 100)}
                    icon={AlertTriangle}
                    current={cancelRate(current)}
                    previous={cancelRate(previous)}
                    lowerIsBetter
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Section title="Tren Omzet Harian" description={`${formatDate(report.period.start)} – ${formatDate(report.period.end, true)}`}>
                        <BarChart data={report.sales.daily.map((day) => ({ label: formatDate(day.date), value: day.revenue }))} formatValue={formatIDR} />
                    </Section>
                </div>
                <Section title="Sumber Omzet" description="Kontribusi tiap channel penjualan">
                    <StackedBar
                        items={report.sales.channels.map((channel) => ({
                            key: channel.channel,
                            label: channel.label,
                            value: channel.revenue,
                            color: CHANNEL_COLORS[channel.channel],
                            detail: formatCompactIDR(channel.revenue),
                        }))}
                    />
                </Section>
            </div>

            <Section title="5 Produk Terlaris" description="Berdasarkan omzet pesanan selesai">
                <ProductRanking products={report.sales.top_products.slice(0, 5)} />
            </Section>
        </div>
    );
}

function ProductRanking({ products }: { products: ProductRow[] }) {
    const max = Math.max(...products.map((product) => product.revenue), 1);

    return (
        <div className="space-y-3">
            {products.map((product, index) => (
                <div key={product.sku} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                        {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-medium text-foreground">{product.name}</span>
                            <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatIDR(product.revenue)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${(product.revenue / max) * 100}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                            {formatNumber(product.orders)} pesanan · {product.showcase_name}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SalesTab({ report }: { report: Report }) {
    const [granularity, setGranularity] = useState<'daily' | 'weekly'>('daily');
    const { current } = report.summary;
    const chartData =
        granularity === 'daily'
            ? report.sales.daily.map((day) => ({ label: formatDate(day.date), value: day.revenue }))
            : report.sales.weekly.map((week) => ({ label: `Mg ${formatDate(week.week_start)}`, value: week.revenue }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Omzet" value={formatCompactIDR(current.revenue)} icon={Wallet} hint={formatIDR(current.revenue)} />
                <KpiCard label="Pesanan Masuk" value={formatNumber(current.placed_orders)} icon={Package} hint="Termasuk batal & retur" />
                <KpiCard label="Pesanan Selesai" value={formatNumber(current.orders)} icon={ShoppingBag} hint={`AOV ${formatIDR(current.aov)}`} />
                <KpiCard label="Rata-rata per Hari" value={formatCompactIDR(current.revenue / report.period.days)} icon={TrendingUp} hint={`${formatNumber(Math.round(current.orders / report.period.days))} pesanan / hari`} />
            </div>

            <Section
                title="Tren Omzet"
                description="Omzet dari pesanan selesai"
                action={
                    <div className="inline-flex rounded-xl border border-sidebar-border p-0.5 text-xs">
                        {(['daily', 'weekly'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setGranularity(option)}
                                className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                                    granularity === option ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {option === 'daily' ? 'Harian' : 'Mingguan'}
                            </button>
                        ))}
                    </div>
                }
            >
                <BarChart data={chartData} formatValue={formatIDR} />
            </Section>

            <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Status Pesanan" description="Distribusi pesanan masuk per status">
                    <StackedBar
                        items={report.sales.statuses.map((status) => ({
                            key: status.status,
                            label: status.label,
                            value: status.orders,
                            color: STATUS_COLORS[status.status],
                            detail: `${formatNumber(status.orders)} · ${formatCompactIDR(status.value)}`,
                        }))}
                    />
                </Section>
                <Section title="Channel Penjualan" description="Pesanan selesai per sumber">
                    <StackedBar
                        items={report.sales.channels.map((channel) => ({
                            key: channel.channel,
                            label: channel.label,
                            value: channel.orders,
                            color: CHANNEL_COLORS[channel.channel],
                            detail: `${formatNumber(channel.orders)} pesanan`,
                        }))}
                    />
                </Section>
            </div>

            <Section title="Produk Terlaris" description="10 produk dengan omzet tertinggi">
                <DataTable
                    headers={[
                        { label: '#' },
                        { label: 'Produk' },
                        { label: 'Harga', align: 'right' },
                        { label: 'Pesanan', align: 'right' },
                        { label: 'Omzet', align: 'right' },
                        { label: 'Batal / Retur', align: 'right' },
                    ]}
                >
                    {report.sales.top_products.map((product, index) => (
                        <tr key={product.sku} className="hover:bg-muted/40">
                            <td className={`${cell} text-muted-foreground`}>{index + 1}</td>
                            <td className={cell}>
                                <div className="font-medium text-foreground">{product.name}</div>
                                <div className="text-[11px] text-muted-foreground">{product.sku}</div>
                            </td>
                            <td className={numberCell}>{formatIDR(product.price)}</td>
                            <td className={numberCell}>{formatNumber(product.orders)}</td>
                            <td className={`${numberCell} font-semibold text-foreground`}>{formatIDR(product.revenue)}</td>
                            <td className={`${numberCell} text-muted-foreground`}>
                                {formatNumber(product.cancelled_orders)} / {formatNumber(product.returned_orders)}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </Section>
        </div>
    );
}

function AdsTab({ report }: { report: Report }) {
    const { totals, campaigns, daily } = report.ads;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Biaya Iklan" value={formatCompactIDR(totals.spend)} icon={Wallet} hint={formatIDR(totals.spend)} />
                <KpiCard label="Omzet dari Iklan" value={formatCompactIDR(totals.revenue)} icon={TrendingUp} hint={formatIDR(totals.revenue)} />
                <KpiCard label="ROAS" value={`${totals.roas.toLocaleString('id-ID')}x`} icon={Target} hint="Omzet iklan ÷ biaya iklan" />
                <KpiCard label="Konversi" value={formatNumber(totals.conversions)} icon={ShoppingBag} hint={`${formatPercent(totals.conversion_rate)} dari klik`} />
                <KpiCard label="Impresi" value={formatNumber(totals.impressions)} icon={Eye} />
                <KpiCard label="Klik" value={formatNumber(totals.clicks)} icon={MousePointerClick} />
                <KpiCard label="CTR" value={formatPercent(totals.ctr)} icon={BarChart3} hint="Klik ÷ impresi" />
                <KpiCard label="CPC" value={formatIDR(totals.cpc)} icon={Megaphone} hint="Biaya ÷ klik" />
            </div>

            <Section title="Biaya vs Omzet Iklan" description="Per hari selama periode">
                <LineChart
                    labels={daily.map((day) => formatDate(day.date))}
                    series={[
                        { name: 'Omzet Iklan', values: daily.map((day) => day.revenue), className: 'text-emerald-500' },
                        { name: 'Biaya Iklan', values: daily.map((day) => day.spend), className: 'text-orange-500' },
                    ]}
                />
            </Section>

            <Section title="Performa Kampanye" description="ROAS hijau ≥ 4x, kuning 2–4x, merah < 2x">
                <DataTable
                    headers={[
                        { label: 'Kampanye' },
                        { label: 'Biaya', align: 'right' },
                        { label: 'Impresi', align: 'right' },
                        { label: 'Klik', align: 'right' },
                        { label: 'CTR', align: 'right' },
                        { label: 'CPC', align: 'right' },
                        { label: 'Konversi', align: 'right' },
                        { label: 'Omzet', align: 'right' },
                        { label: 'ROAS', align: 'right' },
                    ]}
                >
                    {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-muted/40">
                            <td className={cell}>
                                <div className="font-medium text-foreground">{campaign.name}</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {campaign.type} · {campaign.target}
                                </div>
                            </td>
                            <td className={numberCell}>{formatIDR(campaign.spend)}</td>
                            <td className={numberCell}>{formatNumber(campaign.impressions)}</td>
                            <td className={numberCell}>{formatNumber(campaign.clicks)}</td>
                            <td className={numberCell}>{formatPercent(campaign.ctr)}</td>
                            <td className={numberCell}>{formatIDR(campaign.cpc)}</td>
                            <td className={numberCell}>{formatNumber(campaign.conversions)}</td>
                            <td className={numberCell}>{formatIDR(campaign.revenue)}</td>
                            <td className={`${numberCell} font-bold ${roasClass(campaign.roas)}`}>{campaign.roas.toLocaleString('id-ID')}x</td>
                        </tr>
                    ))}
                </DataTable>
            </Section>
        </div>
    );
}

function ContentTab({ report }: { report: Report }) {
    const { live, video } = report.content;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Sesi Live" value={formatNumber(live.totals.sessions)} icon={Radio} hint={`${formatNumber(Math.round(live.totals.duration_minutes / 60))} jam siaran`} />
                <KpiCard label="Penonton Live" value={formatNumber(live.totals.viewers)} icon={Eye} hint={`Rata-rata ${formatNumber(live.totals.average_viewers)} / sesi`} />
                <KpiCard label="Omzet Live" value={formatCompactIDR(live.totals.revenue)} icon={Wallet} hint={`${formatNumber(live.totals.orders)} pesanan`} />
                <KpiCard label="Engagement Live" value={formatPercent(live.totals.engagement_rate)} icon={TrendingUp} hint="(Komentar + share) ÷ penonton" />
                <KpiCard label="Video Aktif" value={formatNumber(video.totals.videos)} icon={PlayCircle} />
                <KpiCard label="Views Video" value={formatNumber(video.totals.views)} icon={Eye} />
                <KpiCard label="Omzet Video" value={formatCompactIDR(video.totals.revenue)} icon={Wallet} hint={`${formatNumber(video.totals.orders)} pesanan`} />
                <KpiCard label="Engagement Video" value={formatPercent(video.totals.engagement_rate)} icon={TrendingUp} hint="(Like + komentar + share) ÷ views" />
            </div>

            <Section title="Sesi Shopee Live" description="Terbaru di atas">
                <DataTable
                    headers={[
                        { label: 'Tanggal' },
                        { label: 'Durasi', align: 'right' },
                        { label: 'Penonton', align: 'right' },
                        { label: 'Puncak', align: 'right' },
                        { label: 'Like', align: 'right' },
                        { label: 'Komentar', align: 'right' },
                        { label: 'Pesanan', align: 'right' },
                        { label: 'Omzet', align: 'right' },
                    ]}
                >
                    {live.sessions.map((session) => (
                        <tr key={session.date} className="hover:bg-muted/40">
                            <td className={cell}>
                                <div className="font-medium text-foreground">{formatDate(session.date, true)}</div>
                                <div className="text-[11px] text-muted-foreground">Mulai {session.started_at} WIB</div>
                            </td>
                            <td className={numberCell}>{session.duration_minutes} mnt</td>
                            <td className={numberCell}>{formatNumber(session.viewers)}</td>
                            <td className={numberCell}>{formatNumber(session.peak_viewers)}</td>
                            <td className={numberCell}>{formatNumber(session.likes)}</td>
                            <td className={numberCell}>{formatNumber(session.comments)}</td>
                            <td className={numberCell}>{formatNumber(session.orders)}</td>
                            <td className={`${numberCell} font-semibold text-foreground`}>{formatIDR(session.revenue)}</td>
                        </tr>
                    ))}
                </DataTable>
            </Section>

            <Section title="Performa Shopee Video" description="Diurutkan dari views tertinggi dalam periode">
                <DataTable
                    headers={[
                        { label: 'Video' },
                        { label: 'Views', align: 'right' },
                        { label: 'Like', align: 'right' },
                        { label: 'Share', align: 'right' },
                        { label: 'Engagement', align: 'right' },
                        { label: 'Pesanan', align: 'right' },
                        { label: 'Omzet', align: 'right' },
                    ]}
                >
                    {video.videos.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/40">
                            <td className={cell}>
                                <div className="font-medium text-foreground">{item.title}</div>
                                <div className="text-[11px] text-muted-foreground">Diunggah {formatDate(item.published_at, true)}</div>
                            </td>
                            <td className={numberCell}>{formatNumber(item.views)}</td>
                            <td className={numberCell}>{formatNumber(item.likes)}</td>
                            <td className={numberCell}>{formatNumber(item.shares)}</td>
                            <td className={numberCell}>{formatPercent(item.engagement_rate)}</td>
                            <td className={numberCell}>{formatNumber(item.orders)}</td>
                            <td className={`${numberCell} font-semibold text-foreground`}>{formatIDR(item.revenue)}</td>
                        </tr>
                    ))}
                </DataTable>
            </Section>
        </div>
    );
}

function ShowcasesTab({ report }: { report: Report }) {
    const slowMoving = report.products.filter((product) => product.is_slow_moving);

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {report.showcases.map((showcase) => (
                    <div key={showcase.key} className="flex flex-col gap-2 rounded-2xl border border-sidebar-border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">{showcase.name}</span>
                            <Badge variant="secondary" className="shrink-0">{showcase.product_count} produk</Badge>
                        </div>
                        <div className="text-lg font-bold text-foreground">{formatCompactIDR(showcase.revenue)}</div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${showcase.revenue_share}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                            <span>{formatPercent(showcase.revenue_share)} omzet</span>
                            <span className="text-right">CR {formatPercent(showcase.conversion_rate)}</span>
                            <span>{formatNumber(showcase.orders)} pesanan</span>
                            <span className="text-right">Stok {formatNumber(showcase.stock)}</span>
                        </div>
                        {showcase.slow_moving_count > 0 && (
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                {showcase.slow_moving_count} produk kurang laku
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {slowMoving.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <div className="font-semibold">{slowMoving.length} produk kurang laku di periode ini</div>
                        <div className="mt-0.5">{slowMoving.map((product) => product.name).join(', ')}. Pertimbangkan bundling, promo, atau menonaktifkan produk.</div>
                    </div>
                </div>
            )}

            <Section title="Performa Produk" description="Semua produk, diurutkan dari omzet tertinggi">
                <DataTable
                    headers={[
                        { label: 'Produk' },
                        { label: 'Etalase' },
                        { label: 'Views', align: 'right' },
                        { label: 'Pesanan', align: 'right' },
                        { label: 'CR', align: 'right' },
                        { label: 'Omzet', align: 'right' },
                        { label: 'Stok', align: 'right' },
                        { label: 'Status' },
                    ]}
                >
                    {report.products.map((product) => (
                        <tr key={product.sku} className="hover:bg-muted/40">
                            <td className={cell}>
                                <div className="font-medium text-foreground">{product.name}</div>
                                <div className="text-[11px] text-muted-foreground">{product.sku}</div>
                            </td>
                            <td className={`${cell} text-muted-foreground`}>{product.showcase_name}</td>
                            <td className={numberCell}>{formatNumber(product.views)}</td>
                            <td className={numberCell}>{formatNumber(product.orders)}</td>
                            <td className={numberCell}>{formatPercent(product.conversion_rate)}</td>
                            <td className={`${numberCell} font-semibold text-foreground`}>{formatIDR(product.revenue)}</td>
                            <td className={numberCell}>
                                <div>{formatNumber(product.stock)}</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {product.stock_days === null ? 'tidak bergerak' : `± ${formatNumber(product.stock_days)} hari`}
                                </div>
                            </td>
                            <td className={cell}>
                                {product.is_slow_moving ? (
                                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">Kurang laku</Badge>
                                ) : product.stock_days !== null && product.stock_days < 14 ? (
                                    <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400">Stok menipis</Badge>
                                ) : (
                                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">Sehat</Badge>
                                )}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </Section>
        </div>
    );
}

export default function ShopeeAnalyticsIndex({ period, periodOptions, report }: Props) {
    const [tab, setTab] = useState<TabKey>('summary');

    const changePeriod = (days: number) => {
        router.visit(shopeeIndex({ query: { period: days } }), {
            preserveScroll: true,
            preserveState: true,
            only: ['period', 'report'],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shopee Analytics" />

            <div className="w-full space-y-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sidebar-border bg-card p-5 shadow-sm lg:flex-row lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Shopee Analytics</h1>
                            {report.is_dummy && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    Data Dummy
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            {report.store_name} · {formatDate(report.period.start, true)} – {formatDate(report.period.end, true)}
                        </p>
                    </div>

                    <div className="inline-flex self-start rounded-xl border border-sidebar-border p-0.5 text-xs lg:self-auto">
                        {periodOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => changePeriod(option.value)}
                                className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                                    period === option.value ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {option.value} Hari
                            </button>
                        ))}
                    </div>
                </div>

                {report.is_dummy && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
                        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Semua angka di halaman ini adalah <strong>data dummy</strong> untuk simulasi, bukan data asli toko Shopee. Data asli akan
                            tampil setelah integrasi Shopee Open API.
                        </p>
                    </div>
                )}

                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <div className="inline-flex min-w-full gap-1 rounded-2xl border border-sidebar-border bg-card p-1 shadow-sm sm:min-w-0">
                        {TABS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                                    tab === key ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'summary' && <SummaryTab report={report} />}
                {tab === 'sales' && <SalesTab report={report} />}
                {tab === 'ads' && <AdsTab report={report} />}
                {tab === 'content' && <ContentTab report={report} />}
                {tab === 'showcases' && <ShowcasesTab report={report} />}
            </div>
        </AppLayout>
    );
}
