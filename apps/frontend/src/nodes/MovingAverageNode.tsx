import { memo, useCallback, useEffect, useState } from 'react';
import { Handle, Position, Node, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export type MovingAverageMethod = 'SMA' | 'EMA';

export interface MovingAverageNodeData extends Record<string, unknown> {
    method?: MovingAverageMethod;
    period?: number;
    status?: NodeStatus;
    disabled?: boolean;
}

function parsePeriod(raw: string): number | null {
    const cleaned = raw.trim();
    if (!/^\d+$/.test(cleaned)) return null;
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(parsed, 1);
}

function normalizeMethod(method?: MovingAverageMethod): MovingAverageMethod {
    return method === 'EMA' ? 'EMA' : 'SMA';
}

function sanitizePeriodInput(raw: string): string {
    return raw.replace(/\D/g, '');
}

type MovingAverageNodeType = Node<MovingAverageNodeData>;

/** Logic node computing SMA/EMA from an input price series. */
export const MovingAverageNode = memo(function MovingAverageNode({
    id,
    data,
}: NodeProps<MovingAverageNodeType>) {
    const { setNodes } = useReactFlow();
    const nodeData = data ?? {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [method, setMethod] = useState<MovingAverageMethod>(normalizeMethod(nodeData.method));
    const [periodInput, setPeriodInput] = useState(
        typeof nodeData.period === 'number' && nodeData.period > 0
            ? String(nodeData.period)
            : ''
    );
    const methodId = `moving-average-method-${id}`;
    const periodId = `moving-average-period-${id}`;

    const updateData = useCallback(
        (updates: Partial<MovingAverageNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
                )
            );
        },
        [id, setNodes]
    );

    useEffect(() => {
        setMethod(normalizeMethod(nodeData.method));
    }, [nodeData.method]);

    useEffect(() => {
        if (typeof nodeData.period === 'number' && nodeData.period > 0) {
            setPeriodInput(String(nodeData.period));
            return;
        }
        setPeriodInput('');
    }, [nodeData.period]);

    return (
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                visible={visible}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Moving Average</span>
                    <span>Compute SMA or EMA from series</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-amber), #f59e0b)' }}
                >
                    M
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label htmlFor={methodId}>Method</label>
                    <select
                        id={methodId}
                        value={method}
                        disabled={isDisabled}
                        onChange={(e) => {
                            const next = (e.target.value as MovingAverageMethod) || 'SMA';
                            setMethod(next);
                            updateData({ method: next });
                        }}
                    >
                        <option value="SMA">SMA</option>
                        <option value="EMA">EMA</option>
                    </select>
                </div>
                <div className="field">
                    <label htmlFor={periodId}>Period</label>
                    <input
                        id={periodId}
                        type="text"
                        inputMode="numeric"
                        value={periodInput}
                        disabled={isDisabled}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setPeriodInput(sanitizePeriodInput(raw));
                        }}
                        onBlur={() => {
                            if (periodInput.trim() === '') {
                                updateData({ period: undefined });
                                return;
                            }
                            const parsed = parsePeriod(periodInput);
                            if (parsed === null) {
                                setPeriodInput(
                                    typeof nodeData.period === 'number' && nodeData.period > 0
                                        ? String(nodeData.period)
                                        : ''
                                );
                                return;
                            }
                            setPeriodInput(parsed.toString());
                            updateData({ period: parsed });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Inputs</label>
                    <div className="chip">Series required · Period optional</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Outputs latest MA value</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '50%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:series"
                className="data"
                style={{ top: '62%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:period"
                className="data"
                style={{ top: '46%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:value"
                className="data"
                style={{ top: '46%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:out"
                className="control"
                style={{ top: '50%' }}
            />
        </div>
    );
});
