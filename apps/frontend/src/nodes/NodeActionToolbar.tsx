import { NodeToolbar, Position } from '@xyflow/react';
import { useNodeActions } from '../context/NodeActionContext';

interface NodeActionToolbarProps {
    nodeId: string;
    disabled?: boolean;
    selected?: boolean;
}

export function NodeActionToolbar({ nodeId, disabled, selected }: NodeActionToolbarProps) {
    const { runNode, toggleNodeDisabled, deleteNode } = useNodeActions();
    const toggleLabel = disabled ? 'Activate' : 'Deactivate';

    return (
        <NodeToolbar isVisible={selected} position={Position.Top} className="node-toolbar nodrag nopan">
            <button className="node-action-btn nodrag" onClick={() => runNode(nodeId)}>
                Run
            </button>
            <button className="node-action-btn nodrag" onClick={() => toggleNodeDisabled(nodeId)}>
                {toggleLabel}
            </button>
            <button className="node-action-btn nodrag" onClick={() => deleteNode(nodeId)}>
                Delete
            </button>
        </NodeToolbar>
    );
}
