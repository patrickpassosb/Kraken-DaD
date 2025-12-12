/**
 * Kraken DaD - Kraken API Adapter Interface
 *
 * Defines the contract for Kraken API adapters.
 * This interface is injected into ExecutionContext for data blocks.
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
 * Kraken API adapter interface.
 * Implementations may use REST, WebSocket, or mock data.
 */
export interface KrakenAdapter {
    /**
     * Get ticker information for a trading pair.
     * @param pair - Trading pair (e.g., "XBTUSD", "ETHUSD")
     * @returns Normalized ticker data
     * @throws Error if the pair is invalid or request fails
     */
    getTicker(pair: string): Promise<KrakenTicker>;

    // Future methods (not implemented):
    // getOrderbook(pair: string): Promise<KrakenOrderbook>;
    // getBalance(): Promise<KrakenBalance>;
}
