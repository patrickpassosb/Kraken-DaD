import { StartNode } from './StartNode';
import { KrakenTickerNode } from './KrakenTickerNode';
import { LogIntentNode } from './LogIntentNode';

export const nodeTypes = {
    'control.start': StartNode,
    'data.kraken.ticker': KrakenTickerNode,
    'action.logIntent': LogIntentNode,
};

export type NodeType = keyof typeof nodeTypes;
