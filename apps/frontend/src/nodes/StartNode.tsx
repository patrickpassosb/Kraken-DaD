import { Handle, Position, NodeProps } from '@xyflow/react';

export type StartNodeData = Record<string, never>;

export function StartNode(_props: NodeProps) {
    return (
        <div className="node-wrapper">
            <div className="node-header control">Start</div>
            <div className="node-body">
                <div className="port-row">
                    <span></span>
                    <span className="port-label right">out</span>
                </div>
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
