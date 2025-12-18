import { formatPair, formatPercent, formatPrice, formatSpread } from '../utils/format';
import { getAssetsForPair } from '../data/pairs';

interface MarketContextProps {
    pair: string;
    lastPrice: number;
    spread: number;
    changePct?: number;
    status: 'Open' | 'Halted';
    source?: string;
}

export function MarketContextDock({
    pair,
    lastPrice,
    spread,
    changePct,
    status,
    source,
}: MarketContextProps) {
    const assets = getAssetsForPair(pair);
    const baseIcon = assets.base?.icon;
    const baseColor = assets.base?.color ?? 'var(--kraken-purple)';
    const hasChange = changePct !== undefined && !Number.isNaN(changePct);
    return (
        <div className="dock-card">
            <div className="market-header">
                <div className="market-pair">
                    {baseIcon ? (
                        <img className="asset-icon" src={baseIcon} alt={assets.base?.symbol ?? pair} />
                    ) : (
                        <div className="asset-initial" style={{ background: baseColor }}>
                            {(assets.base?.symbol ?? pair.split('/')[0]).slice(0, 3).toUpperCase()}
                        </div>
                    )}
                    <span>{formatPair(pair)}</span>
                </div>
                {hasChange && (
                    <span
                        className="market-badge"
                        style={{ color: (changePct ?? 0) >= 0 ? 'var(--kraken-green)' : 'var(--kraken-red)' }}
                    >
                        {formatPercent(changePct)}
                    </span>
                )}
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
