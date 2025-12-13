import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeStatus } from '../utils/status';

export interface RiskNodeData {
    status?: NodeStatus;
    maxOrderSize?: number;
    maxTrades?: number;
    priceDeviation?: number;
}

export function RiskNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as RiskNodeData) || {};

    const [maxOrderSize, setMaxOrderSize] = useState(nodeData.maxOrderSize ?? 5);
    const [maxTrades, setMaxTrades] = useState(nodeData.maxTrades ?? 10);
    const [priceDeviation, setPriceDeviation] = useState(nodeData.priceDeviation ?? 1.5);

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
                    <span>Risk Guard</span>
                    <span>Dry-run safety controls</span>
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
                    <label>Max order size (USD)</label>
                    <input
                        type="number"
                        value={maxOrderSize}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaxOrderSize(val);
                            updateData({ maxOrderSize: val });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Max trades per session</label>
                    <input
                        type="number"
                        value={maxTrades}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setMaxTrades(val);
                            updateData({ maxTrades: val });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Price deviation guard (%)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={priceDeviation}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPriceDeviation(val);
                            updateData({ priceDeviation: val });
                        }}
                    />
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>UI-only guard (dry-run)</span>
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
        </div>
    );
}
