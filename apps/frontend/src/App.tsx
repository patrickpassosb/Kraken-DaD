import { useState, useCallback, useMemo, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { executeDryRun, ExecutionResult } from './api/executeDryRun';
import { fetchMarketContext, MarketContextResponse } from './api/marketContext';
import { toStrategyJSON } from './utils/toStrategyJSON';
import { MarketContextDock } from './components/MarketContextDock';
import { OrderPreviewPanel } from './components/OrderPreviewPanel';
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

function describeValidation(entry: NonNullable<ExecutionResult['krakenValidations']>[number]) {
    const { request } = entry;
    if (entry.action === 'CANCEL_ORDER') {
        return `Cancel order ${request.orderId ?? 'unknown'} (validate-only)`;
    }
    const pair = request.pair ?? 'BTC/USD';
    const side = (request.side ?? 'buy').toUpperCase();
    const amount = request.amount ?? '?';
    const type = request.type ?? 'market';
    const priceText = type === 'limit' && request.price ? ` @ ${request.price}` : '';
    return `${side} ${amount} ${pair} (${type}${priceText ? priceText : ''}, validate-only)`;
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
    const validateWithKraken = true;

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
    const marketSourceLabel = marketError
        ? 'Mock snapshot (Kraken API unavailable)'
        : 'Kraken Ticker + Depth (REST/WS blend)';
    const orderSourceLabel = marketError
        ? 'Preview uses mock price'
        : 'Preview uses Kraken price snapshot';
    const validationEntries = result?.krakenValidations ?? [];

    return (
        <div className="app-shell">
            <header className="kraken-header">
                <div className="header-left">
                    <div className="brand-stack">
                        <div className="brand-mark">
                            <img src="/KrakenPro.png" alt="Kraken Pro" className="brand-logo-img" />
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-ghost" onClick={handleExportJSON}>
                        Export Strategy Definition
                    </button>
                    <button className="btn btn-primary" onClick={handleExecute} disabled={loading}>
                        {loading ? 'Running Dry-Run...' : 'Run Dry-Run'}
                    </button>
                </div>
            </header>

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
                            source={marketSourceLabel}
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
                            sourceLabel={orderSourceLabel}
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
                        {result && (
                            <div className="panel" style={{ marginTop: '12px' }}>
                                <div className="panel-title">Kraken Validate-Only Checks</div>
                                <div
                                    className="chip"
                                    style={{
                                        marginBottom: '8px',
                                        color: 'var(--kraken-amber)',
                                        background: 'rgba(255, 192, 105, 0.1)',
                                        borderColor: 'rgba(255, 192, 105, 0.35)',
                                    }}
                                >
                                    Dry-run safety: requests use validate=true and never place live trades.
                                </div>
                                {validationEntries.length === 0 ? (
                                    <div className="summary-card" style={{ marginTop: 0 }}>
                                        <div className="value">No Kraken order intents to validate.</div>
                                    </div>
                                ) : (
                                    <div className="kraken-validation-list">
                                        {validationEntries.map((entry) => (
                                            <div
                                                key={`${entry.nodeId}-${entry.action}-${entry.request.orderId ?? entry.request.price ?? entry.request.pair ?? ''}`}
                                                className="summary-card"
                                                style={{
                                                    marginTop: 0,
                                                    borderColor:
                                                        entry.status === 'ok'
                                                            ? 'rgba(43, 217, 157, 0.5)'
                                                            : 'rgba(255, 107, 107, 0.6)',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{describeValidation(entry)}</div>
                                                    <div
                                                        className="chip"
                                                        style={{
                                                            color: entry.status === 'ok' ? 'var(--kraken-green)' : 'var(--kraken-red)',
                                                            background:
                                                                entry.status === 'ok'
                                                                    ? 'rgba(43, 217, 157, 0.12)'
                                                                    : 'rgba(255, 107, 107, 0.1)',
                                                        }}
                                                    >
                                                        {entry.status === 'ok' ? 'Validated' : 'Error'}
                                                    </div>
                                                </div>
                                                {entry.detail && (
                                                    <div className="value" style={{ fontSize: '13px', marginTop: '6px' }}>
                                                        {entry.detail}
                                                    </div>
                                                )}
                                                <div className="value" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    Node: {entry.nodeId}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
