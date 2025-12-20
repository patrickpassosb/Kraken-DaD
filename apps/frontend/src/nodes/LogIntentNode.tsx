import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface LogIntentNodeData {
    action?: string;
    status?: NodeStatus;
    note?: string;
    disabled?: boolean;
}

export function LogIntentNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as LogIntentNodeData) || {};
    const isDisabled = nodeData.disabled;
    const [note, setNote] = useState(nodeData.note || 'Log execution intent for audit');
    const { visible, onNodeEnter, onNodeLeave, onToolbarEnter, onToolbarLeave } =
        useNodeToolbarHover();

    const updateData = useCallback(
        (updates: Partial<LogIntentNodeData>) => {
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
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
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
                    <span>Audit Log</span>
                    <span>Record intent without execution</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-purple), var(--kraken-purple-strong))' }}
                >
                    ℹ
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Note</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => {
                            setNote(e.target.value);
                            updateData({ note: e.target.value });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Behavior</label>
                    <div className="chip">Dry-run logging only</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Captures audit trail</span>
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
                id="data:price"
                className="data"
                style={{ top: '50%' }}
            />
        </div>
    );
}
