import React from 'react';

/**
 * SVG Icons for Strategy Blocks
 * Normalized to 24x24 ViewBox with consistent stroke weights (2px/2.5px)
 * Solid designs without opacities as per user feedback for high contrast and professional look.
 */

export const IconPaths: Record<string, React.ReactNode> = {
    'control.start': (
        <>
            <path d="M8 5l12 7-12 7V5z" fill="currentColor" />
        </>
    ),
    'control.timeWindow': (
        <>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M12 7v5l4 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'data.kraken.ticker': (
        <>
            {/* Market Data - Bold line chart representing a live ticker */}
            <polyline points="3 16 8 10 13 14 21 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="21" cy="6" r="2" fill="currentColor" />
        </>
    ),
    'data.kraken.ohlc': (
        <>
            {/* Professional Candlesticks */}
            <rect x="5" y="9" width="4" height="8" rx="0.5" fill="currentColor" />
            <path d="M7 5v4m0 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="15" y="7" width="4" height="6" rx="0.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M17 3v4m0 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'data.constant': (
        <>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M8 10h8m-8 4h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
    ),
    'data.kraken.spread': (
        <>
            {/* Spread - Gap Measure (Technical Dimension Line) */}
            {/* Top Bar (Ask) */}
            <path d="M4 8h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M15 8h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

            {/* Bottom Bar (Bid) */}
            <path d="M4 16h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M15 16h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

            {/* Dimension Line (The Spread) */}
            <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 10l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 14l2 2 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'data.kraken.assetPairs': (
        <>
            {/* AssetPairs - Connected Coins (Molecule / Pair) */}
            {/* Connection Bar */}
            <path d="M9 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

            {/* Coin 1 */}
            <circle cx="7" cy="12" r="4.5" stroke="currentColor" strokeWidth="2.5" fill="none" />

            {/* Coin 2 */}
            <circle cx="17" cy="12" r="4.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </>
    ),
    'logic.movingAverage': (
        <>
            {/* Moving Average - Intertwined Curves (Crossover/Golden Cross) */}
            {/* Slow Average (Broader curve) */}
            <path d="M3 15C8 15 13 12 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

            {/* Fast Average (Steeper curve, intersecting) */}
            <path d="M3 18C8 18 12 9 21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'logic.if': (
        <>
            {/* Condition (IF) - Simple Fork (Requested by User) */}
            {/* Input Line */}
            <path d="M4 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

            {/* Split (Fork) - diverging paths */}
            <path d="M10 12L14 8H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 12L14 16H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Arrowheads on exits? User just said "split into two paths". Let's add small tips to imply direction. */}
            <path d="M18 6l2 2-2 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 14l2 2-2 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'risk.guard': (
        <>
            <path d="M12 3L4 6v5c0 5.5 8 10 8 10s8-4.5 8-10V6l-8-3z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
        </>
    ),
    'action.placeOrder': (
        <>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M8 12.5l3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'action.cancelOrder': (
        <>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
    ),
    'action.logIntent': (
        <>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M14 3v6h6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M8 13h8M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    )
};
