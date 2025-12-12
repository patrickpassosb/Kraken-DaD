import { Handle, Position, NodeProps } from '@xyflow/react';

export interface LogIntentNodeData {
    action?: string;
}

export function LogIntentNode({ id, data }: NodeProps<{ data: LogIntentNodeData }>) {
    return (
        <div className="node-wrapper">
            <div className="node-header action">Log Intent</div>
            <div className="node-body">
                <div className="port-row">
                    <span className="port-label left">in</span>
                    <span></span>
                </div>
                <div className="port-row">
                    <span className="port-label left">price</span>
                    <span></span>
                </div>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="in"
                className="control"
                style={{ top: '45%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="price"
                className="data"
                style={{ top: '70%' }}
            />
        </div>
    );
}
