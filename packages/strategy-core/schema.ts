/**
 * Kraken DaD - Strategy Core Schema
 *
 * This module defines the foundational data structures for representing
 * trading strategies as directed graphs. It is the single source of truth
 * for strategy serialization between frontend and backend.
 *
 * @module strategy-core/schema
 * @version 1.0.0
 */

// =============================================================================
// SCHEMA VERSION
// =============================================================================

/**
 * Schema version for migration support.
 * Increment when making breaking changes to the schema.
 */
export const SCHEMA_VERSION = 1 as const;

// =============================================================================
// BLOCK CATEGORIES
// =============================================================================

/**
 * Block categories define the role of each node in the strategy graph.
 *
 * - `data`: Sources of market data (prices, balances, orderbook)
 * - `logic`: Decision nodes (conditions, comparisons, transforms)
 * - `action`: Execution nodes (place order, cancel, notify)
 */
export type BlockCategory = 'data' | 'logic' | 'action' | 'control';

// =============================================================================
// PORT DEFINITIONS
// =============================================================================

/**
 * Supported data types for port connections.
 * Used for validation of edge connections between nodes.
 */
export type PortDataType = 'number' | 'boolean' | 'string' | 'trigger' | 'any';

/**
 * Defines an input or output port on a block.
 * Ports enable typed connections between nodes.
 */
export interface Port {
    /** Unique identifier within the node */
    readonly id: string;
    /** Human-readable label */
    readonly label: string;
    /** Data type for connection validation */
    readonly dataType: PortDataType;
    /** Whether this port is required for execution */
    readonly required: boolean;
}

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

/**
 * Defines a block type that can be instantiated as nodes.
 * This is the "template" from which nodes are created.
 */
export interface BlockDefinition {
    /** Unique block type identifier (e.g., "kraken.price", "logic.compare") */
    readonly type: string;
    /** Block category */
    readonly category: BlockCategory;
    /** Human-readable name */
    readonly name: string;
    /** Description of what the block does */
    readonly description: string;
    /** Available input ports */
    readonly inputs: readonly Port[];
    /** Available output ports */
    readonly outputs: readonly Port[];
}

// =============================================================================
// NODE (BLOCK INSTANCE)
// =============================================================================

/**
 * Configuration object for a node instance.
 * Each block type defines its own config shape.
 */
export type NodeConfig = Record<string, unknown>;

/**
 * A node is an instance of a block within a strategy graph.
 * Nodes hold their configuration and position metadata.
 */
export interface StrategyNode {
    /** Unique node identifier (UUID recommended) */
    readonly id: string;
    /** Reference to the block type (must match a BlockDefinition.type) */
    readonly type: string;
    /** Block-specific configuration */
    readonly config: NodeConfig;
    /** Optional user-defined label for this instance */
    readonly label?: string;
    /** Visual position in the editor (x, y coordinates) */
    readonly position: {
        readonly x: number;
        readonly y: number;
    };
}

// =============================================================================
// EDGE (CONNECTION)
// =============================================================================

/**
 * Edge type distinguishes between data flow and control flow.
 *
 * - `data`: Carries a value from source output to target input
 * - `control`: Triggers execution flow (e.g., condition → action)
 */
export type EdgeType = 'data' | 'control';

/**
 * An edge connects two nodes via their ports.
 * Edges define both data dependencies and execution order.
 */
export interface StrategyEdge {
    /** Unique edge identifier */
    readonly id: string;
    /** Source node ID */
    readonly source: string;
    /** Source port ID on the source node */
    readonly sourcePort: string;
    /** Target node ID */
    readonly target: string;
    /** Target port ID on the target node */
    readonly targetPort: string;
    /** Type of connection */
    readonly type: EdgeType;
}

// =============================================================================
// STRATEGY METADATA
// =============================================================================

/**
 * Metadata about the strategy for display and management.
 */
export interface StrategyMetadata {
    /** User-defined name for the strategy */
    readonly name: string;
    /** Optional description */
    readonly description?: string;
    /** ISO 8601 timestamp of creation */
    readonly createdAt: string;
    /** ISO 8601 timestamp of last modification */
    readonly updatedAt: string;
    /** Optional author identifier */
    readonly author?: string;
    /** Optional tags for categorization */
    readonly tags?: readonly string[];
}

// =============================================================================
// STRATEGY GRAPH
// =============================================================================

/**
 * Complete strategy definition as a serializable directed graph.
 * This is the top-level structure saved to JSON and shared between
 * frontend and backend.
 */
export interface Strategy {
    /** Schema version for migration support */
    readonly version: typeof SCHEMA_VERSION;
    /** Strategy metadata */
    readonly metadata: StrategyMetadata;
    /** All nodes in the strategy graph */
    readonly nodes: readonly StrategyNode[];
    /** All edges connecting nodes */
    readonly edges: readonly StrategyEdge[];
}

// =============================================================================
// EXECUTION CONTEXT (RUNTIME ONLY)
// =============================================================================

/**
 * Execution mode for strategy runs.
 *
 * - `dry-run`: Simulate without any trading side effects (default for demo)
 * - `live`: Execute real orders (requires explicit opt-in; disabled in this project)
 */
export type ExecutionMode = 'dry-run' | 'live';

/**
 * Runtime context passed to the execution engine.
 * Separate from the strategy definition itself.
 */
export interface ExecutionContext {
    /** Execution mode */
    readonly mode: ExecutionMode;
    /** Optional start time for backtesting (ISO 8601) */
    readonly startTime?: string;
    /** Optional end time for backtesting (ISO 8601) */
    readonly endTime?: string;
    /** Optional pre-fetched market data (populated by backend) */
    readonly marketData?: Record<string, MarketDataSnapshot>;
}

/**
 * Lightweight market snapshot injected at runtime from Kraken public APIs.
 */
export interface MarketDataSnapshot {
    readonly pair: string;
    readonly last: number;
    readonly ask?: number;
    readonly bid?: number;
    readonly spread?: number;
    readonly timestamp?: number;
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

/**
 * Result of validating a strategy graph.
 */
export interface ValidationResult {
    /** Whether the strategy is valid for execution */
    readonly valid: boolean;
    /** List of validation errors (empty if valid) */
    readonly errors: readonly ValidationError[];
    /** List of validation warnings (non-blocking) */
    readonly warnings: readonly ValidationWarning[];
}

/**
 * A validation error that prevents execution.
 */
export interface ValidationError {
    /** Error code for programmatic handling */
    readonly code: string;
    /** Human-readable error message */
    readonly message: string;
    /** Node ID where the error occurred (if applicable) */
    readonly nodeId?: string;
    /** Edge ID where the error occurred (if applicable) */
    readonly edgeId?: string;
}

/**
 * A validation warning that does not prevent execution.
 */
export interface ValidationWarning {
    /** Warning code for programmatic handling */
    readonly code: string;
    /** Human-readable warning message */
    readonly message: string;
    /** Node ID where the warning occurred (if applicable) */
    readonly nodeId?: string;
}
