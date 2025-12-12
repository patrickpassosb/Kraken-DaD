import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { executeDryRun, ExecutionResult } from './api/executeDryRun';
import { toStrategyJSON } from './utils/toStrategyJSON';

// Demo strategy: Start → Kraken Ticker → If → Place Order
const demoNodes: Node[] = [
    {
        id: 'start-1',
        type: 'control.start',
        position: { x: 50, y: 200 },
        data: {},
    },
    {
        id: 'ticker-1',
        type: 'data.kraken.ticker',
        position: { x: 250, y: 180 },
        data: { pair: 'XBT/USD' },
    },
    {
        id: 'if-1',
        type: 'logic.if',
        position: { x: 500, y: 200 },
        data: {},
    },
    {
        id: 'order-1',
        type: 'action.placeOrder',
        position: { x: 750, y: 150 },
        data: { pair: 'XBT/USD', side: 'buy', type: 'market', amount: 0.1 },
    },
];

const demoEdges: Edge[] = [
    {
        id: 'e-start-ticker',
        source: 'start-1',
        sourceHandle: 'control:out',
        target: 'ticker-1',
        targetHandle: 'control:out',
        type: 'step',
        style: { stroke: '#ff9100', strokeWidth: 2 },
    },
    {
        id: 'e-ticker-if-control',
        source: 'ticker-1',
        sourceHandle: 'control:out',
        target: 'if-1',
        targetHandle: 'control:trigger',
        type: 'step',
        style: { stroke: '#ff9100', strokeWidth: 2 },
    },
    {
        id: 'e-if-order',
        source: 'if-1',
        sourceHandle: 'control:true',
        target: 'order-1',
        targetHandle: 'control:trigger',
        type: 'step',
        style: { stroke: '#ff9100', strokeWidth: 2 },
    },
    {
        id: 'e-ticker-order-price',
        source: 'ticker-1',
        sourceHandle: 'data:price',
        target: 'order-1',
        targetHandle: 'data:price',
        type: 'default',
        style: { stroke: '#00e676', strokeWidth: 2 },
    },
];

function App() {
    const [nodes, setNodes] = useState<Node[]>(demoNodes);
    const [edges, setEdges] = useState<Edge[]>(demoEdges);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleNodesChange = useCallback((newNodes: Node[]) => {
        setNodes(newNodes);
    }, []);

    const handleEdgesChange = useCallback((newEdges: Edge[]) => {
        setEdges(newEdges);
    }, []);

    const handleExecute = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const strategy = toStrategyJSON(nodes, edges);
            console.log('Strategy JSON:', JSON.stringify(strategy, null, 2));
            const executionResult = await executeDryRun(strategy);
            setResult(executionResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportJSON = () => {
        const strategy = toStrategyJSON(nodes, edges);
        const json = JSON.stringify(strategy, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'strategy.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>🐙 Kraken DaD</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleExportJSON}>
                        Export JSON
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExecute}
                        disabled={loading}
                    >
                        {loading ? 'Running...' : 'Run (Dry-Run)'}
                    </button>
                </div>
            </header>

            <FlowCanvas
                initialNodes={demoNodes}
                initialEdges={demoEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
            />

            {(result || error) && (
                <div className="result-panel">
                    <h3>Execution Result</h3>
                    {error && <p className="result-error">Error: {error}</p>}
                    {result && (
                        <div className="result-grid">
                            <div className="result-item">
                                <h4>Status</h4>
                                <p className={result.success ? 'result-success' : 'result-error'}>
                                    {result.success ? '✓ Success' : '✗ Failed'}
                                </p>
                            </div>
                            <div className="result-item">
                                <h4>Nodes Executed</h4>
                                <p>{result.nodesExecuted}</p>
                            </div>
                            {result.actionIntents.length > 0 && (
                                <div className="result-item">
                                    <h4>Action Intents</h4>
                                    <pre>{JSON.stringify(result.actionIntents, null, 2)}</pre>
                                </div>
                            )}
                            {result.errors.length > 0 && (
                                <div className="result-item">
                                    <h4>Errors</h4>
                                    <pre className="result-error">
                                        {JSON.stringify(result.errors, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {result.warnings.length > 0 && (
                                <div className="result-item">
                                    <h4>Warnings</h4>
                                    <pre>{JSON.stringify(result.warnings, null, 2)}</pre>
                                </div>
                            )}
                            {result.log.length > 0 && (
                                <div className="result-item">
                                    <h4>Execution Log</h4>
                                    <pre>{JSON.stringify(result.log, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
