import { useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { getPortType } from '../utils/toStrategyJSON';

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

    const isValidConnection = useCallback(
        (connection: Connection) => {
            const sourceHandle = connection.sourceHandle || '';
            const targetHandle = connection.targetHandle || '';

            // Get port types from handle IDs
            const sourcePortType = getPortType(sourceHandle);
            const targetPortType = getPortType(targetHandle);

            // Only allow connections between same port types
            if (sourcePortType !== targetPortType) {
                console.log(`Blocked: ${sourcePortType} → ${targetPortType}`);
                return false;
            }

            // Check if target port already has a connection
            const hasExistingConnection = edges.some(
                (e) =>
                    e.target === connection.target &&
                    e.targetHandle === connection.targetHandle
            );

            if (hasExistingConnection) {
                console.log('Blocked: target port already connected');
                return false;
            }

            return true;
        },
        [edges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isValidConnection(connection)) {
                return;
            }

            const sourceHandle = connection.sourceHandle || '';
            const portType = getPortType(sourceHandle);

            const edge: Edge = {
                ...connection,
                id: `e-${connection.source}-${connection.target}-${Date.now()}`,
                type: portType === 'control' ? 'step' : 'default',
                style: {
                    stroke: portType === 'control' ? '#ff9100' : '#00e676',
                    strokeWidth: 2,
                },
            } as Edge;

            setEdges((eds) => addEdge(edge, eds));
        },
        [setEdges, isValidConnection]
    );

    // Sync state changes to parent
    useMemo(() => {
        onNodesChange(nodes);
    }, [nodes, onNodesChange]);

    useMemo(() => {
        onEdgesChange(edges);
    }, [edges, onEdgesChange]);

    const addNode = useCallback(
        (type: string, position: { x: number; y: number }) => {
            const id = `${type}-${Date.now()}`;
            let data: Record<string, unknown> = {};

            // Set default data based on node type
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

            const newNode: Node = {
                id,
                type,
                position,
                data,
            };
            setNodes((nds) => [...nds, newNode]);
        },
        [setNodes]
    );

    return (
        <div className="canvas-container">
            <div className="node-palette">
                <h4>Add Nodes</h4>
                <div
                    className="palette-item control"
                    onClick={() => addNode('control.start', { x: 50, y: 100 })}
                >
                    Start
                </div>
                <div
                    className="palette-item data"
                    onClick={() => addNode('data.kraken.ticker', { x: 50, y: 200 })}
                >
                    Kraken Ticker
                </div>
                <div
                    className="palette-item"
                    style={{ borderLeft: '3px solid #ffd700' }}
                    onClick={() => addNode('logic.if', { x: 50, y: 300 })}
                >
                    If
                </div>
                <div
                    className="palette-item action"
                    onClick={() => addNode('action.placeOrder', { x: 50, y: 400 })}
                >
                    Place Order
                </div>
                <div
                    className="palette-item action"
                    onClick={() => addNode('action.cancelOrder', { x: 50, y: 500 })}
                >
                    Cancel Order
                </div>
                <div
                    className="palette-item action"
                    onClick={() => addNode('action.logIntent', { x: 50, y: 600 })}
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
