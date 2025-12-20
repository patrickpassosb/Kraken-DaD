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

function parseDecimalInput(raw: string): number | null {
    const normalized = raw.trim().replace(',', '.').replace(/[^0-9.]/g, '');
    if (normalized === '' || normalized === '.') return null;
    const [whole, ...rest] = normalized.split('.');
    const cleaned = rest.length ? `${whole}.${rest.join('')}` : whole;
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(parsed, 0);
}

export function PlaceOrderNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = data as PlaceOrderNodeData;
    const isDisabled = nodeData?.disabled;

    const [pair, setPair] = useState(nodeData?.pair || 'BTC/USD');
    const [side, setSide] = useState<'buy' | 'sell'>(nodeData?.side || 'buy');
    const initialAmount = nodeData?.amount ?? 0.1;
    const [amount, setAmount] = useState(initialAmount);
    const [amountInput, setAmountInput] = useState(String(initialAmount));
    const [price, setPrice] = useState<number | undefined>(nodeData?.price);
    const [priceInput, setPriceInput] = useState(
        nodeData?.price !== undefined ? String(nodeData.price) : ''
    );

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
                        type="text"
                        inputMode="decimal"
                        value={amountInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setAmountInput(raw);
                            const parsed = parseDecimalInput(raw);
                            if (parsed === null) {
                                if (raw.trim() === '') {
                                    setAmount(0);
                                    updateData({ amount: 0 });
                                }
                                return;
                            }
                            setAmount(parsed);
                            updateData({ amount: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parseDecimalInput(amountInput);
                            if (parsed === null) return;
                            setAmountInput(parsed.toString());
                        }}
                    />
                </div>
                <div className="field">
                    <label>Limit reference (optional)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={priceInput}
                        placeholder="Market if empty"
                        onChange={(e) => {
                            const raw = e.target.value;
                            setPriceInput(raw);
                            if (raw.trim() === '') {
                                setPrice(undefined);
                                updateData({ price: undefined });
                                return;
                            }
                            const parsed = parseDecimalInput(raw);
                            if (parsed === null) return;
                            setPrice(parsed);
                            updateData({ price: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parseDecimalInput(priceInput);
                            if (parsed === null) return;
                            setPriceInput(parsed.toString());
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
