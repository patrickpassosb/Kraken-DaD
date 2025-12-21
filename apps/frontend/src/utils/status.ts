export type NodeStatus = 'idle' | 'running' | 'executed' | 'skipped' | 'error';

/** Human-readable labels for status chips used on nodes. */
export function statusLabel(status: NodeStatus): string {
    switch (status) {
        case 'running':
            return 'Triggered';
        case 'executed':
            return 'Executed';
        case 'skipped':
            return 'Skipped';
        case 'error':
            return 'Error';
        default:
            return 'Idle';
    }
}

/** Returns semantic colors for status pills in the canvas. */
export function statusTone(status: NodeStatus): { background: string; dot: string } {
    switch (status) {
        case 'running':
            return { background: 'var(--surface-amber)', dot: 'var(--kraken-amber)' };
        case 'executed':
            return { background: 'var(--surface-green)', dot: 'var(--kraken-green)' };
        case 'skipped':
            return { background: 'var(--surface-muted)', dot: 'var(--border-strong)' };
        case 'error':
            return { background: 'var(--surface-red)', dot: 'var(--kraken-red)' };
        default:
            return { background: 'var(--surface-muted)', dot: 'var(--border-subtle)' };
    }
}
