import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Categorical series colors (fixed order, CVD-validated adjacent order).
 * Light and dark steps are selected separately for each surface.
 */
export const SERIES_BG = [
    'bg-[#2a78d6] dark:bg-[#3987e5]',
    'bg-[#eb6834] dark:bg-[#d95926]',
    'bg-[#1baf7a] dark:bg-[#199e70]',
    'bg-[#eda100] dark:bg-[#c98500]',
] as const;

export const SERIES_STROKE = [
    'stroke-[#2a78d6] dark:stroke-[#3987e5]',
    'stroke-[#eb6834] dark:stroke-[#d95926]',
] as const;

function niceMax(value: number): number {
    if (value <= 0) {
        return 1;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => normalized <= candidate) ?? 10;

    return step * magnitude;
}

function axisTicks(max: number, count = 4): number[] {
    return Array.from({ length: count + 1 }, (_, index) => (max / count) * (count - index));
}

function xLabelIndexes(length: number, maxLabels = 6): Set<number> {
    if (length <= maxLabels) {
        return new Set(Array.from({ length }, (_, index) => index));
    }

    const step = (length - 1) / (maxLabels - 1);

    return new Set(Array.from({ length: maxLabels }, (_, index) => Math.round(index * step)));
}

type TooltipLine = { label: string; value: string; swatch?: string };

function ChartTooltip({ title, lines, alignRight }: { title: string; lines: TooltipLine[]; alignRight: boolean }) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-56 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg group-hover:block group-focus-visible:block',
                alignRight ? 'right-0' : 'left-0',
            )}
        >
            <div className="mb-1 font-semibold">{title}</div>
            <div className="space-y-0.5">
                {lines.map((line) => (
                    <div key={line.label} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            {line.swatch && <span className={cn('size-2 rounded-full', line.swatch)} />}
                            {line.label}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">{line.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function YAxis({ ticks, formatter }: { ticks: number[]; formatter: (value: number) => string }) {
    return (
        <div className="flex w-16 shrink-0 flex-col justify-between pr-2 text-right text-[10px] text-muted-foreground tabular-nums">
            {ticks.map((tick) => (
                <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
                    {formatter(tick)}
                </span>
            ))}
        </div>
    );
}

function Gridlines({ count }: { count: number }) {
    return (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: count + 1 }, (_, index) => (
                <div key={index} className={cn('border-t', index === count ? 'border-border' : 'border-dashed border-border/60')} />
            ))}
        </div>
    );
}

export type BarDatum = {
    key: string;
    axisLabel: string;
    tooltipTitle: string;
    value: number;
    tooltipLines: TooltipLine[];
};

/** Vertical bar chart (single series) with per-bar hover tooltip. */
export function BarTrendChart({
    data,
    ariaLabel,
    axisFormatter,
    barClassName = SERIES_BG[0],
}: {
    data: BarDatum[];
    ariaLabel: string;
    axisFormatter: (value: number) => string;
    barClassName?: string;
}) {
    const max = niceMax(Math.max(0, ...data.map((datum) => datum.value)));
    const ticks = axisTicks(max);
    const labelIndexes = xLabelIndexes(data.length);

    return (
        <div role="img" aria-label={ariaLabel} className="w-full">
            <div className="flex h-56">
                <YAxis ticks={ticks} formatter={axisFormatter} />
                <div className="relative flex-1">
                    <Gridlines count={ticks.length - 1} />
                    <div className={cn('relative flex h-full items-end', data.length > 45 ? 'gap-px' : 'gap-0.5 sm:gap-1')}>
                        {data.map((datum, index) => (
                            <div key={datum.key} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
                                <div
                                    className={cn('w-full min-h-px rounded-t-[4px] transition-opacity group-hover:opacity-80', barClassName)}
                                    style={{ height: `${(datum.value / max) * 100}%` }}
                                />
                                <ChartTooltip title={datum.tooltipTitle} lines={datum.tooltipLines} alignRight={index > data.length / 2} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="ml-16 mt-2 flex text-[10px] text-muted-foreground">
                {data.map((datum, index) => (
                    <div key={datum.key} className="relative flex-1">
                        {labelIndexes.has(index) && (
                            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{datum.axisLabel}</span>
                        )}
                    </div>
                ))}
            </div>
            <div className="h-3" />
        </div>
    );
}

export type LineSeries = { key: string; label: string; values: number[] };

/** Multi-line chart sharing one value axis, with a hover crosshair column. */
export function LineCompareChart({
    labels,
    tooltipTitles,
    series,
    ariaLabel,
    axisFormatter,
    valueFormatter,
}: {
    labels: string[];
    tooltipTitles: string[];
    series: LineSeries[];
    ariaLabel: string;
    axisFormatter: (value: number) => string;
    valueFormatter: (value: number) => string;
}) {
    const max = niceMax(Math.max(0, ...series.flatMap((line) => line.values)));
    const ticks = axisTicks(max);
    const labelIndexes = xLabelIndexes(labels.length);
    const width = 1000;
    const height = 300;
    const xFor = (index: number) => (labels.length <= 1 ? width / 2 : (index / (labels.length - 1)) * width);
    const yFor = (value: number) => height - (value / max) * height;

    return (
        <div role="img" aria-label={ariaLabel} className="w-full">
            <ChartLegend items={series.map((line, index) => ({ label: line.label, swatch: SERIES_BG[index] }))} className="mb-3" />
            <div className="flex h-56">
                <YAxis ticks={ticks} formatter={axisFormatter} />
                <div className="relative flex-1">
                    <Gridlines count={ticks.length - 1} />
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                        {series.map((line, seriesIndex) => (
                            <polyline
                                key={line.key}
                                fill="none"
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                className={SERIES_STROKE[seriesIndex]}
                                points={line.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ')}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex">
                        {labels.map((label, index) => (
                            <div
                                key={label + index}
                                tabIndex={0}
                                className="group relative h-full flex-1 outline-none"
                            >
                                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-foreground/30 group-hover:block group-focus-visible:block" />
                                <ChartTooltip
                                    title={tooltipTitles[index]}
                                    alignRight={index > labels.length / 2}
                                    lines={series.map((line, seriesIndex) => ({
                                        label: line.label,
                                        value: valueFormatter(line.values[index]),
                                        swatch: SERIES_BG[seriesIndex],
                                    }))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="ml-16 mt-2 flex text-[10px] text-muted-foreground">
                {labels.map((label, index) => (
                    <div key={label + index} className="relative flex-1">
                        {labelIndexes.has(index) && (
                            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{label}</span>
                        )}
                    </div>
                ))}
            </div>
            <div className="h-3" />
        </div>
    );
}

export function ChartLegend({ items, className }: { items: { label: string; swatch: string }[]; className?: string }) {
    return (
        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
            {items.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                    <span className={cn('size-2.5 rounded-full', item.swatch)} />
                    {item.label}
                </span>
            ))}
        </div>
    );
}

export type ShareSegment = {
    key: string;
    label: string;
    share: number;
    swatch: string;
    detail: string;
    icon?: ReactNode;
};

/** 100% stacked bar with a labeled legend underneath (identity never by color alone). */
export function StackedShareBar({ segments, ariaLabel }: { segments: ShareSegment[]; ariaLabel: string }) {
    const visible = segments.filter((segment) => segment.share > 0);

    return (
        <div className="space-y-4">
            <div role="img" aria-label={ariaLabel} className="flex h-4 w-full gap-0.5 overflow-hidden rounded-[4px] bg-muted">
                {visible.map((segment) => (
                    <div
                        key={segment.key}
                        tabIndex={0}
                        title={`${segment.label}: ${segment.share}% (${segment.detail})`}
                        className={cn('h-full outline-none first:rounded-l-[4px] last:rounded-r-[4px] hover:opacity-80', segment.swatch)}
                        style={{ width: `${segment.share}%` }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {segments.map((segment) => (
                    <div key={segment.key} className="flex items-start gap-2.5">
                        <span className={cn('mt-1 size-2.5 shrink-0 rounded-full', segment.swatch)} />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                {segment.icon}
                                {segment.label}
                                <span className="font-mono text-xs text-muted-foreground tabular-nums">{segment.share.toLocaleString('id-ID')}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground tabular-nums">{segment.detail}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export type HorizontalBarItem = {
    key: string;
    label: string;
    sublabel?: string;
    value: number;
    valueLabel: string;
};

/** Ranked horizontal bars, values labeled at the end of each row. */
export function HorizontalBarList({
    items,
    barClassName = SERIES_BG[0],
    max,
}: {
    items: HorizontalBarItem[];
    barClassName?: string;
    max?: number;
}) {
    const scaleMax = max ?? Math.max(1, ...items.map((item) => item.value));

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.key} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-foreground">
                            {item.label}
                            {item.sublabel && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{item.sublabel}</span>}
                        </span>
                        <span className="shrink-0 font-mono text-xs font-semibold text-foreground tabular-nums">{item.valueLabel}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-[4px] bg-muted">
                        <div
                            className={cn('h-full rounded-[4px]', barClassName)}
                            style={{ width: `${Math.max(0, Math.min(100, (item.value / scaleMax) * 100))}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
