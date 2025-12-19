import { memo, type MouseEvent } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    type EdgeProps,
    getSmoothStepPath,
    useReactFlow,
} from '@xyflow/react';

type FlowEdgeData = {
    onInsert?: (edgeId: string, position: { x: number; y: number }) => void;
};

function FlowEdge({
    id,
    data,
    style,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    selected,
    type,
}: EdgeProps<FlowEdgeData>) {
    const { deleteElements } = useReactFlow();
    const [path, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 18,
    });

    const isControl = type === 'control';
    const edgeStyle = {
        stroke: isControl ? 'var(--kraken-purple)' : 'var(--kraken-cyan)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        ...style,
    };

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        deleteElements({ edges: [{ id }] });
    };

    const handleInsert = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        data?.onInsert?.(id, { x: labelX, y: labelY });
    };

    return (
        <>
            <BaseEdge id={id} path={path} markerEnd={markerEnd} style={edgeStyle} interactionWidth={18} />
            <EdgeLabelRenderer>
                <div
                    className={`edge-actions nodrag nopan ${selected ? 'edge-actions-visible' : ''}`}
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }}
                >
                    {isControl && (
                        <button className="edge-action-btn" onClick={handleInsert} title="Insert node">
                            +
                        </button>
                    )}
                    <button className="edge-action-btn" onClick={handleDelete} title="Delete edge">
                        x
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default memo(FlowEdge);
