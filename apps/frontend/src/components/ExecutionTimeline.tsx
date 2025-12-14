import { StatusPill } from './StatusPill';
import { NodeStatus } from '../utils/status';

export interface TimelineItem {
    id: string;
    title: string;
    detail?: string;
    status: NodeStatus;
    meta?: string;
}

interface ExecutionTimelineProps {
    items: TimelineItem[];
}

function markerColor(status: NodeStatus): string {
    switch (status) {
        case 'executed':
            return 'var(--kraken-green)';
        case 'running':
            return 'var(--kraken-amber)';
        case 'error':
            return 'var(--kraken-red)';
        case 'skipped':
            return 'var(--border-strong)';
        default:
            return 'var(--border-subtle)';
    }
}

export function ExecutionTimeline({ items }: ExecutionTimelineProps) {
    return (
        <div className="timeline">
            {items.map((item) => (
                <div key={item.id} className="timeline-item">
                    <div
                        className="timeline-marker"
                        style={{ background: markerColor(item.status) }}
                    />
                    <div className="timeline-body">
                        <div className="timeline-title-row">
                            <div className="timeline-title">{item.title}</div>
                            <StatusPill status={item.status} />
                        </div>
                        {item.detail && <div className="timeline-meta">{item.detail}</div>}
                        {item.meta && <div className="muted">{item.meta}</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}
