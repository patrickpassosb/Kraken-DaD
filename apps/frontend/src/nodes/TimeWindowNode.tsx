import { useCallback, useMemo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BlockIcon } from '../components/BlockIcon';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface TimeWindowNodeData {
    startTime?: string;
    endTime?: string;
    days?: string[];
    status?: NodeStatus;
    disabled?: boolean;
}

/** Control node that only passes flow when current UTC time is within configured windows. */
export function TimeWindowNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as TimeWindowNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [startTime, setStartTime] = useState(nodeData.startTime ?? '00:00');
    const [endTime, setEndTime] = useState(nodeData.endTime ?? '23:59');
    const [days, setDays] = useState<string[]>(nodeData.days ?? DAY_LABELS);

    const updateData = useCallback(
        (updates: Partial<TimeWindowNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
                )
            );
        },
        [id, setNodes]
    );

    const daySet = useMemo(() => new Set(days), [days]);

    const toggleDay = useCallback(
        (day: string) => {
            setDays((prev) => {
                const next = new Set(prev);
                if (next.has(day)) {
                    next.delete(day);
                } else {
                    next.add(day);
                }
                const list = DAY_LABELS.filter((label) => next.has(label));
                updateData({ days: list });
                return list;
            });
        },
        [updateData]
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
                    <span>Time Window</span>
                    <span>UTC control gating</span>
                </div>
                <div className="node-icon" style={{ color: '#ffffff' }}>
                    <BlockIcon type="control.timeWindow" size={20} />
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Start (UTC)</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                            const value = e.target.value;
                            setStartTime(value);
                            updateData({ startTime: value });
                        }}
                    />
                </div>
                <div className="field">
                    <label>End (UTC)</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                            const value = e.target.value;
                            setEndTime(value);
                            updateData({ endTime: value });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Days (UTC)</label>
                    <div className="day-toggle-grid">
                        {DAY_LABELS.map((day) => {
                            const active = daySet.has(day);
                            return (
                                <label
                                    key={day}
                                    className={`day-toggle ${active ? 'day-toggle-active' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() => toggleDay(day)}
                                    />
                                    <span>{day}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Gates control flow by UTC time</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:allowed"
                className="data"
                style={{ top: '34%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:now"
                className="data"
                style={{ top: '66%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:nextAllowedAt"
                className="data"
                style={{ top: '82%' }}
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
