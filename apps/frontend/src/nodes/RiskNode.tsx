import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeStatus } from '../utils/status';

export interface RiskNodeData {
    status?: NodeStatus;
    maxSpread?: number;
    pair?: string;
}

export function RiskNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as RiskNodeData) || {};

    const [pair, setPair] = useState(nodeData.pair ?? 'BTC/USD');
    const [maxSpread, setMaxSpread] = useState(nodeData.maxSpread ?? 5);

    const updateData = useCallback(
        (updates: Partial<RiskNodeData>) => {
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
            <div className="node-head">
                <div className="node-title">
                    <span>Orderbook Guard</span>
                    <span>Blocks if spread too wide</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-amber), var(--kraken-purple-strong))', color: '#0b0a12' }}
                >
                    ⚑
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
                    <label>Max spread (USD)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={maxSpread}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaxSpread(val);
                            updateData({ maxSpread: val });
                        }}
                    />
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Reads Kraken orderbook spread</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '40%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:out"
                className="control"
                style={{ top: '40%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:spread"
                className="data"
                style={{ top: '65%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:allowed"
                className="data"
                style={{ top: '80%' }}
            />
        </div>
    );
}
