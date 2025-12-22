# Task: Fix Tidy Layout for Disconnected Nodes

Fix the "Tidy Up" functionality to organize disconnected nodes in a horizontal straight line instead of stacking them vertically.

## Success Criteria
- [x] Clicking "Tidy Up" with disconnected nodes results in a horizontal layout.
- [x] Disconnected nodes are ordered by their type (Start, Market Data, Logic, Action).
- [x] Connected nodes still layout correctly in flow depth.
- [x] No overlaps between nodes.

## Implementation Plan
1.  Analyze `handleTidyLayout` in `apps/frontend/src/canvas/FlowCanvas.tsx`.
2.  Modify the `x` calculation to incorporate `laneIndexForType` when nodes are at the root level or disconnected.
3.  Adjust `rowById` assignment to allow disconnected root nodes to share a row if they are in different lanes.
4.  Verify the fix with various node configurations.

## Notes
- Disconnected nodes all have `controlDepth = 0` currently.
- `laneIndexForType` provides a natural horizontal ordering.
- `assignRows` currently gives each root a new row.
