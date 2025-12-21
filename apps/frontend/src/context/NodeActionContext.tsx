import { createContext, useContext, type ReactNode } from 'react';

type NodeActionContextValue = {
    runNode: (nodeId: string) => void;
    toggleNodeDisabled: (nodeId: string) => void;
    deleteNode: (nodeId: string) => void;
};

const NodeActionContext = createContext<NodeActionContextValue | null>(null);

/** Supplies canvas-level node actions (run/disable/delete) to toolbar buttons. */
export function NodeActionProvider({
    value,
    children,
}: {
    value: NodeActionContextValue;
    children: ReactNode;
}) {
    return <NodeActionContext.Provider value={value}>{children}</NodeActionContext.Provider>;
}

/** Accessor for node action callbacks; returns no-op defaults outside provider scope. */
export function useNodeActions() {
    const context = useContext(NodeActionContext);
    if (!context) {
        return {
            runNode: () => undefined,
            toggleNodeDisabled: () => undefined,
            deleteNode: () => undefined,
        };
    }
    return context;
}
