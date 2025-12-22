import test from 'node:test';
import assert from 'node:assert/strict';
/**
 * Sanity checks for strategy-core dry-run executor: validation, ordering, and block outputs.
 */
import { executeDryRun } from '../../packages/strategy-core/executor/dryRunExecutor.ts';
import { SCHEMA_VERSION, Strategy } from '../../packages/strategy-core/schema.ts';

// Sanity tests cover validation, deterministic ordering, and block outputs.
const baseMetadata = {
    name: 'Test Strategy',
    createdAt: '2024-12-20T00:00:00.000Z',
    updatedAt: '2024-12-20T00:00:00.000Z',
};

test('validation fails when required inputs are missing', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            {
                id: 'start-1',
                type: 'control.start',
                config: {},
                position: { x: 0, y: 0 },
            },
            {
                id: 'if-1',
                type: 'logic.if',
                config: { comparator: '>', threshold: 90000 },
                position: { x: 200, y: 0 },
            },
        ],
        edges: [
            {
                id: 'e-start-if',
                type: 'control',
                source: 'start-1',
                sourcePort: 'out',
                target: 'if-1',
                targetPort: 'in',
            },
        ],
    };

    const result = executeDryRun(strategy, { mode: 'dry-run', marketData: {} });

    assert.equal(result.success, false);
    assert.ok(result.errors.some((error) => error.code === 'MISSING_REQUIRED_INPUT'));
});

test('execution order is deterministic by node id', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            {
                id: 'start-1',
                type: 'control.start',
                config: {},
                position: { x: 0, y: 0 },
            },
            {
                id: 'ticker-a',
                type: 'data.kraken.ticker',
                config: { pair: 'BTC/USD' },
                position: { x: 200, y: 0 },
            },
            {
                id: 'ticker-b',
                type: 'data.kraken.ticker',
                config: { pair: 'BTC/USD' },
                position: { x: 400, y: 0 },
            },
        ],
        edges: [
            {
                id: 'e-start-b',
                type: 'control',
                source: 'start-1',
                sourcePort: 'out',
                target: 'ticker-b',
                targetPort: 'in',
            },
            {
                id: 'e-start-a',
                type: 'control',
                source: 'start-1',
                sourcePort: 'out',
                target: 'ticker-a',
                targetPort: 'in',
            },
        ],
    };

    const result = executeDryRun(strategy, { mode: 'dry-run', marketData: {} });
    const order = result.log.map((entry) => entry.nodeId);

    assert.deepEqual(order, ['start-1', 'ticker-a', 'ticker-b']);
});

test('moving average computes SMA and EMA', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            { id: 'start-1', type: 'control.start', config: {}, position: { x: 0, y: 0 } },
            {
                id: 'series-1',
                type: 'data.constant',
                config: { value: [1, 2, 3, 4, 5] },
                position: { x: 200, y: 0 },
            },
            {
                id: 'ma-sma',
                type: 'logic.movingAverage',
                config: { method: 'SMA', period: 3 },
                position: { x: 400, y: 0 },
            },
            {
                id: 'ma-ema',
                type: 'logic.movingAverage',
                config: { method: 'EMA', period: 3 },
                position: { x: 600, y: 0 },
            },
        ],
        edges: [
            { id: 'e-start-series', type: 'control', source: 'start-1', sourcePort: 'out', target: 'series-1', targetPort: 'in' },
            { id: 'e-series-sma', type: 'control', source: 'series-1', sourcePort: 'out', target: 'ma-sma', targetPort: 'in' },
            { id: 'e-series-ema', type: 'control', source: 'series-1', sourcePort: 'out', target: 'ma-ema', targetPort: 'in' },
            { id: 'e-series-sma-data', type: 'data', source: 'series-1', sourcePort: 'value', target: 'ma-sma', targetPort: 'series' },
            { id: 'e-series-ema-data', type: 'data', source: 'series-1', sourcePort: 'value', target: 'ma-ema', targetPort: 'series' },
        ],
    };

    const result = executeDryRun(strategy, { mode: 'dry-run', marketData: {} });
    const smaLog = result.log.find((entry) => entry.nodeId === 'ma-sma');
    const emaLog = result.log.find((entry) => entry.nodeId === 'ma-ema');

    assert.ok(smaLog);
    assert.ok(emaLog);
    assert.equal(smaLog.outputs.value, 4);
    assert.ok(Math.abs((emaLog.outputs.value as number) - 4.0625) < 1e-6);
});

test('ohlc block outputs candles and close series from context', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            { id: 'start-1', type: 'control.start', config: {}, position: { x: 0, y: 0 } },
            {
                id: 'ohlc-1',
                type: 'data.kraken.ohlc',
                config: { pair: 'BTC/USD', interval: 1, count: 2 },
                position: { x: 200, y: 0 },
            },
        ],
        edges: [
            { id: 'e-start-ohlc', type: 'control', source: 'start-1', sourcePort: 'out', target: 'ohlc-1', targetPort: 'in' },
        ],
    };

    const result = executeDryRun(strategy, {
        mode: 'dry-run',
        marketData: {},
        ohlcData: {
            'BTC/USD::1': {
                pair: 'BTC/USD',
                interval: 1,
                timestamp: 0,
                candles: [
                    { time: 0, open: 10, high: 12, low: 9, close: 11, vwap: 10.5, volume: 1, count: 2 },
                    { time: 60000, open: 11, high: 13, low: 10, close: 12, vwap: 11.2, volume: 1, count: 3 },
                ],
            },
        },
    });

    const logEntry = result.log.find((entry) => entry.nodeId === 'ohlc-1');
    assert.ok(logEntry);
    assert.deepEqual(logEntry.outputs.closeSeries, [11, 12]);
    assert.equal((logEntry.outputs.lastCandle as { close: number }).close, 12);
});

test('spread block computes summary statistics', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            { id: 'start-1', type: 'control.start', config: {}, position: { x: 0, y: 0 } },
            {
                id: 'spread-1',
                type: 'data.kraken.spread',
                config: { pair: 'BTC/USD', count: 3 },
                position: { x: 200, y: 0 },
            },
        ],
        edges: [
            { id: 'e-start-spread', type: 'control', source: 'start-1', sourcePort: 'out', target: 'spread-1', targetPort: 'in' },
        ],
    };

    const result = executeDryRun(strategy, {
        mode: 'dry-run',
        marketData: {},
        spreadData: {
            'BTC/USD': {
                pair: 'BTC/USD',
                timestamp: 0,
                entries: [
                    { time: 0, bid: 100, ask: 101, spread: 1 },
                    { time: 1, bid: 100, ask: 102, spread: 2 },
                    { time: 2, bid: 100, ask: 103, spread: 3 },
                ],
            },
        },
    });

    const logEntry = result.log.find((entry) => entry.nodeId === 'spread-1');
    assert.ok(logEntry);
    assert.equal(logEntry.outputs.latest, 3);
    assert.equal(logEntry.outputs.average, 2);
    assert.equal(logEntry.outputs.min, 1);
    assert.equal(logEntry.outputs.max, 3);
    assert.equal(logEntry.outputs.median, 2);
});

test('time window block blocks when no days are selected', () => {
    const strategy: Strategy = {
        version: SCHEMA_VERSION,
        metadata: baseMetadata,
        nodes: [
            { id: 'start-1', type: 'control.start', config: {}, position: { x: 0, y: 0 } },
            {
                id: 'window-1',
                type: 'control.timeWindow',
                config: { startTime: '09:00', endTime: '10:00', days: [] },
                position: { x: 200, y: 0 },
            },
        ],
        edges: [
            { id: 'e-start-window', type: 'control', source: 'start-1', sourcePort: 'out', target: 'window-1', targetPort: 'in' },
        ],
    };

    const result = executeDryRun(strategy, { mode: 'dry-run', marketData: {} });
    const logEntry = result.log.find((entry) => entry.nodeId === 'window-1');
    assert.ok(logEntry);
    assert.equal(logEntry.outputs.allowed, false);
});
