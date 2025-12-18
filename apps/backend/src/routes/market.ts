import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchTicker, fetchDepth } from '@kraken-dad/kraken-client';

interface MarketQuery {
    pair?: string;
}

export async function marketRoute(fastify: FastifyInstance) {
    fastify.get(
        '/market/context',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        pair: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Querystring: MarketQuery }>, reply: FastifyReply) => {
            const pair = request.query.pair || 'BTC/USD';
            try {
                const [ticker, depth] = await Promise.all([fetchTicker(pair), fetchDepth(pair, 10)]);
                return reply.send({
                    pair: ticker.pair,
                    lastPrice: ticker.last,
                    ask: ticker.ask ?? depth.bestAsk ?? null,
                    bid: ticker.bid ?? depth.bestBid ?? null,
                    spread: ticker.spread ?? depth.spread ?? null,
                    change24h: ticker.change24h,
                    change24hPct: ticker.change24hPct,
                    volume24h: ticker.volume24h,
                    timestamp: ticker.timestamp,
                    source: 'kraken',
                });
            } catch (err) {
                fastify.log.warn({ err, pair }, 'Failed to fetch Kraken market context');
                return reply.status(502).send({
                    pair,
                    error: 'Unable to fetch Kraken market data right now.',
                });
            }
        }
    );
}
