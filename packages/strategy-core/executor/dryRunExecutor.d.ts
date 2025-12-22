/**
 * Kraken DaD - Dry-Run Execution Engine
 *
 * Executes strategies in dry-run mode following the execution lifecycle.
 * No side effects, no API calls, deterministic behavior.
 *
 * @module strategy-core/executor/dryRunExecutor
 */
import type { Strategy, ExecutionContext, ExecutionMode, NodeConfig } from '../schema.js';
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
/**
 * Main entry point for dry-run execution. Validates the graph, determines execution
 * order, runs block handlers, and returns structured logs/warnings/errors.
 */
export declare function executeDryRun(strategy: Strategy, ctx: ExecutionContext): ExecutionResult;
