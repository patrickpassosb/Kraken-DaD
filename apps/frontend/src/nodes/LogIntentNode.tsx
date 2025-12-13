import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeStatus } from '../utils/status';

export interface LogIntentNodeData {
    action?: string;
    status?: NodeStatus;
    note?: string;
}

export function LogIntentNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as LogIntentNodeData) || {};
    const [note, setNote] = useState(nodeData.note || 'Log execution intent for audit');

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
        <div className="node-card">
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
                style={{ top: '45%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:price"
                className="data"
                style={{ top: '70%' }}
            />
        </div>
    );
}
