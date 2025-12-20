import { NodeToolbar, Position } from '@xyflow/react';
import { useNodeActions } from '../context/NodeActionContext';

interface NodeActionToolbarProps {
    nodeId: string;
    disabled?: boolean;
    selected?: boolean;
    visible?: boolean;
    onToolbarEnter?: () => void;
    onToolbarLeave?: () => void;
}

export function NodeActionToolbar({
    nodeId,
    disabled,
    selected,
    visible,
    onToolbarEnter,
    onToolbarLeave,
}: NodeActionToolbarProps) {
    const { runNode, toggleNodeDisabled, deleteNode } = useNodeActions();
    const toggleLabel = disabled ? 'Enable' : 'Disable';
    const isVisible = Boolean(selected || visible);
    const visibilityClass = isVisible ? 'node-toolbar-visible' : '';

    return (
        <NodeToolbar
            isVisible
            position={Position.Top}
            className={`node-toolbar nodrag nopan ${visibilityClass}`.trim()}
        >
            <div
                className="node-toolbar-actions"
                onMouseEnter={onToolbarEnter}
                onMouseLeave={onToolbarLeave}
            >
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
