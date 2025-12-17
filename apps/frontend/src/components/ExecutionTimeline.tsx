import { ExecutionResult } from '../api/executeDryRun';
import { NodeStatus, statusLabel, statusTone } from '../utils/status';

interface ExecutionTimelineProps {
    result?: ExecutionResult | null;
}

function labelForType(nodeType: string): string {
    if (nodeType.includes('start')) return 'Strategy Start';
    if (nodeType.includes('ticker')) return 'Market Data';
    if (nodeType.includes('if')) return 'Condition';
    if (nodeType.includes('risk')) return 'Risk Guard';
    if (nodeType.includes('placeOrder')) return 'Execution';
    if (nodeType.includes('cancelOrder')) return 'Order Control';
    if (nodeType.includes('log')) return 'Audit Log';
    return nodeType;
}

function formatDuration(durationMs: number): string {
    if (!durationMs) return '—';
    if (durationMs < 1000) return `${durationMs.toFixed(0)} ms`;
    return `${(durationMs / 1000).toFixed(2)} s`;
}

export function ExecutionTimeline({ result }: ExecutionTimelineProps) {
    if (!result) {
        return <div className="empty-card">Run a dry-run to see execution steps and timing.</div>;
    }

    return (
        <div className="timeline">
            {result.log.map((entry, index) => {
                const status: NodeStatus = entry.status === 'success' ? 'executed' : entry.status === 'error' ? 'error' : 'skipped';
                const tone = statusTone(status);
                return (
                    <div key={`${entry.nodeId}-${index}`} className="timeline-item">
                        <div
                            className="timeline-marker"
                            style={{ background: tone.dot, boxShadow: `0 0 0 6px ${tone.background}` }}
                        />
                        <div className="timeline-body">
                            <div className="timeline-title-row">
                                <span className="timeline-title">{labelForType(entry.nodeType)}</span>
                                <span className="chip">{statusLabel(status)}</span>
                            </div>
                            <div className="timeline-meta">
                                Node {entry.nodeId} • {formatDuration(entry.durationMs)} • {Object.keys(entry.inputs).length} inputs /
                                {` ${Object.keys(entry.outputs).length} outputs`}
                            </div>
                        </div>
                    </div>
                );
            })}
            {result.errors.length === 0 && result.warnings.length === 0 ? (
                <div className="empty-card" style={{ borderStyle: 'solid' }}>
                    <strong style={{ color: 'var(--kraken-green)' }}>No execution errors</strong> • Dry-run completed safely.
                </div>
            ) : (
                <div className="empty-card">
                    <strong style={{ color: 'var(--kraken-amber)' }}>{result.warnings.length} warning(s)</strong>
                    {result.errors.length > 0 && (
                        <span style={{ marginLeft: 8, color: 'var(--kraken-red)' }}>
                            {result.errors.length} error(s) reported
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
