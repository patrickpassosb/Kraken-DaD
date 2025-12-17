import { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Background,
    Controls,
    BackgroundVariant,
    StepEdge,
    SimpleBezierEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { NodeStatus } from '../utils/status';

interface FlowCanvasProps {
    onNodesChange: (nodes: Node[]) => void;
    onEdgesChange: (edges: Edge[]) => void;
    initialNodes: Node[];
    initialEdges: Edge[];
    nodeStatuses?: Record<string, NodeStatus>;
}

const lanes = [
    { id: 'market', label: 'Market Data', accent: 'var(--kraken-cyan)' },
    { id: 'logic', label: 'Logic', accent: 'var(--kraken-amber)' },
    { id: 'risk', label: 'Risk', accent: 'var(--kraken-purple)' },
    { id: 'execution', label: 'Execution', accent: 'var(--kraken-green)' },
];

const paletteGroups: Array<{
    title: string;
    dot: string;
    items: Array<{ type: string; label: string; helper: string; position: { x: number; y: number }; chip: string }>;
}> = [
    {
        title: 'Control',
        dot: 'var(--kraken-purple)',
        items: [
            {
                type: 'control.start',
                label: 'Strategy Start',
                helper: 'Entry control signal',
                position: { x: 80, y: 200 },
                chip: 'Control',
            },
        ],
    },
    {
        title: 'Market',
        dot: 'var(--kraken-cyan)',
        items: [
            {
                type: 'data.kraken.ticker',
                label: 'Market Data',
                helper: 'Kraken ticker snapshot',
                position: { x: 260, y: 200 },
                chip: 'Data',
            },
        ],
    },
    {
        title: 'Logic & Risk',
        dot: 'var(--kraken-amber)',
        items: [
            {
                type: 'logic.if',
                label: 'Condition',
                helper: 'Branch on price rule',
                position: { x: 520, y: 220 },
                chip: 'Logic',
            },
            {
                type: 'risk.guard',
                label: 'Orderbook Guard',
                helper: 'Block on wide spreads',
                position: { x: 720, y: 200 },
                chip: 'Risk',
            },
        ],
    },
    {
        title: 'Execution',
        dot: 'var(--kraken-green)',
        items: [
            {
                type: 'action.placeOrder',
                label: 'Execution',
                helper: 'Place Kraken order',
                position: { x: 940, y: 200 },
                chip: 'Action',
            },
            {
                type: 'action.cancelOrder',
                label: 'Order Control',
                helper: 'Cancel by ID',
                position: { x: 940, y: 320 },
                chip: 'Action',
            },
            {
                type: 'action.logIntent',
                label: 'Audit Log',
                helper: 'Record decision',
                position: { x: 980, y: 420 },
                chip: 'Audit',
            },
        ],
    },
];

function nodeHighlight(status?: NodeStatus): string {
    if (status === 'executed') return 'node-highlight-executed';
    if (status === 'running') return 'node-highlight-running';
    if (status === 'error') return 'node-highlight-error';
    return '';
}

export function FlowCanvas({
    onNodesChange,
    onEdgesChange,
    initialNodes,
    initialEdges,
    nodeStatuses,
}: FlowCanvasProps) {
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

    const edgeTypes = useMemo(
        () => ({
            control: StepEdge,
            data: SimpleBezierEdge,
        }),
        []
    );

    const isValidConnection = useCallback(
        (connection: Connection | Edge) => {
            if (!connection.sourceHandle || !connection.targetHandle) return false;

            const sourceType = connection.sourceHandle.split(':')[0];
            const targetType = connection.targetHandle.split(':')[0];

            if (sourceType !== targetType) return false;

            if (sourceType === 'data') {
                return !edges.some(
                    (e) =>
                        e.target === connection.target &&
                        e.targetHandle === connection.targetHandle
                );
            }

            return true;
        },
        [edges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isValidConnection(connection)) return;

            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        type: connection.sourceHandle?.startsWith('control')
                            ? 'control'
                            : 'data',
                        style: connection.sourceHandle?.startsWith('control')
                            ? { stroke: '#8a6aff', strokeWidth: 2 }
                            : { stroke: '#3bd7ff', strokeWidth: 2 },
                    },
                    eds
                )
            );
        },
        [isValidConnection, setEdges]
    );

    useEffect(() => {
        onNodesChange(nodes);
    }, [nodes, onNodesChange]);

    useEffect(() => {
        onEdgesChange(edges);
    }, [edges, onEdgesChange]);

    const handleAddNode = useCallback(
        (type: string, position: { x: number; y: number }) => {
            if (type === 'control.start') {
                const hasStart = nodes.some((n) => n.type === 'control.start');
                if (hasStart) {
                    alert('Only one Strategy Start is allowed.');
                    return;
                }
            }

            const id = `${type}-${Date.now()}`;
            let data: Record<string, unknown> = {};

            switch (type) {
                case 'data.kraken.ticker':
                    data = { pair: 'BTC/USD' };
                    break;
                case 'action.placeOrder':
                    data = { pair: 'BTC/USD', side: 'buy', type: 'market', amount: 0.1 };
                    break;
                case 'action.cancelOrder':
                    data = { orderId: '' };
                    break;
                case 'risk.guard':
                    data = { maxOrderSize: 5, maxTrades: 10, priceDeviation: 1.5 };
                    break;
                default:
                    data = {};
            }

            const newNode: Node = { id, type, position, data };
            setNodes((nds) => [...nds, newNode]);
        },
        [nodes, setNodes]
    );

    useEffect(() => {
        if (!nodeStatuses) return;
        setNodes((nds) =>
            nds.map((node) => {
                const status = nodeStatuses[node.id] || 'idle';
                return {
                    ...node,
                    data: { ...node.data, status },
                    className: nodeHighlight(status),
                };
            })
        );
    }, [nodeStatuses, setNodes]);

    const onNodesDelete = useCallback(
        (deleted: Node[]) => {
            const deletedIds = new Set(deleted.map((n) => n.id));
            setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
            setEdges((eds) =>
                eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
            );
        },
        [setNodes, setEdges]
    );

    const onEdgesDelete = useCallback(
        (deleted: Edge[]) => {
            const deletedIds = new Set(deleted.map((e) => e.id));
            setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
        },
        [setEdges]
    );

    return (
        <div className="canvas-panel">
            <div className="canvas-shell">
                <div className="lane-backdrop">
                    {lanes.map((lane, index) => (
                        <div key={lane.id} className="lane">
                            <div className="lane-label">
                                <span style={{ width: 10, height: 10, borderRadius: 6, background: lane.accent }} />
                                {index + 1}. {lane.label}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="palette-floating panel">
                    <div className="panel-title">Strategy Blocks</div>
                    <div className="palette-groups">
                        {paletteGroups.map((group) => (
                            <div key={group.title} className="palette-group">
                                <div className="palette-heading">
                                    <span className="dot" style={{ background: group.dot }} />
                                    {group.title}
                                </div>
                                <div className="node-palette">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.type}
                                            className="palette-item"
                                            onClick={() => handleAddNode(item.type, item.position)}
                                        >
                                            <div className="palette-label">
                                                <span>{item.label}</span>
                                                <span className="palette-subtitle">{item.helper}</span>
                                            </div>
                                            <span className="chip">{item.chip}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="canvas-toolbar">
                    <div className="toolbar-meta">
                        <span>Strategy Canvas</span>
                        <span>Market → Logic → Risk → Execution lanes</span>
                    </div>
                    <div className="toolbar-actions">
                        <span className="pill pill-ghost">Snap to grid</span>
                        <span className="pill pill-ghost">Delete: Backspace/Del</span>
                    </div>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    isValidConnection={isValidConnection}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesDelete={onNodesDelete}
                    onEdgesDelete={onEdgesDelete}
                    deleteKeyCode={['Backspace', 'Delete']}
                    nodesDraggable
                    nodesConnectable
                    elementsSelectable
                    fitView
                    snapToGrid
                    snapGrid={[20, 20]}
                >
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#20263a" />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}
