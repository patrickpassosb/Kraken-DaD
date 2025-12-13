import { Handle, Position, NodeProps } from '@xyflow/react';

export function IfNode(_props: NodeProps) {
    return (
        <div className="node-wrapper">
            <div className="node-header" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', color: '#0f0f14' }}>
                If
            </div>
            <div className="node-body">
                <div className="port-row">
                    <span className="port-label left">trigger</span>
                    <span className="port-label right">true</span>
                </div>
                <div className="port-row">
                    <span className="port-label left">condition</span>
                    <span className="port-label right">false</span>
                </div>
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
