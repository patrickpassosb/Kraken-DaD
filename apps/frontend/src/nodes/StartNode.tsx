import { Handle, Position, NodeProps } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface StartNodeData {
    status?: NodeStatus;
    disabled?: boolean;
}

/** Control entry node that emits the initial trigger signal. */
export function StartNode({ id, data }: NodeProps) {
    const nodeData = (data as StartNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    return (
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                visible={visible}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Strategy Start</span>
                    <span>Entry control signal</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-purple), var(--kraken-purple-strong))' }}
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
