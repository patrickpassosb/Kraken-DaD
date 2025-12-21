import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BlockIcon } from '../components/BlockIcon';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface SpreadNodeData {
    pair?: string;
    count?: number;
    status?: NodeStatus;
    disabled?: boolean;
}

function parseCount(raw: string): number | null {
    const cleaned = raw.trim().replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(parsed, 1);
}

/** Data node that emits recent spread stats for a pair. */
export function SpreadNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as SpreadNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [pair, setPair] = useState(nodeData.pair ?? 'BTC/USD');
    const [countInput, setCountInput] = useState(String(nodeData.count ?? 50));

    const updateData = useCallback(
        (updates: Partial<SpreadNodeData>) => {
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
                    <span>Recent Spreads</span>
                    <span>Kraken bid/ask spread history</span>
                </div>
                <div className="node-icon">
                    <BlockIcon type="data.kraken.spread" size={20} />
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={(e) => {
                            const value = e.target.value;
                            setPair(value);
                            updateData({ pair: value });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Window (entries)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={countInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setCountInput(raw);
                            const parsed = parseCount(raw);
                            if (parsed === null) {
                                if (raw.trim() === '') {
                                    updateData({ count: 0 });
                                }
                                return;
                            }
                            updateData({ count: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parseCount(countInput);
                            if (parsed === null) return;
                            setCountInput(parsed.toString());
                        }}
                    />
                </div>
                <div className="field">
                    <label>Outputs</label>
                    <div className="chip">Latest · Avg · Median · Min/Max</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Tracks spread conditions</span>
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
                id="data:latest"
                className="data"
                style={{ top: '24%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:average"
                className="data"
                style={{ top: '36%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:median"
                className="data"
                style={{ top: '58%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:min"
                className="data"
                style={{ top: '70%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:max"
                className="data"
                style={{ top: '82%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:series"
                className="data"
                style={{ top: '94%' }}
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
