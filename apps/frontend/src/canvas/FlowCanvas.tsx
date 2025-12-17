import { useCallback, useEffect, useMemo, useState } from 'react';
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
    useReactFlow,
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
    { id: 'market', label: 'Market' },
    { id: 'logic', label: 'Logic' },
    { id: 'risk', label: 'Risk' },
    { id: 'execution', label: 'Execution' },
];

const paletteGroups = [
    {
        id: 'control',
        label: 'CONTROL',
        items: [
            {
                type: 'control.start',
                label: 'Strategy Start',
                role: 'Control',
                description: 'Kick off control lane',
                icon: '▶',
                position: { x: 360, y: 260 },
            },
        ],
    },
    {
        id: 'market',
        label: 'MARKET',
        items: [
            {
                type: 'data.kraken.ticker',
                label: 'Market Data',
                role: 'Data',
                description: 'Live Kraken ticker snapshot',
                icon: '$',
                position: { x: 560, y: 240 },
            },
        ],
    },
    {
        id: 'logic',
        label: 'LOGIC & RISK',
        items: [
            {
                type: 'logic.if',
                label: 'Condition (IF)',
                role: 'Logic',
                description: 'Branch on price rule (true/false)',
                icon: '?',
                position: { x: 800, y: 260 },
            },
            {
                type: 'risk.guard',
                label: 'Orderbook Guard',
                role: 'Risk',
                description: 'Block on wide spreads',
                icon: '⚑',
                position: { x: 1040, y: 240 },
            },
        ],
    },
    {
        id: 'execution',
        label: 'EXECUTION',
        items: [
            {
                type: 'action.placeOrder',
                label: 'Execution',
                role: 'Action',
                description: 'Prepare Kraken order intent',
                icon: '✓',
                position: { x: 1260, y: 240 },
            },
            {
                type: 'action.cancelOrder',
                label: 'Order Control',
                role: 'Action',
                description: 'Cancel intent by ID',
                icon: '⤺',
                position: { x: 1260, y: 360 },
            },
            {
                type: 'action.logIntent',
                label: 'Audit Log',
                role: 'Audit',
                description: 'Record audit trail',
                icon: '✎',
                position: { x: 1280, y: 500 },
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
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [paletteSearch, setPaletteSearch] = useState('');
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
    const { fitView } = useReactFlow();

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

    const handleLoadTemplate = useCallback(() => {
        const templateNodes: Node[] = [
            { id: 'start-template', type: 'control.start', position: { x: 360, y: 260 }, data: {} },
            { id: 'ticker-template', type: 'data.kraken.ticker', position: { x: 560, y: 240 }, data: { pair: 'BTC/USD' } },
            { id: 'if-template', type: 'logic.if', position: { x: 780, y: 260 }, data: { comparator: '>', threshold: 90000 } },
            { id: 'order-template', type: 'action.placeOrder', position: { x: 1000, y: 260 }, data: { pair: 'BTC/USD', side: 'buy', type: 'market', amount: 0.1 } },
        ];
        const templateEdges: Edge[] = [
            { id: 'e-start-ticker-template', source: 'start-template', sourceHandle: 'control:out', target: 'ticker-template', targetHandle: 'control:in', type: 'control' },
            { id: 'e-ticker-if-control-template', source: 'ticker-template', sourceHandle: 'control:out', target: 'if-template', targetHandle: 'control:in', type: 'control' },
            { id: 'e-if-order-template', source: 'if-template', sourceHandle: 'control:true', target: 'order-template', targetHandle: 'control:trigger', type: 'control' },
            { id: 'e-ticker-if-data-template', source: 'ticker-template', sourceHandle: 'data:price', target: 'if-template', targetHandle: 'data:condition', type: 'data' },
            { id: 'e-ticker-order-data-template', source: 'ticker-template', sourceHandle: 'data:price', target: 'order-template', targetHandle: 'data:price', type: 'data' },
        ];
        setNodes(templateNodes);
        setEdges(templateEdges);
        setPaletteOpen(false);
        fitView({ padding: 0.2, duration: 300 });
    }, [fitView, setEdges, setNodes]);

    const handleAddNode = useCallback(
        (type: string, position?: { x: number; y: number }) => {
            if (type === 'control.start') {
                const hasStart = nodes.some((n) => n.type === 'control.start');
                if (hasStart) {
                    alert('Only one Strategy Start is allowed.');
                    return;
                }
            }

            const id = `${type}-${Date.now()}`;
            let data: Record<string, unknown> = {};
            const targetPosition = position ?? { x: 360, y: 260 };

            switch (type) {
                case 'data.kraken.ticker':
                    data = { pair: 'BTC/USD' };
                    break;
                case 'logic.if':
                    data = { comparator: '>', threshold: 90000 };
                    break;
                case 'action.placeOrder':
                    data = { pair: 'BTC/USD', side: 'buy', type: 'market', amount: 0.1 };
                    break;
                case 'action.cancelOrder':
                    data = { orderId: '' };
                    break;
                case 'risk.guard':
                    data = { pair: 'BTC/USD', maxSpread: 5 };
                    break;
                case 'action.logIntent':
                    data = { note: 'Capture execution intent' };
                    break;
                default:
                    data = {};
            }

            const newNode: Node = { id, type, position: targetPosition, data };
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

    const handleFitView = useCallback(() => {
        if (nodes.length === 0) {
            fitView({ padding: 0.9, minZoom: 0.8, maxZoom: 1.2 });
        } else {
            fitView({ padding: 0.2, duration: 300 });
        }
    }, [fitView, nodes.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                e.preventDefault();
                handleFitView();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleFitView]);

    const filteredGroups = useMemo(() => {
        const term = paletteSearch.trim().toLowerCase();
        if (!term) return paletteGroups;
        return paletteGroups
            .map((group) => ({
                ...group,
                items: group.items.filter(
                    (item) =>
                        item.label.toLowerCase().includes(term) ||
                        item.role.toLowerCase().includes(term) ||
                        item.description.toLowerCase().includes(term)
                ),
            }))
            .filter((g) => g.items.length > 0);
    }, [paletteSearch]);

    return (
        <div className="canvas-panel">
            <div className="canvas-shell">
                <button className="palette-toggle btn btn-ghost" onClick={() => setPaletteOpen((v) => !v)}>
                    {paletteOpen ? 'Hide Strategy Blocks' : 'Show Strategy Blocks'}
                </button>
                <button className="recenter-control btn btn-ghost" onClick={handleFitView} title="Recenter (R)">
                    <span>Recenter</span>
                    <span className="key-hint">R</span>
                </button>
                <div className="lane-backdrop">
                    {lanes.map((lane) => (
                        <div key={lane.id} className="lane">
                            <div className="lane-label">{lane.label}</div>
                        </div>
                    ))}
                </div>
                {paletteOpen && (
                    <div className="palette-floating panel">
                        <div className="panel-title">Strategy Blocks</div>
                        <input
                            className="palette-search"
                            placeholder="Search blocks..."
                            value={paletteSearch}
                            onChange={(e) => setPaletteSearch(e.target.value)}
                        />
                        <div className="node-palette">
                            {filteredGroups.map((group) => (
                                <div key={group.id} className={`palette-group palette-${group.id}`}>
                                    <div className="palette-group-title">{group.label}</div>
                                    {group.items.map((item) => (
                                        <div
                                        key={item.type + item.label}
                                        className="palette-item"
                                        onClick={() => handleAddNode(item.type, item.position)}
                                        title={`${item.label} — ${item.description}`}
                                    >
                                        <div className="palette-icon">{item.icon}</div>
                                        <div className="palette-text">
                                            <div className="palette-label">{item.label}</div>
                                            <div className="palette-subtext">{item.description}</div>
                                        </div>
                                        <span className={`palette-role role-${item.role.toLowerCase()}`}>
                                                {item.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {nodes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-card">
                            <div className="empty-title">Add first step</div>
                            <div className="empty-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleAddNode('control.start', { x: 520, y: 320 })}
                                >
                                    Add Strategy Start
                                </button>
                                <button className="btn btn-ghost" onClick={handleLoadTemplate}>
                                    Start with template
                                </button>
                                <button className="btn btn-ghost" onClick={() => setPaletteOpen(true)}>
                                    Open Strategy Blocks
                                </button>
                            </div>
                            <div className="empty-subtext">Or start from a template once blocks are defined.</div>
                        </div>
                    </div>
                )}
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
