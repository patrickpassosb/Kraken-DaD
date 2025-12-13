/**
 * Kraken DaD - Execute Routes
 *
 * Exposes dry-run execution endpoint.
 *
 * @module backend/routes/execute
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    Strategy,
    ExecutionContext,
} from '../../../../packages/strategy-core/schema.ts';
import {
    executeDryRun,
    ExecutionResult,
} from '../../../../packages/strategy-core/executor/dryRunExecutor.ts';
import {
    fetchTicker,
    fetchDepth,
} from '../../../../packages/kraken-client/index.ts';

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

interface ExecuteRequestBody {
    strategy: Strategy;
}

// =============================================================================
// ROUTE PLUGIN
// =============================================================================

export async function executeRoute(fastify: FastifyInstance) {
    /**
     * POST /execute/dry-run
     *
     * Execute a strategy in dry-run mode.
     * No side effects, no API calls, deterministic behavior.
     */
    fastify.post<{ Body: ExecuteRequestBody }>(
        '/execute/dry-run',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['strategy'],
                    properties: {
                        strategy: {
                            type: 'object',
                            required: ['version', 'metadata', 'nodes', 'edges'],
                            properties: {
                                version: { type: 'number' },
                                metadata: {
                                    type: 'object',
                                    required: ['name', 'createdAt', 'updatedAt'],
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        createdAt: { type: 'string' },
                                        updatedAt: { type: 'string' },
                                        author: { type: 'string' },
                                        tags: { type: 'array', items: { type: 'string' } },
                                    },
                                },
                                nodes: { type: 'array' },
                                edges: { type: 'array' },
                            },
                        },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            mode: { type: 'string' },
                            startedAt: { type: 'string' },
                            completedAt: { type: 'string' },
                            nodesExecuted: { type: 'number' },
                            log: { type: 'array' },
                            errors: { type: 'array' },
                            warnings: { type: 'array' },
                            actionIntents: { type: 'array' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: ExecuteRequestBody }>, reply: FastifyReply) => {
            const { strategy } = request.body;

            const marketData = await buildMarketData(strategy, fastify);

            // Create execution context for dry-run mode
            const ctx: ExecutionContext = {
                mode: 'dry-run',
                marketData,
            };

            // Execute strategy
            const result: ExecutionResult = executeDryRun(strategy, ctx);

            return reply.status(200).send(result);
        }
    );
}

function pairKey(pair: string): string {
    return pair.trim().toUpperCase();
}

async function buildMarketData(
    strategy: Strategy,
    fastify: FastifyInstance
): Promise<Record<string, { pair: string; last: number; ask?: number; bid?: number; spread?: number }>> {
    const pairs = new Set<string>();
    for (const node of strategy.nodes) {
        if (node.type === 'data.kraken.ticker' || node.type === 'action.placeOrder') {
            const pair = (node.config as { pair?: string }).pair;
            if (pair) {
                pairs.add(pair);
            }
        }
    }
    if (pairs.size === 0) {
        pairs.add('BTC/USD');
    }

    const marketData: Record<string, { pair: string; last: number; ask?: number; bid?: number; spread?: number }> = {};

    for (const pair of pairs) {
        try {
            const [ticker, depth] = await Promise.allSettled([fetchTicker(pair), fetchDepth(pair, 10)]);
            if (ticker.status === 'fulfilled') {
                marketData[pairKey(pair)] = {
                    pair: ticker.value.pair,
                    last: ticker.value.last,
                    ask:
                        ticker.value.ask ??
                        (depth.status === 'fulfilled' ? depth.value.bestAsk : undefined),
                    bid:
                        ticker.value.bid ??
                        (depth.status === 'fulfilled' ? depth.value.bestBid : undefined),
                    spread:
                        ticker.value.spread ??
                        (depth.status === 'fulfilled' ? depth.value.spread : undefined),
                };
            }
        } catch (err) {
            fastify.log.warn({ err, pair }, 'Failed to fetch Kraken market data');
        }
    }

    return marketData;
}
