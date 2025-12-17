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
import { formatPair } from '../utils/format';

interface FlowCanvasProps {
    onNodesChange: (nodes: Node[]) => void;
    onEdgesChange: (edges: Edge[]) => void;
    initialNodes: Node[];
    initialEdges: Edge[];
    nodeStatuses?: Record<string, NodeStatus>;
    activePair?: string;
    running?: boolean;
    nodesCount?: number;
}

const lanes = [
    { id: 'market', label: 'Market Data' },
    { id: 'logic', label: 'Logic' },
    { id: 'risk', label: 'Risk' },
    { id: 'execution', label: 'Execution' },
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
    activePair,
    running,
    nodesCount,
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
                            ? { stroke: '#8f6bff', strokeWidth: 2 }
                            : { stroke: '#3bc9db', strokeWidth: 2 },
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
                    {lanes.map((lane) => (
                        <div key={lane.id} className="lane">
                            <div className="lane-label">{lane.label}</div>
                        </div>
                    ))}
                </div>
                <div className="canvas-topbar">
                    <div>
                        <div className="eyebrow">Strategy canvas</div>
                        <div className="canvas-title">{activePair ? formatPair(activePair) : 'Pair agnostic'}</div>
                        <div className="muted">Design from market intake through guardrails to execution.</div>
                    </div>
                    <div className="canvas-top-meta">
                        <div className="meta-tile">
                            <span className="muted">Nodes</span>
                            <strong>{nodesCount ?? nodes.length}</strong>
                        </div>
                        <div className="meta-tile">
                            <span className="muted">Mode</span>
                            <span className={`pill ${running ? 'pill-warn' : 'pill-ghost'}`}>
                                {running ? 'Running dry-run' : 'Ready'}
                            </span>
                        </div>
                        <div className="handle-legend">
                            <span className="legend-chip">
                                <span className="legend-dot control" /> Control
                            </span>
                            <span className="legend-chip">
                                <span className="legend-dot data" /> Data
                            </span>
                            <span className="legend-chip muted">Grid 20px</span>
                        </div>
                    </div>
                </div>
                <div className="palette-floating panel">
                    <div className="panel-title">Strategy Blocks</div>
                    <div className="node-palette">
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('control.start', { x: 80, y: 200 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">▶</div>
                                <div>
                                    <div className="palette-title">Strategy Start</div>
                                    <div className="palette-subtitle">Single entry control</div>
                                </div>
                            </div>
                            <span className="palette-chip">Control</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('data.kraken.ticker', { x: 260, y: 200 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">$</div>
                                <div>
                                    <div className="palette-title">Market Data</div>
                                    <div className="palette-subtitle">Kraken ticker stream</div>
                                </div>
                            </div>
                            <span className="palette-chip">Data</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('logic.if', { x: 520, y: 220 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">?</div>
                                <div>
                                    <div className="palette-title">Condition</div>
                                    <div className="palette-subtitle">True/false routing</div>
                                </div>
                            </div>
                            <span className="palette-chip">Logic</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('risk.guard', { x: 720, y: 200 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">⚑</div>
                                <div>
                                    <div className="palette-title">Risk Guard</div>
                                    <div className="palette-subtitle">Spread protection</div>
                                </div>
                            </div>
                            <span className="palette-chip">Risk</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.placeOrder', { x: 940, y: 200 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">✓</div>
                                <div>
                                    <div className="palette-title">Execution</div>
                                    <div className="palette-subtitle">Prepare intent</div>
                                </div>
                            </div>
                            <span className="palette-chip">Action</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.cancelOrder', { x: 940, y: 320 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">✕</div>
                                <div>
                                    <div className="palette-title">Order Control</div>
                                    <div className="palette-subtitle">Cancel prepared order</div>
                                </div>
                            </div>
                            <span className="palette-chip">Action</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.logIntent', { x: 940, y: 420 })}
                        >
                            <div className="palette-label">
                                <div className="palette-icon">ℹ</div>
                                <div>
                                    <div className="palette-title">Audit Log</div>
                                    <div className="palette-subtitle">Record intent</div>
                                </div>
                            </div>
                            <span className="palette-chip">Audit</span>
                        </div>
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
