import { useState, useCallback } from 'react';
import { BlockIcon } from '../components/BlockIcon';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { formatPair } from '../utils/format';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface KrakenTickerNodeData {
    pair?: string;
    status?: NodeStatus;
    disabled?: boolean;
}

/** Data node that fetches Kraken ticker snapshots (or uses backend mock). */
export function KrakenTickerNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as KrakenTickerNodeData) || {};
    const [pair, setPair] = useState(nodeData?.pair || 'BTC/USD');
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

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
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                visible={visible}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Market Data</span>
                    <span>Kraken public ticker</span>
                </div>
                <div className="node-icon">
                    <BlockIcon type="data.kraken.ticker" size={20} />
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
                    <div className="chip">Price • Pair • Bid • Ask • Spread</div>
                </div>
                <div className="field">
                    <label>Formatted</label>
                    <div className="chip">{formatPair(pair)}</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Waiting for market tick</span>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="control:in"
                className="control"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:price"
                className="data"
                style={{ top: '34%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:bid"
                className="data"
                style={{ top: '42%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:ask"
                className="data"
                style={{ top: '58%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:spread"
                className="data"
                style={{ top: '66%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:pair"
                className="data"
                style={{ top: '74%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:out"
                className="control"
                style={{ top: '50%' }}
            />
        </div>
    );
}
