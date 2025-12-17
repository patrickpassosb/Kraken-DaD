import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { formatPrice } from '../utils/format';
import { NodeStatus } from '../utils/status';

export interface ConditionNodeData {
    status?: NodeStatus;
    comparator?: string;
    threshold?: number;
}

export function IfNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as ConditionNodeData) || {};

    const [comparator, setComparator] = useState(nodeData.comparator || '>');
    const [threshold, setThreshold] = useState<number>(nodeData.threshold ?? 90135.6);

    const updateData = useCallback(
        (updates: Partial<ConditionNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, ...updates } }
                        : node
                )
            );
        },
        [id, setNodes]
    );

    return (
        <div className="node-card">
            <div className="node-head">
                <div className="node-title">
                    <span>Condition</span>
                    <span>Human-readable logic</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-purple-strong), var(--kraken-cyan))' }}
                >
                    ?
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Condition</label>
                    <div className="chip">IF Price {comparator} {formatPrice(threshold)}</div>
                </div>
                <div className="field">
                    <label>Comparator</label>
                    <select
                        value={comparator}
                        onChange={(e) => {
                            setComparator(e.target.value);
                            updateData({ comparator: e.target.value });
                        }}
                    >
                        <option value=">">Greater than</option>
                        <option value="<">Less than</option>
                        <option value=">=">Greater or equal</option>
                        <option value="<=">Less or equal</option>
                    </select>
                </div>
                <div className="field">
                    <label>Threshold (USD)</label>
                    <input
                        type="number"
                        value={threshold}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setThreshold(val);
                            updateData({ threshold: val });
                        }}
                    />
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Routes true/false</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '45%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:condition"
                className="data"
                style={{ top: '70%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:true"
                className="control"
                style={{ top: '45%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:false"
                className="control"
                style={{ top: '70%' }}
            />
        </div>
    );
}
