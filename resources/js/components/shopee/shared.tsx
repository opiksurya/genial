import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function SectionCard({
    title,
    description,
    action,
    children,
    className,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Card className={cn('min-w-0 gap-4 py-5', className)}>
            <CardHeader className="flex flex-col gap-2 px-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && <CardDescription className="text-xs">{description}</CardDescription>}
                </div>
                {action}
            </CardHeader>
            <CardContent className="min-w-0 px-5">{children}</CardContent>
        </Card>
    );
}

export function StatTile({ label, value, hint, icon }: { label: string; value: string; hint?: ReactNode; icon?: ReactNode }) {
    return (
        <div className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span className="truncate">{label}</span>
                {icon}
            </div>
            <div className="mt-2 truncate text-xl font-bold text-foreground tabular-nums">{value}</div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
    );
}

/**
 * Percentage change versus the previous period. Color reflects whether the
 * change is good or bad for that metric, and an arrow + sign carry the direction.
 */
export function ChangeBadge({ change, higherIsBetter = true }: { change: number | null; higherIsBetter?: boolean }) {
    if (change === null) {
        return <span className="text-xs text-muted-foreground">Tidak ada data pembanding</span>;
    }

    const isFlat = change === 0;
    const isGood = isFlat ? null : (change > 0) === higherIsBetter;
    const Icon = isFlat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                isGood === null && 'bg-muted text-muted-foreground',
                isGood === true && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                isGood === false && 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
            )}
        >
            <Icon className="size-3.5" aria-hidden />
            {change > 0 ? '+' : ''}
            {change.toLocaleString('id-ID')}%
        </span>
    );
}

export function TableWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-left text-xs">{children}</table>
        </div>
    );
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
    return (
        <th
            className={cn(
                'border-b border-border bg-muted/50 p-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase whitespace-nowrap',
                align === 'right' && 'text-right',
            )}
        >
            {children}
        </th>
    );
}

export function Td({ children, align = 'left', className }: { children: ReactNode; align?: 'left' | 'right'; className?: string }) {
    return (
        <td className={cn('p-3 text-foreground', align === 'right' && 'text-right font-mono tabular-nums whitespace-nowrap', className)}>
            {children}
        </td>
    );
}

export function EmptyState({ message }: { message: string }) {
    return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{message}</div>;
}
