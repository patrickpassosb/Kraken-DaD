import { Edge, Node } from '@xyflow/react';

export type NodeTypeId =
    | 'control.start'
    | 'data.kraken.ticker'
    | 'data.constant'
    | 'logic.if'
    | 'risk.guard'
    | 'action.placeOrder'
    | 'action.cancelOrder'
    | 'action.logIntent';

type PaletteGroupId = 'control' | 'market' | 'logic' | 'execution';

export interface NodeDefinition {
    type: NodeTypeId;
    label: string;
    role: string;
    description: string;
    icon: string;
    paletteGroup: PaletteGroupId;
    defaultPosition: { x: number; y: number };
    defaultData?: Record<string, unknown>;
}

export const nodeDefinitions: NodeDefinition[] = [
    {
        type: 'control.start',
        label: 'Strategy Start',
        role: 'Control',
        description: 'Kick off control lane',
        icon: '▶',
        paletteGroup: 'control',
        defaultPosition: { x: 360, y: 260 },
        defaultData: {},
    },
    {
        type: 'data.kraken.ticker',
        label: 'Market Data',
        role: 'Data',
        description: 'Live Kraken ticker snapshot',
        icon: '$',
        paletteGroup: 'market',
        defaultPosition: { x: 560, y: 240 },
        defaultData: { pair: 'BTC/USD' },
    },
    {
        type: 'data.constant',
        label: 'Constant',
        role: 'Data',
        description: 'Static value output',
        icon: 'C',
        paletteGroup: 'market',
        defaultPosition: { x: 520, y: 420 },
        defaultData: { valueType: 'number', value: 90000 },
    },
    {
        type: 'logic.if',
        label: 'Condition (IF)',
        role: 'Logic',
        description: 'Branch on price rule (true/false)',
        icon: '?',
        paletteGroup: 'logic',
        defaultPosition: { x: 800, y: 260 },
        defaultData: { comparator: '>', threshold: 90000 },
    },
    {
        type: 'risk.guard',
        label: 'Orderbook Guard',
        role: 'Risk',
        description: 'Block on wide spreads',
        icon: '⚑',
        paletteGroup: 'logic',
        defaultPosition: { x: 1040, y: 240 },
        defaultData: { pair: 'BTC/USD', maxSpread: 5 },
    },
    {
        type: 'action.placeOrder',
        label: 'Execution',
        role: 'Action',
        description: 'Prepare Kraken order intent',
        icon: '✓',
        paletteGroup: 'execution',
        defaultPosition: { x: 1260, y: 240 },
        defaultData: { pair: 'BTC/USD', side: 'buy', type: 'market', amount: 0.1 },
    },
    {
        type: 'action.cancelOrder',
        label: 'Order Control',
        role: 'Action',
        description: 'Cancel intent by ID',
        icon: '⤺',
        paletteGroup: 'execution',
        defaultPosition: { x: 1260, y: 360 },
        defaultData: { orderId: '' },
    },
    {
        type: 'action.logIntent',
        label: 'Audit Log',
        role: 'Audit',
        description: 'Record audit trail',
        icon: '✎',
        paletteGroup: 'execution',
        defaultPosition: { x: 1280, y: 500 },
        defaultData: { note: 'Capture execution intent' },
    },
];

export const nodeDefinitionMap: Record<string, NodeDefinition> = Object.fromEntries(
    nodeDefinitions.map((def) => [def.type, def])
);

const paletteLabels: Record<PaletteGroupId, string> = {
    control: 'CONTROL',
    market: 'MARKET',
    logic: 'LOGIC & RISK',
    execution: 'EXECUTION',
};

export const paletteGroups = (['control', 'market', 'logic', 'execution'] as PaletteGroupId[]).map(
    (groupId) => ({
        id: groupId,
        label: paletteLabels[groupId],
        items: nodeDefinitions.filter((def) => def.paletteGroup === groupId),
    })
);

export function createNodeWithDefaults(
    type: NodeTypeId,
    id: string,
    position?: { x: number; y: number }
): Node {
    const meta = nodeDefinitionMap[type];
    const targetPosition = position ?? meta?.defaultPosition ?? { x: 360, y: 260 };
    const data = meta?.defaultData ? { ...meta.defaultData } : {};
    const className = type === 'logic.if' ? 'node-conditional' : '';
    return {
        id,
        type,
        position: targetPosition,
        data,
        className,
    };
}

export function buildTemplateNodes(): Node[] {
    return [
        createNodeWithDefaults('control.start', 'start-template'),
        createNodeWithDefaults('data.kraken.ticker', 'ticker-template'),
        createNodeWithDefaults('logic.if', 'if-template'),
        createNodeWithDefaults('action.placeOrder', 'order-template'),
    ];
}

export function buildTemplateEdges(): Edge[] {
    return [
        {
            id: 'e-start-ticker-template',
            source: 'start-template',
            sourceHandle: 'control:out',
            target: 'ticker-template',
            targetHandle: 'control:in',
            type: 'control',
        },
        {
            id: 'e-ticker-if-control-template',
            source: 'ticker-template',
            sourceHandle: 'control:out',
            target: 'if-template',
            targetHandle: 'control:in',
            type: 'control',
        },
        {
            id: 'e-if-order-template',
            source: 'if-template',
            sourceHandle: 'control:true',
            target: 'order-template',
            targetHandle: 'control:trigger',
            type: 'control',
        },
        {
            id: 'e-ticker-if-data-template',
            source: 'ticker-template',
            sourceHandle: 'data:price',
            target: 'if-template',
            targetHandle: 'data:condition',
            type: 'data',
            data: { implied: true },
        },
        {
            id: 'e-ticker-order-data-template',
            source: 'ticker-template',
            sourceHandle: 'data:price',
            target: 'order-template',
            targetHandle: 'data:price',
            type: 'data',
            data: { implied: true },
        },
    ];
}
