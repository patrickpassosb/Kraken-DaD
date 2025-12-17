import { formatPair, formatPercent, formatPrice, formatSpread } from '../utils/format';

interface MarketContextProps {
    pair: string;
    lastPrice: number;
    spread: number;
    change: number;
    status: 'Open' | 'Halted';
    source?: string;
    ask?: number | null;
    bid?: number | null;
}

export function MarketContextDock({
    pair,
    lastPrice,
    spread,
    change,
    status,
    source,
    ask,
    bid,
}: MarketContextProps) {
    const isUp = change >= 0;
    return (
        <div className="dock-card">
            <div className="market-header">
                <div className="market-pair">{formatPair(pair)}</div>
                <span
                    className="market-badge"
                    style={{ color: isUp ? 'var(--kraken-green)' : 'var(--kraken-red)' }}
                >
                    {formatPercent(change)}
                </span>
            </div>
            {source && <div className="market-subtitle">{source}</div>}
            <div className="kv">
                <span>Last price</span>
                <strong>{formatPrice(lastPrice)}</strong>
            </div>
            <div className="kv">
                <span>Bid / Ask</span>
                <strong>
                    {formatPrice(bid ?? lastPrice - spread)} · {formatPrice(ask ?? lastPrice + spread)}
                </strong>
            </div>
            <div className="kv">
                <span>Spread</span>
                <strong>{formatSpread(spread)}</strong>
            </div>
            <div className="kv">
                <span>Status</span>
                <strong style={{ color: status === 'Open' ? 'var(--kraken-green)' : 'var(--kraken-red)' }}>
                    {status}
                </strong>
            </div>
        </div>
    );
}
