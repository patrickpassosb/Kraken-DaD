import { createContext, useContext, type ReactNode } from 'react';

type NodeActionContextValue = {
    runNode: (nodeId: string) => void;
    toggleNodeDisabled: (nodeId: string) => void;
    deleteNode: (nodeId: string) => void;
};

const NodeActionContext = createContext<NodeActionContextValue | null>(null);

export function NodeActionProvider({
    value,
    children,
}: {
    value: NodeActionContextValue;
    children: ReactNode;
}) {
    return <NodeActionContext.Provider value={value}>{children}</NodeActionContext.Provider>;
}

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
