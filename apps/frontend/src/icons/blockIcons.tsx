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
            {/* Spread - distance between bid and ask */}
            <path d="M5 7h14m-14 10h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polyline points="10 10 12 7 14 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="10 14 12 17 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'data.kraken.assetPairs': (
        <>
            <circle cx="8" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
        </>
    ),
    'logic.movingAverage': (
        <>
            {/* Moving Average - Smooth sine curve */}
            <path d="M2 14c4-4 8-4 12 0s8 4 12 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    'logic.if': (
        <>
            <path d="M12 4L4 12l8 8 8-8-8-8z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M12 9v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
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
