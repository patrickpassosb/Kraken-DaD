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
import { BlockIcon } from '../components/BlockIcon';

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

type ImpliedDataEdge = {
    source: NodeTypeId;
    target: NodeTypeId;
    sourcePort: string;
    targetPort: string;
};

const IMPLIED_DATA_EDGES: ImpliedDataEdge[] = [
    {
        source: 'data.kraken.ticker',
        target: 'logic.if',
        sourcePort: 'price',
        targetPort: 'condition',
    },
    {
        source: 'data.kraken.ohlc',
        target: 'logic.movingAverage',
        sourcePort: 'closeSeries',
        targetPort: 'series',
    },
    {
        source: 'data.constant',
        target: 'logic.if',
        sourcePort: 'value',
        targetPort: 'threshold',
    },
    {
        source: 'data.kraken.ticker',
        target: 'action.placeOrder',
        sourcePort: 'price',
        targetPort: 'price',
    },
    {
        source: 'data.constant',
        target: 'action.placeOrder',
        sourcePort: 'value',
        targetPort: 'price',
    },
    {
        source: 'data.constant',
        target: 'action.logIntent',
        sourcePort: 'value',
        targetPort: 'price',
    },
    {
        source: 'action.placeOrder',
        target: 'action.cancelOrder',
        sourcePort: 'orderId',
        targetPort: 'orderId',
    },
];

const CONTROL_INSERT_HANDLES: Record<NodeTypeId, InsertHandles | null> = {
    'control.start': null,
    'control.timeWindow': { in: 'control:in', out: 'control:out' },
    'data.kraken.ticker': { in: 'control:in', out: 'control:out' },
    'data.kraken.ohlc': { in: 'control:in', out: 'control:out' },
    'data.kraken.spread': { in: 'control:in', out: 'control:out' },
    'data.kraken.assetPairs': { in: 'control:in', out: 'control:out' },
    'data.constant': { in: 'control:in', out: 'control:out' },
    'logic.movingAverage': { in: 'control:in', out: 'control:out' },
    'logic.if': { in: 'control:in', out: 'control:true' },
    'risk.guard': { in: 'control:in', out: 'control:out' },
    'action.placeOrder': null,
    'action.cancelOrder': null,
    'action.logIntent': null,
};

function edgeStyleForType(type?: string) {
    return type === 'control' ? EDGE_STYLE_CONTROL : EDGE_STYLE_DATA;
}

function resolveNodeType(
    nodeId: string,
    nodes: Node[],
    extraNode?: Node
): NodeTypeId | null {
    if (extraNode?.id === nodeId && extraNode.type) {
        return extraNode.type as NodeTypeId;
    }
    const node = nodes.find((item) => item.id === nodeId);
    return node?.type ? (node.type as NodeTypeId) : null;
}

function findImpliedDataEdges(
    sourceId: string,
    targetId: string,
    nodes: Node[],
    extraNode?: Node
): Edge[] {
    const sourceType = resolveNodeType(sourceId, nodes, extraNode);
    const targetType = resolveNodeType(targetId, nodes, extraNode);
    if (!sourceType || !targetType) return [];

    return IMPLIED_DATA_EDGES.filter(
        (rule) => rule.source === sourceType && rule.target === targetType
    ).map((rule) => ({
        id: `e-${sourceId}-${targetId}-data-${rule.sourcePort}-${rule.targetPort}`,
        source: sourceId,
        sourceHandle: `data:${rule.sourcePort}`,
        target: targetId,
        targetHandle: `data:${rule.targetPort}`,
        type: 'data',
        style: EDGE_STYLE_DATA,
        data: { implied: true },
    }));
}

function appendImpliedEdges(
    baseEdges: Edge[],
    impliedEdges: Edge[]
): Edge[] {
    const existing = new Set(
        baseEdges.map(
            (edge) =>
                `${edge.source}:${edge.sourceHandle ?? ''}->${edge.target}:${edge.targetHandle ?? ''}`
        )
    );
    const targetPorts = new Set(
        baseEdges
            .filter((edge) => edge.type === 'data')
            .map((edge) => `${edge.target}:${edge.targetHandle ?? ''}`)
    );
    const nextEdges = [...baseEdges];
    impliedEdges.forEach((edge) => {
        const key = `${edge.source}:${edge.sourceHandle ?? ''}->${edge.target}:${edge.targetHandle ?? ''}`;
        const targetKey = `${edge.target}:${edge.targetHandle ?? ''}`;
        if (!existing.has(key)) {
            if (edge.type === 'data' && targetPorts.has(targetKey)) {
                return;
            }
            existing.add(key);
            if (edge.type === 'data') {
                targetPorts.add(targetKey);
            }
            nextEdges.push(edge);
        }
    });
    return nextEdges;
}

function nodeHighlight(status?: NodeStatus): string {
    if (status === 'executed') return 'node-highlight-executed';
    if (status === 'running') return 'node-highlight-running';
    if (status === 'error') return 'node-highlight-error';
    return '';
}

function nodeClassName(status?: NodeStatus, disabled?: boolean, type?: string): string {
    const classes = [];
    const highlight = nodeHighlight(status);
    if (highlight) classes.push(highlight);
    if (disabled) classes.push('node-disabled');
    if (type === 'logic.if') classes.push('node-conditional');
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

/**
 * Hosts the React Flow canvas, palette, and layout helpers.
 * Handles implied data edges, tidy layout, keyboard shortcuts, and node actions.
 */
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
    const [pendingTidy, setPendingTidy] = useState(false);
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

    const edgesWithActions = useMemo(() => {
        const pairCounts = new Map<string, number>();
        edges.forEach((edge) => {
            const key = `${edge.source}->${edge.target}`;
            pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        });

        const pairCursor = new Map<string, number>();
        return edges.map((edge) => {
            const key = `${edge.source}->${edge.target}`;
            const count = pairCounts.get(key) ?? 1;
            const index = pairCursor.get(key) ?? 0;
            pairCursor.set(key, index + 1);
            const offset = count > 1 ? (index - (count - 1) / 2) * 20 : 0;
            const stepPosition = count > 1 ? 0.5 + (index - (count - 1) / 2) * 0.08 : undefined;
            const hidden = edge.type === 'data';
            return {
                ...edge,
                data: {
                    ...(edge.data as Record<string, unknown>),
                    onInsert: handleEdgeInsertRequest,
                    offset,
                    stepPosition,
                    hidden,
                },
            };
        });
    }, [edges, handleEdgeInsertRequest]);

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
            setEdges((eds) => {
                const nextEdges = addEdge(
                    {
                        ...connection,
                        type: edgeType,
                        style: edgeStyleForType(edgeType),
                    },
                    eds
                );
                if (edgeType !== 'control') return nextEdges;
                const sourceId = connection.source ?? '';
                const targetId = connection.target ?? '';
                const impliedEdges = findImpliedDataEdges(sourceId, targetId, nodes);
                return appendImpliedEdges(nextEdges, impliedEdges);
            }
            );
        },
        [isValidConnection, nodes, setEdges]
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
        setPendingTidy(true);
        fitView({ padding: 0.2, duration: 300 });
    }, [activePair, fitView, setEdges, setNodes, setPendingInsert, setPendingTidy]);

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
                    const implied = [
                        ...findImpliedDataEdges(insertEdge.source, id, nodes, newNode),
                        ...findImpliedDataEdges(id, insertEdge.target, nodes, newNode),
                    ];
                    return appendImpliedEdges([...withoutEdge, edgeIn, edgeOut], implied);
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
                    className: nodeClassName(status, disabled, node.type),
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
            const deletedControlPairs = new Set(
                deleted
                    .filter((edge) => edge.type === 'control')
                    .map((edge) => `${edge.source}->${edge.target}`)
            );
            setEdges((eds) =>
                eds.filter((edge) => {
                    if (deletedIds.has(edge.id)) return false;
                    if (edge.type === 'data' && deletedControlPairs.has(`${edge.source}->${edge.target}`)) {
                        return false;
                    }
                    return true;
                })
            );
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
                        className: nodeClassName(status, disabled, node.type),
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
        const outgoing = new Map<string, string[]>();
        controlEdges.forEach(({ source, target }) => {
            incoming.set(target, [...(incoming.get(target) ?? []), source]);
            outgoing.set(source, [...(outgoing.get(source) ?? []), target]);
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

        const nodeMap = new Map(nodes.map((node) => [node.id, node]));
        const byNodeOrder = (aId: string, bId: string) => {
            const a = nodeMap.get(aId);
            const b = nodeMap.get(bId);
            return (
                laneIndexForType(a?.type) - laneIndexForType(b?.type) ||
                (a?.position?.y ?? 0) - (b?.position?.y ?? 0) ||
                aId.localeCompare(bId)
            );
        };

        const rowById = new Map<string, number>();
        let nextRow = 0;
        const claimRow = () => nextRow++;
        const rowVisit = new Set<string>();

        const assignRows = (id: string) => {
            if (rowVisit.has(id)) return;
            rowVisit.add(id);
            if (!rowById.has(id)) {
                rowById.set(id, claimRow());
            }
            const baseRow = rowById.get(id) ?? 0;
            const children = (outgoing.get(id) ?? []).slice().sort(byNodeOrder);
            children.forEach((childId, index) => {
                if (!rowById.has(childId)) {
                    rowById.set(childId, index === 0 ? baseRow : claimRow());
                }
                assignRows(childId);
            });
            rowVisit.delete(id);
        };

        nodes
            .filter((node) => !incoming.has(node.id))
            .map((node) => node.id)
            .sort(byNodeOrder)
            .forEach((rootId) => assignRows(rootId));

        nodes
            .filter((node) => !rowById.has(node.id))
            .map((node) => node.id)
            .sort(byNodeOrder)
            .forEach((nodeId) => {
                rowById.set(nodeId, claimRow());
            });

        const NODE_HEIGHT_FALLBACK = 220;
        const ROW_GAP = 120;
        const xStart = 240;
        const yStart = 220;
        const xSpacing = 300;
        const rowHeights = new Map<number, number>();
        rowById.forEach((row, nodeId) => {
            const node = nodeMap.get(nodeId);
            const height = node?.height ?? NODE_HEIGHT_FALLBACK;
            rowHeights.set(row, Math.max(rowHeights.get(row) ?? 0, height));
        });

        const rowCenters = new Map<number, number>();
        let cursorY = yStart;
        Array.from(rowHeights.keys())
            .sort((a, b) => a - b)
            .forEach((row) => {
                const height = rowHeights.get(row) ?? NODE_HEIGHT_FALLBACK;
                rowCenters.set(row, cursorY + height / 2);
                cursorY += height + ROW_GAP;
            });

        const layoutPositions = new Map<string, { x: number; y: number }>();

        nodes.forEach((node) => {
            const controlDepth = depthFor(node.id);
            const row = rowById.get(node.id) ?? 0;
            const height = node.height ?? NODE_HEIGHT_FALLBACK;
            const rowCenter = rowCenters.get(row) ?? yStart;
            layoutPositions.set(node.id, {
                x: snapToGrid(xStart + controlDepth * xSpacing),
                y: rowCenter - height / 2,
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
        if (!pendingTidy) return;
        setPendingTidy(false);
        requestAnimationFrame(() => {
            handleTidyLayout();
        });
    }, [handleTidyLayout, pendingTidy]);

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
                                            <div className="palette-icon">
                                                <BlockIcon type={item.type} size={22} />
                                            </div>
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
