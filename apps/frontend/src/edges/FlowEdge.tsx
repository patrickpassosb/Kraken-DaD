import { memo, type CSSProperties, type MouseEvent } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    type Edge,
    type EdgeProps,
    getBezierPath,
    getSmoothStepPath,
    getStraightPath,
    Position,
    useReactFlow,
} from '@xyflow/react';

type EdgePathMode = 'auto' | 'straight' | 'curved';

const EDGE_PADDING_BOTTOM = 130;
const EDGE_PADDING_X = 40;
const EDGE_BORDER_RADIUS = 16;
const HANDLE_SIZE = 20;
const STRAIGHT_TOLERANCE = 24;

type FlowEdgeData = {
    onInsert?: (edgeId: string, position: { x: number; y: number }) => void;
    offset?: number;
    stepPosition?: number;
    hidden?: boolean;
    pathMode?: EdgePathMode;
};

const isRightOfSourceHandle = (sourceX: number, targetX: number) => sourceX - HANDLE_SIZE > targetX;

/**
 * Custom edge renderer that supports curved/straight paths, delete/insert actions,
 * and optional hiding for implied data edges.
 */
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
}: EdgeProps<Edge<FlowEdgeData>>) {
    const { deleteElements } = useReactFlow();
    const pathMode = data?.pathMode ?? 'auto';
    const offset = data?.offset ?? 0;
    const aligned = Math.abs(sourceY - targetY) <= STRAIGHT_TOLERANCE;
    const useStraight = pathMode === 'straight' || (pathMode === 'auto' && aligned);
    const isBackward = isRightOfSourceHandle(sourceX, targetX);

    let segments: Array<[string, number, number]> = [];
    let labelX = 0;
    let labelY = 0;

    if (useStraight) {
        const [path, centerX, centerY] = getStraightPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
        });
        segments = [[path, centerX, centerY]];
        labelX = centerX;
        labelY = centerY;
    } else if (!isBackward) {
        const [path, centerX, centerY] = getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
        segments = [[path, centerX, centerY]];
        labelX = centerX;
        labelY = centerY;
    } else {
        const midX = (sourceX + targetX) / 2;
        const midY = sourceY + EDGE_PADDING_BOTTOM + offset;
        const [firstPath] = getSmoothStepPath({
            sourceX,
            sourceY,
            targetX: midX,
            targetY: midY,
            sourcePosition,
            targetPosition: Position.Right,
            borderRadius: EDGE_BORDER_RADIUS,
            offset: EDGE_PADDING_X,
        });
        const [secondPath] = getSmoothStepPath({
            sourceX: midX,
            sourceY: midY,
            targetX,
            targetY,
            sourcePosition: Position.Left,
            targetPosition,
            borderRadius: EDGE_BORDER_RADIUS,
            offset: EDGE_PADDING_X,
        });
        segments = [
            [firstPath, midX, midY],
            [secondPath, midX, midY],
        ];
        labelX = midX;
        labelY = midY;
    }

    const isControl = type === 'control';
    const hidden = data?.hidden;
    const edgeStyle: CSSProperties = {
        stroke: isControl ? 'var(--kraken-purple)' : 'var(--kraken-cyan)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        opacity: hidden ? 0 : 1,
        ...(style ?? {}),
    };

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        deleteElements({ edges: [{ id }] });
    };

    const handleInsert = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        data?.onInsert?.(id, { x: labelX, y: labelY });
    };

    if (hidden) {
        return (
            <>
                {segments.map((segment, index) => (
                    <BaseEdge
                        key={`${id}-${index}`}
                        id={`${id}-${index}`}
                        path={segment[0]}
                        markerEnd={markerEnd}
                        style={edgeStyle}
                        interactionWidth={0}
                    />
                ))}
            </>
        );
    }

    return (
        <>
            {segments.map((segment, index) => (
                <BaseEdge
                    key={`${id}-${index}`}
                    id={`${id}-${index}`}
                    path={segment[0]}
                    markerEnd={markerEnd}
                    style={edgeStyle}
                    interactionWidth={18}
                />
            ))}
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
