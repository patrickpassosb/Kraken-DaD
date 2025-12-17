import { ExecutionResult } from '../api/executeDryRun';
import { formatPrice } from '../utils/format';

interface ExecutionTimelineProps {
    result?: ExecutionResult | null;
    error?: string | null;
}

const statusTone: Record<string, { label: string; color: string; border: string }> = {
    success: {
        label: 'Executed',
        color: 'var(--kraken-green)',
        border: 'rgba(42, 214, 159, 0.24)',
    },
    skipped: {
        label: 'Skipped',
        color: 'var(--text-muted)',
        border: 'var(--border-subtle)',
    },
    error: {
        label: 'Error',
        color: 'var(--kraken-red)',
        border: 'rgba(255, 107, 122, 0.3)',
    },
};

export function ExecutionTimeline({ result, error }: ExecutionTimelineProps) {
    if (!result) {
        return (
            <div className="dock-card">
                <div className="market-header">
                    <div className="market-pair">Execution trail</div>
                    <span className="chip ghost">Awaiting run</span>
                </div>
                <p className="muted">Dry-run results will appear here with node-by-node status.</p>
                {error && <div className="chip" style={{ marginTop: '8px', color: 'var(--kraken-red)' }}>{error}</div>}
            </div>
        );
    }

    return (
        <div className="dock-card timeline">
            <div className="market-header">
                <div className="market-pair">Execution trail</div>
                <span className="chip ghost">{result.mode}</span>
            </div>
            {result.log.map((entry) => {
                const tone = statusTone[entry.status] || statusTone.success;
                return (
                    <div
                        key={`${entry.nodeId}-${entry.durationMs}`}
                        className="timeline-item"
                        style={{ borderColor: tone.border }}
                    >
                        <div className="timeline-marker" style={{ background: tone.color }} />
                        <div className="timeline-body">
                            <div className="timeline-title-row">
                                <div className="timeline-title">{entry.nodeType}</div>
                                <div className="timeline-meta">{entry.durationMs} ms</div>
                            </div>
                            <div className="timeline-meta">
                                Node {entry.nodeId} · {tone.label}
                            </div>
                            {entry.outputs && Object.keys(entry.outputs).length > 0 && (
                                <div className="timeline-meta">
                                    Output → {JSON.stringify(entry.outputs)}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {result.actionIntents.length > 0 && (
                <div className="intent-footer">
                    <div>Order preview</div>
                    <div className="muted">
                        {String(result.actionIntents[0].intent?.params?.pair ?? 'Pair')} @{' '}
                        {formatPrice(
                            (result.actionIntents[0].intent?.params?.price as number | undefined) ||
                                (result.actionIntents[0].intent?.params?.limit as number | undefined)
                        )}
                    </div>
                </div>
            )}
            {result.warnings.length > 0 && (
                <div className="chip" style={{ marginTop: '4px' }}>
                    {result.warnings.length} warning(s) • review risk guard thresholds
                </div>
            )}
            {error && <div className="chip" style={{ marginTop: '4px', color: 'var(--kraken-red)' }}>{error}</div>}
        </div>
    );
}
