import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BlockIcon } from '../components/BlockIcon';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

const INTERVAL_OPTIONS = [1, 5, 15, 30, 60, 240, 1440, 10080, 21600];
const INTERVAL_LABELS: Record<number, string> = {
    1: '1m',
    5: '5m',
    15: '15m',
    30: '30m',
    60: '1h',
    240: '4h',
    1440: '1d',
    10080: '1w',
    21600: '15d',
};

export interface OhlcNodeData {
    pair?: string;
    interval?: number;
    count?: number;
    status?: NodeStatus;
    disabled?: boolean;
}

function parseCountInput(raw: string): number | null {
    const cleaned = raw.trim().replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(parsed, 1);
}

/** Data node that requests OHLC snapshots for a pair/interval. */
export function OhlcNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as OhlcNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const [pair, setPair] = useState(nodeData.pair ?? 'BTC/USD');
    const [interval, setInterval] = useState(nodeData.interval ?? 1);
    const [countInput, setCountInput] = useState(String(nodeData.count ?? 120));

    const updateData = useCallback(
        (updates: Partial<OhlcNodeData>) => {
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
                    <span>OHLC Candles</span>
                    <span>Kraken public OHLC snapshot</span>
                </div>
                <div className="node-icon" style={{ color: '#ffffff' }}>
                    <BlockIcon type="data.kraken.ohlc" size={20} />
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
                    <label>Interval</label>
                    <select
                        value={interval}
                        onChange={(e) => {
                            const next = Number.parseInt(e.target.value, 10);
                            setInterval(next);
                            updateData({ interval: next });
                        }}
                    >
                        {INTERVAL_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {INTERVAL_LABELS[option] ?? `${option}m`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Candles</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={countInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setCountInput(raw);
                            const parsed = parseCountInput(raw);
                            if (parsed === null) {
                                if (raw.trim() === '') {
                                    updateData({ count: 0 });
                                }
                                return;
                            }
                            updateData({ count: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parseCountInput(countInput);
                            if (parsed === null) return;
                            setCountInput(parsed.toString());
                        }}
                    />
                </div>
                <div className="field">
                    <label>Outputs</label>
                    <div className="chip">Candles · Close Series · Last Candle</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Snapshots Kraken OHLC data</span>
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
                id="data:candles"
                className="data"
                style={{ top: '34%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:closeSeries"
                className="data"
                style={{ top: '58%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:lastCandle"
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
