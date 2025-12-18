import { useMemo, useState } from 'react';
import { tradingPairs } from '../data/pairs';
import { getAssetIconUrl, getAssetMeta, hashedColor } from '../data/assets';
import type { PairItem } from '../api/pairs';

interface PairSelectorProps {
    value: string;
    onSelect: (pairId: string) => void;
    onClose: () => void;
    pairs?: PairItem[];
}

function AssetBadge({ symbol }: { symbol: string }) {
    const meta = getAssetMeta(symbol);
    const [iconOk, setIconOk] = useState(true);
    const iconUrl = getAssetIconUrl(symbol);
    if (iconUrl && iconOk) {
        return (
            <img
                className="asset-icon"
                src={iconUrl}
                alt={symbol}
                onError={() => setIconOk(false)}
            />
        );
    }
    const colorA = meta?.color ?? hashedColor(symbol);
    const colorB = hashedColor(symbol, 1);
    return (
        <div
            className="asset-initial"
            style={{ background: `linear-gradient(135deg, ${colorA}, ${colorB})` }}
        >
            {symbol.slice(0, 3).toUpperCase()}
        </div>
    );
}

export function PairSelector({ value, onSelect, onClose, pairs }: PairSelectorProps) {
    const [term, setTerm] = useState('');
    const displaySymbol = (sym: string) => {
        const upper = sym.toUpperCase();
        if (upper === 'XBT' || upper === 'TBTC') return 'BTC';
        return upper;
    };
    const filtered = useMemo(() => {
        const source = pairs && pairs.length > 0 ? pairs : tradingPairs;
        const q = term.trim().toLowerCase();
        if (!q) return source;
        return source.filter(
            (p) =>
                p.id.toLowerCase().includes(q) ||
                p.base.toLowerCase().includes(q) ||
                p.quote.toLowerCase().includes(q)
        );
    }, [pairs, term]);

    return (
        <div className="pair-selector panel">
            <div className="pair-selector-head">
                <div className="pair-selector-title">Select Pair</div>
                <button className="btn btn-ghost" onClick={onClose}>
                    Close
                </button>
            </div>
            <input
                className="pair-search"
                placeholder="Search assets or pairs..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
            <div className="pair-list">
                {filtered.map((pair) => {
                    const baseMeta = getAssetMeta(pair.base);
                    const displayLabel =
                        (pair as { label?: string }).label ||
                        `${displaySymbol(pair.base)}/${pair.quote}`;
                    return (
                        <button
                            key={pair.id}
                            className={`pair-row ${value === pair.id ? 'active' : ''}`}
                            onClick={() => onSelect(pair.id)}
                        >
                            <AssetBadge symbol={pair.base} />
                            <div className="pair-row-text">
                                <div className="pair-row-label">{displayLabel}</div>
                                <div className="pair-row-sub">
                                    {baseMeta?.name ?? pair.base} • {pair.quote}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="pair-empty">No pairs match your search.</div>
                )}
            </div>
        </div>
    );
}
