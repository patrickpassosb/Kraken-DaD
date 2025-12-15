import { API_BASE } from './config';

export interface MarketContextResponse {
    pair: string;
    lastPrice: number;
    ask: number | null;
    bid: number | null;
    spread: number | null;
    change24h: number;
    volume24h?: number;
    timestamp?: number;
    source: 'kraken';
    error?: string;
}

export async function fetchMarketContext(pair: string): Promise<MarketContextResponse> {
    const url = `${API_BASE}/market/context?pair=${encodeURIComponent(pair)}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch market context: ${res.status}`);
    }
    return res.json();
}
