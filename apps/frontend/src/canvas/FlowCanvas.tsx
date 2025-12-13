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

interface FlowCanvasProps {
    onNodesChange: (nodes: Node[]) => void;
    onEdgesChange: (edges: Edge[]) => void;
    initialNodes: Node[];
    initialEdges: Edge[];
}

export function FlowCanvas({
    onNodesChange,
    onEdgesChange,
    initialNodes,
    initialEdges,
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

    const isControlEdge = useCallback((edge: Edge) => {
        const sourceHandle = edge.sourceHandle || '';
        const targetHandle = edge.targetHandle || '';
        return (
            sourceHandle.startsWith('control') ||
            targetHandle.startsWith('control') ||
            edge.type === 'control'
        );
    }, []);

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
                            ? { stroke: '#ff9100', strokeWidth: 2 }
                            : { stroke: '#00e676', strokeWidth: 2 },
                    },
                    eds
                )
            );
        },
        [isValidConnection, setEdges]
    );

    // Sync state changes to parent
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
                    alert('Only one Start node is allowed.');
                    return;
                }
            }

            const id = `${type}-${Date.now()}`;
            let data: Record<string, unknown> = {};

            switch (type) {
                case 'data.kraken.ticker':
                    data = { pair: 'XBT/USD' };
                    break;
                case 'action.placeOrder':
                    data = { pair: 'XBT/USD', side: 'buy', type: 'market', amount: 0.1 };
                    break;
                case 'action.cancelOrder':
                    data = { orderId: '' };
                    break;
            }

            const newNode: Node = { id, type, position, data };
            setNodes((nds) => [...nds, newNode]);
        },
        [nodes, setNodes]
    );

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const hasControlEdge = edges.some(
                    (e) =>
                        isControlEdge(e) &&
                        (e.source === node.id || e.target === node.id)
                );
                const isOrphan = !hasControlEdge && nds.length > 1;
                const nextStyle = isOrphan
                    ? {
                          ...node.style,
                          border: '1px solid #ff5252',
                          boxShadow: '0 0 0 2px rgba(255,82,82,0.4)',
                      }
                    : { ...node.style };

                if (JSON.stringify(nextStyle) === JSON.stringify(node.style ?? {})) {
                    return node;
                }
                return { ...node, style: nextStyle };
            })
        );
    }, [edges, isControlEdge, setNodes]);

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
        <div className="canvas-container">
            <div className="node-palette">
                <h4>Add Nodes</h4>
                <div
                    className="palette-item control"
                    onClick={() => handleAddNode('control.start', { x: 50, y: 100 })}
                >
                    Start
                </div>
                <div
                    className="palette-item data"
                    onClick={() => handleAddNode('data.kraken.ticker', { x: 50, y: 200 })}
                >
                    Kraken Ticker
                </div>
                <div
                    className="palette-item"
                    style={{ borderLeft: '3px solid #ffd700' }}
                    onClick={() => handleAddNode('logic.if', { x: 50, y: 300 })}
                >
                    If
                </div>
                <div
                    className="palette-item action"
                    onClick={() => handleAddNode('action.placeOrder', { x: 50, y: 400 })}
                >
                    Place Order
                </div>
                <div
                    className="palette-item action"
                    onClick={() => handleAddNode('action.cancelOrder', { x: 50, y: 500 })}
                >
                    Cancel Order
                </div>
                <div
                    className="palette-item action"
                    onClick={() => handleAddNode('action.logIntent', { x: 50, y: 600 })}
                >
                    Log Intent
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
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                <Controls />
            </ReactFlow>
        </div>
    );
}
