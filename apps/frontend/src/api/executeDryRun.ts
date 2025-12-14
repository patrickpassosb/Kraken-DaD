const API_BASE = 'http://127.0.0.1:3001';

export interface ExecutionResult {
    success: boolean;
    mode: 'dry-run';
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
        executed: false;
    }>;
    krakenValidations?: Array<{
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

export async function executeDryRun(strategy: Strategy, validate?: boolean): Promise<ExecutionResult> {
    const response = await fetch(`${API_BASE}/execute/dry-run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy, validate }),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}
