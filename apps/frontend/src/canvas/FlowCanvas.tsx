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
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FlowEdge from '../edges/FlowEdge';
import { NodeActionProvider } from '../context/NodeActionContext';
import { nodeTypes } from '../nodes/nodeTypes';
import {
    buildTemplateEdges,
    buildTemplateNodes,
    createNodeWithDefaults,
    nodeDefinitionMap,
    paletteGroups,
    type NodeTypeId,
} from '../nodes/nodeRegistry';
import { NodeStatus } from '../utils/status';

interface FlowCanvasProps {
    onNodesChange: (nodes: Node[]) => void;
    onEdgesChange: (edges: Edge[]) => void;
    initialNodes: Node[];
    initialEdges: Edge[];
    nodeStatuses?: Record<string, NodeStatus>;
    activePair?: string;
    onRunNode?: (nodeId: string) => void;
}

const lanes = [
    { id: 'market', label: 'Market' },
    { id: 'logic', label: 'Logic' },
    { id: 'risk', label: 'Risk' },
    { id: 'execution', label: 'Execution' },
];

type PendingInsert = {
    edgeId: string;
    position: { x: number; y: number };
};

type InsertHandles = { in: string; out: string };

const EDGE_STYLE_CONTROL = { stroke: '#8f6bff', strokeWidth: 2 };
const EDGE_STYLE_DATA = { stroke: '#3bc9db', strokeWidth: 2 };

const CONTROL_INSERT_HANDLES: Record<NodeTypeId, InsertHandles | null> = {
    'control.start': null,
    'data.kraken.ticker': { in: 'control:in', out: 'control:out' },
    'logic.if': { in: 'control:in', out: 'control:true' },
    'risk.guard': { in: 'control:in', out: 'control:out' },
    'action.placeOrder': null,
    'action.cancelOrder': null,
    'action.logIntent': null,
};

function edgeStyleForType(type?: string) {
    return type === 'control' ? EDGE_STYLE_CONTROL : EDGE_STYLE_DATA;
}

function nodeHighlight(status?: NodeStatus): string {
    if (status === 'executed') return 'node-highlight-executed';
    if (status === 'running') return 'node-highlight-running';
    if (status === 'error') return 'node-highlight-error';
    return '';
}

function nodeClassName(status?: NodeStatus, disabled?: boolean): string {
    const classes = [];
    const highlight = nodeHighlight(status);
    if (highlight) classes.push(highlight);
    if (disabled) classes.push('node-disabled');
    return classes.join(' ');
}

function laneIndexForType(type?: string): number {
    if (!type) return 0;
    if (type.startsWith('control')) return 0;
    if (type.startsWith('data')) return 1;
    if (type.startsWith('logic') || type.startsWith('risk')) return 2;
    if (type.startsWith('action')) return 3;
    return 4;
}

const GRID_SIZE = 20;
const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export function FlowCanvas({
    onNodesChange,
    onEdgesChange,
    initialNodes,
    initialEdges,
    nodeStatuses,
    activePair = 'BTC/USD',
    onRunNode,
}: FlowCanvasProps) {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [paletteSearch, setPaletteSearch] = useState('');
    const [pendingInsert, setPendingInsert] = useState<PendingInsert | null>(null);
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
    const { fitView } = useReactFlow();

    const edgeTypes = useMemo(
        () => ({
            control: FlowEdge,
            data: FlowEdge,
        }),
        []
    );

    const handleEdgeInsertRequest = useCallback(
        (edgeId: string, position: { x: number; y: number }) => {
            setPendingInsert({ edgeId, position });
            setPaletteOpen(true);
            setPaletteSearch('');
        },
        [setPaletteOpen, setPaletteSearch, setPendingInsert]
    );

    const edgesWithActions = useMemo(
        () =>
            edges.map((edge) => ({
                ...edge,
                data: { ...(edge.data as Record<string, unknown>), onInsert: handleEdgeInsertRequest },
            })),
        [edges, handleEdgeInsertRequest]
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

            const edgeType = connection.sourceHandle?.startsWith('control') ? 'control' : 'data';
            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        type: edgeType,
                        style: edgeStyleForType(edgeType),
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
        const templateNodes = buildTemplateNodes().map((node) => {
            if (node.data && typeof node.data === 'object' && 'pair' in node.data) {
                return { ...node, data: { ...node.data, pair: activePair } };
            }
            return node;
        });
        setNodes(templateNodes);
        setEdges(buildTemplateEdges());
        setPaletteOpen(false);
        setPendingInsert(null);
        fitView({ padding: 0.2, duration: 300 });
    }, [activePair, fitView, setEdges, setNodes, setPendingInsert]);

    const handleAddNode = useCallback(
        (type: string, position?: { x: number; y: number }) => {
            const meta = nodeDefinitionMap[type];
            if (!meta) return;

            if (type === 'control.start') {
                const hasStart = nodes.some((n) => n.type === 'control.start');
                if (hasStart) {
                    alert('Only one Strategy Start is allowed.');
                    return;
                }
            }

            const id = `${type}-${Date.now()}`;
            const insertEdge = pendingInsert
                ? edges.find((edge) => edge.id === pendingInsert.edgeId)
                : undefined;
            const insertHandles =
                insertEdge && insertEdge.type === 'control'
                    ? CONTROL_INSERT_HANDLES[type as NodeTypeId]
                    : null;
            const insertPosition = pendingInsert?.position
                ? { x: pendingInsert.position.x - 140, y: pendingInsert.position.y - 80 }
                : undefined;
            if (pendingInsert && (!insertEdge || !insertHandles)) {
                setPendingInsert(null);
            }
            const targetPosition = pendingInsert ? insertPosition : position;
            const newNode = createNodeWithDefaults(meta.type, id, targetPosition);
            if (newNode.data && typeof newNode.data === 'object') {
                if ('pair' in newNode.data) {
                    (newNode.data as Record<string, unknown>).pair = activePair;
                }
            }
            setNodes((nds) => [...nds, newNode]);
            if (pendingInsert && insertEdge && insertHandles) {
                const edgeType = insertEdge.type ?? 'control';
                const style = insertEdge.style ?? edgeStyleForType(edgeType);
                setEdges((eds) => {
                    const withoutEdge = eds.filter((edge) => edge.id !== insertEdge.id);
                    const edgeIn: Edge = {
                        id: `e-${insertEdge.source}-${id}-in`,
                        source: insertEdge.source,
                        sourceHandle: insertEdge.sourceHandle,
                        target: id,
                        targetHandle: insertHandles.in,
                        type: edgeType,
                        style,
                    };
                    const edgeOut: Edge = {
                        id: `e-${id}-${insertEdge.target}-out`,
                        source: id,
                        sourceHandle: insertHandles.out,
                        target: insertEdge.target,
                        targetHandle: insertEdge.targetHandle,
                        type: edgeType,
                        style,
                    };
                    return [...withoutEdge, edgeIn, edgeOut];
                });
                setPendingInsert(null);
                setPaletteOpen(false);
                return;
            }
        },
        [activePair, edges, nodes, pendingInsert, setEdges, setNodes, setPendingInsert]
    );

    useEffect(() => {
        if (!nodeStatuses) return;
        setNodes((nds) =>
            nds.map((node) => {
                const status = nodeStatuses[node.id] || 'idle';
                const disabled =
                    node.data && typeof node.data === 'object'
                        ? Boolean((node.data as Record<string, unknown>).disabled)
                        : false;
                return {
                    ...node,
                    data: { ...node.data, status },
                    className: nodeClassName(status, disabled),
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

    const handleRunNode = useCallback(
        (nodeId: string) => {
            onRunNode?.(nodeId);
        },
        [onRunNode]
    );

    const handleToggleNodeDisabled = useCallback(
        (nodeId: string) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id !== nodeId) return node;
                    const data =
                        node.data && typeof node.data === 'object'
                            ? (node.data as Record<string, unknown>)
                            : {};
                    const disabled = !Boolean(data.disabled);
                    const status = data.status as NodeStatus | undefined;
                    return {
                        ...node,
                        data: { ...data, disabled },
                        className: nodeClassName(status, disabled),
                    };
                })
            );
        },
        [setNodes]
    );

    const handleDeleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        },
        [setEdges, setNodes]
    );

    const handleFitView = useCallback(() => {
        if (nodes.length === 0) {
            fitView({ padding: 0.9, minZoom: 0.8, maxZoom: 1.2 });
        } else {
            fitView({ padding: 0.2, duration: 300 });
        }
    }, [fitView, nodes.length]);

    const handleTidyLayout = useCallback(() => {
        if (nodes.length === 0) {
            handleFitView();
            return;
        }

        const controlEdges = edges.filter((e) => e.type === 'control');
        const incoming = new Map<string, string[]>();
        controlEdges.forEach(({ source, target }) => {
            incoming.set(target, [...(incoming.get(target) ?? []), source]);
        });

        const memo = new Map<string, number>();
        const visiting = new Set<string>();
        const depthFor = (id: string): number => {
            if (memo.has(id)) return memo.get(id) ?? 0;
            if (visiting.has(id)) return 0;
            visiting.add(id);
            const parents = incoming.get(id) ?? [];
            const depth = parents.length
                ? Math.max(...parents.map((parent) => depthFor(parent) + 1))
                : 0;
            visiting.delete(id);
            memo.set(id, depth);
            return depth;
        };

        const columns = new Map<number, Node[]>();
        nodes.forEach((node) => {
            const laneIndex = laneIndexForType(node.type);
            const controlDepth = depthFor(node.id);
            const column = Math.max(laneIndex, controlDepth);
            const bucket = columns.get(column) ?? [];
            bucket.push(node);
            columns.set(column, bucket);
        });

        const layoutPositions = new Map<string, { x: number; y: number }>();
        const xStart = 240;
        const yStart = 160;
        const xSpacing = 260;
        const ySpacing = 180;

        Array.from(columns.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([col, bucket]) => {
                bucket
                    .sort(
                        (a, b) =>
                            (a.position?.y ?? 0) - (b.position?.y ?? 0) ||
                            a.id.localeCompare(b.id)
                    )
                    .forEach((node, idx) => {
                        layoutPositions.set(node.id, {
                            x: snapToGrid(xStart + col * xSpacing),
                            y: snapToGrid(yStart + idx * ySpacing),
                        });
                    });
            });

        setNodes((nds) =>
            nds.map((node) => {
                const next = layoutPositions.get(node.id);
                if (!next) return node;
                return { ...node, position: next, dragging: false };
            })
        );

        requestAnimationFrame(() => {
            fitView({ padding: 0.2, duration: 300 });
        });
    }, [edges, fitView, handleFitView, nodes, setNodes]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'r' || key === 't') {
                const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                e.preventDefault();
                if (key === 'r') {
                    handleFitView();
                } else {
                    handleTidyLayout();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleFitView, handleTidyLayout]);

    const insertableTypes = useMemo(() => {
        if (!pendingInsert) return null;
        const edge = edges.find((item) => item.id === pendingInsert.edgeId);
        if (!edge || edge.type !== 'control') return new Set<string>();
        return new Set(
            Object.entries(CONTROL_INSERT_HANDLES)
                .filter(([, handles]) => handles)
                .map(([type]) => type)
        );
    }, [edges, pendingInsert]);

    const filteredGroups = useMemo(() => {
        const term = paletteSearch.trim().toLowerCase();
        const matchesInsert = (type: string) =>
            !insertableTypes || insertableTypes.has(type);
        return paletteGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    if (!matchesInsert(item.type)) return false;
                    if (!term) return true;
                    return (
                        item.label.toLowerCase().includes(term) ||
                        item.role.toLowerCase().includes(term) ||
                        item.description.toLowerCase().includes(term)
                    );
                }),
            }))
            .filter((g) => g.items.length > 0);
    }, [insertableTypes, paletteSearch]);

    return (
        <div className="canvas-panel">
            <div className="canvas-shell">
                <button
                    className="palette-toggle btn btn-ghost"
                    onClick={() =>
                        setPaletteOpen((v) => {
                            if (v) setPendingInsert(null);
                            return !v;
                        })
                    }
                >
                    {paletteOpen ? 'Hide Strategy Blocks' : 'Show Strategy Blocks'}
                </button>
                <div className="canvas-controls">
                    <button className="tidy-control btn btn-ghost" onClick={handleTidyLayout} title="Tidy Up (T)">
                        <span>Tidy Up</span>
                        <span className="key-hint">T</span>
                    </button>
                    <button className="recenter-control btn btn-ghost" onClick={handleFitView} title="Recenter (R)">
                        <span>Recenter</span>
                        <span className="key-hint">R</span>
                    </button>
                </div>
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
                        {pendingInsert && (
                            <div className="palette-insert-banner">
                                <span>Insert into selected control line</span>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setPendingInsert(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
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
                                        onClick={() => handleAddNode(item.type, item.defaultPosition)}
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
                <NodeActionProvider
                    value={{
                        runNode: handleRunNode,
                        toggleNodeDisabled: handleToggleNodeDisabled,
                        deleteNode: handleDeleteNode,
                    }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edgesWithActions}
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
                </NodeActionProvider>
            </div>
        </div>
    );
}
