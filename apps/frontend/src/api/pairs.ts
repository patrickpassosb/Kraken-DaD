import { API_BASE } from './config';

export interface PairItem {
    id: string;
    base: string;
    quote: string;
    status?: string;
    name?: string;
}

export async function fetchPairs(): Promise<PairItem[]> {
    const res = await fetch(`${API_BASE}/market/pairs`);
    if (!res.ok) {
        throw new Error(`Failed to fetch pairs: ${res.status}`);
    }
    const data = (await res.json()) as { pairs?: PairItem[] };
    return data.pairs ?? [];
}
