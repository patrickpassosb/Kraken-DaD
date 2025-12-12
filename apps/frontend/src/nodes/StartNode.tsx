import { Handle, Position, NodeProps } from '@xyflow/react';

export type StartNodeData = Record<string, never>;

export function StartNode({ id }: NodeProps) {
    return (
        <div className="node-wrapper">
            <div className="node-header control">Start</div>
            <div className="node-body">
                <div className="port-row">
                    <span className="port-label right" style={{ width: '100%' }}>out</span>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="out"
                className="control"
                style={{ top: '50%' }}
            />
        </div>
    );
}
