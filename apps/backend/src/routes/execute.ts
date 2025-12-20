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
    ExecutionMode,
} from '../../../../packages/strategy-core/schema.ts';
import {
    executeDryRun,
    ExecutionResult,
    ExecutionWarning,
    LiveActionResult,
} from '../../../../packages/strategy-core/executor/dryRunExecutor.ts';
import {
    fetchTicker,
    fetchDepth,
    fetchTickerWsOnce,
    hasPrivateCreds,
    validateAddOrder,
    validateCancelOrder,
    placeOrder,
    cancelOrder,
} from '@kraken-dad/kraken-client';

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

interface ExecuteRequestBody {
    strategy: Strategy;
    validate?: boolean;
    mode?: ExecutionMode;
    targetNodeId?: string;
}

interface ErrorResponseBody {
    error: string;
}

// =============================================================================
// ROUTE PLUGIN
// =============================================================================

export async function executeRoute(fastify: FastifyInstance) {
    /**
     * POST /execute
     *
     * Execute a strategy in dry-run or live mode.
     */
    fastify.post<{ Body: ExecuteRequestBody }>(
        '/execute',
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
                        mode: { type: 'string', enum: ['dry-run', 'live'] },
                        targetNodeId: { type: 'string' },
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
                            liveActions: { type: 'array' },
                        },
                    },
                    400: {
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: ExecuteRequestBody }>, reply: FastifyReply) => {
            const { strategy, validate } = request.body;
            const mode: ExecutionMode = request.body.mode ?? 'dry-run';
            const targetNodeId = request.body.targetNodeId;

            try {
                const result = await runExecution(strategy, fastify, mode, validate, targetNodeId);
                return reply.status(200).send(result);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Execution failed';
                return reply.status(400).send({ error: message } satisfies ErrorResponseBody);
            }
        }
    );

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
                        targetNodeId: { type: 'string' },
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
                            liveActions: { type: 'array' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: ExecuteRequestBody }>, reply: FastifyReply) => {
            const { strategy, validate } = request.body;
            const targetNodeId = request.body.targetNodeId;
            const result = await runExecution(strategy, fastify, 'dry-run', validate, targetNodeId);
            return reply.status(200).send(result);
        }
    );
}

function pairKey(pair: string): string {
    return pair.trim().toUpperCase();
}

function normalizeOrderType(value: unknown): 'market' | 'limit' {
    return value === 'limit' ? 'limit' : 'market';
}

function normalizeSide(value: unknown): 'buy' | 'sell' {
    return value === 'sell' ? 'sell' : 'buy';
}

function normalizePrice(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function resolveOrderParams(params: Record<string, unknown>): {
    order?: { pair: string; type: 'buy' | 'sell'; ordertype: 'market' | 'limit'; volume: string; price?: string };
    error?: string;
} {
    const pair = (params.pair as string) ?? 'BTC/USD';
    const side = normalizeSide(params.side);
    const rawType = normalizeOrderType(params.type);
    const volume = String(params.amount ?? 0.1);
    const priceValue = normalizePrice(params.price);
    const hasLimitReference = priceValue !== undefined;
    const ordertype: 'market' | 'limit' = hasLimitReference ? 'limit' : rawType;

    if (ordertype === 'limit' && !hasLimitReference) {
        return { error: 'Limit orders require a price.' };
    }

    return {
        order: {
            pair,
            type: side,
            ordertype,
            volume,
            ...(ordertype === 'limit' && hasLimitReference && { price: String(priceValue) }),
        },
    };
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

    const pairResults = Array.from(pairs).map(async (pair) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const fallback = MARKET_FALLBACKS[pairKey(pair)] ?? { last: 42000, spread: 2.5 };

        try {
            const [wsTicker, restResults] = await Promise.allSettled([
                fetchTickerWsOnce(pair, 2500),
                Promise.allSettled([
                    fetchTicker(pair, { signal: controller.signal }),
                    fetchDepth(pair, 10, { signal: controller.signal }),
                ]),
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
                return;
            }

            marketData[pairKey(pair)] = {
                pair: pairKey(pair),
                ...fallback,
                timestamp: Date.now(),
            };
            warnings.push({
                code: 'MARKET_DATA_FALLBACK',
                message: `Using fallback market data for ${pairKey(pair)}; live fetch failed.`,
            });
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                fastify.log.warn({ err, pair }, 'Failed to fetch Kraken market data');
            }
            marketData[pairKey(pair)] = {
                pair: pairKey(pair),
                ...fallback,
                timestamp: Date.now(),
            };
            warnings.push({
                code: 'MARKET_DATA_FALLBACK',
                message: `Error fetching ${pairKey(pair)} market data; using fallback snapshot.`,
            });
        } finally {
            clearTimeout(timeout);
        }
    });

    await Promise.all(pairResults);

    return { marketData, warnings };
}

async function runExecution(
    strategy: Strategy,
    fastify: FastifyInstance,
    mode: ExecutionMode,
    validate?: boolean,
    targetNodeId?: string
): Promise<ExecutionResult> {
    const { marketData, warnings: marketWarnings } = await buildMarketData(strategy, fastify);

    const ctx: ExecutionContext = {
        mode,
        marketData,
        targetNodeId,
    };

    let result: ExecutionResult = executeDryRun(strategy, ctx);
    result.warnings.push(...marketWarnings);

    if (mode === 'dry-run' && validate) {
        await applyKrakenValidation(result, fastify);
        if (result.errors.length > 0) {
            result = { ...result, success: false };
        }
    }

    if (mode === 'live') {
        return applyKrakenLive(result, fastify);
    }

    return result;
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
                const resolved = resolveOrderParams(params);
                if (!resolved.order) {
                    const detail = resolved.error ?? 'Invalid order parameters.';
                    validations.push({
                        nodeId: intent.nodeId,
                        action: intent.intent.action,
                        status: 'error',
                        detail,
                    });
                    result.errors.push({
                        code: 'ORDER_PRICE_REQUIRED',
                        message: detail,
                        nodeId: intent.nodeId,
                    });
                    continue;
                }
                const validateResp = await validateAddOrder(resolved.order);
                validations.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: 'Kraken validate=true accepted',
                    response: validateResp,
                });
            } else if (intent.intent.action === 'CANCEL_ORDER') {
                const txid = (intent.intent.params.orderId as string) ?? '';
                const validateResp = await validateCancelOrder(txid);
                validations.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: 'Kraken validate=true accepted',
                    response: validateResp,
                });
            }
        } catch (err) {
            validations.push({
                nodeId: intent.nodeId,
                action: intent.intent.action,
                status: 'error',
                detail: err instanceof Error ? err.message : 'Unknown validation error',
            });
            fastify.log.warn({ err, intent }, 'Kraken validation failed');
        }
    }

    result.krakenValidations = validations;
}

async function applyKrakenLive(result: ExecutionResult, fastify: FastifyInstance): Promise<ExecutionResult> {
    const creds = hasPrivateCreds();
    if (!creds) {
        const errors = [
            ...result.errors,
            {
                code: 'LIVE_CREDENTIALS_MISSING',
                message: 'Kraken API credentials are required for live mode.',
            },
        ];
        return {
            ...result,
            errors,
            success: false,
            liveActions: [],
        };
    }

    if (result.errors.length > 0) {
        return {
            ...result,
            success: false,
            liveActions: [],
        };
    }

    const liveActions: LiveActionResult[] = [];
    const errors = [...result.errors];

    for (const intent of result.actionIntents) {
        try {
            if (intent.intent.action === 'PLACE_ORDER') {
                const params = intent.intent.params;
                const resolved = resolveOrderParams(params);
                if (!resolved.order) {
                    const detail = resolved.error ?? 'Invalid order parameters.';
                    liveActions.push({
                        nodeId: intent.nodeId,
                        action: intent.intent.action,
                        status: 'error',
                        detail,
                    });
                    errors.push({
                        code: 'LIVE_ORDER_INVALID',
                        message: detail,
                        nodeId: intent.nodeId,
                    });
                    continue;
                }
                const response = await placeOrder(resolved.order);
                liveActions.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: 'Kraken order placed',
                    response,
                });
            } else if (intent.intent.action === 'CANCEL_ORDER') {
                const txid = (intent.intent.params.orderId as string) ?? '';
                const response = await cancelOrder(txid);
                liveActions.push({
                    nodeId: intent.nodeId,
                    action: intent.intent.action,
                    status: 'ok',
                    detail: 'Kraken order cancelled',
                    response,
                });
            }
        } catch (err) {
            const detail = err instanceof Error ? err.message : 'Unknown Kraken error';
            liveActions.push({
                nodeId: intent.nodeId,
                action: intent.intent.action,
                status: 'error',
                detail,
            });
            errors.push({
                code: 'LIVE_ORDER_FAILED',
                message: `Kraken live order failed: ${detail}`,
                nodeId: intent.nodeId,
            });
            fastify.log.warn({ err, intent }, 'Kraken live order failed');
        }
    }

    return {
        ...result,
        errors,
        success: errors.length === 0,
        liveActions,
    };
}
