import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { formatPair } from '../utils/format';
import { NodeStatus } from '../utils/status';

export interface KrakenTickerNodeData {
    pair?: string;
    status?: NodeStatus;
}

export function KrakenTickerNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const [pair, setPair] = useState((data as KrakenTickerNodeData)?.pair || 'BTC/USD');

    const handlePairChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newPair = e.target.value;
            setPair(newPair);
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, pair: newPair } }
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
                    <span>Market Data</span>
                    <span>Kraken public ticker</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-cyan), #4dd9ff)' }}
                >
                    $
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={handlePairChange}
                        placeholder="BTC/USD"
                    />
                </div>
                <div className="field">
                    <label>Outputs</label>
                    <div className="chip">Price • Pair</div>
                </div>
                <div className="field">
                    <label>Formatted</label>
                    <div className="chip">{formatPair(pair)}</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={(data as KrakenTickerNodeData)?.status} />
                <span>Waiting for market tick</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '80%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:price"
                className="data"
                style={{ top: '60%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:out"
                className="control"
                style={{ top: '80%' }}
            />
        </div>
    );
}
