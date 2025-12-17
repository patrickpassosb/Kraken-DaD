import { Handle, Position, NodeProps } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeStatus } from '../utils/status';

export interface StartNodeData {
    status?: NodeStatus;
}

export function StartNode({ data }: NodeProps) {
    const nodeData = (data as StartNodeData) || {};

    return (
        <div className="node-card">
            <div className="node-head">
                <div className="node-title">
                    <span>Strategy Start</span>
                    <span>Entry control signal</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-purple), var(--kraken-cyan))' }}
                >
                    ▶
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Execution lane</label>
                    <div className="chip">Control • Start</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Waiting to trigger</span>
            </div>
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
