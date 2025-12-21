import { AssetMeta, getAssetMeta } from './assets';

export interface TradingPair {
    id: string;
    base: string;
    quote: string;
    label: string;
}

export const tradingPairs: TradingPair[] = [
    { id: 'BTC/USD', base: 'BTC', quote: 'USD', label: 'BTC/USD' },
    { id: 'ETH/USD', base: 'ETH', quote: 'USD', label: 'ETH/USD' },
    { id: 'USDC/USD', base: 'USDC', quote: 'USD', label: 'USDC/USD' },
    { id: 'USDT/USD', base: 'USDT', quote: 'USD', label: 'USDT/USD' },
    { id: 'BTC/USDC', base: 'BTC', quote: 'USDC', label: 'BTC/USDC' },
    { id: 'ETH/USDC', base: 'ETH', quote: 'USDC', label: 'ETH/USDC' },
    { id: 'SOL/USD', base: 'SOL', quote: 'USD', label: 'SOL/USD' },
    { id: 'ADA/USD', base: 'ADA', quote: 'USD', label: 'ADA/USD' },
    { id: 'ETH/EUR', base: 'ETH', quote: 'EUR', label: 'ETH/EUR' },
    { id: 'BTC/EUR', base: 'BTC', quote: 'EUR', label: 'BTC/EUR' },
];

/** Finds a bundled pair entry, case-insensitive. */
export function findPair(id: string): TradingPair | undefined {
    return tradingPairs.find((p) => p.id.toUpperCase() === id.toUpperCase());
}

/** Returns metadata for base/quote assets when available. */
export function getAssetsForPair(pairId: string): { base?: AssetMeta; quote?: AssetMeta } {
    const pair = findPair(pairId);
    if (!pair) return {};
    return {
        base: getAssetMeta(pair.base),
        quote: getAssetMeta(pair.quote),
    };
}
