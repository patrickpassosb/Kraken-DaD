import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export interface KrakenTickerNodeData {
    pair: string;
}

export function KrakenTickerNode({ id, data }: NodeProps<{ data: KrakenTickerNodeData }>) {
    const { setNodes } = useReactFlow();
    const [pair, setPair] = useState((data as KrakenTickerNodeData)?.pair || 'XBT/USD');

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
        <div className="node-wrapper">
            <div className="node-header data">Kraken Ticker</div>
            <div className="node-body">
                <div className="node-field">
                    <label>Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={handlePairChange}
                        placeholder="XBT/USD"
                    />
                </div>
                <div className="port-row">
                    <span></span>
                    <span className="port-label right">price</span>
                </div>
                <div className="port-row">
                    <span></span>
                    <span className="port-label right">out</span>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="price"
                className="data"
                style={{ top: '60%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="out"
                className="control"
                style={{ top: '80%' }}
            />
        </div>
    );
}
