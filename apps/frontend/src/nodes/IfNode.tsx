import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { formatPrice } from '../utils/format';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface ConditionNodeData {
    status?: NodeStatus;
    comparator?: string;
    threshold?: number;
    disabled?: boolean;
}

export function IfNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as ConditionNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave, onToolbarEnter, onToolbarLeave } =
        useNodeToolbarHover();

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
        <div className="node-card node-card-conditional" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                selected={selected}
                visible={visible}
                onToolbarEnter={onToolbarEnter}
                onToolbarLeave={onToolbarLeave}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Condition</span>
                    <span>Human-readable logic</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-amber), #ffd166)' }}
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
            <span className="if-branch-label if-branch-true">true</span>
            <span className="if-branch-label if-branch-false">false</span>
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
                id="data:condition"
                className="data"
                style={{ top: '45%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:threshold"
                className="data"
                style={{ top: '55%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:true"
                className="control"
                style={{ top: '46%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:false"
                className="control"
                style={{ top: '62%' }}
            />
        </div>
    );
}
