import { NodeToolbar, Position } from '@xyflow/react';
import { useNodeActions } from '../context/NodeActionContext';

interface NodeActionToolbarProps {
    nodeId: string;
    disabled?: boolean;
    visible?: boolean;
}

export function NodeActionToolbar({
    nodeId,
    disabled,
    visible,
}: NodeActionToolbarProps) {
    const { runNode, toggleNodeDisabled, deleteNode } = useNodeActions();
    const toggleLabel = disabled ? 'Enable' : 'Disable';
    const isVisible = Boolean(visible);
    const visibilityClass = isVisible ? 'node-toolbar-visible' : '';

    return (
        <NodeToolbar
            isVisible={isVisible}
            position={Position.Top}
            className={`node-toolbar nodrag nopan ${visibilityClass}`.trim()}
        >
            <div className="node-toolbar-actions">
                <button className="node-action-btn node-action-run nodrag" onClick={() => runNode(nodeId)}>
                    Execute
                </button>
                <button
                    className="node-action-btn node-action-toggle nodrag"
                    onClick={() => toggleNodeDisabled(nodeId)}
                >
                    {toggleLabel}
                </button>
                <button className="node-action-btn node-action-delete nodrag" onClick={() => deleteNode(nodeId)}>
                    Delete
                </button>
            </div>
        </NodeToolbar>
    );
}
