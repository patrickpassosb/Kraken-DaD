import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

export interface RiskNodeData {
    status?: NodeStatus;
    maxSpread?: number;
    pair?: string;
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

export function RiskNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as RiskNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave, onToolbarEnter, onToolbarLeave } =
        useNodeToolbarHover();

    const [pair, setPair] = useState(nodeData.pair ?? 'BTC/USD');
    const initialMaxSpread = nodeData.maxSpread ?? 5;
    const [maxSpreadInput, setMaxSpreadInput] = useState(String(initialMaxSpread));

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
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                selected={selected}
                visible={visible}
                onToolbarEnter={onToolbarEnter}
                onToolbarLeave={onToolbarLeave}
            />
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
                        type="text"
                        inputMode="decimal"
                        value={maxSpreadInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setMaxSpreadInput(raw);
                            const parsed = parseDecimalInput(raw);
                            if (parsed === null) {
                                if (raw.trim() === '') {
                                    updateData({ maxSpread: 0 });
                                }
                                return;
                            }
                            updateData({ maxSpread: parsed });
                        }}
                        onBlur={() => {
                            const parsed = parseDecimalInput(maxSpreadInput);
                            if (parsed === null) return;
                            setMaxSpreadInput(parsed.toString());
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
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="control:out"
                className="control"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:spread"
                className="data"
                style={{ top: '45%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="data:allowed"
                className="data"
                style={{ top: '55%' }}
            />
        </div>
    );
}
