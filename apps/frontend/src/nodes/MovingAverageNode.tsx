import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export type MovingAverageMethod = 'SMA' | 'EMA';

export interface MovingAverageNodeData {
    method?: MovingAverageMethod;
    period?: number;
    status?: NodeStatus;
    disabled?: boolean;
}

function parsePeriod(raw: string): number | null {
    const cleaned = raw.trim().replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(parsed, 1);
}

export function MovingAverageNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as MovingAverageNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [method, setMethod] = useState<MovingAverageMethod>(nodeData.method ?? 'SMA');
    const [periodInput, setPeriodInput] = useState(String(nodeData.period ?? 14));

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
                    <label>Method</label>
                    <select
                        value={method}
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
                    <label>Period</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={periodInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setPeriodInput(raw);
                            const parsed = parsePeriod(raw);
                            if (parsed === null) {
                                if (raw.trim() === '') {
                                    updateData({ period: 0 });
                                }
                                return;
                            }
                            updateData({ period: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parsePeriod(periodInput);
                            if (parsed === null) return;
                            setPeriodInput(parsed.toString());
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
}
