/**
 * Kraken DaD - Dry-Run Execution Engine
 *
 * Executes strategies in dry-run mode following the execution lifecycle.
 * No side effects, no API calls, deterministic behavior.
 *
 * @module strategy-core/executor/dryRunExecutor
 */



import {
    Strategy,
    StrategyNode,
    StrategyEdge,
    ExecutionContext,
    ExecutionMode,
    BlockDefinition,
    BlockCategory,
    NodeConfig,
    Port,
    PortDataType,
    SCHEMA_VERSION,
} from '../schema.js';

// =============================================================================
// EXECUTION RESULT TYPES
// =============================================================================

export interface ExecutionError {
    readonly code: string;
    readonly message: string;
    readonly nodeId?: string;
    readonly edgeId?: string;
}

export interface ExecutionWarning {
    readonly code: string;
    readonly message: string;
    readonly nodeId?: string;
}

export interface ActionIntent {
    readonly nodeId: string;
    readonly type: string;
    readonly intent: {
        readonly action: string;
        readonly params: NodeConfig;
    };
    readonly executed: boolean;
}

export interface NodeExecutionLog {
    readonly nodeId: string;
    readonly nodeType: string;
    readonly inputs: Record<string, unknown>;
    readonly outputs: Record<string, unknown>;
    readonly durationMs: number;
    readonly status: 'success' | 'error' | 'skipped';
}

export interface ExecutionResult {
    readonly success: boolean;
    readonly mode: ExecutionMode;
    readonly startedAt: string;
    readonly completedAt: string;
    readonly nodesExecuted: number;
    log: NodeExecutionLog[];
    errors: ExecutionError[];
    warnings: ExecutionWarning[];
    actionIntents: ActionIntent[];
    krakenValidations?: KrakenValidation[];
    liveActions?: LiveActionResult[];
}

export interface KrakenValidation {
    readonly nodeId: string;
    readonly action: string;
    readonly status: 'ok' | 'error';
    readonly detail?: string;
    readonly response?: Record<string, unknown>;
}

export interface LiveActionResult {
    readonly nodeId: string;
    readonly action: string;
    readonly status: 'ok' | 'error';
    readonly detail?: string;
    readonly response?: Record<string, unknown>;
}

// =============================================================================
// BLOCK HANDLER TYPE
// =============================================================================

type BlockHandler = (
    node: StrategyNode,
    inputs: Record<string, unknown>,
    ctx: ExecutionContext
) => { outputs: Record<string, unknown>; actionIntent?: ActionIntent };

// =============================================================================
// BLOCK REGISTRY
// =============================================================================

const blockDefinitions: Map<string, BlockDefinition> = new Map();
const blockHandlers: Map<string, BlockHandler> = new Map();

function pairKey(pair: string): string {
    return pair.trim().toUpperCase();
}

function isNodeDisabled(node: StrategyNode): boolean {
    const config = node.config as Record<string, unknown>;
    return Boolean(config?.disabled);
}

/**
 * control.start - Entry point for control flow
 */
blockDefinitions.set('control.start', {
    type: 'control.start',
    category: 'control',
    name: 'Start',
    description: 'Entry point for control flow execution',
    inputs: [],
    outputs: [
        { id: 'out', label: 'Out', dataType: 'trigger', required: true },
    ],
});

blockHandlers.set('control.start', (_node, _inputs, _ctx) => {
    return { outputs: {} };
});

/**
 * data.constant - Returns a static value from config
 */
blockDefinitions.set('data.constant', {
    type: 'data.constant',
    category: 'data',
    name: 'Constant',
    description: 'Outputs a constant value from configuration',
    inputs: [],
    outputs: [
        { id: 'value', label: 'Value', dataType: 'any', required: true },
    ],
});

blockHandlers.set('data.constant', (node, _inputs, _ctx) => {
    const value = node.config.value ?? null;
    return { outputs: { value } };
});

/**
 * logic.equals - Compares two values for equality
 */
blockDefinitions.set('logic.equals', {
    type: 'logic.equals',
    category: 'logic',
    name: 'Equals',
    description: 'Compares two values and outputs a boolean',
    inputs: [
        { id: 'a', label: 'A', dataType: 'any', required: true },
        { id: 'b', label: 'B', dataType: 'any', required: true },
    ],
    outputs: [
        { id: 'result', label: 'Result', dataType: 'boolean', required: true },
    ],
});

blockHandlers.set('logic.equals', (node, inputs, _ctx) => {
    const a = inputs.a;
    const b = inputs.b;
    const result = a === b;
    return { outputs: { result } };
});

/**
 * action.logIntent - Logs an intent without side effects
 */
blockDefinitions.set('action.logIntent', {
    type: 'action.logIntent',
    category: 'action',
    name: 'Log Intent',
    description: 'Logs an action intent in dry-run mode',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [],
});

blockHandlers.set('action.logIntent', (node, _inputs, _ctx) => {
    const actionIntent: ActionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: (node.config.action as string) ?? 'LOG',
            params: node.config,
        },
        executed: false,
    };
    return { outputs: {}, actionIntent };
});

/**
 * data.kraken.ticker - Fetches ticker price from Kraken (mock in dry-run)
 */
blockDefinitions.set('data.kraken.ticker', {
    type: 'data.kraken.ticker',
    category: 'data',
    name: 'Kraken Ticker',
    description: 'Fetches latest ticker price from Kraken (dry-run uses mock)',
    inputs: [],
    outputs: [
        { id: 'price', label: 'Price', dataType: 'number', required: true },
        { id: 'pair', label: 'Pair', dataType: 'string', required: true },
        { id: 'ask', label: 'Ask', dataType: 'number', required: false },
        { id: 'bid', label: 'Bid', dataType: 'number', required: false },
        { id: 'spread', label: 'Spread', dataType: 'number', required: false },
    ],
});

blockHandlers.set('data.kraken.ticker', (node, _inputs, ctx) => {
    const pair = (node.config.pair as string) || 'BTC/USD';
    const key = pairKey(pair);
    const market = ctx.marketData?.[key];
    const price = market?.last ?? 42000;
    return {
        outputs: {
            price,
            pair: market?.pair ?? pair,
            ask: market?.ask,
            bid: market?.bid,
            spread: market?.spread,
        },
    };
});

/**
 * action.placeOrder - Places a trading order (dry-run logs intent only)
 */
blockDefinitions.set('action.placeOrder', {
    type: 'action.placeOrder',
    category: 'action',
    name: 'Place Order',
    description: 'Places a trading order (dry-run mode logs intent only)',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'price', label: 'Price', dataType: 'number', required: false },
    ],
    outputs: [
        { id: 'orderId', label: 'Order ID', dataType: 'string', required: true },
    ],
});

blockHandlers.set('action.placeOrder', (node, inputs, _ctx) => {
    const pair = (node.config.pair as string) ?? 'XBT/USD';
    const side = (node.config.side as string) ?? 'buy';
    const type = (node.config.type as string) ?? 'market';
    const amount = (node.config.amount as number) ?? 0.1;
    const price = (inputs.price as number) ?? node.config.price;

    const actionIntent: ActionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: 'PLACE_ORDER',
            params: {
                pair,
                side,
                type,
                amount,
                ...(price !== undefined && { price }),
            },
        },
        executed: false,
    };

    // Mock order ID for dry-run
    const mockOrderId = `order-${Date.now()}`;

    return {
        outputs: { orderId: mockOrderId },
        actionIntent,
    };
});

/**
 * action.cancelOrder - Cancels a trading order (dry-run logs intent only)
 */
blockDefinitions.set('action.cancelOrder', {
    type: 'action.cancelOrder',
    category: 'action',
    name: 'Cancel Order',
    description: 'Cancels a trading order (dry-run mode logs intent only)',
    inputs: [
        { id: 'trigger', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'orderId', label: 'Order ID', dataType: 'string', required: false },
    ],
    outputs: [],
});

blockHandlers.set('action.cancelOrder', (node, inputs, _ctx) => {
    const orderId = (inputs.orderId as string) ?? (node.config.orderId as string) ?? 'unknown';

    const actionIntent: ActionIntent = {
        nodeId: node.id,
        type: node.type,
        intent: {
            action: 'CANCEL_ORDER',
            params: { orderId },
        },
        executed: false,
    };

    return { outputs: {}, actionIntent };
});

/**
 * risk.guard - Checks spread against a configured threshold
 */
blockDefinitions.set('risk.guard', {
    type: 'risk.guard',
    category: 'logic',
    name: 'Orderbook Guard',
    description: 'Blocks execution if spread exceeds threshold',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
    ],
    outputs: [
        { id: 'out', label: 'Pass', dataType: 'trigger', required: true },
        { id: 'allowed', label: 'Allowed', dataType: 'boolean', required: true },
        { id: 'spread', label: 'Spread', dataType: 'number', required: false },
    ],
});

blockHandlers.set('risk.guard', (node, _inputs, ctx) => {
    const pair = (node.config.pair as string) || 'BTC/USD';
    const maxSpread = (node.config.maxSpread as number) ?? 5;
    const market = ctx.marketData?.[pairKey(pair)];
    const spread = market?.spread ?? 0;
    const allowed = spread <= maxSpread;
    return {
        outputs: {
            out: allowed,
            allowed,
            spread,
        },
    };
});

/**
 * logic.if - Conditional routing based on numeric comparison
 */
blockDefinitions.set('logic.if', {
    type: 'logic.if',
    category: 'logic',
    name: 'If',
    description: 'Routes control flow based on a numeric comparison',
    inputs: [
        { id: 'in', label: 'Trigger', dataType: 'trigger', required: false },
        { id: 'condition', label: 'Value', dataType: 'number', required: true },
    ],
    outputs: [
        { id: 'true', label: 'True', dataType: 'trigger', required: true },
        { id: 'false', label: 'False', dataType: 'trigger', required: true },
    ],
});

blockHandlers.set('logic.if', (node, inputs, _ctx) => {
    const comparator = (node.config.comparator as string) ?? '>';
    const thresholdRaw = node.config.threshold;
    const value = (inputs.condition ?? inputs.value) as unknown;

    if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error('Condition node requires a numeric input value');
    }

    if (typeof thresholdRaw !== 'number' || Number.isNaN(thresholdRaw)) {
        throw new Error('Condition node requires a numeric threshold');
    }

    let condition = false;
    switch (comparator) {
        case '>':
            condition = value > thresholdRaw;
            break;
        case '<':
            condition = value < thresholdRaw;
            break;
        case '>=':
        case '=>':
            condition = value >= thresholdRaw;
            break;
        case '<=':
            condition = value <= thresholdRaw;
            break;
        case '==':
        case '=':
            condition = value === thresholdRaw;
            break;
        default:
            throw new Error(`Unsupported comparator: ${comparator}`);
    }

    return {
        outputs: {
            true: condition,
            false: !condition,
        },
    };
});

// =============================================================================
// GRAPH UTILITIES
// =============================================================================

interface GraphIndex {
    nodeMap: Map<string, StrategyNode>;
    controlEdges: StrategyEdge[];
    dataEdges: StrategyEdge[];
    incomingControlEdges: Map<string, StrategyEdge[]>;
    incomingDataEdges: Map<string, StrategyEdge[]>;
    outgoingControlEdges: Map<string, StrategyEdge[]>;
    outgoingDataEdges: Map<string, StrategyEdge[]>;
}

function buildGraphIndex(strategy: Strategy): GraphIndex {
    const nodeMap = new Map<string, StrategyNode>();
    const controlEdges: StrategyEdge[] = [];
    const dataEdges: StrategyEdge[] = [];
    const incomingControlEdges = new Map<string, StrategyEdge[]>();
    const incomingDataEdges = new Map<string, StrategyEdge[]>();
    const outgoingControlEdges = new Map<string, StrategyEdge[]>();
    const outgoingDataEdges = new Map<string, StrategyEdge[]>();

    for (const node of strategy.nodes) {
        nodeMap.set(node.id, node);
        incomingControlEdges.set(node.id, []);
        incomingDataEdges.set(node.id, []);
        outgoingControlEdges.set(node.id, []);
        outgoingDataEdges.set(node.id, []);
    }

    for (const edge of strategy.edges) {
        if (edge.type === 'control') {
            controlEdges.push(edge);
            incomingControlEdges.get(edge.target)?.push(edge);
            outgoingControlEdges.get(edge.source)?.push(edge);
        } else {
            dataEdges.push(edge);
            incomingDataEdges.get(edge.target)?.push(edge);
            outgoingDataEdges.get(edge.source)?.push(edge);
        }
    }

    return {
        nodeMap,
        controlEdges,
        dataEdges,
        incomingControlEdges,
        incomingDataEdges,
        outgoingControlEdges,
        outgoingDataEdges,
    };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateStrategy(
    strategy: Strategy,
    graph: GraphIndex
): { errors: ExecutionError[]; warnings: ExecutionWarning[] } {
    const errors: ExecutionError[] = [];
    const warnings: ExecutionWarning[] = [];

    // Check schema version
    if (strategy.version !== SCHEMA_VERSION) {
        errors.push({
            code: 'INVALID_SCHEMA_VERSION',
            message: `Expected schema version ${SCHEMA_VERSION}, got ${strategy.version}`,
        });
    }

    // Check for duplicate node IDs
    const seenNodeIds = new Set<string>();
    for (const node of strategy.nodes) {
        if (seenNodeIds.has(node.id)) {
            errors.push({
                code: 'DUPLICATE_NODE_ID',
                message: `Duplicate node ID: ${node.id}`,
                nodeId: node.id,
            });
        }
        seenNodeIds.add(node.id);
    }

    // Check for duplicate edge IDs
    const seenEdgeIds = new Set<string>();
    for (const edge of strategy.edges) {
        if (seenEdgeIds.has(edge.id)) {
            errors.push({
                code: 'DUPLICATE_EDGE_ID',
                message: `Duplicate edge ID: ${edge.id}`,
                edgeId: edge.id,
            });
        }
        seenEdgeIds.add(edge.id);
    }

    // Check all edge references and port existence
    for (const edge of strategy.edges) {
        const sourceNode = graph.nodeMap.get(edge.source);
        const targetNode = graph.nodeMap.get(edge.target);

        if (!sourceNode) {
            errors.push({
                code: 'NODE_NOT_FOUND',
                message: `Edge references non-existent source node: ${edge.source}`,
                edgeId: edge.id,
            });
        }
        if (!targetNode) {
            errors.push({
                code: 'NODE_NOT_FOUND',
                message: `Edge references non-existent target node: ${edge.target}`,
                edgeId: edge.id,
            });
        }

        // Validate port existence (only for data edges)
        // Control edges define execution order only, they don't transfer data via ports
        if (edge.type === 'data') {
            if (sourceNode) {
                const sourceBlockDef = blockDefinitions.get(sourceNode.type);
                if (sourceBlockDef) {
                    const hasSourcePort = sourceBlockDef.outputs.some((p: Port) => p.id === edge.sourcePort);
                    if (!hasSourcePort) {
                        errors.push({
                            code: 'PORT_NOT_FOUND',
                            message: `Source port '${edge.sourcePort}' not found on node '${edge.source}' (type: ${sourceNode.type})`,
                            edgeId: edge.id,
                            nodeId: edge.source,
                        });
                    }
                }
            }
            if (targetNode) {
                const targetBlockDef = blockDefinitions.get(targetNode.type);
                if (targetBlockDef) {
                    const hasTargetPort = targetBlockDef.inputs.some((p: Port) => p.id === edge.targetPort);
                    if (!hasTargetPort) {
                        errors.push({
                            code: 'PORT_NOT_FOUND',
                            message: `Target port '${edge.targetPort}' not found on node '${edge.target}' (type: ${targetNode.type})`,
                            edgeId: edge.id,
                            nodeId: edge.target,
                        });
                    }
                }
            }
        }
    }

    // Check for unknown block types
    for (const node of strategy.nodes) {
        if (!blockDefinitions.has(node.type)) {
            errors.push({
                code: 'UNKNOWN_BLOCK_TYPE',
                message: `Unknown block type: ${node.type}`,
                nodeId: node.id,
            });
        }
    }

    // Check for entry points
    const entryPoints = strategy.nodes.filter(
        (node: StrategyNode) => (graph.incomingControlEdges.get(node.id)?.length ?? 0) === 0
    );
    if (entryPoints.length === 0) {
        errors.push({
            code: 'NO_ENTRY_POINT',
            message: 'No entry points found (all nodes have incoming control edges)',
        });
    }

    // Check for orphan nodes (warning)
    for (const node of strategy.nodes) {
        const hasIncoming = (graph.incomingControlEdges.get(node.id)?.length ?? 0) > 0;
        const hasOutgoing = (graph.outgoingControlEdges.get(node.id)?.length ?? 0) > 0;
        const isEntryPoint = !hasIncoming;
        const isTerminal = !hasOutgoing;

        if (!hasIncoming && !hasOutgoing && strategy.nodes.length > 1) {
            warnings.push({
                code: 'ORPHAN_NODE',
                message: `Node is not connected to any control flow: ${node.id}`,
                nodeId: node.id,
            });
        }
    }

    // Check for ambiguous data sources
    const dataTargetCounts = new Map<string, number>();
    for (const edge of graph.dataEdges) {
        const key = `${edge.target}:${edge.targetPort}`;
        dataTargetCounts.set(key, (dataTargetCounts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of dataTargetCounts) {
        if (count > 1) {
            const [nodeId, portId] = key.split(':');
            errors.push({
                code: 'AMBIGUOUS_DATA_SOURCE',
                message: `Multiple data edges target the same port: ${key}`,
                nodeId,
            });
        }
    }

    // Validate required input ports have incoming data edges
    for (const node of strategy.nodes) {
        const blockDef = blockDefinitions.get(node.type);
        if (!blockDef) continue;

        const incomingData = graph.incomingDataEdges.get(node.id) ?? [];
        const connectedInputPorts = new Set(incomingData.map((e) => e.targetPort));

        for (const inputPort of blockDef.inputs) {
            if (inputPort.required && !connectedInputPorts.has(inputPort.id)) {
                errors.push({
                    code: 'MISSING_REQUIRED_INPUT',
                    message: `Required input port '${inputPort.id}' on node '${node.id}' has no incoming data edge`,
                    nodeId: node.id,
                });
            }
        }
    }

    return { errors, warnings };
}

// =============================================================================
// TOPOLOGICAL SORT
// =============================================================================

function topologicalSort(
    strategy: Strategy,
    graph: GraphIndex
): { order: string[]; error?: ExecutionError } {
    const inDegree = new Map<string, number>();

    for (const node of strategy.nodes) {
        inDegree.set(node.id, 0);
    }

    for (const edge of [...graph.controlEdges, ...graph.dataEdges]) {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    // Sort entry points by ID for determinism
    const queue: string[] = [];
    for (const node of strategy.nodes) {
        if (inDegree.get(node.id) === 0) {
            queue.push(node.id);
        }
    }
    queue.sort();

    const order: string[] = [];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        order.push(nodeId);

        const outgoing = graph.outgoingControlEdges.get(nodeId) ?? [];
        const outgoingData = graph.outgoingDataEdges.get(nodeId) ?? [];
        // Sort outgoing edges by target ID for determinism
        const sortedOutgoing = [...outgoing, ...outgoingData].sort((a, b) =>
            a.target.localeCompare(b.target)
        );

        for (const edge of sortedOutgoing) {
            const targetDegree = (inDegree.get(edge.target) ?? 0) - 1;
            inDegree.set(edge.target, targetDegree);
            if (targetDegree === 0) {
                queue.push(edge.target);
                queue.sort(); // Maintain deterministic order
            }
        }
    }

    if (order.length < strategy.nodes.length) {
        return {
            order,
            error: {
                code: 'CONTROL_CYCLE_DETECTED',
                message: 'Cycle detected in control flow graph',
            },
        };
    }

    return { order };
}

function collectDependencyNodes(
    targetNodeId: string,
    graph: GraphIndex
): Set<string> {
    const visited = new Set<string>();
    const stack = [targetNodeId];

    while (stack.length > 0) {
        const nodeId = stack.pop()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const incoming = [
            ...(graph.incomingControlEdges.get(nodeId) ?? []),
            ...(graph.incomingDataEdges.get(nodeId) ?? []),
        ];
        for (const edge of incoming) {
            if (!visited.has(edge.source)) {
                stack.push(edge.source);
            }
        }
    }

    return visited;
}

// =============================================================================
// DATA RESOLUTION
// =============================================================================

function resolveInputs(
    nodeId: string,
    graph: GraphIndex,
    dataCache: Map<string, unknown>
): { inputs: Record<string, unknown>; error?: ExecutionError; warnings: ExecutionWarning[] } {
    const inputs: Record<string, unknown> = {};
    const warnings: ExecutionWarning[] = [];
    const incomingData = graph.incomingDataEdges.get(nodeId) ?? [];

    // Get target node's block definition for port metadata
    const targetNode = graph.nodeMap.get(nodeId);
    const targetBlockDef = targetNode ? blockDefinitions.get(targetNode.type) : null;

    for (const edge of incomingData) {
        const cacheKey = `${edge.source}:${edge.sourcePort}`;
        const value = dataCache.get(cacheKey);

        // Find the target input port definition
        const targetInputPort = targetBlockDef?.inputs.find((p: Port) => p.id === edge.targetPort);

        // Check if TARGET input port is required and value is missing
        if ((value === undefined || value === null) && targetInputPort?.required) {
            const sourceNode = graph.nodeMap.get(edge.source);
            if (sourceNode && isNodeDisabled(sourceNode)) {
                warnings.push({
                    code: 'DISABLED_INPUT',
                    message: `Input '${edge.targetPort}' on node '${nodeId}' is missing because source node '${edge.source}' is disabled`,
                    nodeId,
                });
                inputs[edge.targetPort] = null;
                continue;
            }
            return {
                inputs,
                warnings,
                error: {
                    code: 'MISSING_REQUIRED_INPUT',
                    message: `Required input '${edge.targetPort}' on node '${nodeId}' received null/undefined from ${edge.source}:${edge.sourcePort}`,
                    nodeId,
                },
            };
        }

        // Type validation (emit TYPE_MISMATCH warning if types don't match)
        if (value !== undefined && value !== null && targetInputPort) {
            const typeWarning = validatePortType(value, targetInputPort, nodeId, edge.targetPort);
            if (typeWarning) {
                warnings.push(typeWarning);
            }
        }

        inputs[edge.targetPort] = value ?? null;
    }

    return { inputs, warnings };
}

/**
 * Validates that a value matches the expected port dataType.
 * Returns a TYPE_MISMATCH warning if validation fails, null otherwise.
 */
function validatePortType(
    value: unknown,
    port: Port,
    nodeId: string,
    portId: string
): ExecutionWarning | null {
    // 'any' and 'trigger' types accept all values
    if (port.dataType === 'any' || port.dataType === 'trigger') {
        return null;
    }

    const actualType = typeof value;
    let expectedType: string;

    switch (port.dataType) {
        case 'number':
            expectedType = 'number';
            break;
        case 'boolean':
            expectedType = 'boolean';
            break;
        case 'string':
            expectedType = 'string';
            break;
        default:
            return null; // Unknown port type, skip validation
    }

    if (actualType !== expectedType) {
        return {
            code: 'TYPE_MISMATCH',
            message: `Port '${portId}' on node '${nodeId}' expects ${expectedType}, got ${actualType}`,
            nodeId,
        };
    }

    return null;
}

// =============================================================================
// MAIN EXECUTOR
// =============================================================================

export function executeDryRun(
    strategy: Strategy,
    ctx: ExecutionContext
): ExecutionResult {
    const startedAt = new Date().toISOString();
    const log: NodeExecutionLog[] = [];
    const errors: ExecutionError[] = [];
    const warnings: ExecutionWarning[] = [];
    const actionIntents: ActionIntent[] = [];
    const dataCache = new Map<string, unknown>();

    // Step 1 & 2: Build graph index
    const fullGraph = buildGraphIndex(strategy);
    const targetNodeId = ctx.targetNodeId;

    if (targetNodeId && !fullGraph.nodeMap.has(targetNodeId)) {
        errors.push({
            code: 'TARGET_NODE_NOT_FOUND',
            message: `Target node not found: ${targetNodeId}`,
            nodeId: targetNodeId,
        });
        return {
            success: false,
            mode: ctx.mode,
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }

    const strategyToRun = targetNodeId
        ? (() => {
              const requiredNodes = collectDependencyNodes(targetNodeId, fullGraph);
              return {
                  ...strategy,
                  nodes: strategy.nodes.filter((node) => requiredNodes.has(node.id)),
                  edges: strategy.edges.filter(
                      (edge) => requiredNodes.has(edge.source) && requiredNodes.has(edge.target)
                  ),
              };
          })()
        : strategy;

    const graph = targetNodeId ? buildGraphIndex(strategyToRun) : fullGraph;

    // Step 3: Validate
    const validation = validateStrategy(strategyToRun, graph);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    if (errors.length > 0) {
        return {
            success: false,
            mode: 'dry-run',
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }

    // Step 4 & 5: Compute execution order
    const sortResult = topologicalSort(strategyToRun, graph);
    if (sortResult.error) {
        errors.push(sortResult.error);
        return {
            success: false,
            mode: 'dry-run',
            startedAt,
            completedAt: new Date().toISOString(),
            nodesExecuted: 0,
            log,
            errors,
            warnings,
            actionIntents,
        };
    }

    const executionOrder = sortResult.order;

    // Step 6: Execute nodes in order
    for (const nodeId of executionOrder) {
        const node = graph.nodeMap.get(nodeId)!;
        const handler = blockHandlers.get(node.type);

        if (isNodeDisabled(node)) {
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: {},
                outputs: {},
                durationMs: 0,
                status: 'skipped',
            });
            continue;
        }

        if (!handler) {
            errors.push({
                code: 'UNKNOWN_BLOCK_TYPE',
                message: `No handler for block type: ${node.type}`,
                nodeId,
            });
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: {},
                outputs: {},
                durationMs: 0,
                status: 'error',
            });
            break;
        }

        // Resolve inputs
        const inputResult = resolveInputs(nodeId, graph, dataCache);
        warnings.push(...inputResult.warnings);
        if (inputResult.error) {
            errors.push(inputResult.error);
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: inputResult.inputs,
                outputs: {},
                durationMs: 0,
                status: 'error',
            });
            break;
        }

        // Execute node
        const execStart = Date.now();
        let outputs: Record<string, unknown> = {};
        let actionIntent: ActionIntent | undefined;

        try {
            const result = handler(node, inputResult.inputs, ctx);
            outputs = result.outputs;
            actionIntent = result.actionIntent;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            errors.push({
                code: 'NODE_EXECUTION_ERROR',
                message: `Error executing node: ${message}`,
                nodeId,
            });
            log.push({
                nodeId,
                nodeType: node.type,
                inputs: inputResult.inputs,
                outputs: {},
                durationMs: Date.now() - execStart,
                status: 'error',
            });
            break;
        }

        const durationMs = Date.now() - execStart;

        // Store outputs in cache
        for (const [portId, value] of Object.entries(outputs)) {
            dataCache.set(`${nodeId}:${portId}`, value);
        }

        // Collect action intent
        if (actionIntent) {
            actionIntents.push(actionIntent);
        }

        log.push({
            nodeId,
            nodeType: node.type,
            inputs: inputResult.inputs,
            outputs,
            durationMs,
            status: 'success',
        });
    }

    // Step 7: Return result
    const completedAt = new Date().toISOString();

    return {
        success: errors.length === 0,
        mode: ctx.mode,
        startedAt,
        completedAt,
        nodesExecuted: log.filter((l) => l.status === 'success').length,
        log,
        errors,
        warnings,
        actionIntents,
    };
}
