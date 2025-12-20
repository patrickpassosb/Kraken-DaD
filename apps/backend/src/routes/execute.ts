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
    MarketDataSnapshot,
    OhlcSnapshot,
    SpreadSnapshot,
    AssetPairMetadata,
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
    fetchOHLC,
    fetchSpread,
    fetchAssetPairs,
    normalizePair,
    hasPrivateCreds,
    validateAddOrder,
    validateCancelOrder,
    placeOrder,
    cancelOrder,
} from '@kraken-dad/kraken-client';
import type { KrakenAssetPair } from '@kraken-dad/kraken-client';

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

function ohlcKey(pair: string, interval: number): string {
    return `${pairKey(pair)}::${interval}`;
}

const SUPPORTED_OHLC_INTERVALS = new Set([1, 5, 15, 30, 60, 240, 1440, 10080, 21600]);

function normalizeInterval(value: unknown): number {
    if (typeof value === 'number' && SUPPORTED_OHLC_INTERVALS.has(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && SUPPORTED_OHLC_INTERVALS.has(parsed)) {
            return parsed;
        }
    }
    return 1;
}

function normalizeCount(value: unknown, fallback: number, min: number, max: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.min(Math.max(Math.round(value), min), max);
    }
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) {
            return Math.min(Math.max(parsed, min), max);
        }
    }
    return fallback;
}

function parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function resolveAssetPairMetadata(
    pair: string,
    assetPairs: Record<string, KrakenAssetPair>
): AssetPairMetadata | null {
    const { krakenPair, display } = normalizePair(pair);
    const displayUpper = display.toUpperCase();
    const displayNoSlash = displayUpper.replace('/', '');
    const displayXbt = displayUpper.replace('BTC', 'XBT');
    const displayXbtNoSlash = displayXbt.replace('/', '');
    const candidates = new Set([
        krakenPair.toUpperCase(),
        displayUpper,
        displayNoSlash,
        displayXbt,
        displayXbtNoSlash,
    ]);

    const match = Object.entries(assetPairs).find(([key, value]) => {
        const alt = value.altname?.toUpperCase();
        const wsname = value.wsname?.toUpperCase();
        return (
            candidates.has(key.toUpperCase()) ||
            (alt && candidates.has(alt)) ||
            (wsname && candidates.has(wsname))
        );
    });

    if (!match) return null;

    const [, meta] = match;
    const [base, quote] = displayUpper.split('/');
    return {
        pair: displayUpper,
        base: base ?? '',
        quote: quote ?? '',
        status: meta.status,
        pairDecimals: meta.pair_decimals,
        lotDecimals: meta.lot_decimals,
        orderMin: parseNumber(meta.ordermin),
        costMin: parseNumber(meta.costmin),
        tickSize: parseNumber(meta.tick_size),
        timestamp: Date.now(),
    };
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

async function buildExecutionData(
    strategy: Strategy,
    fastify: FastifyInstance
): Promise<{
    marketData: Record<string, MarketDataSnapshot>;
    ohlcData: Record<string, OhlcSnapshot>;
    spreadData: Record<string, SpreadSnapshot>;
    assetPairData: Record<string, AssetPairMetadata>;
    warnings: ExecutionWarning[];
}> {
    const marketPairs = new Set<string>();
    const ohlcRequests = new Map<string, { pair: string; interval: number; count: number }>();
    const spreadRequests = new Map<string, { pair: string; count: number }>();
    const assetPairRequests = new Set<string>();

    for (const node of strategy.nodes) {
        if (node.type === 'data.kraken.ticker' || node.type === 'action.placeOrder' || node.type === 'risk.guard') {
            const pair = (node.config as { pair?: string }).pair ?? 'BTC/USD';
            marketPairs.add(pair);
        }
        if (node.type === 'data.kraken.ohlc') {
            const config = node.config as { pair?: string; interval?: unknown; count?: unknown };
            const pair = config.pair ?? 'BTC/USD';
            const interval = normalizeInterval(config.interval);
            const count = normalizeCount(config.count, 120, 1, 720);
            const key = ohlcKey(pair, interval);
            const existing = ohlcRequests.get(key);
            if (!existing || count > existing.count) {
                ohlcRequests.set(key, { pair, interval, count });
            }
        }
        if (node.type === 'data.kraken.spread') {
            const config = node.config as { pair?: string; count?: unknown };
            const pair = config.pair ?? 'BTC/USD';
            const count = normalizeCount(config.count, 50, 1, 500);
            const key = pairKey(pair);
            const existing = spreadRequests.get(key);
            if (!existing || count > existing.count) {
                spreadRequests.set(key, { pair, count });
            }
        }
        if (node.type === 'data.kraken.assetPairs') {
            const pair = (node.config as { pair?: string }).pair ?? 'BTC/USD';
            assetPairRequests.add(pair);
        }
    }

    if (marketPairs.size === 0) {
        marketPairs.add('BTC/USD');
    }

    const marketData: Record<string, MarketDataSnapshot> = {};
    const ohlcData: Record<string, OhlcSnapshot> = {};
    const spreadData: Record<string, SpreadSnapshot> = {};
    const assetPairData: Record<string, AssetPairMetadata> = {};
    const warnings: ExecutionWarning[] = [];

    const marketResults = Array.from(marketPairs).map(async (pair) => {
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

    const ohlcResults = Array.from(ohlcRequests.values()).map(async (request) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
            const snapshot = await fetchOHLC(request.pair, request.interval, { signal: controller.signal });
            ohlcData[ohlcKey(request.pair, request.interval)] = {
                ...snapshot,
                candles: snapshot.candles.slice(-request.count),
            };
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                fastify.log.warn({ err, pair: request.pair }, 'Failed to fetch Kraken OHLC');
            }
            warnings.push({
                code: 'OHLC_FALLBACK',
                message: `OHLC data unavailable for ${pairKey(request.pair)}; using dry-run fallback.`,
            });
        } finally {
            clearTimeout(timeout);
        }
    });

    const spreadResults = Array.from(spreadRequests.values()).map(async (request) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
            const snapshot = await fetchSpread(request.pair, { signal: controller.signal });
            spreadData[pairKey(request.pair)] = {
                ...snapshot,
                entries: snapshot.entries.slice(-request.count),
            };
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                fastify.log.warn({ err, pair: request.pair }, 'Failed to fetch Kraken spreads');
            }
            warnings.push({
                code: 'SPREAD_FALLBACK',
                message: `Spread data unavailable for ${pairKey(request.pair)}; using dry-run fallback.`,
            });
        } finally {
            clearTimeout(timeout);
        }
    });

    const assetPairResults = async () => {
        if (assetPairRequests.size === 0) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
            const pairs = await fetchAssetPairs({ signal: controller.signal });
            for (const pair of assetPairRequests) {
                const metadata = resolveAssetPairMetadata(pair, pairs);
                if (metadata) {
                    assetPairData[pairKey(pair)] = metadata;
                } else {
                    warnings.push({
                        code: 'ASSET_PAIR_NOT_FOUND',
                        message: `AssetPairs metadata not found for ${pairKey(pair)}.`,
                    });
                }
            }
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                fastify.log.warn({ err }, 'Failed to fetch Kraken asset pairs');
            }
            warnings.push({
                code: 'ASSET_PAIR_FALLBACK',
                message: 'AssetPairs metadata unavailable; using dry-run fallback.',
            });
        } finally {
            clearTimeout(timeout);
        }
    };

    await Promise.all([Promise.all(marketResults), Promise.all(ohlcResults), Promise.all(spreadResults), assetPairResults()]);

    return { marketData, ohlcData, spreadData, assetPairData, warnings };
}

async function runExecution(
    strategy: Strategy,
    fastify: FastifyInstance,
    mode: ExecutionMode,
    validate?: boolean,
    targetNodeId?: string
): Promise<ExecutionResult> {
    const {
        marketData,
        ohlcData,
        spreadData,
        assetPairData,
        warnings: marketWarnings,
    } = await buildExecutionData(strategy, fastify);

    const ctx: ExecutionContext = {
        mode,
        marketData,
        ohlcData,
        spreadData,
        assetPairData,
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
