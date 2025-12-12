/**
 * Kraken DaD - Kraken REST API Adapter
 *
 * Implementation of KrakenAdapter using Kraken's public REST API.
 * Uses only public endpoints, no authentication required.
 *
 * @module strategy-core/kraken/krakenRestAdapter
 */

import { KrakenAdapter, KrakenTicker } from './krakenAdapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const KRAKEN_API_BASE = 'https://api.kraken.com';
const TICKER_ENDPOINT = '/0/public/Ticker';

// =============================================================================
// KRAKEN API RESPONSE TYPES
// =============================================================================

/**
 * Raw Kraken API ticker response structure.
 * @see https://docs.kraken.com/api/docs/rest-api/get-ticker-information
 */
interface KrakenTickerResponse {
    error: string[];
    result: {
        [pair: string]: {
            /** Ask [price, whole lot volume, lot volume] */
            a: [string, string, string];
            /** Bid [price, whole lot volume, lot volume] */
            b: [string, string, string];
            /** Last trade closed [price, lot volume] */
            c: [string, string];
            /** Volume [today, last 24 hours] */
            v: [string, string];
            /** Volume weighted average price [today, last 24 hours] */
            p: [string, string];
            /** Number of trades [today, last 24 hours] */
            t: [number, number];
            /** Low [today, last 24 hours] */
            l: [string, string];
            /** High [today, last 24 hours] */
            h: [string, string];
            /** Today's opening price */
            o: string;
        };
    };
}

// =============================================================================
// REST ADAPTER IMPLEMENTATION
// =============================================================================

/**
 * Kraken REST API adapter.
 * Fetches public market data from Kraken's REST API.
 */
export class KrakenRestAdapter implements KrakenAdapter {
    private readonly baseUrl: string;

    constructor(baseUrl: string = KRAKEN_API_BASE) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get ticker information for a trading pair.
     * @param pair - Trading pair (e.g., "XBTUSD", "ETHUSD")
     * @returns Normalized ticker data
     * @throws Error if the pair is invalid or request fails
     */
    async getTicker(pair: string): Promise<KrakenTicker> {
        const url = `${this.baseUrl}${TICKER_ENDPOINT}?pair=${encodeURIComponent(pair)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Kraken API error: HTTP ${response.status}`);
        }

        const data: KrakenTickerResponse = await response.json();

        // Check for API errors
        if (data.error && data.error.length > 0) {
            throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }

        // Extract the result
        const resultKeys = Object.keys(data.result);
        if (resultKeys.length === 0) {
            throw new Error(`Kraken API error: No data returned for pair "${pair}"`);
        }

        // Use the first (and typically only) result key
        const pairKey = resultKeys[0];
        const tickerData = data.result[pairKey];

        // Extract last trade price from 'c' field [price, volume]
        const price = parseFloat(tickerData.c[0]);

        if (isNaN(price)) {
            throw new Error(`Kraken API error: Invalid price data for pair "${pair}"`);
        }

        return {
            pair: pairKey,
            price,
            timestamp: new Date().toISOString(),
        };
    }
}
