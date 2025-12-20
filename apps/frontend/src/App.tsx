import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { executeStrategy, ExecutionResult, ExecutionMode } from './api/executeStrategy';
import { fetchMarketContext, MarketContextResponse } from './api/marketContext';
import { fetchPairs, PairItem } from './api/pairs';
import { toStrategyJSON } from './utils/toStrategyJSON';
import { MarketContextDock } from './components/MarketContextDock';
import { OrderPreviewPanel } from './components/OrderPreviewPanel';
import { formatPair } from './utils/format';
import { NodeStatus } from './utils/status';
import { useMarketStream } from './hooks/useMarketStream';
import { PairSelector } from './components/PairSelector';
import {
    clearKrakenCredentials,
    fetchKrakenCredentialsStatus,
    KrakenCredentialsStatus,
    saveKrakenCredentials,
} from './api/krakenCredentials';

const FEE_RATE = 0.0026;

type MarketStatus = 'Open' | 'Halted';

interface MarketContext {
    pair: string;
    lastPrice: number;
    spread: number;
    changePct?: number;
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
    if (raw.toLowerCase().includes('kraken')) {
        return raw;
    }
    if (raw.toLowerCase().includes('schema')) {
        return 'Strategy definition looks out of date. Refresh and retry the dry-run.';
    }
    if (raw.toLowerCase().includes('condition')) {
        return 'Condition requires a true/false rule. Price comparison detected.';
    }
    return 'Strategy needs valid connections and a start trigger. Please review the canvas.';
}

function mockMarketContext(pair: string): MarketContext {
    const defaults: Record<string, Omit<MarketContext, 'pair'>> = {
        'BTC/USD': { lastPrice: 90135.6, spread: 0.8, changePct: 0.5, status: 'Open' },
        'ETH/USD': { lastPrice: 3450.12, spread: 0.5, changePct: -0.3, status: 'Open' },
    };
    const normalized = formatPair(pair);
    const context = defaults[normalized] ?? { lastPrice: 1250, spread: 0.6, changePct: 0.1, status: 'Open' as MarketStatus };
    return { pair: normalized, ...context };
}

function normalizePrice(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function deriveOrderPreview(nodes: Node[], edges: Edge[], context: MarketContext, fallbackPair: string) {
    const orderNode = nodes.find((n) => n.type === 'action.placeOrder');
    const data = (orderNode?.data as Record<string, unknown>) || {};
    const side = (data.side as 'buy' | 'sell') || 'buy';
    const amount = (data.amount as number) ?? 0.1;
    const rawType = data.type === 'limit' ? 'limit' : 'market';
    const price = normalizePrice(data.price);
    const hasInputPrice =
        !!orderNode &&
        edges.some(
            (edge) =>
                edge.target === orderNode.id &&
                edge.targetHandle === 'data:price'
        );
    const type: 'market' | 'limit' =
        price !== undefined ? 'limit' : hasInputPrice ? 'limit' : rawType;
    const estimatedPrice =
        type === 'limit' ? price ?? context.lastPrice : context.lastPrice;
    const pairValue = (data.pair as string) || fallbackPair || context.pair;

    return {
        pair: formatPair(pairValue),
        side,
        amount,
        type,
        estimatedPrice,
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
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('dry-run');
    const [credentialsStatus, setCredentialsStatus] = useState<KrakenCredentialsStatus>({
        configured: false,
        source: 'none',
    });
    const [credentialsError, setCredentialsError] = useState<string | null>(null);
    const [credentialsLoading, setCredentialsLoading] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [apiSecretInput, setApiSecretInput] = useState('');
    const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
    const [marketError, setMarketError] = useState<string | null>(null);
    const [rightRailOpen, setRightRailOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [pairSelectorOpen, setPairSelectorOpen] = useState(false);
    const [selectedPair, setSelectedPair] = useState('BTC/USD');
    const [previousPair, setPreviousPair] = useState<string>('BTC/USD');
    const [pairCatalog, setPairCatalog] = useState<PairItem[]>([]);
    const [pairCatalogError, setPairCatalogError] = useState<string | null>(null);
    const validateWithKraken = executionMode === 'dry-run';

    // Sync nodes when pair selection changes; only overwrite nodes using the previous selected pair.
    useEffect(() => {
        if (selectedPair === previousPair) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (
                    (node.type === 'data.kraken.ticker' ||
                        node.type === 'action.placeOrder' ||
                        node.type === 'risk.guard') &&
                    node.data &&
                    typeof node.data === 'object'
                ) {
                    const currentPair = (node.data as Record<string, unknown>).pair as string | undefined;
                    if (!currentPair || currentPair === previousPair) {
                        return {
                            ...node,
                            data: { ...node.data, pair: selectedPair },
                        };
                    }
                }
                return node;
            })
        );
        setPreviousPair(selectedPair);
    }, [previousPair, selectedPair, setNodes]);

    useEffect(() => {
        let isMounted = true;
        setCredentialsError(null);
        fetchKrakenCredentialsStatus()
            .then((status) => {
                if (!isMounted) return;
                setCredentialsStatus(status);
            })
            .catch(() => {
                if (!isMounted) return;
                setCredentialsError('Unable to load Kraken credential status.');
            });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!credentialsStatus.configured && executionMode === 'live') {
            setExecutionMode('dry-run');
        }
    }, [credentialsStatus.configured, executionMode]);

    const handleNodesChange = useCallback((newNodes: Node[]) => {
        setNodes(newNodes);
    }, []);

    const handleEdgesChange = useCallback((newEdges: Edge[]) => {
        setEdges(newEdges);
    }, []);

    const handleSaveCredentials = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!apiKeyInput.trim() || !apiSecretInput.trim()) {
            setCredentialsError('API key and secret are required.');
            return;
        }
        setCredentialsLoading(true);
        setCredentialsError(null);
        try {
            const status = await saveKrakenCredentials(apiKeyInput, apiSecretInput);
            setCredentialsStatus(status);
            setApiKeyInput('');
            setApiSecretInput('');
        } catch (err) {
            setCredentialsError(err instanceof Error ? err.message : 'Unable to save credentials.');
        } finally {
            setCredentialsLoading(false);
        }
    };

    const handleClearCredentials = async () => {
        setCredentialsLoading(true);
        setCredentialsError(null);
        try {
            const status = await clearKrakenCredentials();
            setCredentialsStatus(status);
        } catch (err) {
            setCredentialsError(err instanceof Error ? err.message : 'Unable to clear credentials.');
        } finally {
            setCredentialsLoading(false);
        }
    };

    const handleToggleLive = () => {
        if (!credentialsStatus.configured) return;
        setExecutionMode((current) => (current === 'live' ? 'dry-run' : 'live'));
    };

    const runStrategy = useCallback(
        async (targetNodeId?: string) => {
            if (executionMode === 'live') {
                const message = targetNodeId
                    ? 'Live mode places real Kraken orders. Confirm you want to execute this node live.'
                    : 'Live mode places real Kraken orders. Confirm you want to execute live orders.';
                const confirmed = window.confirm(message);
                if (!confirmed) {
                    return;
                }
            }
            setLoading(true);
            setError(null);
            setResult(null);
            setNodeStatuses({});

            try {
                const strategy = toStrategyJSON(nodes, edges);
                const executionResult = await executeStrategy(strategy, {
                    mode: executionMode,
                    validate: validateWithKraken,
                    targetNodeId,
                });
                const statusMap: Record<string, NodeStatus> = {};
                executionResult.log.forEach((entry) => {
                    statusMap[entry.nodeId] = mapLogToStatus(entry.status);
                });
                setNodeStatuses(statusMap);
                setResult(executionResult);
                if (!executionResult.success && executionResult.errors.length > 0) {
                    setError(executionResult.errors[0].message);
                }
            } catch (err) {
                setError(friendlyError(err));
            } finally {
                setLoading(false);
            }
        },
        [edges, executionMode, nodes, validateWithKraken]
    );

    const handleExecute = () => {
        void runStrategy();
    };

    const handleRunNode = useCallback(
        (nodeId: string) => {
            void runStrategy(nodeId);
        },
        [runStrategy]
    );

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

    const activePair = selectedPair;
    const orderPreview = useMemo(
        () => deriveOrderPreview(nodes, edges, marketContext ?? mockMarketContext(activePair), activePair),
        [nodes, edges, marketContext, activePair]
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
                    changePct: ctx.change24hPct,
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
        let isMounted = true;
        fetchPairs()
            .then((pairs) => {
                if (!isMounted) return;
                setPairCatalog(pairs);
                setPairCatalogError(null);
            })
            .catch(() => {
                if (!isMounted) return;
                setPairCatalogError('Using bundled pair list');
            });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!streamData) return;
        setMarketContext((prev) => ({
            pair: streamData.pair,
            lastPrice: streamData.last ?? prev?.lastPrice ?? 0,
            ask: streamData.ask ?? prev?.ask ?? null,
            bid: streamData.bid ?? prev?.bid ?? null,
            spread: streamData.spread ?? prev?.spread ?? 0,
            changePct: prev?.changePct,
            status: prev?.status ?? 'Open',
            source: streamData.source,
        }));
    }, [streamData]);

    const warningMessage = streamWarning ?? marketError;
    const displayMarketContext = marketContext ?? mockMarketContext(activePair);
    const marketSourceLabel = warningMessage ? 'Backup market snapshot' : 'Kraken Live Ticker (WS)';
    const orderSourceLabel = warningMessage ? 'Preview uses backup price' : 'Preview uses Kraken price snapshot';
    const liveBlocked = executionMode === 'live' && !credentialsStatus.configured;
    const modeLabel = executionMode === 'live' ? 'Live (real orders)' : 'Dry-run (no live orders)';
    const executeLabel = executionMode === 'live' ? 'Execute live' : 'Execute workflow';
    const canClearCredentials = credentialsStatus.source === 'runtime';

    return (
        <>
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
                    <span className={`mode-pill ${executionMode === 'live' ? 'mode-pill-live' : ''}`}>
                        Mode: {modeLabel}
                    </span>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPairSelectorOpen(true)}
                        title="Select trading pair"
                    >
                        Pair: {selectedPair}
                    </button>
                    {pairCatalogError && <span className="chip">{pairCatalogError}</span>}
                    <button
                        className="btn btn-ghost"
                        onClick={() => setRightRailOpen((v) => !v)}
                    >
                        {rightRailOpen ? 'Hide Context & Preview' : 'Show Context & Preview'}
                    </button>
                    <button className="btn btn-ghost" onClick={handleExportJSON}>
                        Export Strategy Definition
                    </button>
                    <button className="btn btn-primary" onClick={handleExecute} disabled={loading || liveBlocked}>
                        {loading ? 'Executing workflow...' : executeLabel}
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
                        activePair={selectedPair}
                        onRunNode={handleRunNode}
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
                                    changePct={displayMarketContext.changePct}
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
        <button
            className="settings-fab"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    className="gear-outer"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.11-.2-.36-.28-.57-.2l-2.39.96c-.5-.38-1.04-.69-1.63-.94l-.36-2.54a.47.47 0 0 0-.45-.38H9.13c-.23 0-.42.16-.45.38l-.36 2.54c-.59.25-1.13.56-1.63.94l-2.39-.96c-.21-.08-.46 0-.57.2l-1.92 3.32c-.11.2-.06.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.11.2.36.28.57.2l2.39-.96c.5.38 1.04.69 1.63.94l.36 2.54c.03.22.22.38.45.38h4.74c.23 0 .42-.16.45-.38l.36-2.54c.59-.25 1.13-.56 1.63-.94l2.39.96c.21.08.46 0 .57-.2l1.92-3.32c.11-.2.06-.47-.12-.61l-2.03-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"
                />
                <circle className="gear-ring" cx="12" cy="12" r="3.2" />
                <circle className="gear-core" cx="12" cy="12" r="2" />
            </svg>
        </button>
        {settingsOpen && (
            <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
                <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
                    <div className="settings-header">
                        <div>
                            <div className="settings-title">Settings</div>
                            <div className="settings-subtitle">Kraken API credentials and execution controls</div>
                        </div>
                        <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
                            Close
                        </button>
                    </div>
                    <div className="settings-section">
                        <div className="panel-title">Execution Mode</div>
                        <div className="mode-panel">
                            <div className="mode-row">
                                <div>
                                    <div className="mode-label">Live Orders</div>
                                    <div className="mode-subtitle">Real Kraken orders (requires API key)</div>
                                </div>
                                <button
                                    className={`btn ${executionMode === 'live' ? 'btn-live' : 'btn-ghost'}`}
                                    onClick={handleToggleLive}
                                    disabled={!credentialsStatus.configured || credentialsLoading}
                                >
                                    {executionMode === 'live' ? 'Live On' : 'Live Off'}
                                </button>
                            </div>
                            <div className="mode-status">
                                <span
                                    className={`status-dot ${
                                        credentialsStatus.configured ? 'status-dot-live' : 'status-dot-muted'
                                    }`}
                                />
                                <span>
                                    Credentials {credentialsStatus.configured ? 'Configured' : 'Not configured'}
                                </span>
                                {credentialsStatus.configured && (
                                    <span className="mode-source">Source: {credentialsStatus.source}</span>
                                )}
                            </div>
                            <div className="mode-warning">
                                Live mode sends real orders to Kraken. Start small and verify your workflow.
                                This feature is in test and not ready.
                            </div>
                            {credentialsError && <div className="chip">{credentialsError}</div>}
                            <form className="mode-form" onSubmit={handleSaveCredentials}>
                                <div className="field">
                                    <label htmlFor="kraken-key">Kraken API Key</label>
                                    <input
                                        id="kraken-key"
                                        type="password"
                                        value={apiKeyInput}
                                        onChange={(event) => setApiKeyInput(event.target.value)}
                                        placeholder="Paste your Kraken API key"
                                        autoComplete="new-password"
                                        disabled={credentialsLoading}
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="kraken-secret">Kraken API Secret</label>
                                    <input
                                        id="kraken-secret"
                                        type="password"
                                        value={apiSecretInput}
                                        onChange={(event) => setApiSecretInput(event.target.value)}
                                        placeholder="Paste your Kraken API secret"
                                        autoComplete="new-password"
                                        disabled={credentialsLoading}
                                    />
                                </div>
                                <div className="mode-actions">
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={
                                            credentialsLoading ||
                                            !apiKeyInput.trim() ||
                                            !apiSecretInput.trim()
                                        }
                                    >
                                        {credentialsLoading
                                            ? 'Saving...'
                                            : credentialsStatus.configured
                                            ? 'Update credentials'
                                            : 'Save credentials'}
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        type="button"
                                        onClick={handleClearCredentials}
                                        disabled={!canClearCredentials || credentialsLoading}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                            <div className="mode-hint">
                                Credentials are stored in-memory for this session only.
                                {credentialsStatus.source === 'env' && ' Clear env keys in backend config.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {pairSelectorOpen && (
            <div className="pair-selector-overlay" onClick={() => setPairSelectorOpen(false)}>
                <div className="pair-selector-container" onClick={(e) => e.stopPropagation()}>
                    <PairSelector
                        value={selectedPair}
                        pairs={pairCatalog}
                        onSelect={(pairId) => {
                            setSelectedPair(pairId);
                            setPairSelectorOpen(false);
                        }}
                        onClose={() => setPairSelectorOpen(false)}
                    />
                </div>
            </div>
        )}
        </>
    );
}

export default App;
