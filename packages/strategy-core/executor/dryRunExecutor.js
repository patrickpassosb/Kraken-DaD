/**
 * Kraken DaD - Dry-Run Execution Engine
 *
 * Executes strategies in dry-run mode following the execution lifecycle.
 * No side effects, no API calls, deterministic behavior.
 *
 * @module strategy-core/executor/dryRunExecutor
 */
import { SCHEMA_VERSION, } from '../schema.js';
// =============================================================================
// BLOCK REGISTRY
// =============================================================================
const blockDefinitions = new Map();
const blockHandlers = new Map();
function pairKey(pair) {
    return pair.trim().toUpperCase();
}
function ohlcKey(pair, interval) {
    return `${pairKey(pair)}::${interval}`;
}
const SUPPORTED_OHLC_INTERVALS = new Set([1, 5, 15, 30, 60, 240, 1440, 10080, 21600]);
function normalizeInterval(value) {
    if (typeof value === 'number' && SUPPORTED_OHLC_INTERVALS.has(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && SUPPORTED_OHLC_INTERVALS.has(parsed)) {
            return parsed;
        }
    }
    return 1;
}
function normalizeCount(value, fallback, min, max) {
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
function normalizeOrderType(value) {
    return value === 'limit' ? 'limit' : 'market';
}
function normalizePrice(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
function extractSeriesValues(raw) {
    if (!Array.isArray(raw))
        return [];
    const values = [];
    for (const entry of raw) {
        const resolved = typeof entry === 'number'
            ? entry
            : typeof entry === 'string'
                ? Number.parseFloat(entry)
                : typeof entry === 'object' && entry !== null
                    ? normalizePrice(entry.close ?? entry.value)
                    : undefined;
        if (!Number.isFinite(resolved ?? NaN)) {
            throw new Error('Moving Average requires a numeric series');
        }
        values.push(resolved);
    }
    return values;
}
/**
 * Computes a simple moving average for each index in the series.
 */
function computeSma(series, period) {
    const result = [];
    let sum = 0;
    for (let i = 0; i < series.length; i += 1) {
        sum += series[i];
        if (i >= period) {
            sum -= series[i - period];
        }
        const windowSize = Math.min(i + 1, period);
        result.push(sum / windowSize);
    }
    return result;
}
/**
 * Computes an exponential moving average for each index in the series.
 */
function computeEma(series, period) {
    if (series.length === 0)
        return [];
    const alpha = 2 / (period + 1);
    const result = [];
    let prev = series[0];
    result.push(prev);
    for (let i = 1; i < series.length; i += 1) {
        prev = alpha * series[i] + (1 - alpha) * prev;
        result.push(prev);
    }
    return result;
}
/**
 * Derives summary statistics from a spread series for guard blocks.
 */
function computeSpreadStats(series) {
    if (series.length === 0) {
        return { latest: 0, average: 0, min: 0, max: 0, median: 0 };
    }
    const latest = series[series.length - 1];
    let sum = 0;
    let min = series[0];
    let max = series[0];
    for (const value of series) {
        sum += value;
        if (value < min)
            min = value;
        if (value > max)
            max = value;
    }
    const sorted = [...series].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    return { latest, average: sum / series.length, min, max, median };
}
/**
 * Reads market price from context, falling back to a deterministic mock.
 */
function resolveMarketPrice(pair, ctx, fallback) {
    const market = ctx.marketData?.[pairKey(pair)];
    return market?.last ?? fallback;
}
function buildMockOhlcCandles(basePrice, count, interval) {
    const candles = [];
    const stepMs = interval * 60_000;
    const start = Date.now() - (count - 1) * stepMs;
    for (let i = 0; i < count; i += 1) {
        const drift = i * 0.35;
        const open = basePrice + drift;
        const close = open + (i % 2 === 0 ? 0.25 : -0.15);
        const high = Math.max(open, close) + 0.4;
        const low = Math.min(open, close) - 0.4;
        candles.push({
            time: start + i * stepMs,
            open,
            high,
            low,
            close,
            vwap: (open + close) / 2,
            volume: 0.5 + i * 0.01,
            count: 10 + i,
        });
    }
    return candles;
}
function buildMockSpreadEntries(basePrice, spread, count) {
    const entries = [];
    const start = Date.now() - (count - 1) * 1000;
    for (let i = 0; i < count; i += 1) {
        entries.push({
            time: start + i * 1000,
            bid: basePrice,
            ask: basePrice + spread,
            spread,
        });
    }
    return entries;
}
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function parseTimeToMinutes(value, fallback) {
    if (typeof value !== 'string')
        return fallback;
    const trimmed = value.trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    if (!match)
        return fallback;
    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
        return fallback;
    }
    return hours * 60 + minutes;
}
function resolveAllowedDays(value) {
    if (!Array.isArray(value)) {
        return [0, 1, 2, 3, 4, 5, 6];
    }
    if (value.length === 0) {
        return [];
    }
    const allowed = new Set();
    for (const entry of value) {
        if (typeof entry === 'number' && entry >= 0 && entry <= 6) {
            allowed.add(entry);
            continue;
        }
        if (typeof entry === 'string') {
            const normalized = entry.trim().slice(0, 3).toLowerCase();
            const index = DAY_LABELS.findIndex((label) => label.toLowerCase() === normalized);
            if (index >= 0) {
                allowed.add(index);
            }
        }
    }
    if (allowed.size === 0) {
        return [];
    }
    return Array.from(allowed.values()).sort((a, b) => a - b);
}
function nextAllowedAt(now, allowedDays, startMinutes) {
    if (allowedDays.length === 0)
        return null;
    const nowDay = now.getUTCDay();
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    for (let offset = 0; offset <= 7; offset += 1) {
        const candidateDay = (nowDay + offset) % 7;
        if (!allowedDays.includes(candidateDay)) {
            continue;
        }
        const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 0, 0, 0));
        const candidate = new Date(base.getTime() + startMinutes * 60_000);
        if (offset === 0 && startMinutes <= nowMinutes) {
            continue;
        }
        return candidate;
    }
    return null;
}
function isNodeDisabled(node) {
    const config = node.config;
    return Boolean(config?.disabled);
}
/**
 * control.start - Entry point for control flow
 */
blockDefinitions.set('control.start', {
    type: 'control.start',
    category: 'control',
    name: 'Start',
    description: 'Entry point for control flow execution',
    inputs: [],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
    ],
});
blockHandlers.set('control.start', (_node, _inputs, _ctx) => {
    return { outputs: { out: true } };
});
/**
 * data.constant - Returns a static value from config
 */
blockDefinitions.set('data.constant', {
    type: 'data.constant',
    category: 'data',
    name: 'Constant',
    description: 'Outputs a constant value from configuration',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'value', label: 'Value', dataType: 'any', required: true },
    ],
});
blockHandlers.set('data.constant', (node, _inputs, _ctx) => {
    const value = node.config.value ?? null;
    return { outputs: { out: true, value } };
});
/**
 * logic.equals - Compares two values for equality
 */
blockDefinitions.set('logic.equals', {
    type: 'logic.equals',
    category: 'logic',
    name: 'Equals',
    description: 'Compares two values and outputs a boolean',
    inputs: [
        { id: 'a', label: 'A', dataType: 'any', required: true },
        { id: 'b', label: 'B', dataType: 'any', required: true },
    ],
    outputs: [
        { id: 'result', label: 'Result', dataType: 'boolean', required: true },
    ],
});
blockHandlers.set('logic.equals', (node, inputs, _ctx) => {
    const a = inputs.a;
    const b = inputs.b;
    const result = a === b;
    return { outputs: { result } };
});
/**
 * action.logIntent - Logs an intent without side effects
 */
blockDefinitions.set('action.logIntent', {
    type: 'action.logIntent',
    category: 'action',
    name: 'Log Intent',
    description: 'Logs an action intent in dry-run mode',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'price', label: 'Price', dataType: 'number', required: false },
    ],
    outputs: [],
});
blockHandlers.set('action.logIntent', (node, _inputs, _ctx) => {
    const actionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: node.config.action ?? 'LOG',
            params: node.config,
        },
        executed: false,
    };
    return { outputs: {}, actionIntent };
});
/**
 * data.kraken.ticker - Fetches ticker price from Kraken (mock in dry-run)
 */
blockDefinitions.set('data.kraken.ticker', {
    type: 'data.kraken.ticker',
    category: 'data',
    name: 'Kraken Ticker',
    description: 'Fetches latest ticker price from Kraken (dry-run uses mock)',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'price', label: 'Price', dataType: 'number', required: true },
        { id: 'pair', label: 'Pair', dataType: 'string', required: true },
        { id: 'ask', label: 'Ask', dataType: 'number', required: false },
        { id: 'bid', label: 'Bid', dataType: 'number', required: false },
        { id: 'spread', label: 'Spread', dataType: 'number', required: false },
    ],
});
blockHandlers.set('data.kraken.ticker', (node, _inputs, ctx) => {
    const pair = node.config.pair || 'BTC/USD';
    const key = pairKey(pair);
    const market = ctx.marketData?.[key];
    const price = market?.last ?? 42000;
    return {
        outputs: {
            out: true,
            price,
            pair: market?.pair ?? pair,
            ask: market?.ask,
            bid: market?.bid,
            spread: market?.spread,
        },
    };
});
/**
 * data.kraken.ohlc - Fetches OHLC candles from Kraken (mock in dry-run if missing)
 */
blockDefinitions.set('data.kraken.ohlc', {
    type: 'data.kraken.ohlc',
    category: 'data',
    name: 'Kraken OHLC',
    description: 'Fetches OHLC candles from Kraken (dry-run uses snapshot)',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'candles', label: 'Candles', dataType: 'any', required: true },
        { id: 'closeSeries', label: 'Close Series', dataType: 'any', required: true },
        { id: 'lastCandle', label: 'Last Candle', dataType: 'any', required: true },
    ],
});
blockHandlers.set('data.kraken.ohlc', (node, _inputs, ctx) => {
    const pair = node.config.pair || 'BTC/USD';
    const interval = normalizeInterval(node.config.interval);
    const count = normalizeCount(node.config.count, 120, 1, 720);
    const snapshot = ctx.ohlcData?.[ohlcKey(pair, interval)];
    const candles = snapshot?.candles?.length
        ? snapshot.candles.slice(-count)
        : buildMockOhlcCandles(resolveMarketPrice(pair, ctx, 42000), count, interval);
    const closeSeries = candles.map((candle) => candle.close);
    const lastCandle = candles[candles.length - 1] ?? null;
    return {
        outputs: {
            out: true,
            candles,
            closeSeries,
            lastCandle,
        },
    };
});
/**
 * data.kraken.spread - Fetches recent spreads from Kraken (mock in dry-run if missing)
 */
blockDefinitions.set('data.kraken.spread', {
    type: 'data.kraken.spread',
    category: 'data',
    name: 'Kraken Spreads',
    description: 'Fetches recent bid/ask spreads from Kraken',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'latest', label: 'Latest', dataType: 'number', required: true },
        { id: 'average', label: 'Average', dataType: 'number', required: true },
        { id: 'min', label: 'Min', dataType: 'number', required: true },
        { id: 'max', label: 'Max', dataType: 'number', required: true },
        { id: 'median', label: 'Median', dataType: 'number', required: true },
        { id: 'series', label: 'Series', dataType: 'any', required: true },
    ],
});
blockHandlers.set('data.kraken.spread', (node, _inputs, ctx) => {
    const pair = node.config.pair || 'BTC/USD';
    const count = normalizeCount(node.config.count, 50, 1, 500);
    const snapshot = ctx.spreadData?.[pairKey(pair)];
    const entries = snapshot?.entries?.length
        ? [...snapshot.entries].slice(-count)
        : buildMockSpreadEntries(resolveMarketPrice(pair, ctx, 42000), ctx.marketData?.[pairKey(pair)]?.spread ?? 2.5, count);
    const series = entries.map((entry) => entry.spread);
    const stats = computeSpreadStats(series);
    return {
        outputs: {
            out: true,
            latest: stats.latest,
            average: stats.average,
            min: stats.min,
            max: stats.max,
            median: stats.median,
            series,
        },
    };
});
/**
 * data.kraken.assetPairs - Reads asset pair metadata (tick size, min size)
 */
blockDefinitions.set('data.kraken.assetPairs', {
    type: 'data.kraken.assetPairs',
    category: 'data',
    name: 'Kraken AssetPairs',
    description: 'Reads AssetPairs metadata for precision and min size checks',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'found', label: 'Found', dataType: 'boolean', required: true },
        { id: 'status', label: 'Status', dataType: 'string', required: false },
        { id: 'pairDecimals', label: 'Pair Decimals', dataType: 'number', required: false },
        { id: 'lotDecimals', label: 'Lot Decimals', dataType: 'number', required: false },
        { id: 'orderMin', label: 'Order Min', dataType: 'number', required: false },
        { id: 'costMin', label: 'Cost Min', dataType: 'number', required: false },
        { id: 'tickSize', label: 'Tick Size', dataType: 'number', required: false },
    ],
});
blockHandlers.set('data.kraken.assetPairs', (node, _inputs, ctx) => {
    const pair = node.config.pair || 'BTC/USD';
    const metadata = ctx.assetPairData?.[pairKey(pair)];
    return {
        outputs: {
            out: true,
            found: Boolean(metadata),
            status: metadata?.status ?? null,
            pairDecimals: metadata?.pairDecimals ?? null,
            lotDecimals: metadata?.lotDecimals ?? null,
            orderMin: metadata?.orderMin ?? null,
            costMin: metadata?.costMin ?? null,
            tickSize: metadata?.tickSize ?? null,
        },
    };
});
/**
 * logic.movingAverage - Computes SMA/EMA from a series
 */
blockDefinitions.set('logic.movingAverage', {
    type: 'logic.movingAverage',
    category: 'logic',
    name: 'Moving Average',
    description: 'Computes SMA or EMA from a numeric series',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'series', label: 'Series', dataType: 'any', required: true },
        { id: 'period', label: 'Period', dataType: 'number', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'value', label: 'Value', dataType: 'number', required: true },
    ],
});
blockHandlers.set('logic.movingAverage', (node, inputs, _ctx) => {
    const methodRaw = node.config.method ?? 'SMA';
    const method = methodRaw.toUpperCase() === 'EMA' ? 'EMA' : 'SMA';
    const period = normalizeCount(inputs.period ?? node.config.period, 14, 1, 500);
    const values = extractSeriesValues(inputs.series);
    if (values.length === 0) {
        throw new Error('Moving Average requires a numeric series');
    }
    const computed = method === 'EMA' ? computeEma(values, period) : computeSma(values, period);
    const value = computed[computed.length - 1] ?? values[values.length - 1];
    return {
        outputs: {
            out: true,
            value,
        },
    };
});
/**
 * control.timeWindow - Gates execution based on UTC time window
 */
blockDefinitions.set('control.timeWindow', {
    type: 'control.timeWindow',
    category: 'control',
    name: 'Time Window',
    description: 'Gates control flow based on UTC day/time window',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
        { id: 'allowed', label: 'Allowed', dataType: 'boolean', required: true },
        { id: 'now', label: 'Now', dataType: 'string', required: false },
        { id: 'nextAllowedAt', label: 'Next Allowed', dataType: 'string', required: false },
    ],
});
blockHandlers.set('control.timeWindow', (node, _inputs, _ctx) => {
    const startRaw = node.config.startTime ?? '00:00';
    const endRaw = node.config.endTime ?? '23:59';
    const daysRaw = node.config.days ?? DAY_LABELS;
    const startMinutes = parseTimeToMinutes(startRaw, 0);
    const endMinutes = parseTimeToMinutes(endRaw, 23 * 60 + 59);
    const allowedDays = resolveAllowedDays(daysRaw);
    const now = new Date();
    const nowDay = now.getUTCDay();
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const dayAllowed = allowedDays.length > 0 && allowedDays.includes(nowDay);
    const timeAllowed = startMinutes <= endMinutes
        ? nowMinutes >= startMinutes && nowMinutes <= endMinutes
        : nowMinutes >= startMinutes || nowMinutes <= endMinutes;
    const allowed = dayAllowed && timeAllowed;
    const next = allowed ? now : nextAllowedAt(now, allowedDays, startMinutes);
    return {
        outputs: {
            out: allowed,
            allowed,
            now: now.toISOString(),
            nextAllowedAt: next ? next.toISOString() : null,
        },
    };
});
/**
 * action.placeOrder - Places a trading order (dry-run logs intent only)
 */
blockDefinitions.set('action.placeOrder', {
    type: 'action.placeOrder',
    category: 'action',
    name: 'Place Order',
    description: 'Places a trading order (dry-run mode logs intent only)',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'price', label: 'Price', dataType: 'number', required: false },
    ],
    outputs: [
        { id: 'orderId', label: 'Order ID', dataType: 'string', required: true },
    ],
});
blockHandlers.set('action.placeOrder', (node, inputs, _ctx) => {
    const pair = node.config.pair ?? 'XBT/USD';
    const side = node.config.side ?? 'buy';
    const rawType = normalizeOrderType(node.config.type);
    const amount = node.config.amount ?? 0.1;
    const inputPrice = normalizePrice(inputs.price);
    const configPrice = normalizePrice(node.config.price);
    const resolvedPrice = configPrice ?? inputPrice;
    const hasLimitReference = resolvedPrice !== undefined;
    const resolvedType = hasLimitReference ? 'limit' : rawType;
    const actionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: 'PLACE_ORDER',
            params: {
                pair,
                side,
                type: resolvedType,
                amount,
                ...(resolvedType === 'limit' && hasLimitReference && { price: resolvedPrice }),
            },
        },
        executed: false,
    };
    // Mock order ID for dry-run
    const mockOrderId = `order-${Date.now()}`;
    return {
        outputs: { orderId: mockOrderId },
        actionIntent,
    };
});
/**
 * action.cancelOrder - Cancels a trading order (dry-run logs intent only)
 */
blockDefinitions.set('action.cancelOrder', {
    type: 'action.cancelOrder',
    category: 'action',
    name: 'Cancel Order',
    description: 'Cancels a trading order (dry-run mode logs intent only)',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'orderId', label: 'Order ID', dataType: 'string', required: false },
    ],
    outputs: [],
});
blockHandlers.set('action.cancelOrder', (node, inputs, _ctx) => {
    const orderId = inputs.orderId ?? node.config.orderId ?? 'unknown';
    const actionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: 'CANCEL_ORDER',
            params: { orderId },
        },
        executed: false,
    };
    return { outputs: {}, actionIntent };
});
/**
 * risk.guard - Checks spread against a configured threshold
 */
blockDefinitions.set('risk.guard', {
    type: 'risk.guard',
    category: 'logic',
    name: 'Orderbook Guard',
    description: 'Blocks execution if spread exceeds threshold',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'spreadOverride', label: 'Spread Override', dataType: 'number', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Pass', dataType: 'trigger', required: true },
        { id: 'allowed', label: 'Allowed', dataType: 'boolean', required: true },
        { id: 'spread', label: 'Spread', dataType: 'number', required: false },
    ],
});
blockHandlers.set('risk.guard', (node, inputs, ctx) => {
    const pair = node.config.pair || 'BTC/USD';
    const maxSpread = node.config.maxSpread ?? 5;
    const market = ctx.marketData?.[pairKey(pair)];
    const inputSpread = normalizePrice(inputs.spreadOverride);
    const spread = inputSpread ?? market?.spread ?? 0;
    const allowed = spread <= maxSpread;
    return {
        outputs: {
            out: allowed,
            allowed,
            spread,
        },
    };
});
/**
 * logic.if - Conditional routing based on numeric comparison
 */
blockDefinitions.set('logic.if', {
    type: 'logic.if',
    category: 'logic',
    name: 'If',
    description: 'Routes control flow based on a numeric comparison',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'condition', label: 'Value', dataType: 'number', required: true },
        { id: 'threshold', label: 'Threshold', dataType: 'number', required: false },
    ],
    outputs: [
        { id: 'true', label: 'True', dataType: 'trigger', required: true },
        { id: 'false', label: 'False', dataType: 'trigger', required: true },
    ],
});
blockHandlers.set('logic.if', (node, inputs, _ctx) => {
    const comparator = node.config.comparator ?? '>';
    const value = normalizePrice(inputs.condition ?? inputs.value);
    const thresholdInput = normalizePrice(inputs.threshold);
    const thresholdRaw = normalizePrice(node.config.threshold);
    const threshold = thresholdInput ?? thresholdRaw;
    if (value === undefined || Number.isNaN(value)) {
        throw new Error('Condition node requires a numeric input value');
    }
    if (threshold === undefined || Number.isNaN(threshold)) {
        throw new Error('Condition node requires a numeric threshold');
    }
    let condition = false;
    switch (comparator) {
        case '>':
            condition = value > threshold;
            break;
        case '<':
            condition = value < threshold;
            break;
        case '>=':
        case '=>':
            condition = value >= threshold;
            break;
        case '<=':
            condition = value <= threshold;
            break;
        case '==':
        case '=':
            condition = value === threshold;
            break;
        default:
            throw new Error(`Unsupported comparator: ${comparator}`);
    }
    return {
        outputs: {
            true: condition,
            false: !condition,
        },
    };
});
/**
 * Precomputes adjacency lists for control/data edges to speed up validation and execution.
 */
function buildGraphIndex(strategy) {
    const nodeMap = new Map();
    const controlEdges = [];
    const dataEdges = [];
    const incomingControlEdges = new Map();
    const incomingDataEdges = new Map();
    const outgoingControlEdges = new Map();
    const outgoingDataEdges = new Map();
    for (const node of strategy.nodes) {
        nodeMap.set(node.id, node);
        incomingControlEdges.set(node.id, []);
        incomingDataEdges.set(node.id, []);
        outgoingControlEdges.set(node.id, []);
        outgoingDataEdges.set(node.id, []);
    }
    for (const edge of strategy.edges) {
        if (edge.type === 'control') {
            controlEdges.push(edge);
            incomingControlEdges.get(edge.target)?.push(edge);
            outgoingControlEdges.get(edge.source)?.push(edge);
        }
        else {
            dataEdges.push(edge);
            incomingDataEdges.get(edge.target)?.push(edge);
            outgoingDataEdges.get(edge.source)?.push(edge);
        }
    }
    return {
        nodeMap,
        controlEdges,
        dataEdges,
        incomingControlEdges,
        incomingDataEdges,
        outgoingControlEdges,
        outgoingDataEdges,
    };
}
// =============================================================================
// VALIDATION
// =============================================================================
/**
 * Performs static validation before execution to prevent runtime errors (cycles,
 * missing ports, unknown blocks, ambiguous data edges).
 */
function validateStrategy(strategy, graph) {
    const errors = [];
    const warnings = [];
    // Check schema version
    if (strategy.version !== SCHEMA_VERSION) {
        errors.push({
            code: 'INVALID_SCHEMA_VERSION',
            message: `Expected schema version ${SCHEMA_VERSION}, got ${strategy.version}`,
        });
    }
    // Check for duplicate node IDs
    const seenNodeIds = new Set();
    for (const node of strategy.nodes) {
        if (seenNodeIds.has(node.id)) {
            errors.push({
                code: 'DUPLICATE_NODE_ID',
                message: `Duplicate node ID: ${node.id}`,
                nodeId: node.id,
            });
        }
        seenNodeIds.add(node.id);
    }
    // Check for duplicate edge IDs
    const seenEdgeIds = new Set();
    for (const edge of strategy.edges) {
        if (seenEdgeIds.has(edge.id)) {
            errors.push({
                code: 'DUPLICATE_EDGE_ID',
                message: `Duplicate edge ID: ${edge.id}`,
                edgeId: edge.id,
            });
        }
        seenEdgeIds.add(edge.id);
    }
    // Check all edge references and port existence
    for (const edge of strategy.edges) {
        const sourceNode = graph.nodeMap.get(edge.source);
        const targetNode = graph.nodeMap.get(edge.target);
        if (!sourceNode) {
            errors.push({
                code: 'NODE_NOT_FOUND',
                message: `Edge references non-existent source node: ${edge.source}`,
                edgeId: edge.id,
            });
        }
        if (!targetNode) {
            errors.push({
                code: 'NODE_NOT_FOUND',
                message: `Edge references non-existent target node: ${edge.target}`,
                edgeId: edge.id,
            });
        }
        // Validate port existence (only for data edges)
        // Control edges define execution order only, they don't transfer data via ports
        if (edge.type === 'data') {
            if (sourceNode) {
                const sourceBlockDef = blockDefinitions.get(sourceNode.type);
                if (sourceBlockDef) {
                    const hasSourcePort = sourceBlockDef.outputs.some((p) => p.id === edge.sourcePort);
                    if (!hasSourcePort) {
                        errors.push({
                            code: 'PORT_NOT_FOUND',
                            message: `Source port '${edge.sourcePort}' not found on node '${edge.source}' (type: ${sourceNode.type})`,
                            edgeId: edge.id,
                            nodeId: edge.source,
                        });
                    }
                }
            }
            if (targetNode) {
                const targetBlockDef = blockDefinitions.get(targetNode.type);
                if (targetBlockDef) {
                    const hasTargetPort = targetBlockDef.inputs.some((p) => p.id === edge.targetPort);
                    if (!hasTargetPort) {
                        errors.push({
                            code: 'PORT_NOT_FOUND',
                            message: `Target port '${edge.targetPort}' not found on node '${edge.target}' (type: ${targetNode.type})`,
                            edgeId: edge.id,
                            nodeId: edge.target,
                        });
                    }
                }
            }
        }
    }
    // Check for unknown block types
    for (const node of strategy.nodes) {
        if (!blockDefinitions.has(node.type)) {
            errors.push({
                code: 'UNKNOWN_BLOCK_TYPE',
                message: `Unknown block type: ${node.type}`,
                nodeId: node.id,
            });
        }
    }
    // Check for entry points
    const entryPoints = strategy.nodes.filter((node) => (graph.incomingControlEdges.get(node.id)?.length ?? 0) === 0);
    if (entryPoints.length === 0) {
        errors.push({
            code: 'NO_ENTRY_POINT',
            message: 'No entry points found (all nodes have incoming control edges)',
        });
    }
    // Check for orphan nodes (warning)
    for (const node of strategy.nodes) {
        const hasIncoming = (graph.incomingControlEdges.get(node.id)?.length ?? 0) > 0;
        const hasOutgoing = (graph.outgoingControlEdges.get(node.id)?.length ?? 0) > 0;
        const isEntryPoint = !hasIncoming;
        const isTerminal = !hasOutgoing;
        if (!hasIncoming && !hasOutgoing && strategy.nodes.length > 1) {
            warnings.push({
                code: 'ORPHAN_NODE',
                message: `Node is not connected to any control flow: ${node.id}`,
                nodeId: node.id,
            });
        }
    }
    // Check for ambiguous data sources
    const dataTargetCounts = new Map();
    for (const edge of graph.dataEdges) {
        const key = `${edge.target}:${edge.targetPort}`;
        dataTargetCounts.set(key, (dataTargetCounts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of dataTargetCounts) {
        if (count > 1) {
            const [nodeId, portId] = key.split(':');
            errors.push({
                code: 'AMBIGUOUS_DATA_SOURCE',
                message: `Multiple data edges target the same port: ${key}`,
                nodeId,
            });
        }
    }
    // Validate required input ports have incoming data edges
    for (const node of strategy.nodes) {
        const blockDef = blockDefinitions.get(node.type);
        if (!blockDef)
            continue;
        const incomingData = graph.incomingDataEdges.get(node.id) ?? [];
        const connectedInputPorts = new Set(incomingData.map((e) => e.targetPort));
        for (const inputPort of blockDef.inputs) {
            if (inputPort.required && !connectedInputPorts.has(inputPort.id)) {
                errors.push({
                    code: 'MISSING_REQUIRED_INPUT',
                    message: `Required input port '${inputPort.id}' on node '${node.id}' has no incoming data edge`,
                    nodeId: node.id,
                });
            }
        }
    }
    return { errors, warnings };
}
// =============================================================================
// TOPOLOGICAL SORT
// =============================================================================
/**
 * Orders nodes by control/data dependencies; detects cycles that would deadlock execution.
 */
function topologicalSort(strategy, graph) {
    const inDegree = new Map();
    for (const node of strategy.nodes) {
        inDegree.set(node.id, 0);
    }
    for (const edge of [...graph.controlEdges, ...graph.dataEdges]) {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
    // Sort entry points by ID for determinism
    const queue = [];
    for (const node of strategy.nodes) {
        if (inDegree.get(node.id) === 0) {
            queue.push(node.id);
        }
    }
    queue.sort();
    const order = [];
    while (queue.length > 0) {
        const nodeId = queue.shift();
        order.push(nodeId);
        const outgoing = graph.outgoingControlEdges.get(nodeId) ?? [];
        const outgoingData = graph.outgoingDataEdges.get(nodeId) ?? [];
        // Sort outgoing edges by target ID for determinism
        const sortedOutgoing = [...outgoing, ...outgoingData].sort((a, b) => a.target.localeCompare(b.target));
        for (const edge of sortedOutgoing) {
            const targetDegree = (inDegree.get(edge.target) ?? 0) - 1;
            inDegree.set(edge.target, targetDegree);
            if (targetDegree === 0) {
                queue.push(edge.target);
                queue.sort(); // Maintain deterministic order
            }
        }
    }
    if (order.length < strategy.nodes.length) {
        return {
            order,
            error: {
                code: 'CONTROL_CYCLE_DETECTED',
                message: 'Cycle detected in control flow graph',
            },
        };
    }
    return { order };
}
/**
 * Collects the subgraph needed to run a specific node (used for partial execution).
 */
function collectDependencyNodes(targetNodeId, graph) {
    const visited = new Set();
    const stack = [targetNodeId];
    while (stack.length > 0) {
        const nodeId = stack.pop();
        if (visited.has(nodeId))
            continue;
        visited.add(nodeId);
        const incoming = [
            ...(graph.incomingControlEdges.get(nodeId) ?? []),
            ...(graph.incomingDataEdges.get(nodeId) ?? []),
        ];
        for (const edge of incoming) {
            if (!visited.has(edge.source)) {
                stack.push(edge.source);
            }
        }
    }
    return visited;
}
// =============================================================================
// DATA RESOLUTION
// =============================================================================
/**
 * Resolves incoming data for a node from the cache, emitting warnings for disabled inputs
 * and errors for missing required ports.
 */
function resolveInputs(nodeId, graph, dataCache) {
    const inputs = {};
    const warnings = [];
    const incomingData = graph.incomingDataEdges.get(nodeId) ?? [];
    // Get target node's block definition for port metadata
    const targetNode = graph.nodeMap.get(nodeId);
    const targetBlockDef = targetNode ? blockDefinitions.get(targetNode.type) : null;
    for (const edge of incomingData) {
        const cacheKey = `${edge.source}:${edge.sourcePort}`;
        const value = dataCache.get(cacheKey);
        // Find the target input port definition
        const targetInputPort = targetBlockDef?.inputs.find((p) => p.id === edge.targetPort);
        // Check if TARGET input port is required and value is missing
        if ((value === undefined || value === null) && targetInputPort?.required) {
            const sourceNode = graph.nodeMap.get(edge.source);
            if (sourceNode && isNodeDisabled(sourceNode)) {
                warnings.push({
                    code: 'DISABLED_INPUT',
                    message: `Input '${edge.targetPort}' on node '${nodeId}' is missing because source node '${edge.source}' is disabled`,
                    nodeId,
                });
                inputs[edge.targetPort] = null;
                continue;
            }
            return {
                inputs,
                warnings,
                error: {
                    code: 'MISSING_REQUIRED_INPUT',
                    message: `Required input '${edge.targetPort}' on node '${nodeId}' received null/undefined from ${edge.source}:${edge.sourcePort}`,
                    nodeId,
                },
            };
        }
        // Type validation (emit TYPE_MISMATCH warning if types don't match)
        if (value !== undefined && value !== null && targetInputPort) {
            const typeWarning = validatePortType(value, targetInputPort, nodeId, edge.targetPort);
            if (typeWarning) {
                warnings.push(typeWarning);
            }
        }
        inputs[edge.targetPort] = value ?? null;
    }
    return { inputs, warnings };
}
/**
 * Validates that a value matches the expected port dataType.
 * Returns a TYPE_MISMATCH warning if validation fails, null otherwise.
 */
function validatePortType(value, port, nodeId, portId) {
    // 'any' and 'trigger' types accept all values
    if (port.dataType === 'any' || port.dataType === 'trigger') {
        return null;
    }
    const actualType = typeof value;
    let expectedType;
    switch (port.dataType) {
        case 'number':
            expectedType = 'number';
            break;
        case 'boolean':
            expectedType = 'boolean';
            break;
        case 'string':
            expectedType = 'string';
            break;
        default:
            return null; // Unknown port type, skip validation
    }
    if (actualType !== expectedType) {
        return {
            code: 'TYPE_MISMATCH',
            message: `Port '${portId}' on node '${nodeId}' expects ${expectedType}, got ${actualType}`,
            nodeId,
        };
    }
    return null;
}
// =============================================================================
// MAIN EXECUTOR
// =============================================================================
/**
 * Main entry point for dry-run execution. Validates the graph, determines execution
 * order, runs block handlers, and returns structured logs/warnings/errors.
 */
export function executeDryRun(strategy, ctx) {
    const startedAt = new Date().toISOString();
    const log = [];
    const errors = [];
    const warnings = [];
    const actionIntents = [];
    const dataCache = new Map();
    // Step 1 & 2: Build graph index
    const fullGraph = buildGraphIndex(strategy);
    const targetNodeId = ctx.targetNodeId;
    if (targetNodeId && !fullGraph.nodeMap.has(targetNodeId)) {
        errors.push({
            code: 'TARGET_NODE_NOT_FOUND',
            message: `Target node not found: ${targetNodeId}`,
            nodeId: targetNodeId,
        });
        return {
            success: false,
            mode: ctx.mode,
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }
    const strategyToRun = targetNodeId
        ? (() => {
            const requiredNodes = collectDependencyNodes(targetNodeId, fullGraph);
            return {
                ...strategy,
                nodes: strategy.nodes.filter((node) => requiredNodes.has(node.id)),
                edges: strategy.edges.filter((edge) => requiredNodes.has(edge.source) && requiredNodes.has(edge.target)),
            };
        })()
        : strategy;
    const graph = targetNodeId ? buildGraphIndex(strategyToRun) : fullGraph;
    // Step 3: Validate
    const validation = validateStrategy(strategyToRun, graph);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
    if (errors.length > 0) {
        return {
            success: false,
            mode: 'dry-run',
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }
    // Step 4 & 5: Compute execution order
    const sortResult = topologicalSort(strategyToRun, graph);
    if (sortResult.error) {
        errors.push(sortResult.error);
        return {
            success: false,
            mode: 'dry-run',
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }
    const executionOrder = sortResult.order;
    // Step 6: Execute nodes in order (control flow gating)
    const nodeOrderIndex = new Map();
    executionOrder.forEach((nodeId, index) => nodeOrderIndex.set(nodeId, index));
    const pendingQueue = [];
    const pendingSet = new Set();
    const executedNodes = new Set();
    const enqueueNode = (nodeId) => {
        if (executedNodes.has(nodeId) || pendingSet.has(nodeId)) {
            return;
        }
        pendingQueue.push(nodeId);
        pendingSet.add(nodeId);
    };
    for (const node of strategyToRun.nodes) {
        const incoming = graph.incomingControlEdges.get(node.id)?.length ?? 0;
        if (incoming === 0) {
            enqueueNode(node.id);
        }
    }
    const dequeueNextNode = () => {
        if (pendingQueue.length === 0) {
            return undefined;
        }
        let bestIndex = 0;
        for (let i = 1; i < pendingQueue.length; i++) {
            const currentId = pendingQueue[i];
            const bestId = pendingQueue[bestIndex];
            if ((nodeOrderIndex.get(currentId) ?? Infinity) <
                (nodeOrderIndex.get(bestId) ?? Infinity)) {
                bestIndex = i;
            }
        }
        const [nodeId] = pendingQueue.splice(bestIndex, 1);
        pendingSet.delete(nodeId);
        return nodeId;
    };
    while (pendingQueue.length > 0) {
        const nodeId = dequeueNextNode();
        if (!nodeId) {
            break;
        }
        if (executedNodes.has(nodeId)) {
            continue;
        }
        const node = graph.nodeMap.get(nodeId);
        if (!node) {
            continue;
        }
        if (isNodeDisabled(node)) {
            executedNodes.add(nodeId);
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: {},
                outputs: {},
                durationMs: 0,
                status: 'skipped',
            });
            continue;
        }
        const handler = blockHandlers.get(node.type);
        if (!handler) {
            errors.push({
                code: 'UNKNOWN_BLOCK_TYPE',
                message: `No handler for block type: ${node.type}`,
                nodeId,
            });
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: {},
                outputs: {},
                durationMs: 0,
                status: 'error',
            });
            break;
        }
        const inputResult = resolveInputs(nodeId, graph, dataCache);
        warnings.push(...inputResult.warnings);
        if (inputResult.error) {
            errors.push(inputResult.error);
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: inputResult.inputs,
                outputs: {},
                durationMs: 0,
                status: 'error',
            });
            break;
        }
        const execStart = Date.now();
        let outputs = {};
        let actionIntent;
        try {
            const result = handler(node, inputResult.inputs, ctx);
            outputs = result.outputs;
            actionIntent = result.actionIntent;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            errors.push({
                code: 'NODE_EXECUTION_ERROR',
                message: `Error executing node: ${message}`,
                nodeId,
            });
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: inputResult.inputs,
                outputs: {},
                durationMs: Date.now() - execStart,
                status: 'error',
            });
            break;
        }
        const durationMs = Date.now() - execStart;
        for (const [portId, value] of Object.entries(outputs)) {
            dataCache.set(`${nodeId}:${portId}`, value);
        }
        if (actionIntent) {
            actionIntents.push(actionIntent);
        }
        log.push({
            nodeId,
            nodeType: node.type,
            inputs: inputResult.inputs,
            outputs,
            durationMs,
            status: 'success',
        });
        executedNodes.add(nodeId);
        const outgoingControls = graph.outgoingControlEdges.get(nodeId) ?? [];
        for (const edge of outgoingControls) {
            const triggerValue = Object.prototype.hasOwnProperty.call(outputs, edge.sourcePort) &&
                outputs[edge.sourcePort] !== undefined
                ? outputs[edge.sourcePort]
                : undefined;
            const shouldTrigger = triggerValue === undefined || triggerValue === null
                ? true
                : Boolean(triggerValue);
            if (shouldTrigger) {
                enqueueNode(edge.target);
            }
        }
    }
    // Step 7: Return result
    const completedAt = new Date().toISOString();
    return {
        success: errors.length === 0,
        mode: ctx.mode,
        startedAt,
        completedAt,
        nodesExecuted: log.filter((l) => l.status === 'success').length,
        log,
        errors,
        warnings,
        actionIntents,
    };
}
