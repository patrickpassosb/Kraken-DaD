import { useState, useCallback, useMemo, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { executeDryRun, ExecutionResult } from './api/executeDryRun';
import { fetchMarketContext, MarketContextResponse } from './api/marketContext';
import { toStrategyJSON } from './utils/toStrategyJSON';
import { MarketContextDock } from './components/MarketContextDock';
import { OrderPreviewPanel } from './components/OrderPreviewPanel';
import { ExecutionTimeline, TimelineItem } from './components/ExecutionTimeline';
import { formatPair } from './utils/format';
import { NodeStatus } from './utils/status';

type MarketStatus = 'Open' | 'Halted';

interface MarketContext {
    pair: string;
    lastPrice: number;
    spread: number;
    change: number;
    status: MarketStatus;
    ask?: number | null;
    bid?: number | null;
}

// Demo strategy: Strategy Start -> Market Data -> Condition -> Risk -> Execution
const demoNodes: Node[] = [
    {
        id: 'start-1',
        type: 'control.start',
        position: { x: 80, y: 220 },
        data: {},
    },
    {
        id: 'ticker-1',
        type: 'data.kraken.ticker',
        position: { x: 260, y: 200 },
        data: { pair: 'BTC/USD' },
    },
    {
        id: 'if-1',
        type: 'logic.if',
        position: { x: 520, y: 220 },
        data: { comparator: '>', threshold: 90135.6 },
    },
    {
        id: 'risk-1',
        type: 'risk.guard',
        position: { x: 720, y: 200 },
        data: { pair: 'BTC/USD', maxSpread: 5 },
    },
    {
        id: 'order-1',
        type: 'action.placeOrder',
        position: { x: 940, y: 200 },
        data: { pair: 'BTC/USD', side: 'buy', type: 'limit', amount: 0.1, price: 90135.6 },
    },
    {
        id: 'audit-1',
        type: 'action.logIntent',
        position: { x: 980, y: 380 },
        data: { note: 'Capture execution intent' },
    },
];

const demoEdges: Edge[] = [
    {
        id: 'e-start-ticker',
        source: 'start-1',
        sourceHandle: 'control:out',
        target: 'ticker-1',
        targetHandle: 'control:in',
        type: 'control',
    },
    {
        id: 'e-ticker-if-control',
        source: 'ticker-1',
        sourceHandle: 'control:out',
        target: 'if-1',
        targetHandle: 'control:in',
        type: 'control',
    },
    {
        id: 'e-if-risk',
        source: 'if-1',
        sourceHandle: 'control:true',
        target: 'risk-1',
        targetHandle: 'control:in',
        type: 'control',
    },
    {
        id: 'e-risk-order',
        source: 'risk-1',
        sourceHandle: 'control:out',
        target: 'order-1',
        targetHandle: 'control:trigger',
        type: 'control',
    },
    {
        id: 'e-if-audit',
        source: 'if-1',
        sourceHandle: 'control:false',
        target: 'audit-1',
        targetHandle: 'control:in',
        type: 'control',
    },
    {
        id: 'e-ticker-if-condition',
        source: 'ticker-1',
        sourceHandle: 'data:price',
        target: 'if-1',
        targetHandle: 'data:condition',
        type: 'data',
    },
    {
        id: 'e-ticker-order-price',
        source: 'ticker-1',
        sourceHandle: 'data:price',
        target: 'order-1',
        targetHandle: 'data:price',
        type: 'data',
    },
];

function friendlyError(err: unknown): string {
    const raw = err instanceof Error ? err.message : 'Unable to run strategy';
    if (raw.toLowerCase().includes('schema')) {
        return 'Strategy definition looks out of date. Refresh and retry the dry-run.';
    }
    if (raw.toLowerCase().includes('condition')) {
        return 'Condition requires a true/false rule. Price comparison detected.';
    }
    return 'Strategy needs valid connections and a start trigger. Please review the canvas.';
}

function derivePair(nodes: Node[]): string {
    const orderNode = nodes.find((n) => n.type === 'action.placeOrder');
    if (orderNode?.data && typeof orderNode.data === 'object' && 'pair' in orderNode.data) {
        return (orderNode.data as { pair?: string }).pair || 'BTC/USD';
    }
    const marketNode = nodes.find((n) => n.type === 'data.kraken.ticker');
    if (marketNode?.data && typeof marketNode.data === 'object' && 'pair' in marketNode.data) {
        return (marketNode.data as { pair?: string }).pair || 'BTC/USD';
    }
    return 'BTC/USD';
}

function mockMarketContext(pair: string): MarketContext {
    const defaults: Record<string, Omit<MarketContext, 'pair'>> = {
        'BTC/USD': { lastPrice: 90135.6, spread: 0.8, change: 0.5, status: 'Open' },
        'ETH/USD': { lastPrice: 3450.12, spread: 0.5, change: -0.3, status: 'Open' },
    };
    const normalized = formatPair(pair);
    const context = defaults[normalized] ?? { lastPrice: 1250, spread: 0.6, change: 0.1, status: 'Open' as MarketStatus };
    return { pair: normalized, ...context };
}

function deriveOrderPreview(nodes: Node[], context: MarketContext) {
    const orderNode = nodes.find((n) => n.type === 'action.placeOrder');
    const data = (orderNode?.data as Record<string, unknown>) || {};
    const side = (data.side as 'buy' | 'sell') || 'buy';
    const amount = (data.amount as number) ?? 0.1;
    const type = (data.type as 'market' | 'limit') || 'market';
    const price = (data.price as number | undefined) ?? context.lastPrice;

    return {
        pair: formatPair((data.pair as string) || context.pair),
        side,
        amount,
        type,
        estimatedPrice: price,
    };
}

function mapLogToStatus(logStatus: string): NodeStatus {
    if (logStatus === 'error') return 'error';
    if (logStatus === 'skipped') return 'skipped';
    return 'executed';
}

function timelineFromResult(
    result: ExecutionResult | null,
    error: string | null,
    nodes: Node[]
): TimelineItem[] {
    if (error) {
        return [
            {
                id: 'error',
                title: 'Strategy halted',
                detail: error,
                status: 'error',
            },
        ];
    }
    if (!result) {
        return [
            { id: 'ready', title: 'Strategy ready', detail: 'Dry-run only, no live orders.', status: 'idle' },
            { id: 'lanes', title: 'Market Data → Logic → Risk → Execution', status: 'idle' },
        ];
    }

    const labels: Record<string, string> = {
        'data.kraken.ticker': 'Market data fetched',
        'logic.if': 'Condition evaluated',
        'risk.guard': 'Risk guard reviewed',
        'action.placeOrder': 'Order prepared',
        'action.cancelOrder': 'Order cancellation queued',
        'action.logIntent': 'Audit log recorded',
        'control.start': 'Strategy triggered',
    };

    if (result.log.length === 0) {
        return [
            {
                id: 'complete',
                title: result.success ? 'Dry-run completed' : 'Dry-run halted',
                detail: result.success ? 'Strategy executed without errors.' : 'Please review the canvas connections.',
                status: result.success ? 'executed' : 'error',
            },
        ];
    }

    const timeline: TimelineItem[] = result.log.map((entry) => {
        const nodeType = nodes.find((n) => n.id === entry.nodeId)?.type ?? entry.nodeType;
        return {
            id: entry.nodeId,
            title: labels[nodeType] ?? entry.nodeType,
            detail: `Status: ${entry.status} • Duration: ${entry.durationMs}ms`,
            meta: nodeType === 'logic.if' ? 'Condition requires true/false input' : undefined,
            status: mapLogToStatus(entry.status),
        };
    });

    if (result.krakenValidations && result.krakenValidations.length > 0) {
        result.krakenValidations.forEach((validation, idx) => {
            timeline.push({
                id: `kraken-validate-${idx}`,
                title: 'Kraken validate-only',
                detail: `${validation.action} → ${validation.status}`,
                meta: validation.detail,
                status: validation.status === 'ok' ? 'executed' : 'error',
            });
        });
    }

    return timeline;
}

function App() {
    const [nodes, setNodes] = useState<Node[]>(demoNodes);
    const [edges, setEdges] = useState<Edge[]>(demoEdges);
    const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
    const [marketError, setMarketError] = useState<string | null>(null);
    const [validateWithKraken, setValidateWithKraken] = useState(false);

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
        setNodeStatuses({});

        try {
            const strategy = toStrategyJSON(nodes, edges);
            const executionResult = await executeDryRun(strategy, validateWithKraken);
            const statusMap: Record<string, NodeStatus> = {};
            executionResult.log.forEach((entry) => {
                statusMap[entry.nodeId] = mapLogToStatus(entry.status);
            });
            setNodeStatuses(statusMap);
            setResult(executionResult);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleExportJSON = () => {
        const strategy = toStrategyJSON(nodes, edges);
        const json = JSON.stringify(strategy, null, 2);
        const blob = new Blob([json, '\n'], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kraken-strategy-definition.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const activePair = useMemo(() => derivePair(nodes), [nodes]);
    const orderPreview = useMemo(
        () => deriveOrderPreview(nodes, marketContext ?? mockMarketContext(activePair)),
        [nodes, marketContext, activePair]
    );
    const timelineItems = useMemo(
        () => timelineFromResult(result, error, nodes),
        [result, error, nodes]
    );

    useEffect(() => {
        let isMounted = true;
        setMarketError(null);
        fetchMarketContext(activePair)
            .then((ctx: MarketContextResponse) => {
                if (!isMounted) return;
                if (ctx.error) {
                    setMarketError(ctx.error);
                    setMarketContext(mockMarketContext(activePair));
                    return;
                }
                setMarketContext({
                    pair: ctx.pair,
                    lastPrice: ctx.lastPrice,
                    spread: ctx.spread ?? 0,
                    change: ctx.change24h,
                    status: 'Open',
                    ask: ctx.ask,
                    bid: ctx.bid,
                });
            })
            .catch(() => {
                if (!isMounted) return;
                setMarketError('Using cached mock data (Kraken API unavailable)');
                setMarketContext(mockMarketContext(activePair));
            });
        return () => {
            isMounted = false;
        };
    }, [activePair]);

    const displayMarketContext = marketContext ?? mockMarketContext(activePair);

    return (
        <div className="app-shell">
            <header className="kraken-header">
                <div className="brand-stack">
                    <div className="brand-mark">KP</div>
                    <div className="brand-text">
                        <span>Kraken DaD</span>
                        <span>Strategy Canvas</span>
                    </div>
                </div>
                <div className="badge">
                    <span className="badge-dot" />
                    Dry-Run enforced — no real orders executed
                </div>
                <div className="header-actions">
                    <label className="chip" style={{ cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={validateWithKraken}
                            onChange={(e) => setValidateWithKraken(e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        Validate orders on Kraken (no execution)
                    </label>
                    <button className="btn btn-ghost" onClick={handleExportJSON}>
                        Export Kraken Strategy Definition
                    </button>
                    <button className="btn btn-primary" onClick={handleExecute} disabled={loading}>
                        {loading ? 'Running Dry-Run...' : 'Run Dry-Run'}
                    </button>
                </div>
            </header>

            <div className="dry-run-banner">
                <strong>Safety-first:</strong> Dry-Run mode only. Public market data fetched from Kraken; private endpoints remain stubbed or validate-only. Connect lanes from Strategy Start → Market Data → Condition → Risk → Execution.
            </div>

            <div className="workspace">
                <FlowCanvas
                    initialNodes={demoNodes}
                    initialEdges={demoEdges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    nodeStatuses={nodeStatuses}
                />

                <div className="right-rail">
                    <div className="panel">
                        <div className="panel-title">Execution Feedback</div>
                        <ExecutionTimeline items={timelineItems} />
                    </div>
                    <div className="panel">
                        <div className="panel-title">Market Context</div>
                        {marketError && (
                            <div className="chip" style={{ marginBottom: '8px', color: 'var(--kraken-amber)' }}>
                                {marketError}
                            </div>
                        )}
                        <MarketContextDock
                            pair={displayMarketContext.pair}
                            lastPrice={displayMarketContext.lastPrice}
                            spread={displayMarketContext.spread}
                            change={displayMarketContext.change}
                            status={displayMarketContext.status}
                        />
                    </div>
                    <div className="panel">
                        <div className="panel-title">Order Preview</div>
                        <OrderPreviewPanel
                            pair={orderPreview.pair}
                            side={orderPreview.side}
                            amount={orderPreview.amount}
                            type={orderPreview.type}
                            estimatedPrice={orderPreview.estimatedPrice}
                            feeRate={0.0026}
                        />
                        {result && (
                            <div className="result-summary" style={{ marginTop: '12px' }}>
                                <div className="summary-card">
                                    <h4>Status</h4>
                                    <div className="value" style={{ color: result.success ? 'var(--kraken-green)' : 'var(--kraken-red)' }}>
                                        {result.success ? 'Success' : 'Check strategy'}
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <h4>Nodes Executed</h4>
                                    <div className="value">{result.nodesExecuted}</div>
                                </div>
                                <div className="summary-card">
                                    <h4>Warnings</h4>
                                    <div className="value" style={{ color: 'var(--text-secondary)' }}>
                                        {result.warnings.length}
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="summary-card" style={{ marginTop: '12px', borderColor: 'var(--kraken-red)' }}>
                                <h4>Alert</h4>
                                <div className="value" style={{ color: 'var(--kraken-red)', fontSize: '15px' }}>{error}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
