import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const META_SERIES_BG = [
    'bg-[#0080fb] dark:bg-[#3897f0]',
    'bg-[#e1306c] dark:bg-[#fd1d1d]',
    'bg-[#833ab4] dark:bg-[#9d4edd]',
    'bg-[#00c300] dark:bg-[#25d366]',
] as const;

export const META_SERIES_STROKE = [
    'stroke-[#0080fb] dark:stroke-[#3897f0]',
    'stroke-[#e1306c] dark:stroke-[#fd1d1d]',
] as const;

function niceMax(value: number): number {
    if (value <= 0) return 1;
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
                'pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-56 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md group-hover:block group-focus-visible:block',
                alignRight ? 'right-0' : 'left-0',
            )}
        >
            <div className="mb-1 font-semibold">{title}</div>
            <div className="space-y-0.5">
                {lines.map((line) => (
                    <div key={line.label} className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            {line.swatch && <span className={cn('size-2 rounded-full', line.swatch)} />}
                            {line.label}
                        </span>
                        <span className="font-semibold text-foreground">{line.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BarTrendChart({
    data,
    axisFormatter = (v) => String(v),
    ariaLabel,
}: {
    data: { key: string; axisLabel: string; tooltipTitle: string; value: number; tooltipLines: TooltipLine[] }[];
    axisFormatter?: (value: number) => string;
    ariaLabel: string;
}) {
    const rawMax = Math.max(0, ...data.map((d) => d.value));
    const max = niceMax(rawMax);
    const ticks = axisTicks(max);
    const visibleLabelIndexes = xLabelIndexes(data.length);

    return (
        <div aria-label={ariaLabel} className="space-y-2">
            <div className="flex h-44 gap-2 sm:h-52">
                <div className="flex w-14 shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums">
                    {ticks.map((tick, index) => (
                        <span key={index} className="truncate">
                            {axisFormatter(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative flex flex-1 items-end gap-1 border-b border-border">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                        {ticks.map((_, index) => (
                            <div key={index} className="h-px w-full bg-border/40" />
                        ))}
                    </div>

                    {data.map((item, index) => {
                        const height = max > 0 ? (item.value / max) * 100 : 0;
                        const alignRight = index > data.length / 2;

                        return (
                            <div key={item.key} tabIndex={0} className="group relative flex-1 focus-visible:outline-none h-full flex items-end">
                                <div
                                    style={{ height: `${Math.max(2, height)}%` }}
                                    className="w-full rounded-t-sm bg-blue-600 dark:bg-blue-500 transition-all duration-150 group-hover:brightness-110"
                                />
                                <ChartTooltip title={item.tooltipTitle} lines={item.tooltipLines} alignRight={alignRight} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex pl-16">
                {data.map((item, index) => (
                    <div key={item.key} className="flex-1 text-center text-[10px] text-muted-foreground">
                        {visibleLabelIndexes.has(index) ? item.axisLabel : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StackedShareBar({
    segments,
    ariaLabel,
}: {
    segments: { key: string; label: string; share: number; swatch: string; detail?: string; icon?: ReactNode }[];
    ariaLabel: string;
}) {
    return (
        <div aria-label={ariaLabel} className="space-y-3">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted">
                {segments.map((seg) => (
                    <div
                        key={seg.key}
                        style={{ width: `${seg.share}%` }}
                        className={cn('h-full transition-all duration-300', seg.swatch)}
                        title={`${seg.label}: ${seg.share}%`}
                    />
                ))}
            </div>

            <div className="space-y-2">
                {segments.map((seg) => (
                    <div key={seg.key} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={cn('size-2.5 rounded-full shrink-0', seg.swatch)} />
                            {seg.icon}
                            <span className="font-semibold truncate">{seg.label}</span>
                            {seg.detail && <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">({seg.detail})</span>}
                        </div>
                        <span className="font-bold tabular-nums text-foreground">{seg.share}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function HorizontalBarList({
    items,
    max,
}: {
    items: { key: string; label: string; sublabel?: string; value: number; valueLabel: string }[];
    max?: number;
}) {
    const computedMax = max ?? Math.max(1, ...items.map((i) => i.value));

    return (
        <div className="space-y-2.5">
            {items.map((item) => {
                const width = Math.min(100, Math.max(2, (item.value / computedMax) * 100));

                return (
                    <div key={item.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                                <span className="font-semibold text-foreground truncate">{item.label}</span>
                                {item.sublabel && <span className="text-[10px] text-muted-foreground truncate">({item.sublabel})</span>}
                            </div>
                            <span className="font-bold tabular-nums text-foreground shrink-0">{item.valueLabel}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div style={{ width: `${width}%` }} className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function LineCompareChart({
    labels,
    series,
    axisFormatter = (v) => String(v),
    valueFormatter = (v) => String(v),
    tooltipTitles,
    ariaLabel,
}: {
    labels: string[];
    series: { key: string; label: string; values: number[]; strokeClass?: string }[];
    axisFormatter?: (value: number) => string;
    valueFormatter?: (value: number) => string;
    tooltipTitles?: string[];
    ariaLabel: string;
}) {
    const allValues = series.flatMap((s) => s.values);
    const rawMax = Math.max(0, ...allValues);
    const max = niceMax(rawMax);
    const ticks = axisTicks(max);
    const count = labels.length;
    const visibleLabelIndexes = xLabelIndexes(count);

    const width = 1000;
    const height = 300;
    const getX = (idx: number) => (count > 1 ? (idx / (count - 1)) * width : width / 2);
    const getY = (val: number) => (max > 0 ? height - (val / max) * height : height);

    return (
        <div aria-label={ariaLabel} className="space-y-2">
            <div className="flex items-center justify-end gap-4 text-xs">
                {series.map((s, idx) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                        <span className={cn('h-1 w-3 rounded-full', idx === 0 ? 'bg-blue-600' : 'bg-pink-600')} />
                        <span className="text-muted-foreground font-medium">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="flex h-44 gap-2 sm:h-52">
                <div className="flex w-14 shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums">
                    {ticks.map((tick, index) => (
                        <span key={index} className="truncate">
                            {axisFormatter(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative flex-1 border-b border-border">
                    <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
                        {ticks.map((_, index) => {
                            const y = (index / (ticks.length - 1)) * height;
                            return (
                                <line
                                    key={index}
                                    x1="0"
                                    y1={y}
                                    x2={width}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.08"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}

                        {series.map((s, sIdx) => {
                            const points = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
                            const strokeColor = sIdx === 0 ? '#0080fb' : '#e1306c';

                            return (
                                <polyline
                                    key={s.key}
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                    points={points}
                                />
                            );
                        })}
                    </svg>

                    <div className="absolute inset-0 flex">
                        {labels.map((label, idx) => {
                            const alignRight = idx > count / 2;
                            const title = tooltipTitles?.[idx] || label;
                            const tooltipLines = series.map((s, sIdx) => ({
                                label: s.label,
                                value: valueFormatter(s.values[idx] || 0),
                                swatch: sIdx === 0 ? 'bg-blue-600' : 'bg-pink-600',
                            }));

                            return (
                                <div key={idx} tabIndex={0} className="group relative flex-1 focus-visible:outline-none">
                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-foreground/20 group-hover:block group-focus-visible:block" />
                                    <div className="h-full w-full opacity-0 hover:bg-blue-500/5 transition-colors" />
                                    <ChartTooltip title={title} lines={tooltipLines} alignRight={alignRight} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex pl-16">
                {labels.map((label, index) => (
                    <div key={index} className="flex-1 text-center text-[10px] text-muted-foreground">
                        {visibleLabelIndexes.has(index) ? label : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}
