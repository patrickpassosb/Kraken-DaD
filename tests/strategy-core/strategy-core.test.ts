import test from 'node:test';
import assert from 'node:assert/strict';
import { executeDryRun } from '../../packages/strategy-core/executor/dryRunExecutor.ts';
import { SCHEMA_VERSION, Strategy } from '../../packages/strategy-core/schema.ts';

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
