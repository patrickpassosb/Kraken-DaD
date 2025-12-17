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
                <div className="palette-floating panel">
                    <div className="panel-title">Strategy Blocks</div>
                    <div className="node-palette">
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('control.start', { x: 80, y: 200 })}
                        >
                            <div>
                                <div className="palette-label">Strategy Start</div>
                                <div className="palette-desc">Kick off the control lane.</div>
                            </div>
                            <span className="palette-hotkey">Control</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('data.kraken.ticker', { x: 260, y: 200 })}
                        >
                            <div>
                                <div className="palette-label">Market Data</div>
                                <div className="palette-desc">Live Kraken ticker snapshot.</div>
                            </div>
                            <span className="palette-hotkey">Data</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('logic.if', { x: 520, y: 220 })}
                        >
                            <div>
                                <div className="palette-label">Condition</div>
                                <div className="palette-desc">Human-readable rule.</div>
                            </div>
                            <span className="palette-hotkey">Logic</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('risk.guard', { x: 720, y: 200 })}
                        >
                            <div>
                                <div className="palette-label">Risk Guard</div>
                                <div className="palette-desc">Max spread and guardrails.</div>
                            </div>
                            <span className="palette-hotkey">Risk</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.placeOrder', { x: 940, y: 200 })}
                        >
                            <div>
                                <div className="palette-label">Execution</div>
                                <div className="palette-desc">Route to Kraken order.</div>
                            </div>
                            <span className="palette-hotkey">Action</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.cancelOrder', { x: 940, y: 320 })}
                        >
                            <div>
                                <div className="palette-label">Order Control</div>
                                <div className="palette-desc">Cancel open intent.</div>
                            </div>
                            <span className="palette-hotkey">Action</span>
                        </div>
                        <div
                            className="palette-item"
                            onClick={() => handleAddNode('action.logIntent', { x: 940, y: 420 })}
                        >
                            <div>
                                <div className="palette-label">Audit Log</div>
                                <div className="palette-desc">Capture decisions.</div>
                            </div>
                            <span className="palette-hotkey">Audit</span>
                        </div>
                    </div>
                </div>
                <div className="edge-legend">
                    <div className="legend-item">
                        <span className="legend-swatch" style={{ background: 'var(--kraken-purple)' }} /> Control flow
                    </div>
                    <div className="legend-item">
                        <span className="legend-swatch" style={{ background: 'var(--kraken-cyan)' }} /> Data link
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
