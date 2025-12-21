import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BlockIcon } from '../components/BlockIcon';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface AssetPairsNodeData {
    pair?: string;
    status?: NodeStatus;
    disabled?: boolean;
}

/** Data node that requests Kraken AssetPairs metadata for precision/limits. */
export function AssetPairsNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as AssetPairsNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [pair, setPair] = useState(nodeData.pair ?? 'BTC/USD');

    const updateData = useCallback(
        (updates: Partial<AssetPairsNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
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
                    <span>AssetPairs Metadata</span>
                    <span>Tick size + min order constraints</span>
                </div>
                <div className="node-icon">
                    <BlockIcon type="data.kraken.assetPairs" size={20} />
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={(e) => {
                            const value = e.target.value;
                            setPair(value);
                            updateData({ pair: value });
                        }}
                    />
                </div>
                <div className="field">
                    <label>Outputs</label>
                    <div className="chip">Tick Size · Order Min · Decimals</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Validates precision limits</span>
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
                id="data:found"
                className="data"
                style={{ top: '24%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:pairDecimals"
                className="data"
                style={{ top: '36%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:lotDecimals"
                className="data"
                style={{ top: '58%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:orderMin"
                className="data"
                style={{ top: '68%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:costMin"
                className="data"
                style={{ top: '78%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:tickSize"
                className="data"
                style={{ top: '88%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:status"
                className="data"
                style={{ top: '96%' }}
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
