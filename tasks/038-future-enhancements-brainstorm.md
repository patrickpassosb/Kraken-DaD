# Task: 038 Future Enhancements Brainstorm

## Status
- [ ] Multi-Exchange Support Technical Breakdown
- [ ] Backtesting Suite Technical Breakdown
- [ ] Template Gallery Technical Breakdown
- [ ] Mobile-Optimized Viewer Technical Breakdown
- [ ] Architectural Impact Analysis
- [ ] Roadmap & Prioritization

## Context
The user wants to explore the four future enhancements listed in the README:
1. Multi-Exchange Support
2. Backtesting Suite
3. Template Gallery
4. Mobile-Optimized Viewer

## Technical Breakdown

### 1. Advanced Strategy Blocks
- **Indicator Library**: Integrate `Tulip Indicators` or `TechnicalIndicators` to provide RSI, MACD, Bollinger Bands, and Ichimoku Clouds.
- **Custom Scripting**: A "Javascript Node" allowing power users to write snippets of logic directly within the visual flow.
- **Multi-Asset Arbitrage**: Blocks that compare prices across multiple pairs in real-time to detect spread opportunities.
- **AI/ML Inference**: Integration with external prediction APIs or local LiteRT/ONNX models for price movement forecasting.
- **On-Chain Data**: Pulling global liquidity or whale movement data from Ethereum/Solana to use as market sentiment filters.

### 2. Backtesting Suite
- **Historical Data Bridge**: Implement a `HistoryProvider` that fetches past OHLC data.
- **Tick-by-Tick Simulation**: A specialized executor loop that "replays" time-series data into the strategy DAG.
- **Virtual Ledger**: A stateful component to track virtual trades, fees, and equity.
- **Reporting**: Generate a `BacktestReport` with metrics like Sharpe Ratio, Max Drawdown, and Win Rate.

### 3. Template Gallery
- **Registry System**: A JSON-based manifest to catalog community templates.
- **Metadata Extension**: Add `description`, `category` (e.g., HFT, Swing), and `previewImageUrl` to strategy definitions.
- **One-Click Import**: UI logic to load a template, auto-recenter the canvas, and prompt for user-specific pair/threshold adjustments.

### 4. Mobile-Optimized Viewer
- **Responsive Dashboard**: A "Compact Mode" for the frontend using CSS Grid/Flexbox tailored for small screens.
- **Performance Feed**: Optimized SSE subscription that only pulls high-level strategy health and PnL, rather than full DAG state.
- **Push Notifications**: Integrate Web Push API for alerts (e.g., "Strategy Stop-Loss Triggered").

## Success Criteria
1. For **Advanced Strategy Blocks**: Define the library integration (e.g., Tulip), custom scripting support, and multi-asset logic. [X]
2. For **Backtesting Suite**: Define the historical data ingestion, the modified execution loop (virtual clock), and PnL reporting. [X]
3. For **Template Gallery**: Define the schema for templates, UI for discovery, and "Instantiate from Template" logic. [X]
4. For **Mobile-Optimized Viewer**: Define the tech stack (PWA? Native?) and the read-only API requirements. [X]
5. Identify shared dependencies or necessary refactors (e.g., standardizing data models). [X]

## Progress
- [x] Task initialized.
