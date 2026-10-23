export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatRupiahCompact(amount: number): string {
    if (Math.abs(amount) >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
    }
    if (Math.abs(amount) >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    }
    if (Math.abs(amount) >= 1_000) {
        return `Rp ${(amount / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
    }
    return formatRupiah(amount);
}

export function formatNumber(value: number): string {
    return value.toLocaleString('id-ID');
}

export function formatPercent(value: number): string {
    return `${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
}

export function formatRatio(value: number): string {
    return `${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
}

export function formatDate(
    isoDate: string,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));

    return new Intl.DateTimeFormat('id-ID', { ...options, timeZone: 'Asia/Jakarta' }).format(date);
}

export function formatKpiValue(value: number, format: 'currency' | 'number' | 'percent' | 'ratio'): string {
    switch (format) {
        case 'currency':
            return formatRupiah(value);
        case 'number':
            return formatNumber(value);
        case 'percent':
            return formatPercent(value);
        case 'ratio':
            return formatRatio(value);
    }
}
