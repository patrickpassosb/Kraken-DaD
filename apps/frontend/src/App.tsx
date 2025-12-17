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
import { useMarketStream } from './hooks/useMarketStream';

type MarketStatus = 'Open' | 'Halted';

interface MarketContext {
    pair: string;
    lastPrice: number;
    spread: number;
    change: number;
    status: MarketStatus;
    ask?: number | null;
    bid?: number | null;
    source?: string;
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
        'BTC/USD': { lastPrice: 90135.6, spread: 0.8, change: 0.5, status: 'Open', bid: 90135.2, ask: 90136.4 },
        'ETH/USD': { lastPrice: 3450.12, spread: 0.5, change: -0.3, status: 'Open', bid: 3449.8, ask: 3450.9 },
    };
    const normalized = formatPair(pair);
    const context =
        defaults[normalized] ??
        { lastPrice: 1250, spread: 0.6, change: 0.1, status: 'Open' as MarketStatus, bid: 1249.7, ask: 1250.3 };
    const mid = context.lastPrice;
    return { pair: normalized, ...context, bid: context.bid ?? mid - context.spread / 2, ask: context.ask ?? mid + context.spread / 2 };
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
    const { data: streamData, warning: streamWarning } = useMarketStream(activePair);

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

    useEffect(() => {
        if (!streamData) return;
        setMarketContext((prev) => ({
            pair: streamData.pair,
            lastPrice: streamData.last ?? prev?.lastPrice ?? 0,
            ask: streamData.ask ?? prev?.ask ?? null,
            bid: streamData.bid ?? prev?.bid ?? null,
            spread: streamData.spread ?? prev?.spread ?? 0,
            change: prev?.change ?? 0,
            status: prev?.status ?? 'Open',
            source: streamData.source,
        }));
    }, [streamData]);

    const warningMessage = streamWarning ?? marketError;
    const displayMarketContext = marketContext ?? mockMarketContext(activePair);
    const marketSourceLabel = warningMessage ? 'Backup market snapshot' : 'Kraken Live Ticker (WS)';
    const orderSourceLabel = warningMessage ? 'Preview uses backup price' : 'Preview uses Kraken price snapshot';
    const connectionTotal = edges.length;
    const controlConnections = edges.filter((edge) => edge.type === 'control').length;
    const dataConnections = connectionTotal - controlConnections;
    const lastRunStatus = result ? (result.success ? 'Dry-run clean' : 'Needs review') : 'Ready for dry-run';
    const lastRunTone = result ? (result.success ? 'var(--kraken-green)' : 'var(--kraken-red)') : 'var(--text-secondary)';
    const warningsCount = result?.warnings.length ?? 0;
    const executedCount = result?.nodesExecuted ?? 0;

    return (
        <div className="app-shell">
            <header className="kraken-header">
                <div className="header-left">
                    <div className="brand-stack">
                        <div className="brand-mark">
                            <img src="/KrakenPro.png" alt="Kraken Pro" className="brand-logo-img" />
                        </div>
                        <div className="brand-text">
                            <span>Kraken DAD</span>
                            <span>Strategy Builder · Dry-run only</span>
                        </div>
                    </div>
                    <div className="tagline">Node-based canvas mirroring Kraken Pro lanes with dry-run safeguards.</div>
                    <div className="status-row">
                        <div className="pill pill-success">
                            <span className="pill-dot" style={{ background: 'var(--kraken-green)' }} /> Dry-run enforced
                        </div>
                        <div className="pill pill-warn">
                            <span className="pill-dot" style={{ background: 'var(--kraken-amber)' }} /> Kraken validation on
                        </div>
                        <div className="pill pill-ghost">
                            <span className="pill-dot" style={{ background: 'var(--kraken-cyan)' }} /> Control + data lanes required
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

            <div className="dry-run-banner">
                <div className="banner-dot" aria-hidden />
                <div>
                    <strong>Dry-run only.</strong> Connect control + data lanes to mirror Kraken Pro flow before simulating.
                </div>
                <div className="banner-actions">
                    <span className="chip">Validation {validateWithKraken ? 'on' : 'off'}</span>
                    <span className="chip">Control links · {controlConnections}</span>
                    <span className="chip">Data links · {dataConnections}</span>
                </div>
            </div>

            <div className="workspace-toolbar">
                <div>
                    <div className="toolbar-kicker">Strategy Canvas</div>
                    <div className="toolbar-title">Market → Logic → Risk → Execution lanes</div>
                </div>
                <div className="toolbar-meta">
                    <span className="meta-chip">
                        Nodes <strong>{nodes.length}</strong>
                    </span>
                    <span className="meta-chip">
                        Connections <strong>{connectionTotal}</strong>
                    </span>
                    <span className="meta-chip">
                        Pair <strong>{formatPair(activePair)}</strong>
                    </span>
                </div>
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
                        <div className="panel-title">Execution State</div>
                        <div className="panel-subtitle">Dry-run feedback and canvas readiness.</div>
                        <div className="signal-grid">
                            <div className="summary-card">
                                <h4>Last run</h4>
                                <div className="value" style={{ color: lastRunTone }}>
                                    {loading ? 'Running...' : lastRunStatus}
                                </div>
                                <div className="market-subtitle">Node statuses mirror canvas highlights.</div>
                            </div>
                            <div className="summary-card">
                                <h4>Nodes executed</h4>
                                <div className="value">{executedCount}</div>
                                <div className="market-subtitle">Out of {nodes.length} staged nodes</div>
                            </div>
                            <div className="summary-card">
                                <h4>Warnings</h4>
                                <div className="value" style={{ color: warningsCount ? 'var(--kraken-amber)' : 'var(--text-secondary)' }}>
                                    {warningsCount}
                                </div>
                                <div className="market-subtitle">Kraken copy instead of raw errors</div>
                            </div>
                        </div>
                        {error && (
                            <div className="summary-card alert-card" style={{ marginTop: '12px' }}>
                                <h4>Alert</h4>
                                <div className="value" style={{ color: 'var(--kraken-red)', fontSize: '15px' }}>{error}</div>
                            </div>
                        )}
                    </div>
                    <div className="panel">
                        <div className="panel-title">Market Context</div>
                        <div className="panel-subtitle">Kraken live snapshot for the active trading pair.</div>
                        {warningMessage && (
                            <div className="chip" style={{ marginBottom: '8px', color: '#ffffff' }}>
                                {warningMessage}
                            </div>
                        )}
                        <MarketContextDock
                            pair={displayMarketContext.pair}
                            lastPrice={displayMarketContext.lastPrice}
                            spread={displayMarketContext.spread}
                            change={displayMarketContext.change}
                            status={displayMarketContext.status}
                            source={marketSourceLabel}
                            ask={displayMarketContext.ask ?? undefined}
                            bid={displayMarketContext.bid ?? undefined}
                        />
                    </div>
                    <div className="panel">
                        <div className="panel-title">Order Preview</div>
                        <div className="panel-subtitle">Mock fill priced using the current market snapshot.</div>
                        <OrderPreviewPanel
                            pair={orderPreview.pair}
                            side={orderPreview.side}
                            amount={orderPreview.amount}
                            type={orderPreview.type}
                            estimatedPrice={orderPreview.estimatedPrice}
                            feeRate={0.0026}
                            sourceLabel={orderSourceLabel}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
