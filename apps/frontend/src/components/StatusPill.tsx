import { NodeStatus, statusLabel, statusTone } from '../utils/status';

interface StatusPillProps {
    status?: NodeStatus;
}

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
