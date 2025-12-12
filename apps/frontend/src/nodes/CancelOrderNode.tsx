import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export interface CancelOrderNodeData {
    orderId: string;
}

export function CancelOrderNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = data as CancelOrderNodeData;

    const [orderId, setOrderId] = useState(nodeData?.orderId || '');

    const updateData = useCallback(
        (updates: Partial<CancelOrderNodeData>) => {
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
        <div className="node-wrapper">
            <div className="node-header action">Cancel Order</div>
            <div className="node-body">
                <div className="node-field">
                    <label>Order ID</label>
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => {
                            setOrderId(e.target.value);
                            updateData({ orderId: e.target.value });
                        }}
                        placeholder="From input or manual"
                    />
                </div>
                <div className="port-row">
                    <span className="port-label left">trigger</span>
                    <span></span>
                </div>
                <div className="port-row">
                    <span className="port-label left">orderId</span>
                    <span></span>
                </div>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:trigger"
                className="control"
                style={{ top: '60%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:orderId"
                className="data"
                style={{ top: '80%' }}
            />
        </div>
    );
}
