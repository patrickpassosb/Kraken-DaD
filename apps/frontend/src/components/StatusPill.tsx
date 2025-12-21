import { NodeStatus, statusLabel, statusTone } from '../utils/status';

interface StatusPillProps {
    status?: NodeStatus;
}

/** Small badge reflecting execution status for nodes and timeline rows. */
export function StatusPill({ status = 'idle' }: StatusPillProps) {
    const tone = statusTone(status);
    return (
        <span
            className="status-pill"
            style={{ background: tone.background, color: 'var(--text-secondary)' }}
        >
            <span
                className="status-dot"
                style={{ backgroundColor: tone.dot }}
                aria-hidden
            />
            {statusLabel(status)}
        </span>
    );
}
