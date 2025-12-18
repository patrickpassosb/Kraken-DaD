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
    XRP: { symbol: 'XRP', name: 'XRP', color: '#0a0a0a' },
    BNB: { symbol: 'BNB', name: 'BNB', color: '#f3ba2f' },
    DOGE: { symbol: 'DOGE', name: 'Dogecoin', color: '#c3a634' },
    DOT: { symbol: 'DOT', name: 'Polkadot', color: '#e6007a' },
    LINK: { symbol: 'LINK', name: 'Chainlink', color: '#345dd9' },
    LTC: { symbol: 'LTC', name: 'Litecoin', color: '#b5b5b5' },
    BCH: { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8dc351' },
    TRX: { symbol: 'TRX', name: 'TRON', color: '#ff060a' },
    MATIC: { symbol: 'MATIC', name: 'Polygon', color: '#8247e5' },
    EUR: { symbol: 'EUR', name: 'Euro', icon: '/icons/eur.svg', color: '#1e4dd8' },
    USD: { symbol: 'USD', name: 'US Dollar', icon: '/icons/usd.svg', color: '#1463ff' },
};

export function getAssetMeta(symbol: string): AssetMeta | undefined {
    return assetMeta[symbol.toUpperCase()];
}

export function getAssetIconUrl(symbol: string): string | undefined {
    const meta = getAssetMeta(symbol);
    if (meta?.icon) return meta.icon;
    const alias: Record<string, string> = {
        BTC: 'btc',
        XBT: 'btc',
        TBTC: 'btc',
        WBTC: 'wbtc',
        ETH: 'eth',
        XETH: 'eth',
        USDC: 'usdc',
        USDT: 'usdt',
        EUR: 'eur',
        USD: 'usd',
        XRP: 'xrp',
        BNB: 'bnb',
        DOGE: 'doge',
        DOT: 'dot',
        LINK: 'link',
        LTC: 'ltc',
        BCH: 'bch',
        TRX: 'trx',
        MATIC: 'matic',
    };
    const sym = alias[symbol.toUpperCase()] ?? symbol.toLowerCase();
    if (!/^[0-9a-z]+$/.test(sym)) return undefined;
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym}.png`;
}
