import { createHash, createHmac } from 'crypto';

const API_BASE = 'https://api.kraken.com';

interface KrakenTickerRaw {
    a?: [string, string?, string?];
    b?: [string, string?, string?];
    c?: [string, string?];
    v?: [string, string?];
    p?: [string, string?];
}

export interface KrakenTickerSnapshot {
    pair: string;
    last: number;
    ask: number;
    bid: number;
    volume24h: number;
    change24h: number;
    spread: number;
    timestamp: number;
}

export interface KrakenDepthSnapshot {
    pair: string;
    bestAsk?: number;
    bestBid?: number;
    spread?: number;
    asks: Array<{ price: number; volume: number }>;
    bids: Array<{ price: number; volume: number }>;
}

export interface KrakenCredentials {
    key: string;
    secret: string;
}

export function normalizePair(pair: string): { krakenPair: string; display: string } {
    const trimmed = pair.trim().toUpperCase().replace(/\s+/g, '');
    const cleaned = trimmed.replace('XBT', 'BTC');
    const noSlash = cleaned.replace('/', '');
    const [base, quote] = cleaned.includes('/') ? cleaned.split('/') : [cleaned.slice(0, -3), cleaned.slice(-3)];
    const baseNorm = base === 'BTC' ? 'XBT' : base;
    const krakenPair = `${baseNorm}${quote}`;
    return { krakenPair, display: `${baseNorm.replace('XBT', 'BTC')}/${quote}` };
}

function ensureFetchResponse(response: Response) {
    if (!response.ok) {
        throw new Error(`Kraken API error: HTTP ${response.status}`);
    }
}

function firstResult<T>(result?: Record<string, T>): T {
    if (!result) {
        throw new Error('Kraken API error: empty result');
    }
    const key = Object.keys(result)[0];
    if (!key) {
        throw new Error('Kraken API error: empty result');
    }
    return result[key];
}

function toNumber(value: unknown): number | undefined {
    const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : undefined;
    if (num === undefined || Number.isNaN(num)) {
        return undefined;
    }
    return num;
}

export async function fetchTicker(pair: string): Promise<KrakenTickerSnapshot> {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/Ticker?pair=${encodeURIComponent(krakenPair)}`;
    const response = await fetch(url, { method: 'GET' });
    ensureFetchResponse(response);
    const payload = (await response.json()) as {
        error?: string[];
        result?: Record<string, unknown>;
    };
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const ticker = firstResult(payload.result as Record<string, KrakenTickerRaw>);

    const ask = toNumber(ticker.a?.[0]);
    const bid = toNumber(ticker.b?.[0]);
    const last = toNumber(ticker.c?.[0]);
    const volume24h = toNumber(ticker.v?.[1]);
    const change24h = toNumber(ticker.p?.[1]);

    return {
        pair: display,
        last: last ?? 0,
        ask: ask ?? 0,
        bid: bid ?? 0,
        volume24h: volume24h ?? 0,
        change24h: change24h ?? 0,
        spread: ask !== undefined && bid !== undefined ? ask - bid : 0,
        timestamp: Date.now(),
    };
}

export async function fetchDepth(pair: string, count = 10): Promise<KrakenDepthSnapshot> {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/Depth?pair=${encodeURIComponent(krakenPair)}&count=${count}`;
    const response = await fetch(url, { method: 'GET' });
    ensureFetchResponse(response);
    const payload = (await response.json()) as {
        error?: string[];
        result?: Record<string, unknown>;
    };
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const depth = firstResult(payload.result as Record<string, unknown>) as {
        asks?: unknown[];
        bids?: unknown[];
    };
    const asks = Array.isArray(depth.asks)
        ? depth.asks.map((row) => {
              const entry = row as unknown[];
              return { price: toNumber(entry[0]) ?? 0, volume: toNumber(entry[1]) ?? 0 };
          })
        : [];
    const bids = Array.isArray(depth.bids)
        ? depth.bids.map((row) => {
              const entry = row as unknown[];
              return { price: toNumber(entry[0]) ?? 0, volume: toNumber(entry[1]) ?? 0 };
          })
        : [];

    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price;

    return {
        pair: display,
        bestAsk,
        bestBid,
        spread: bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : undefined,
        asks,
        bids,
    };
}

export function hasPrivateCreds(): KrakenCredentials | null {
    const key = process.env.KRAKEN_API_KEY;
    const secret = process.env.KRAKEN_API_SECRET;
    if (!key || !secret) return null;
    return { key, secret };
}

interface AddOrderParams {
    pair: string;
    type: 'buy' | 'sell';
    ordertype: 'market' | 'limit';
    volume: string;
    price?: string;
    validate?: boolean;
}

export async function validateAddOrder(params: AddOrderParams): Promise<Record<string, unknown>> {
    const creds = hasPrivateCreds();
    if (!creds) {
        throw new Error('Kraken private API credentials not configured.');
    }
    const body = new URLSearchParams({
        ...params,
        validate: 'true',
        nonce: Date.now().toString(),
    });
    return privatePost('/0/private/AddOrder', body, creds.secret, creds.key);
}

export async function validateCancelOrder(txid: string): Promise<Record<string, unknown>> {
    const creds = hasPrivateCreds();
    if (!creds) {
        throw new Error('Kraken private API credentials not configured.');
    }
    const body = new URLSearchParams({
        txid,
        validate: 'true',
        nonce: Date.now().toString(),
    });
    return privatePost('/0/private/CancelOrder', body, creds.secret, creds.key);
}

async function privatePost(
    path: string,
    body: URLSearchParams,
    secret: string,
    apiKey: string
): Promise<Record<string, unknown>> {
    const url = `${API_BASE}${path}`;
    const signature = signRequest(path, body, secret);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'API-Key': apiKey,
            'API-Sign': signature,
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body,
    });
    ensureFetchResponse(response);
    const payload = (await response.json()) as {
        error?: string[];
        result?: Record<string, unknown>;
    };
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    return payload.result ?? {};
}

function signRequest(path: string, body: URLSearchParams, secret: string): string {
    const secretBuffer = Buffer.from(secret, 'base64');
    const bodyString = body.toString();
    const hash = createHash('sha256');
    hash.update(body.get('nonce') ?? '');
    hash.update(bodyString);
    const digest = hash.digest();
    const hmac = createHmac('sha512', secretBuffer);
    hmac.update(path);
    hmac.update(digest);
    return hmac.digest('base64');
}
