import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export interface PlaceOrderNodeData {
    pair?: string;
    side?: 'buy' | 'sell';
    type?: 'market' | 'limit';
    amount?: number;
    price?: number;
}

export function PlaceOrderNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = data as PlaceOrderNodeData;

    const [pair, setPair] = useState(nodeData?.pair || 'XBT/USD');
    const [side, setSide] = useState<'buy' | 'sell'>(nodeData?.side || 'buy');
    const [amount, setAmount] = useState(nodeData?.amount || 0.1);

    const updateData = useCallback(
        (updates: Partial<PlaceOrderNodeData>) => {
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
            <div className="node-header action">Place Order</div>
            <div className="node-body">
                <div className="node-field">
                    <label>Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={(e) => {
                            setPair(e.target.value);
                            updateData({ pair: e.target.value });
                        }}
                    />
                </div>
                <div className="node-field">
                    <label>Side</label>
                    <select
                        value={side}
                        onChange={(e) => {
                            const val = e.target.value as 'buy' | 'sell';
                            setSide(val);
                            updateData({ side: val });
                        }}
                        style={{ width: '100%', padding: '6px', background: '#0f0f14', border: '1px solid #3a3a50', borderRadius: '4px', color: '#fff' }}
                    >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>
                <div className="node-field">
                    <label>Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setAmount(val);
                            updateData({ amount: val });
                        }}
                    />
                </div>
                <div className="port-row">
                    <span className="port-label left">trigger</span>
                    <span className="port-label right">orderId</span>
                </div>
                <div className="port-row">
                    <span className="port-label left">price</span>
                    <span></span>
                </div>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:trigger"
                className="control"
                style={{ top: '70%' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="data:price"
                className="data"
                style={{ top: '85%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:orderId"
                className="data"
                style={{ top: '70%' }}
            />
        </div>
    );
}
