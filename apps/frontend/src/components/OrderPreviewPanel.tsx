import { formatAmount, formatPair, formatPrice, formatSpread } from '../utils/format';

interface OrderPreviewProps {
    pair: string;
    side: 'buy' | 'sell';
    amount: number;
    type: 'market' | 'limit';
    estimatedPrice?: number;
    feeRate: number;
    sourceLabel?: string;
    bid?: number;
    ask?: number;
    spread?: number;
}

export function OrderPreviewPanel({
    pair,
    side,
    amount,
    type,
    estimatedPrice,
    feeRate,
    sourceLabel,
    bid,
    ask,
    spread,
}: OrderPreviewProps) {
    const priceBasis = estimatedPrice ?? (side === 'buy' ? ask ?? estimatedPrice : bid ?? estimatedPrice);
    const notional = priceBasis ? priceBasis * amount : undefined;
    const fees = notional ? notional * feeRate : undefined;

    return (
        <div className="dock-card order-preview">
            <div className="market-header">
                <div className="market-pair">Order Preview</div>
                <span className="chip">Dry-run</span>
            </div>
            {sourceLabel && <div className="market-subtitle">{sourceLabel}</div>}
            <div className="kv-grid">
                <div className="kv-tile">
                    <span>Pair</span>
                    <strong>{formatPair(pair)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Side</span>
                    <strong style={{ color: side === 'buy' ? 'var(--kraken-green)' : 'var(--kraken-red)' }}>
                        {side === 'buy' ? 'Buy' : 'Sell'}
                    </strong>
                </div>
            </div>
            <div className="kv-grid">
                <div className="kv-tile">
                    <span>Size</span>
                    <strong>{formatAmount(amount, pair.split('/')[0])}</strong>
                </div>
                <div className="kv-tile">
                    <span>Type</span>
                    <strong className="muted">{type === 'market' ? 'Market' : 'Limit'}</strong>
                </div>
            </div>
            <div className="kv-grid">
                <div className="kv-tile">
                    <span>Est. price</span>
                    <strong>{formatPrice(priceBasis)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Fees (mock)</span>
                    <strong>{fees ? formatPrice(fees) : '$—'}</strong>
                </div>
            </div>
            <div className="kv-grid">
                <div className="kv-tile">
                    <span>Book ref</span>
                    <strong className="muted">Bid {formatPrice(bid ?? priceBasis)}</strong>
                </div>
                <div className="kv-tile">
                    <span>Guard</span>
                    <strong className="muted">Spread {formatSpread(spread ?? 0)}</strong>
                </div>
            </div>
        </div>
    );
}
