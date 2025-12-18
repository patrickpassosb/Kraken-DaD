import { useState, useCallback, useMemo, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { executeDryRun, ExecutionResult } from './api/executeDryRun';
import { fetchMarketContext, MarketContextResponse } from './api/marketContext';
import { toStrategyJSON } from './utils/toStrategyJSON';
import { MarketContextDock } from './components/MarketContextDock';
import { OrderPreviewPanel } from './components/OrderPreviewPanel';
import { formatPair } from './utils/format';
import { NodeStatus } from './utils/status';
import { useMarketStream } from './hooks/useMarketStream';

const FEE_RATE = 0.0026;

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
const demoNodes: Node[] = [];

const demoEdges: Edge[] = [];

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

function App() {
    const [nodes, setNodes] = useState<Node[]>(demoNodes);
    const [edges, setEdges] = useState<Edge[]>(demoEdges);
    const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
    const [marketError, setMarketError] = useState<string | null>(null);
    const [rightRailOpen, setRightRailOpen] = useState(true);
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
    const orderNotional =
        orderPreview.estimatedPrice !== undefined
            ? orderPreview.estimatedPrice * orderPreview.amount
            : undefined;
    const orderFeeValue = orderNotional !== undefined ? orderNotional * FEE_RATE : undefined;
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

    return (
        <div className="app-shell">
            <header className="kraken-header">
                <div className="header-left">
                    <div className="brand-stack">
                        <div className="brand-mark">
                            <img src="/KrakenPro.png" alt="Kraken Pro" className="brand-logo-img" />
                        </div>
                        <div className="brand-text">
                            <span>Kraken DaD</span>
                            <span>Strategy Builder</span>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <span className="mode-pill">Mode: Dry-run (no live orders)</span>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setRightRailOpen((v) => !v)}
                    >
                        {rightRailOpen ? 'Hide Context & Preview' : 'Show Context & Preview'}
                    </button>
                    <button className="btn btn-ghost" onClick={handleExportJSON}>
                        Export Strategy Definition
                    </button>
                    <button className="btn btn-primary" onClick={handleExecute} disabled={loading}>
                        {loading ? 'Executing workflow...' : 'Execute workflow'}
                    </button>
                </div>
            </header>

            <div
                className="workspace"
                style={{
                    gridTemplateColumns: rightRailOpen ? 'minmax(0, 1fr) 380px' : '1fr',
                    gap: rightRailOpen ? 'var(--space-4)' : '0px',
                }}
            >
                <ReactFlowProvider>
                    <FlowCanvas
                        initialNodes={demoNodes}
                        initialEdges={demoEdges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        nodeStatuses={nodeStatuses}
                    />
                </ReactFlowProvider>

                {rightRailOpen && (
                    <div className="right-rail-shell">
                        <div className="right-rail">
                            <div className="panel">
                                <div className="panel-title">Market Context</div>
                                {warningMessage && (
                                    <div className="chip" style={{ marginBottom: '8px', color: '#ffffff' }}>
                                        {warningMessage}
                                    </div>
                                )}
                                <MarketContextDock
                                    pair={displayMarketContext.pair}
                                    lastPrice={displayMarketContext.lastPrice}
                                    spread={displayMarketContext.spread}
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
                                    feeRate={FEE_RATE}
                                    notional={orderNotional}
                                    feeValue={orderFeeValue}
                                    sourceLabel={orderSourceLabel}
                                />
                                <div className="result-summary" style={{ marginTop: '12px' }}>
                                    {result ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <div className="summary-card">
                                                <h4>Status</h4>
                                                <div className="value" style={{ color: 'var(--text-secondary)' }}>Not run</div>
                                            </div>
                                            <div className="summary-card">
                                                <h4>Nodes Executed</h4>
                                                <div className="value">0</div>
                                            </div>
                                        <div className="summary-card">
                                            <h4>Warnings</h4>
                                            <div className="value" style={{ color: 'var(--text-secondary)' }}>0</div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {error && (
                                <div className="summary-card" style={{ marginTop: '12px', borderColor: 'var(--kraken-red)' }}>
                                    <h4>Alert</h4>
                                    <div className="value" style={{ color: 'var(--kraken-red)', fontSize: '15px' }}>{error}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
