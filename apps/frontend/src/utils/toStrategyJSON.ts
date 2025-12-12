import { Node, Edge } from '@xyflow/react';
import { Strategy } from '../api/executeDryRun';

const PORT_TYPES: Record<string, Record<string, 'data' | 'control'>> = {
    'control.start': {
        out: 'control',
    },
    'data.kraken.ticker': {
        price: 'data',
        out: 'control',
    },
    'action.logIntent': {
        in: 'control',
        price: 'data',
    },
};

export function getPortType(nodeType: string, portId: string): 'data' | 'control' {
    return PORT_TYPES[nodeType]?.[portId] ?? 'data';
}

export function toStrategyJSON(nodes: Node[], edges: Edge[]): Strategy {
    const now = new Date().toISOString();

    const strategyNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type || 'unknown',
        config: (node.data as Record<string, unknown>) || {},
        position: { x: node.position.x, y: node.position.y },
    }));

    const strategyEdges = edges.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const sourcePortType = sourceNode
            ? getPortType(sourceNode.type || '', edge.sourceHandle || '')
            : 'data';

        return {
            id: edge.id,
            type: sourcePortType,
            source: edge.source,
            sourcePort: edge.sourceHandle || '',
            target: edge.target,
            targetPort: edge.targetHandle || '',
        };
    });

    return {
        version: 1,
        metadata: {
            name: 'Strategy',
            description: 'Built with Kraken DaD',
            createdAt: now,
            updatedAt: now,
        },
        nodes: strategyNodes,
        edges: strategyEdges,
    };
}
