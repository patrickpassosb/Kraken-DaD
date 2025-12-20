import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { formatAmount, formatPair, formatPrice } from '../utils/format';
import { NodeStatus } from '../utils/status';

export interface PlaceOrderNodeData {
    pair?: string;
    side?: 'buy' | 'sell';
    type?: 'market' | 'limit';
    amount?: number;
    price?: number;
    status?: NodeStatus;
    disabled?: boolean;
}

export function PlaceOrderNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = data as PlaceOrderNodeData;
    const isDisabled = nodeData?.disabled;

    const [pair, setPair] = useState(nodeData?.pair || 'BTC/USD');
    const [side, setSide] = useState<'buy' | 'sell'>(nodeData?.side || 'buy');
    const [amount, setAmount] = useState(nodeData?.amount || 0.1);
    const [price, setPrice] = useState<number | undefined>(nodeData?.price);

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
        <div className="node-card">
            <NodeActionToolbar nodeId={id} disabled={isDisabled} selected={selected} />
            <div className="node-head">
                <div className="node-title">
                    <span>Execution</span>
                    <span>Prepare Kraken order intent</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-green), #46ef9a)' }}
                >
                    ✓
                </div>
            </div>
            <div className="node-body">
                <div className="field">
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
                <div className="field">
                    <label>Side</label>
                    <select
                        value={side}
                        onChange={(e) => {
                            const val = e.target.value as 'buy' | 'sell';
                            setSide(val);
                            updateData({ side: val });
                        }}
                    >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>
                <div className="field">
                    <label>Amount</label>
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                            const parsed = parseFloat(e.target.value);
                            const val = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
                            setAmount(val);
                            updateData({ amount: val });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Limit reference (optional)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={price ?? ''}
                        placeholder="Market if empty"
                        onChange={(e) => {
                            if (e.target.value === '') {
                                setPrice(undefined);
                                updateData({ price: undefined });
                                return;
                            }
                            const parsed = parseFloat(e.target.value);
                            const val = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
                            setPrice(val);
                            updateData({ price: val });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Summary</label>
                    <div className="chip">
                        {side === 'buy' ? 'Buy' : 'Sell'} {formatAmount(amount)} @ {formatPrice(price)}
                        {' '}({formatPair(pair)})
                    </div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Outputs order intent</span>
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
                id="data:price"
                className="data"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:orderId"
                className="data"
                style={{ top: '50%' }}
            />
        </div>
    );
}
