import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface CancelOrderNodeData {
    orderId?: string;
    status?: NodeStatus;
    disabled?: boolean;
}

export function CancelOrderNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = data as CancelOrderNodeData;
    const isDisabled = nodeData?.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

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
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                visible={visible}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Order Control</span>
                    <span>Cancel prepared order</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-red), #ff8897)' }}
                >
                    ✕
                </div>
            </div>
            <div className="node-body">
                <div className="field">
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
                <div className="field">
                    <label>Behavior</label>
                    <div className="chip">Stops intent from executing</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Requires trigger</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:trigger"
                className="control"
                style={{ top: '50%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:orderId"
                className="data"
                style={{ top: '50%' }}
            />
        </div>
    );
}
