import { Node, Edge } from '@xyflow/react';
import { SCHEMA_VERSION } from '../../../../packages/strategy-core/schema.ts';
import { Strategy } from '../api/executeStrategy';

/** Converts React Flow handle ids into strategy edge type. */
export function getPortType(handleId: string): 'data' | 'control' {
    if (handleId.startsWith('control:')) {
        return 'control';
    }
    return 'data';
}

/** Strips `data:` / `control:` prefixes, returning the schema port id. */
export function getPortId(handleId: string): string {
    // Strip the prefix (control: or data:) to get the actual port ID
    if (handleId.startsWith('control:')) {
        return handleId.slice(8);
    }
    if (handleId.startsWith('data:')) {
        return handleId.slice(5);
    }
    return handleId;
}

/**
 * Serializes the canvas into a Strategy JSON aligned with strategy-core schema.
 * Applies sane defaults for nodes that would otherwise violate validation.
 */
export function toStrategyJSON(nodes: Node[], edges: Edge[]): Strategy {
    const now = new Date().toISOString();

    const strategyNodes = nodes.map((node) => {
        const config = { ...(node.data as Record<string, unknown>) };

        if (node.type === 'risk.guard') {
            config.pair = config.pair ?? 'BTC/USD';
            config.maxSpread = config.maxSpread ?? 5;
        }

        if (node.type === 'data.kraken.ohlc') {
            config.pair = config.pair ?? 'BTC/USD';
            config.interval = config.interval ?? 1;
            config.count = config.count ?? 120;
        }

        if (node.type === 'data.kraken.spread') {
            config.pair = config.pair ?? 'BTC/USD';
            config.count = config.count ?? 50;
        }

        if (node.type === 'data.kraken.assetPairs') {
            config.pair = config.pair ?? 'BTC/USD';
        }

        if (node.type === 'logic.movingAverage') {
            config.method = config.method ?? 'SMA';
            config.period = typeof config.period === 'number' && !Number.isNaN(config.period)
                ? config.period
                : 14;
        }

        if (node.type === 'logic.if') {
            config.comparator = config.comparator ?? '>';
            config.threshold =
                typeof config.threshold === 'number' && !Number.isNaN(config.threshold)
                    ? config.threshold
                    : 0;
        }

        if (node.type === 'control.timeWindow') {
            config.startTime = config.startTime ?? '00:00';
            config.endTime = config.endTime ?? '23:59';
            config.days = config.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        }

        return {
        id: node.id,
            type: node.type || 'unknown',
            config,
        position: { x: node.position.x, y: node.position.y },
        };
    });

    const strategyEdges = edges.map((edge) => {
        const sourceHandle = edge.sourceHandle || '';
        const targetHandle = edge.targetHandle || '';

        return {
            id: edge.id,
            type: getPortType(sourceHandle),
            source: edge.source,
            sourcePort: getPortId(sourceHandle),
            target: edge.target,
            targetPort: getPortId(targetHandle),
        };
    });

    return {
        version: SCHEMA_VERSION,
        metadata: {
            name: 'Kraken Strategy Definition',
            description: 'Built with Kraken DaD',
            createdAt: now,
            updatedAt: now,
        },
        nodes: strategyNodes,
        edges: strategyEdges,
    };
}
