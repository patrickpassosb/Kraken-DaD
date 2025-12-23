/**
 * Lightweight Kraken helpers for REST/WS market data plus private order intents.
 */
import { createHash, createHmac } from 'crypto';
import WebSocket from 'ws';
const API_BASE = 'https://api.kraken.com';
let runtimeCreds = null;
let lastNonce = 0;
/**
 * Generates a strictly increasing nonce so Kraken private endpoints accept sequential invocations.
 */
function nextNonce() {
    const now = Date.now();
    if (now <= lastNonce) {
        lastNonce += 1;
    }
    else {
        lastNonce = now;
    }
    return String(lastNonce);
}
/**
 * Stores runtime credentials (in-memory only). These override env credentials.
 */
export function setPrivateCreds(creds) {
    runtimeCreds = {
        key: creds.key.trim(),
        secret: creds.secret.trim(),
    };
}
/**
 * Clears runtime credentials; env-based creds remain available.
 */
export function clearPrivateCreds() {
    runtimeCreds = null;
}
/**
 * Indicates whether private creds are available and where they came from.
 */
export function getPrivateCredsStatus() {
    if (runtimeCreds) {
        return { configured: true, source: 'runtime' };
    }
    const key = process.env.KRAKEN_API_KEY;
    const secret = process.env.KRAKEN_API_SECRET;
    if (key && secret) {
        return { configured: true, source: 'env' };
    }
    return { configured: false, source: 'none' };
}
/**
 * Normalizes user-friendly pair strings into Kraken's format (e.g., BTC/USD -> XBTUSD)
 * while keeping a display variant for UI use.
 */
export function normalizePair(pair) {
    const trimmed = pair.trim().toUpperCase().replace(/\s+/g, '');
    const cleaned = trimmed.replace('XBT', 'BTC');
    const noSlash = cleaned.replace('/', '');
    const [base, quote] = cleaned.includes('/') ? cleaned.split('/') : [cleaned.slice(0, -3), cleaned.slice(-3)];
    const baseNorm = base === 'BTC' ? 'XBT' : base;
    const krakenPair = `${baseNorm}${quote}`;
    return { krakenPair, display: `${baseNorm.replace('XBT', 'BTC')}/${quote}` };
}
/**
 * Throws with the HTTP status when Kraken responds with a non-2xx code.
 */
function ensureFetchResponse(response) {
    if (!response.ok) {
        throw new Error(`Kraken API error: HTTP ${response.status}`);
    }
}
/**
 * Pulls the first bucket from Kraken REST replies (payloads are keyed by pair symbols).
 */
function firstResult(result) {
    if (!result) {
        throw new Error('Kraken API error: empty result');
    }
    const key = Object.keys(result)[0];
    if (!key) {
        throw new Error('Kraken API error: empty result');
    }
    return result[key];
}
/**
 * Converts string or numeric fields into finite numbers, returning undefined for invalid inputs.
 */
function toNumber(value) {
    const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : undefined;
    if (num === undefined || Number.isNaN(num)) {
        return undefined;
    }
    return num;
}
/**
 * Fetches the latest ticker snapshot for a pair via Kraken REST.
 */
export async function fetchTicker(pair, options = {}) {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/Ticker?pair=${encodeURIComponent(krakenPair)}`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const ticker = firstResult(payload.result);
    const ask = toNumber(ticker.a?.[0]);
    const bid = toNumber(ticker.b?.[0]);
    const last = toNumber(ticker.c?.[0]);
    const volume24h = toNumber(ticker.v?.[1]);
    const change24h = toNumber(ticker.p?.[1]);
    const openPrice = Array.isArray(ticker.o)
        ? toNumber(ticker.o[1] ?? ticker.o[0])
        : toNumber(ticker.o);
    // Kraken UI percent closely matches last vs 24h VWAP (p[1]); fall back to open if unavailable.
    const vwap24h = change24h;
    const change24hPct = vwap24h && last
        ? ((last - vwap24h) / vwap24h) * 100
        : openPrice && last
            ? ((last - openPrice) / openPrice) * 100
            : undefined;
    return {
        pair: display,
        last: last ?? 0,
        ask: ask ?? 0,
        bid: bid ?? 0,
        volume24h: volume24h ?? 0,
        change24h: change24h ?? 0,
        change24hPct,
        spread: ask !== undefined && bid !== undefined ? ask - bid : 0,
        timestamp: Date.now(),
    };
}
/**
 * Retrieves the Kraken assets catalog (symbols and display metadata).
 */
export async function fetchAssets(options = {}) {
    const url = `${API_BASE}/0/public/Assets`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    if (!payload.result) {
        throw new Error('Kraken API error: empty assets result');
    }
    return payload.result;
}
/**
 * Retrieves the Kraken AssetPairs catalog with precision/limits metadata.
 */
export async function fetchAssetPairs(options = {}) {
    const url = `${API_BASE}/0/public/AssetPairs`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    if (!payload.result) {
        throw new Error('Kraken API error: empty asset pairs result');
    }
    return payload.result;
}
/**
 * Fetches orderbook depth for a pair; used to derive bid/ask/spread when ticker lacks it.
 */
export async function fetchDepth(pair, count = 10, options = {}) {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/Depth?pair=${encodeURIComponent(krakenPair)}&count=${count}`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const depth = firstResult(payload.result);
    const asks = Array.isArray(depth.asks)
        ? depth.asks.map((row) => {
            const entry = row;
            return { price: toNumber(entry[0]) ?? 0, volume: toNumber(entry[1]) ?? 0 };
        })
        : [];
    const bids = Array.isArray(depth.bids)
        ? depth.bids.map((row) => {
            const entry = row;
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
/**
 * Fetches OHLC candles for a pair/interval. Returns timestamps in ms.
 */
export async function fetchOHLC(pair, interval = 1, options = {}) {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/OHLC?pair=${encodeURIComponent(krakenPair)}&interval=${interval}`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const result = payload.result ?? {};
    const resultKey = Object.keys(result).find((key) => key !== 'last');
    if (!resultKey) {
        throw new Error('Kraken API error: empty OHLC result');
    }
    const candlesRaw = result[resultKey];
    const lastRaw = typeof result.last === 'string' ? Number.parseInt(result.last, 10) : Number(result.last);
    const last = Number.isFinite(lastRaw) ? lastRaw : 0;
    const candles = Array.isArray(candlesRaw)
        ? candlesRaw.map((row) => {
            const entry = row;
            const time = toNumber(entry[0]) ?? 0;
            const open = toNumber(entry[1]) ?? 0;
            const high = toNumber(entry[2]) ?? 0;
            const low = toNumber(entry[3]) ?? 0;
            const close = toNumber(entry[4]) ?? 0;
            const vwap = toNumber(entry[5]) ?? 0;
            const volume = toNumber(entry[6]) ?? 0;
            const count = toNumber(entry[7]) ?? 0;
            return {
                time: time * 1000,
                open,
                high,
                low,
                close,
                vwap,
                volume,
                count,
            };
        })
        : [];
    return {
        pair: display,
        interval,
        candles,
        last,
        timestamp: Date.now(),
    };
}
/**
 * Fetches recent bid/ask spreads for a pair.
 */
export async function fetchSpread(pair, options = {}) {
    const { krakenPair, display } = normalizePair(pair);
    const url = `${API_BASE}/0/public/Spread?pair=${encodeURIComponent(krakenPair)}`;
    const response = await fetch(url, { method: 'GET', signal: options.signal });
    ensureFetchResponse(response);
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    const result = payload.result ?? {};
    const resultKey = Object.keys(result).find((key) => key !== 'last');
    if (!resultKey) {
        throw new Error('Kraken API error: empty spread result');
    }
    const spreadRaw = result[resultKey];
    const lastRaw = typeof result.last === 'string' ? Number.parseInt(result.last, 10) : Number(result.last);
    const last = Number.isFinite(lastRaw) ? lastRaw : 0;
    const entries = Array.isArray(spreadRaw)
        ? spreadRaw.map((row) => {
            const entry = row;
            const time = toNumber(entry[0]) ?? 0;
            const bid = toNumber(entry[1]) ?? 0;
            const ask = toNumber(entry[2]) ?? 0;
            return {
                time: time * 1000,
                bid,
                ask,
                spread: Number.isFinite(ask - bid) ? ask - bid : 0,
            };
        })
        : [];
    return {
        pair: display,
        entries,
        last,
        timestamp: Date.now(),
    };
}
/**
 * Returns available credentials (runtime or env) without throwing when missing.
 */
export function hasPrivateCreds() {
    if (runtimeCreds) {
        return runtimeCreds;
    }
    const key = process.env.KRAKEN_API_KEY;
    const secret = process.env.KRAKEN_API_SECRET;
    if (!key || !secret)
        return null;
    return { key, secret };
}
function getPrivateCreds() {
    const creds = hasPrivateCreds();
    if (!creds) {
        throw new Error('Kraken private API credentials not configured.');
    }
    return creds;
}
/**
 * Calls Kraken AddOrder with validate=true to check parameters without placing a trade.
 */
export async function validateAddOrder(params) {
    const creds = getPrivateCreds();
    const { krakenPair } = normalizePair(params.pair);
    const payload = {
        pair: krakenPair,
        type: params.type,
        ordertype: params.ordertype,
        volume: params.volume,
        validate: 'true',
        nonce: nextNonce(),
    };
    if (params.price !== undefined) {
        payload.price = params.price;
    }
    const body = new URLSearchParams(payload);
    return privatePost('/0/private/AddOrder', body, creds.secret, creds.key);
}
/**
 * Calls Kraken CancelOrder with validate=true for dry-run confirmation.
 */
export async function validateCancelOrder(txid) {
    const creds = getPrivateCreds();
    const body = new URLSearchParams({
        txid,
        validate: 'true',
        nonce: nextNonce(),
    });
    return privatePost('/0/private/CancelOrder', body, creds.secret, creds.key);
}
/**
 * Places a live Kraken order. Caller is responsible for ensuring intent safety.
 */
export async function placeOrder(params) {
    const creds = getPrivateCreds();
    const { krakenPair } = normalizePair(params.pair);
    const payload = {
        pair: krakenPair,
        type: params.type,
        ordertype: params.ordertype,
        volume: params.volume,
        nonce: nextNonce(),
    };
    if (params.price !== undefined) {
        payload.price = params.price;
    }
    const body = new URLSearchParams(payload);
    return privatePost('/0/private/AddOrder', body, creds.secret, creds.key);
}
/**
 * Cancels a Kraken order by transaction id.
 */
export async function cancelOrder(txid) {
    const creds = getPrivateCreds();
    const body = new URLSearchParams({
        txid,
        nonce: nextNonce(),
    });
    return privatePost('/0/private/CancelOrder', body, creds.secret, creds.key);
}
/**
 * Sends signed POST payload to Kraken private APIs and unwraps the JSON result.
 */
async function privatePost(path, body, secret, apiKey) {
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
    const payload = (await response.json());
    if (payload.error?.length) {
        throw new Error(`Kraken API error: ${payload.error.join(',')}`);
    }
    return payload.result ?? {};
}
/**
 * Builds Kraken's HMAC-SHA512 signature using the request path and hashed body.
 */
function signRequest(path, body, secret) {
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
/**
 * Fetches a single ticker tick over Kraken WS, with a short timeout fallback.
 */
export async function fetchTickerWsOnce(pair, timeoutMs = 3000) {
    const { krakenPair, display } = normalizePair(pair);
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://ws.kraken.com');
        const timer = setTimeout(() => {
            ws.close();
            reject(new Error('Kraken WS ticker timeout'));
        }, timeoutMs);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                event: 'subscribe',
                pair: [krakenPair],
                subscription: { name: 'ticker' },
            }));
        });
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                if (!Array.isArray(parsed))
                    return;
                const payload = parsed[1];
                if (!payload?.c)
                    return;
                const last = toNumber(payload.c[0]) ?? 0;
                const ask = toNumber(payload.a?.[0]);
                const bid = toNumber(payload.b?.[0]);
                const spread = ask !== undefined && bid !== undefined ? ask - bid : undefined;
                clearTimeout(timer);
                ws.close();
                resolve({
                    pair: display,
                    last,
                    ask: ask ?? 0,
                    bid: bid ?? 0,
                    spread: spread ?? 0,
                    volume24h: 0,
                    change24h: 0,
                    timestamp: Date.now(),
                });
            }
            catch (err) {
                // ignore parse errors
            }
        });
        ws.on('error', (err) => {
            clearTimeout(timer);
            ws.close();
            reject(err);
        });
    });
}
