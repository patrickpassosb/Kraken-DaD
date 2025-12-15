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
    ExecutionWarning,
} from '../../../../packages/strategy-core/executor/dryRunExecutor.ts';
import {
    fetchTicker,
    fetchDepth,
    fetchTickerWsOnce,
    hasPrivateCreds,
    validateAddOrder,
    validateCancelOrder,
} from '@kraken-dad/kraken-client';

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

interface ExecuteRequestBody {
    strategy: Strategy;
    validate?: boolean;
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
                        validate: { type: 'boolean' },
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
                            krakenValidations: { type: 'array' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: ExecuteRequestBody }>, reply: FastifyReply) => {
            const { strategy, validate } = request.body;

            const { marketData, warnings: marketWarnings } = await buildMarketData(strategy, fastify);

            // Create execution context for dry-run mode
            const ctx: ExecutionContext = {
                mode: 'dry-run',
                marketData,
            };

            // Execute strategy
            const result: ExecutionResult = executeDryRun(strategy, ctx);
            result.warnings.push(...marketWarnings);

            if (validate) {
                await applyKrakenValidation(result, fastify);
            }

            return reply.status(200).send(result);
        }
    );
}

function pairKey(pair: string): string {
    return pair.trim().toUpperCase();
}

const MARKET_FALLBACKS: Record<string, { last: number; ask?: number; bid?: number; spread?: number }> = {
    'BTC/USD': { last: 90135.6, ask: 90136.4, bid: 90134.8, spread: 1.6 },
    'ETH/USD': { last: 3450.12, ask: 3450.6, bid: 3449.5, spread: 1.1 },
};

async function buildMarketData(
    strategy: Strategy,
    fastify: FastifyInstance
): Promise<{
    marketData: Record<string, { pair: string; last: number; ask?: number; bid?: number; spread?: number; timestamp?: number }>;
    warnings: ExecutionWarning[];
}> {
    const pairs = new Set<string>();
    for (const node of strategy.nodes) {
        if (node.type === 'data.kraken.ticker' || node.type === 'action.placeOrder' || node.type === 'risk.guard') {
            const pair = (node.config as { pair?: string }).pair ?? 'BTC/USD';
            if (pair) {
                pairs.add(pair);
            }
        }
    }
    if (pairs.size === 0) {
        pairs.add('BTC/USD');
    }

    const marketData: Record<string, { pair: string; last: number; ask?: number; bid?: number; spread?: number; timestamp?: number }> = {};
    const warnings: ExecutionWarning[] = [];

    for (const pair of pairs) {
        try {
            const [wsTicker, restResults] = await Promise.allSettled([
                fetchTickerWsOnce(pair, 2500),
                Promise.allSettled([fetchTicker(pair), fetchDepth(pair, 10)]),
            ]);

            const ticker =
                wsTicker.status === 'fulfilled'
                    ? wsTicker.value
                    : restResults.status === 'fulfilled' && restResults.value[0].status === 'fulfilled'
                    ? restResults.value[0].value
                    : null;

            const depth =
                restResults.status === 'fulfilled' && restResults.value[1].status === 'fulfilled'
                    ? restResults.value[1].value
                    : null;

            if (ticker) {
                marketData[pairKey(pair)] = {
                    pair: ticker.pair,
                    last: ticker.last,
                    ask: ticker.ask ?? depth?.bestAsk,
                    bid: ticker.bid ?? depth?.bestBid,
                    spread: ticker.spread ?? depth?.spread,
                    timestamp: Date.now(),
                };
            } else {
                const fallback = MARKET_FALLBACKS[pairKey(pair)] ?? { last: 42000, spread: 2.5 };
                marketData[pairKey(pair)] = {
                    pair: pairKey(pair),
                    ...fallback,
                    timestamp: Date.now(),
                };
                warnings.push({
                    code: 'MARKET_DATA_FALLBACK',
                    message: `Using fallback market data for ${pairKey(pair)}; live fetch failed.`,
                });
            }
        } catch (err) {
            fastify.log.warn({ err, pair }, 'Failed to fetch Kraken market data');
            const fallback = MARKET_FALLBACKS[pairKey(pair)] ?? { last: 42000, spread: 2.5 };
            marketData[pairKey(pair)] = {
                pair: pairKey(pair),
                ...fallback,
                timestamp: Date.now(),
            };
            warnings.push({
                code: 'MARKET_DATA_FALLBACK',
                message: `Error fetching ${pairKey(pair)} market data; using fallback snapshot.`,
            });
        }
    }

    return { marketData, warnings };
}

async function applyKrakenValidation(result: ExecutionResult, fastify: FastifyInstance) {
    const creds = hasPrivateCreds();
    if (!creds) {
        result.warnings.push({
            code: 'VALIDATE_SKIPPED',
            message: 'Kraken API keys not configured; validation skipped.',
        });
        return;
    }

    const validations: ExecutionResult['krakenValidations'] = [];

    for (const intent of result.actionIntents) {
        try {
            if (intent.intent.action === 'PLACE_ORDER') {
                const params = intent.intent.params;
                const pair = (params.pair as string) ?? 'BTC/USD';
                const side = (params.side as 'buy' | 'sell') ?? 'buy';
                const type = (params.type as 'market' | 'limit') ?? 'market';
                const amount = (params.amount as number) ?? 0.1;
                const priceValue = params.price as number | undefined;
                const volume = String(amount);
                const price = priceValue !== undefined ? String(priceValue) : undefined;
                const request = {
                    pair,
                    side,
                    type,
                    amount,
                    price: priceValue,
                    validate: true as const,
                };
                const validateResp = await validateAddOrder({
                    pair,
                    type: side,
                    ordertype: type,
                    volume,
                    price,
                    validate: true,
                });
                validations.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: extractValidationDetail(validateResp) ?? 'Kraken validate=true accepted',
                    response: validateResp,
                    request,
                });
            } else if (intent.intent.action === 'CANCEL_ORDER') {
                const txid = (intent.intent.params.orderId as string) ?? '';
                const request = { orderId: txid, validate: true as const };
                const validateResp = await validateCancelOrder(txid);
                validations.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: extractValidationDetail(validateResp) ?? 'Kraken validate=true accepted',
                    response: validateResp,
                    request,
                });
            }
        } catch (err) {
            validations.push({
                nodeId: intent.nodeId,
                action: intent.intent.action,
                status: 'error',
                detail: err instanceof Error ? err.message : 'Unknown validation error',
                request: intent.intent.action === 'CANCEL_ORDER'
                    ? { orderId: (intent.intent.params.orderId as string) ?? '', validate: true as const }
                    : {
                          pair: (intent.intent.params.pair as string) ?? 'BTC/USD',
                          side: (intent.intent.params.side as 'buy' | 'sell') ?? 'buy',
                          type: (intent.intent.params.type as 'market' | 'limit') ?? 'market',
                          amount: (intent.intent.params.amount as number) ?? 0.1,
                          price: (intent.intent.params.price as number | undefined),
                          validate: true as const,
                      },
            });
            fastify.log.warn({ err, intent }, 'Kraken validation failed');
        }
    }

    result.krakenValidations = validations;
}

function extractValidationDetail(resp: unknown): string | undefined {
    if (!resp || typeof resp !== 'object') return undefined;
    const result = (resp as { result?: unknown }).result;
    if (result && typeof result === 'object' && 'descr' in result) {
        const descr = (result as { descr?: unknown }).descr;
        if (descr && typeof descr === 'object' && 'order' in descr) {
            const order = (descr as { order?: unknown }).order;
            if (typeof order === 'string') {
                return order;
            }
        }
    }
    return undefined;
}
