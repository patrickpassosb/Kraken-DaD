import { StartNode } from './StartNode';
import { KrakenTickerNode } from './KrakenTickerNode';
import { LogIntentNode } from './LogIntentNode';
import { PlaceOrderNode } from './PlaceOrderNode';
import { CancelOrderNode } from './CancelOrderNode';
import { IfNode } from './IfNode';

export const nodeTypes = {
    'control.start': StartNode,
    'data.kraken.ticker': KrakenTickerNode,
    'action.logIntent': LogIntentNode,
    'action.placeOrder': PlaceOrderNode,
    'action.cancelOrder': CancelOrderNode,
    'logic.if': IfNode,
};

export type NodeType = keyof typeof nodeTypes;
