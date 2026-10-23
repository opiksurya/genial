import type { ShopeeKpiFormat } from '@/types/shopee';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

const decimalFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatRupiah(value: number): string {
    return rupiahFormatter.format(value);
}

/** Compact Rupiah for axis ticks and tight spaces, e.g. "Rp 12,5 jt". */
export function formatRupiahCompact(value: number): string {
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
        return `Rp ${trimDecimal(value / 1_000_000_000)} M`;
    }

    if (abs >= 1_000_000) {
        return `Rp ${trimDecimal(value / 1_000_000)} jt`;
    }

    if (abs >= 1_000) {
        return `Rp ${trimDecimal(value / 1_000)} rb`;
    }

    return `Rp ${numberFormatter.format(value)}`;
}

function trimDecimal(value: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value);
}

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
    return `${decimalFormatter.format(value)}%`;
}

export function formatRatio(value: number): string {
    return `${decimalFormatter.format(value)}x`;
}

export function formatKpiValue(value: number, format: ShopeeKpiFormat): string {
    switch (format) {
        case 'currency':
            return formatRupiah(value);
        case 'percent':
            return formatPercent(value);
        case 'ratio':
            return formatRatio(value);
        default:
            return formatNumber(value);
    }
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
    return new Intl.DateTimeFormat('id-ID', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (hours === 0) {
        return `${rest} mnt`;
    }

    return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} mnt`;
}
