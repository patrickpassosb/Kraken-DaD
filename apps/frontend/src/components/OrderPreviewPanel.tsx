import { formatAmount, formatPair, formatPrice } from '../utils/format';

interface OrderPreviewProps {
    pair: string;
    side: 'buy' | 'sell';
    amount: number;
    type: 'market' | 'limit';
    estimatedPrice?: number;
    feeRate: number;
    sourceLabel?: string;
}

export function OrderPreviewPanel({
    pair,
    side,
    amount,
    type,
    estimatedPrice,
    feeRate,
    sourceLabel,
}: OrderPreviewProps) {
    const notional = estimatedPrice ? estimatedPrice * amount : undefined;
    const fees = notional ? notional * feeRate : undefined;

    return (
        <div className="dock-card order-preview">
            <div className="market-header">
                <div className="market-pair">Order Preview</div>
                <span className="chip">Dry-run</span>
            </div>
            {sourceLabel && <div className="market-subtitle">{sourceLabel}</div>}
            <div className="kv">
                <span>Pair</span>
                <strong>{formatPair(pair)}</strong>
            </div>
            <div className="kv">
                <span>Side</span>
                <strong style={{ color: side === 'buy' ? 'var(--kraken-green)' : 'var(--kraken-red)' }}>
                    {side === 'buy' ? 'Buy' : 'Sell'}
                </strong>
            </div>
            <div className="kv">
                <span>Size</span>
                <strong>{formatAmount(amount, pair.split('/')[0])}</strong>
            </div>
            <div className="kv">
                <span>Type</span>
                <strong className="muted">{type === 'market' ? 'Market' : 'Limit'}</strong>
            </div>
            <div className="kv">
                <span>Est. price</span>
                <strong>{formatPrice(estimatedPrice)}</strong>
            </div>
            {notional && (
                <div className="kv">
                    <span>Est. notional</span>
                    <strong>{formatPrice(notional)}</strong>
                </div>
            )}
            <div className="kv">
                <span>Fees (mock)</span>
                <strong>{fees ? formatPrice(fees) : '$—'}</strong>
            </div>
        </div>
    );
}
