import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import WebSocket from 'ws';
import { fetchTicker, fetchDepth, normalizePair } from '@kraken-dad/kraken-client';

type TickerSnapshot = {
    pair: string;
    last: number;
    ask?: number;
    bid?: number;
    spread?: number;
    timestamp: number;
    source: 'kraken-ws' | 'kraken-rest' | 'fallback';
};

type StreamState = {
    socket?: WebSocket;
    reconnectTimer?: NodeJS.Timeout;
    lastSnapshot?: TickerSnapshot;
};

const MARKET_FALLBACKS: Record<string, { last: number; ask?: number; bid?: number; spread?: number }> = {
    'BTC/USD': { last: 90135.6, ask: 90136.4, bid: 90134.8, spread: 1.6 },
    'ETH/USD': { last: 3450.12, ask: 3450.6, bid: 3449.5, spread: 1.1 },
};

const streams = new Map<string, StreamState>();

function pairKey(pair: string): string {
    return pair.trim().toUpperCase();
}

function fallbackSnapshot(pair: string): TickerSnapshot {
    const key = pairKey(pair);
    const fallback = MARKET_FALLBACKS[key] ?? { last: 42000, spread: 2.5 };
    return {
        pair: key,
        last: fallback.last,
        ask: fallback.ask,
        bid: fallback.bid,
        spread: fallback.spread,
        timestamp: Date.now(),
        source: 'fallback',
    };
}

function setSnapshot(pair: string, snapshot: TickerSnapshot) {
    const key = pairKey(pair);
    const current = streams.get(key) ?? {};
    streams.set(key, { ...current, lastSnapshot: snapshot });
}

function getSnapshot(pair: string): TickerSnapshot {
    const key = pairKey(pair);
    const state = streams.get(key);
    if (state?.lastSnapshot) return state.lastSnapshot;
    return fallbackSnapshot(key);
}

function scheduleReconnect(pair: string, delayMs: number, log: FastifyInstance['log']) {
    const key = pairKey(pair);
    const state = streams.get(key) ?? {};
    if (state.reconnectTimer) return; // already scheduled
    state.reconnectTimer = setTimeout(() => {
        state.reconnectTimer = undefined;
        startWs(pair, log);
    }, delayMs);
    streams.set(key, state);
}

async function seedFromRest(pair: string, log: FastifyInstance['log']) {
    try {
        const [ticker, depth] = await Promise.all([fetchTicker(pair), fetchDepth(pair, 10)]);
        setSnapshot(pair, {
            pair: ticker.pair,
            last: ticker.last,
            ask: ticker.ask ?? depth.bestAsk,
            bid: ticker.bid ?? depth.bestBid,
            spread: ticker.spread ?? depth.spread,
            timestamp: ticker.timestamp,
            source: 'kraken-rest',
        });
    } catch (err) {
        log.warn({ err, pair }, 'REST seed failed, using fallback');
        setSnapshot(pair, fallbackSnapshot(pair));
    }
}

function startWs(pair: string, log: FastifyInstance['log']) {
    const key = pairKey(pair);
    const existing = streams.get(key);
    if (existing?.socket && existing.socket.readyState === WebSocket.OPEN) {
        return;
    }

    const { krakenPair, display } = normalizePair(pair);
    const socket = new WebSocket('wss://ws.kraken.com');
    const state: StreamState = { socket, lastSnapshot: existing?.lastSnapshot };
    streams.set(key, state);

    socket.on('open', () => {
        socket.send(
            JSON.stringify({
                event: 'subscribe',
                pair: [krakenPair],
                subscription: { name: 'ticker' },
            })
        );
    });

    socket.on('message', (data: WebSocket.RawData) => {
        try {
            const parsed = JSON.parse(data.toString());
            if (!Array.isArray(parsed)) return;
            const payload = parsed[1];
            if (!payload?.c) return;
            const last = parseFloat(payload.c?.[0] ?? '0');
            const ask = payload.a?.[0] ? parseFloat(payload.a[0]) : undefined;
            const bid = payload.b?.[0] ? parseFloat(payload.b[0]) : undefined;
            const spread = ask !== undefined && bid !== undefined ? ask - bid : undefined;
            setSnapshot(key, {
                pair: display,
                last: Number.isFinite(last) ? last : 0,
                ask: Number.isFinite(ask ?? NaN) ? ask : undefined,
                bid: Number.isFinite(bid ?? NaN) ? bid : undefined,
                spread: Number.isFinite(spread ?? NaN) ? spread : undefined,
                timestamp: Date.now(),
                source: 'kraken-ws',
            });
        } catch (err) {
            // ignore parse errors
        }
    });

    socket.on('close', () => {
        scheduleReconnect(key, 2000, log);
    });

    socket.on('error', (err) => {
        log.warn({ err, pair: key }, 'Kraken WS error');
        socket.close();
    });
}

interface StreamQuery {
    pair?: string;
    retry?: string;
}

export async function marketStreamRoute(fastify: FastifyInstance) {
    fastify.get(
        '/market/stream',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        pair: { type: 'string' },
                        retry: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Querystring: StreamQuery }>, reply: FastifyReply) => {
            const pair = request.query.pair ?? 'BTC/USD';
            const retryMs = parseInt(request.query.retry ?? '2000', 10);

            // Seed cache from REST so clients get immediate data even before WS ticks
            await seedFromRest(pair, fastify.log);
            startWs(pair, fastify.log);

            // Ensure CORS even when using raw writeHead for SSE
            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            });
            reply.hijack(); // take ownership so Fastify does not auto-end the stream
            reply.raw.write(`retry: ${retryMs}\n\n`);

            let lastSentTs = 0;
            const interval = setInterval(() => {
                const snapshot = getSnapshot(pair);
                if (!snapshot) return;
                if (snapshot.timestamp <= lastSentTs) return;
                lastSentTs = snapshot.timestamp;
                reply.raw.write(`event: ticker\ndata:${JSON.stringify(snapshot)}\n\n`);
            }, 250);

            request.raw.on('close', () => {
                clearInterval(interval);
            });
        }
    );
}
