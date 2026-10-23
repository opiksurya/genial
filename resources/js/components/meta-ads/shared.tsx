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
        <Card className={cn('min-w-0 gap-3 py-4 rounded-xl border-border/70 bg-card shadow-2xs transition-all hover:shadow-xs', className)}>
            <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-0.5">
                    <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-foreground">{title}</CardTitle>
                    {description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
                </div>
                {action}
            </CardHeader>
            <CardContent className="min-w-0 px-4">{children}</CardContent>
        </Card>
    );
}

export function StatTile({ label, value, hint, icon }: { label: string; value: string; hint?: ReactNode; icon?: ReactNode }) {
    return (
        <div className="group min-w-0 rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 shadow-2xs transition-all duration-150 hover:border-blue-500/30 hover:shadow-xs">
            <div className="flex items-center justify-between gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <span className="truncate uppercase tracking-wider">{label}</span>
                {icon && <div className="text-muted-foreground/80 transition-colors group-hover:text-blue-600">{icon}</div>}
            </div>
            <div className="mt-1.5 truncate text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">{value}</div>
            {hint && <div className="mt-1 text-[11px] text-muted-foreground font-normal">{hint}</div>}
        </div>
    );
}

export function ChangeBadge({ change, higherIsBetter = true }: { change: number | null; higherIsBetter?: boolean }) {
    if (change === null) {
        return <span className="text-[11px] text-muted-foreground font-medium">Tidak ada data pembanding</span>;
    }

    const isFlat = change === 0;
    const isGood = isFlat ? null : (change > 0) === higherIsBetter;
    const Icon = isFlat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums shadow-2xs',
                isGood === null && 'bg-muted text-muted-foreground',
                isGood === true && 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                isGood === false && 'border border-rose-500/20 bg-rose-500/15 text-rose-700 dark:text-rose-400',
            )}
        >
            <Icon className="size-3 stroke-[2.5]" aria-hidden />
            {change > 0 ? '+' : ''}
            {change.toLocaleString('id-ID')}%
        </span>
    );
}

export function TableWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] text-left text-xs">{children}</table>
        </div>
    );
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
    return (
        <th
            className={cn(
                'border-b border-border bg-muted/40 p-2.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase whitespace-nowrap',
                align === 'right' && 'text-right',
            )}
        >
            {children}
        </th>
    );
}

export function Td({ children, align = 'left', className }: { children: ReactNode; align?: 'left' | 'right'; className?: string }) {
    return (
        <td className={cn('p-2.5 text-foreground', align === 'right' && 'text-right font-mono tabular-nums whitespace-nowrap', className)}>
            {children}
        </td>
    );
}

export function EmptyState({ message }: { message: string }) {
    return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{message}</div>;
}
