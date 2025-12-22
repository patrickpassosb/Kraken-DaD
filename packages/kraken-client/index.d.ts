export interface KrakenTickerSnapshot {
    pair: string;
    last: number;
    ask: number;
    bid: number;
    volume24h: number;
    change24h: number;
    change24hPct?: number;
    spread: number;
    timestamp: number;
}
export interface KrakenDepthSnapshot {
    pair: string;
    bestAsk?: number;
    bestBid?: number;
    spread?: number;
    asks: Array<{
        price: number;
        volume: number;
    }>;
    bids: Array<{
        price: number;
        volume: number;
    }>;
}
export interface KrakenOhlcCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    vwap: number;
    volume: number;
    count: number;
}
export interface KrakenOhlcSnapshot {
    pair: string;
    interval: number;
    candles: KrakenOhlcCandle[];
    last: number;
    timestamp: number;
}
export interface KrakenSpreadEntry {
    time: number;
    bid: number;
    ask: number;
    spread: number;
}
export interface KrakenSpreadSnapshot {
    pair: string;
    entries: KrakenSpreadEntry[];
    last: number;
    timestamp: number;
}
export interface KrakenAsset {
    altname: string;
    aclass: string;
    decimals: number;
    display_decimals: number;
}
export interface KrakenAssetPair {
    altname: string;
    wsname?: string;
    base: string;
    quote: string;
    status?: string;
    pair_decimals?: number;
    lot_decimals?: number;
    ordermin?: string;
    costmin?: string;
    tick_size?: string;
}
export interface KrakenCredentials {
    key: string;
    secret: string;
}
type KrakenCredentialsSource = 'runtime' | 'env' | 'none';
interface KrakenCredentialsStatus {
    configured: boolean;
    source: KrakenCredentialsSource;
}
/**
 * Stores runtime credentials (in-memory only). These override env credentials.
 */
export declare function setPrivateCreds(creds: KrakenCredentials): void;
/**
 * Clears runtime credentials; env-based creds remain available.
 */
export declare function clearPrivateCreds(): void;
/**
 * Indicates whether private creds are available and where they came from.
 */
export declare function getPrivateCredsStatus(): KrakenCredentialsStatus;
/**
 * Normalizes user-friendly pair strings into Kraken's format (e.g., BTC/USD -> XBTUSD)
 * while keeping a display variant for UI use.
 */
export declare function normalizePair(pair: string): {
    krakenPair: string;
    display: string;
};
type FetchOptions = {
    signal?: AbortSignal;
};
/**
 * Fetches the latest ticker snapshot for a pair via Kraken REST.
 */
export declare function fetchTicker(pair: string, options?: FetchOptions): Promise<KrakenTickerSnapshot>;
/**
 * Retrieves the Kraken assets catalog (symbols and display metadata).
 */
export declare function fetchAssets(options?: FetchOptions): Promise<Record<string, KrakenAsset>>;
/**
 * Retrieves the Kraken AssetPairs catalog with precision/limits metadata.
 */
export declare function fetchAssetPairs(options?: FetchOptions): Promise<Record<string, KrakenAssetPair>>;
/**
 * Fetches orderbook depth for a pair; used to derive bid/ask/spread when ticker lacks it.
 */
export declare function fetchDepth(pair: string, count?: number, options?: FetchOptions): Promise<KrakenDepthSnapshot>;
/**
 * Fetches OHLC candles for a pair/interval. Returns timestamps in ms.
 */
export declare function fetchOHLC(pair: string, interval?: number, options?: FetchOptions): Promise<KrakenOhlcSnapshot>;
/**
 * Fetches recent bid/ask spreads for a pair.
 */
export declare function fetchSpread(pair: string, options?: FetchOptions): Promise<KrakenSpreadSnapshot>;
/**
 * Returns available credentials (runtime or env) without throwing when missing.
 */
export declare function hasPrivateCreds(): KrakenCredentials | null;
interface AddOrderParams {
    pair: string;
    type: 'buy' | 'sell';
    ordertype: 'market' | 'limit';
    volume: string;
    price?: string;
}
/**
 * Calls Kraken AddOrder with validate=true to check parameters without placing a trade.
 */
export declare function validateAddOrder(params: AddOrderParams): Promise<Record<string, unknown>>;
/**
 * Calls Kraken CancelOrder with validate=true for dry-run confirmation.
 */
export declare function validateCancelOrder(txid: string): Promise<Record<string, unknown>>;
/**
 * Places a live Kraken order. Caller is responsible for ensuring intent safety.
 */
export declare function placeOrder(params: AddOrderParams): Promise<Record<string, unknown>>;
/**
 * Cancels a Kraken order by transaction id.
 */
export declare function cancelOrder(txid: string): Promise<Record<string, unknown>>;
/**
 * Fetches a single ticker tick over Kraken WS, with a short timeout fallback.
 */
export declare function fetchTickerWsOnce(pair: string, timeoutMs?: number): Promise<KrakenTickerSnapshot>;
export {};
