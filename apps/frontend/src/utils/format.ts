export function formatPair(pair: string): string {
    const normalized = pair.trim().toUpperCase().replace('XBT', 'BTC');
    return normalized;
}

export function formatPrice(value?: number): string {
    if (value === undefined || Number.isNaN(value)) {
        return '$—';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatAmount(amount?: number, asset: string = 'BTC'): string {
    if (amount === undefined || Number.isNaN(amount)) {
        return `0.0000 ${asset}`;
    }
    return `${amount.toFixed(4)} ${asset}`;
}

export function formatPercent(change?: number): string {
    if (change === undefined || Number.isNaN(change)) {
        return '0.00%';
    }
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

export function formatSpread(spread?: number): string {
    if (spread === undefined || Number.isNaN(spread)) {
        return '$0.00';
    }
    return `$${spread.toFixed(2)}`;
}

export function formatRate(rate?: number): string {
    if (rate === undefined || Number.isNaN(rate)) {
        return '0.00%';
    }
    return `${(rate * 100).toFixed(2)}%`;
}
