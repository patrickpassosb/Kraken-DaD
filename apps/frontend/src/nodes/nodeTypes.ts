import { StartNode } from './StartNode';
import { KrakenTickerNode } from './KrakenTickerNode';
import { ConstantNode } from './ConstantNode';
import { OhlcNode } from './OhlcNode';
import { SpreadNode } from './SpreadNode';
import { AssetPairsNode } from './AssetPairsNode';
import { LogIntentNode } from './LogIntentNode';
import { PlaceOrderNode } from './PlaceOrderNode';
import { CancelOrderNode } from './CancelOrderNode';
import { IfNode } from './IfNode';
import { RiskNode } from './RiskNode';
import { MovingAverageNode } from './MovingAverageNode';
import { TimeWindowNode } from './TimeWindowNode';

export const nodeTypes = {
    'control.start': StartNode,
    'control.timeWindow': TimeWindowNode,
    'data.kraken.ticker': KrakenTickerNode,
    'data.constant': ConstantNode,
    'data.kraken.ohlc': OhlcNode,
    'data.kraken.spread': SpreadNode,
    'data.kraken.assetPairs': AssetPairsNode,
    'action.logIntent': LogIntentNode,
    'action.placeOrder': PlaceOrderNode,
    'action.cancelOrder': CancelOrderNode,
    'logic.if': IfNode,
    'logic.movingAverage': MovingAverageNode,
    'risk.guard': RiskNode,
};

/** Registry consumed by React Flow to resolve node component implementations. */
export type NodeType = keyof typeof nodeTypes;
