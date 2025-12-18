import { formatPair, formatPrice, formatSpread } from '../utils/format';

interface MarketContextProps {
    pair: string;
    lastPrice: number;
    spread: number;
    status: 'Open' | 'Halted';
    source?: string;
}

export function MarketContextDock({
    pair,
    lastPrice,
    spread,
    status,
    source,
}: MarketContextProps) {
    return (
        <div className="dock-card">
            <div className="market-header">
                <div className="market-pair">{formatPair(pair)}</div>
            </div>
            {source && <div className="market-subtitle">{source}</div>}
            <div className="kv">
                <span>Last price</span>
                <strong>{formatPrice(lastPrice)}</strong>
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
