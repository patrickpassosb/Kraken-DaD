import { StartNode } from './StartNode';
import { KrakenTickerNode } from './KrakenTickerNode';
import { LogIntentNode } from './LogIntentNode';
import { PlaceOrderNode } from './PlaceOrderNode';
import { CancelOrderNode } from './CancelOrderNode';
import { IfNode } from './IfNode';
import { RiskNode } from './RiskNode';

export const nodeTypes = {
    'control.start': StartNode,
    'data.kraken.ticker': KrakenTickerNode,
    'action.logIntent': LogIntentNode,
    'action.placeOrder': PlaceOrderNode,
    'action.cancelOrder': CancelOrderNode,
    'logic.if': IfNode,
    'risk.guard': RiskNode,
};

export type NodeType = keyof typeof nodeTypes;
