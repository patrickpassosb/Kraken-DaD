import { API_BASE } from './config';

export type ExecutionMode = 'dry-run' | 'live';

export interface ExecutionResult {
    success: boolean;
    mode: ExecutionMode;
    startedAt: string;
    completedAt: string;
    nodesExecuted: number;
    log: Array<{
        nodeId: string;
        nodeType: string;
        inputs: Record<string, unknown>;
        outputs: Record<string, unknown>;
        durationMs: number;
        status: 'success' | 'error' | 'skipped';
    }>;
    errors: Array<{
        code: string;
        message: string;
        nodeId?: string;
    }>;
    warnings: Array<{
        code: string;
        message: string;
        nodeId?: string;
    }>;
    actionIntents: Array<{
        nodeId: string;
        type: string;
        intent: {
            action: string;
            params: Record<string, unknown>;
        };
        executed: boolean;
    }>;
    krakenValidations?: Array<{
        nodeId: string;
        action: string;
        status: 'ok' | 'error';
        detail?: string;
        response?: Record<string, unknown>;
    }>;
    liveActions?: Array<{
        nodeId: string;
        action: string;
        status: 'ok' | 'error';
        detail?: string;
        response?: Record<string, unknown>;
    }>;
}

export interface Strategy {
    version: number;
    metadata: {
        name: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
    };
    nodes: Array<{
        id: string;
        type: string;
        config: Record<string, unknown>;
        position: { x: number; y: number };
    }>;
    edges: Array<{
        id: string;
        type: 'data' | 'control';
        source: string;
        sourcePort: string;
        target: string;
        targetPort: string;
    }>;
}

/**
 * Submits a strategy to the backend executor. Supports optional validation toggle
 * and partial execution by target node id. Throws when the backend replies with an error.
 */
export async function executeStrategy(
    strategy: Strategy,
    options: { mode?: ExecutionMode; validate?: boolean; targetNodeId?: string } = {}
): Promise<ExecutionResult> {
    const response = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            strategy,
            validate: options.validate,
            mode: options.mode,
            targetNodeId: options.targetNodeId,
        }),
    });

    const payload = (await response.json()) as { error?: string } & ExecutionResult;
    if (!response.ok) {
        throw new Error(payload.error ?? `API error: ${response.status}`);
    }

    return payload;
}
