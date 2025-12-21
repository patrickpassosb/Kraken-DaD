import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { StatusPill } from '../components/StatusPill';
import { NodeActionToolbar } from './NodeActionToolbar';
import { NodeStatus } from '../utils/status';
import { useNodeToolbarHover } from './useNodeToolbarHover';

type ConstantValueType = 'number' | 'string' | 'boolean';

export interface ConstantNodeData {
    value?: number | string | boolean;
    valueType?: ConstantValueType;
    status?: NodeStatus;
    disabled?: boolean;
}

const DEFAULTS: Record<ConstantValueType, { value: number | string | boolean; input: string }> = {
    number: { value: 90000, input: '90000' },
    string: { value: 'Value', input: 'Value' },
    boolean: { value: true, input: 'true' },
};

function parseDecimalInput(raw: string): number | null {
    const normalized = raw.trim().replace(',', '.').replace(/[^0-9.]/g, '');
    if (normalized === '' || normalized === '.') return null;
    const [whole, ...rest] = normalized.split('.');
    const cleaned = rest.length ? `${whole}.${rest.join('')}` : whole;
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
}

function resolveValueType(data: ConstantNodeData): ConstantValueType {
    if (data.valueType) return data.valueType;
    if (typeof data.value === 'number') return 'number';
    if (typeof data.value === 'boolean') return 'boolean';
    return 'string';
}

function resolveInputValue(data: ConstantNodeData, valueType: ConstantValueType): string {
    const { value } = data;
    if (value === undefined || value === null) {
        return DEFAULTS[valueType].input;
    }
    if (valueType === 'boolean') {
        return value ? 'true' : 'false';
    }
    return String(value);
}

/** Data node that emits a literal constant with configurable type. */
export function ConstantNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const nodeData = (data as ConstantNodeData) || {};
    const isDisabled = nodeData.disabled;
    const { visible, onNodeEnter, onNodeLeave } =
        useNodeToolbarHover();

    const initialType = resolveValueType(nodeData);
    const [valueType, setValueType] = useState<ConstantValueType>(initialType);
    const [valueInput, setValueInput] = useState(resolveInputValue(nodeData, initialType));

    const updateData = useCallback(
        (updates: Partial<ConstantNodeData>) => {
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

    const handleTypeChange = useCallback(
        (nextType: ConstantValueType) => {
            setValueType(nextType);
            const defaults = DEFAULTS[nextType];
            setValueInput(defaults.input);
            updateData({ valueType: nextType, value: defaults.value });
        },
        [updateData]
    );

    const handleValueChange = useCallback(
        (raw: string) => {
            setValueInput(raw);
            if (valueType === 'number') {
                const parsed = parseDecimalInput(raw);
                if (parsed === null) {
                    if (raw.trim() === '') {
                        updateData({ value: 0 });
                    }
                    return;
                }
                updateData({ value: parsed });
                return;
            }
            if (valueType === 'boolean') {
                updateData({ value: raw === 'true' });
                return;
            }
            updateData({ value: raw });
        },
        [updateData, valueType]
    );

    const displayValue =
        valueType === 'boolean'
            ? valueInput === 'true'
                ? 'True'
                : 'False'
            : valueInput || DEFAULTS[valueType].input;

    return (
        <div className="node-card" onMouseEnter={onNodeEnter} onMouseLeave={onNodeLeave}>
            <NodeActionToolbar
                nodeId={id}
                disabled={isDisabled}
                visible={visible}
            />
            <div className="node-head">
                <div className="node-title">
                    <span>Constant</span>
                    <span>Static input value</span>
                </div>
                <div
                    className="node-icon"
                    style={{ background: 'linear-gradient(135deg, var(--kraken-cyan), #3d2c69)' }}
                >
                    C
                </div>
            </div>
            <div className="node-body">
                <div className="field">
                    <label>Type</label>
                    <select
                        value={valueType}
                        onChange={(e) => handleTypeChange(e.target.value as ConstantValueType)}
                    >
                        <option value="number">Number</option>
                        <option value="string">String</option>
                        <option value="boolean">Boolean</option>
                    </select>
                </div>
                <div className="field">
                    <label>Value</label>
                    {valueType === 'boolean' ? (
                        <select value={valueInput} onChange={(e) => handleValueChange(e.target.value)}>
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            inputMode={valueType === 'number' ? 'decimal' : 'text'}
                            value={valueInput}
                            onChange={(e) => handleValueChange(e.target.value)}
                        />
                    )}
                </div>
                <div className="field">
                    <label>Output</label>
                    <div className="chip">Value: {displayValue}</div>
                </div>
            </div>
            <div className="node-footer">
                <StatusPill status={nodeData.status} />
                <span>Outputs a constant value</span>
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
                id="data:value"
                className="data"
                style={{ top: '55%' }}
            />
        </div>
    );
}
