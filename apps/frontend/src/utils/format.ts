/** Normalizes pair display (uppercases, swaps XBT -> BTC). */
export function formatPair(pair: string): string {
    const normalized = pair.trim().toUpperCase().replace('XBT', 'BTC');
    return normalized;
}

/** Formats a USD price with two decimals and a currency symbol. */
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

/** Formats an asset amount with four decimals for preview panels. */
export function formatAmount(amount?: number, asset: string = 'BTC'): string {
    if (amount === undefined || Number.isNaN(amount)) {
        return `0.0000 ${asset}`;
    }
    return `${amount.toFixed(4)} ${asset}`;
}

/** Formats percent deltas with a leading sign. */
export function formatPercent(change?: number): string {
    if (change === undefined || Number.isNaN(change)) {
        return '0.00%';
    }
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

/** Formats spreads as dollar values. */
export function formatSpread(spread?: number): string {
    if (spread === undefined || Number.isNaN(spread)) {
        return '$0.00';
    }
    return `$${spread.toFixed(2)}`;
}

/** Formats fee rates (0.0026) into percentages (0.26%). */
export function formatRate(rate?: number): string {
    if (rate === undefined || Number.isNaN(rate)) {
        return '0.00%';
    }
    return `${(rate * 100).toFixed(2)}%`;
}
