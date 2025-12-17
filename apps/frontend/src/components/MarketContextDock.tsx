import { formatPair, formatPercent, formatPrice, formatSpread } from '../utils/format';

interface MarketContextProps {
    pair: string;
    lastPrice: number;
    spread: number;
    change: number;
    status: 'Open' | 'Halted';
    source?: string;
    bid?: number;
    ask?: number;
}

export function MarketContextDock({
    pair,
    lastPrice,
    spread,
    change,
    status,
    source,
    bid,
    ask,
}: MarketContextProps) {
    const isUp = change >= 0;
    return (
        <div className="dock-card market-dock">
            <div className="market-header">
                <div>
                    <div className="eyebrow">Pair</div>
                    <div className="market-pair">{formatPair(pair)}</div>
                    {source && <div className="market-subtitle">{source}</div>}
                </div>
                <div className="market-tags">
                    <span
                        className="market-change"
                        style={{ color: isUp ? 'var(--kraken-green)' : 'var(--kraken-red)' }}
                    >
                        {formatPercent(change)}
                    </span>
                    <span
                        className="market-badge"
                        style={{
                            borderColor: isUp ? 'rgba(43, 210, 127, 0.35)' : 'rgba(255, 95, 109, 0.35)',
                        }}
                    >
                        {status}
                    </span>
                </div>
            </div>
            <div className="market-price-row">
                <div className="market-price">{formatPrice(lastPrice)}</div>
                <div className="muted">Mark price</div>
            </div>
            <div className="kv-grid">
                <div className="kv-tile">
                    <span>Bid</span>
                    <strong>{formatPrice(bid ?? lastPrice - spread)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Ask</span>
                    <strong>{formatPrice(ask ?? lastPrice + spread)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Spread</span>
                    <strong>{formatSpread(spread)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Status</span>
                    <strong style={{ color: status === 'Open' ? 'var(--kraken-green)' : 'var(--kraken-red)' }}>
                        {status}
                    </strong>
                </div>
            </div>
        </div>
    );
}
