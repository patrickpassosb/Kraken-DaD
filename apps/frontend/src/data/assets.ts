export interface AssetMeta {
    symbol: string;
    name: string;
    icon?: string; // relative to public/
    color?: string;
}

export const assetMeta: Record<string, AssetMeta> = {
    BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '/icons/btc.svg', color: '#f7931a' },
    ETH: { symbol: 'ETH', name: 'Ethereum', icon: '/icons/eth.svg', color: '#6b6bff' },
    USDC: { symbol: 'USDC', name: 'USD Coin', icon: '/icons/usdc.svg', color: '#2775ca' },
    USDT: { symbol: 'USDT', name: 'Tether', icon: '/icons/usdt.svg', color: '#26a17b' },
    SOL: { symbol: 'SOL', name: 'Solana', icon: '/icons/sol.svg', color: '#00ffa3' },
    ADA: { symbol: 'ADA', name: 'Cardano', icon: '/icons/ada.svg', color: '#0033ad' },
    EUR: { symbol: 'EUR', name: 'Euro', icon: '/icons/eur.svg', color: '#1e4dd8' },
    USD: { symbol: 'USD', name: 'US Dollar', icon: '/icons/usd.svg', color: '#1463ff' },
};

export function getAssetMeta(symbol: string): AssetMeta | undefined {
    return assetMeta[symbol.toUpperCase()];
}
