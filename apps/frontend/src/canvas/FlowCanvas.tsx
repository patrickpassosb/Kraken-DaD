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
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);

            if (!sourceNode || !targetNode) return false;

            const sourcePortType = getPortType(
                sourceNode.type || '',
                connection.sourceHandle || ''
            );
            const targetPortType = getPortType(
                targetNode.type || '',
                connection.targetHandle || ''
            );

            // Only allow connections between same port types
            if (sourcePortType !== targetPortType) {
                return false;
            }

            // Check if target port already has a connection
            const hasExistingConnection = edges.some(
                (e) =>
                    e.target === connection.target &&
                    e.targetHandle === connection.targetHandle
            );

            return !hasExistingConnection;
        },
        [nodes, edges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isValidConnection(connection)) {
                return;
            }

            const sourceNode = nodes.find((n) => n.id === connection.source);
            const portType = sourceNode
                ? getPortType(sourceNode.type || '', connection.sourceHandle || '')
                : 'data';

            const edge: Edge = {
                ...connection,
                id: `e-${connection.source}-${connection.target}-${Date.now()}`,
                style: {
                    stroke: portType === 'control' ? '#ff9100' : '#00e676',
                    strokeWidth: 2,
                },
            } as Edge;

            setEdges((eds) => addEdge(edge, eds));
        },
        [nodes, setEdges, isValidConnection]
    );

    // Sync state changes to parent
    const handleNodesChangeWrapper = useCallback(
        (changes: Parameters<typeof handleNodesChange>[0]) => {
            handleNodesChange(changes);
            setTimeout(() => onNodesChange(nodes), 0);
        },
        [handleNodesChange, onNodesChange, nodes]
    );

    const handleEdgesChangeWrapper = useCallback(
        (changes: Parameters<typeof handleEdgesChange>[0]) => {
            handleEdgesChange(changes);
            setTimeout(() => onEdgesChange(edges), 0);
        },
        [handleEdgesChange, onEdgesChange, edges]
    );

    // Update parent when nodes/edges change
    useMemo(() => {
        onNodesChange(nodes);
    }, [nodes, onNodesChange]);

    useMemo(() => {
        onEdgesChange(edges);
    }, [edges, onEdgesChange]);

    const addNode = useCallback(
        (type: string, position: { x: number; y: number }) => {
            const id = `${type}-${Date.now()}`;
            const newNode: Node = {
                id,
                type,
                position,
                data: type === 'data.kraken.ticker' ? { pair: 'XBT/USD' } : {},
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
                    className="palette-item action"
                    onClick={() => addNode('action.logIntent', { x: 50, y: 300 })}
                >
                    Log Intent
                </div>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChangeWrapper}
                onEdgesChange={handleEdgesChangeWrapper}
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
