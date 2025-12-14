import { Node, Edge } from '@xyflow/react';
import { Strategy } from '../api/executeDryRun';

export function getPortType(handleId: string): 'data' | 'control' {
    if (handleId.startsWith('control:')) {
        return 'control';
    }
    return 'data';
}

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

export function toStrategyJSON(nodes: Node[], edges: Edge[]): Strategy {
    const now = new Date().toISOString();

    const strategyNodes = nodes.map((node) => {
        const config = { ...(node.data as Record<string, unknown>) };

        if (node.type === 'risk.guard') {
            config.pair = config.pair ?? 'BTC/USD';
            config.maxSpread = config.maxSpread ?? 5;
        }

        if (node.type === 'logic.if') {
            config.comparator = config.comparator ?? '>';
            config.threshold =
                typeof config.threshold === 'number' && !Number.isNaN(config.threshold)
                    ? config.threshold
                    : 0;
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
        version: 1,
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
