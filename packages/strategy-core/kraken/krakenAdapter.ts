/**
 * Kraken DaD - Kraken API Adapter Interface
 *
 * Defines the contracts for Kraken API adapters.
 * Public adapter is used for market data; private adapter is stubbed (no live trading).
 *
 * @module strategy-core/kraken/krakenAdapter
 */

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Normalized ticker data from Kraken.
 */
export interface KrakenTicker {
    /** Trading pair (e.g., "XXBTZUSD") */
    readonly pair: string;
    /** Last trade price */
    readonly price: number;
    /** Timestamp of the data (ISO 8601) */
    readonly timestamp: string;
}

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Kraken public API adapter interface.
 * Implementations may use REST, WebSocket, or mock data.
 */
export interface KrakenPublicAdapter {
    /**
     * Get ticker information for a trading pair.
     * @param pair - Trading pair (e.g., "XBTUSD", "ETHUSD")
     * @returns Normalized ticker data
     * @throws Error if the pair is invalid or request fails
     */
    getTicker(pair: string): Promise<KrakenTicker>;

}

/**
 * Kraken private API adapter interface (orders).
 * This project ships a stub only; live trading is not enabled.
 */
export interface KrakenPrivateAdapter {
    /**
     * action.placeOrder -> Kraken /0/private/AddOrder
     */
    placeOrder(params: Record<string, unknown>): Promise<never>;

    /**
     * action.cancelOrder -> Kraken /0/private/CancelOrder
     */
    cancelOrder(params: Record<string, unknown>): Promise<never>;
}

/**
 * Stub implementation of KrakenPrivateAdapter.
 * Always throws to keep live trading disabled in this demo.
 */
export class KrakenPrivateStubAdapter implements KrakenPrivateAdapter {
    async placeOrder(_params: Record<string, unknown>): Promise<never> {
        throw new Error('Live trading not enabled');
    }

    async cancelOrder(_params: Record<string, unknown>): Promise<never> {
        throw new Error('Live trading not enabled');
    }
}

// Legacy alias to avoid breaking older imports
export type KrakenAdapter = KrakenPublicAdapter;
