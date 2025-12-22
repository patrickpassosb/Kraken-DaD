import { assetMeta as generatedAssetMeta } from './assets.generated';

export interface AssetMeta {
    symbol: string;
    name: string;
    icon?: string; // relative to public/
    color?: string;
    krakenId?: string;
    coinGeckoId?: string;
}

const iconAliases: Record<string, string> = {
    BTC: 'btc',
    XBT: 'btc',
    TBTC: 'btc',
    WBTC: 'wrapped-bitcoin',
    ETH: 'ethereum',
    XETH: 'ethereum',
    USDC: 'usd-coin',
    USDT: 'tether',
    USDR: 'usdr', // override missing stables
    USDQ: 'usdq',
    EUR: 'eur',
    USD: 'usd',
    XRP: 'ripple',
    BNB: 'binancecoin',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    LINK: 'chainlink',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    TRX: 'tron',
    MATIC: 'matic-network',
};

const baseAssetMeta: Record<string, AssetMeta> = {
    BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '/icons/bitcoin.png', color: '#f7931a' },
    ETH: { symbol: 'ETH', name: 'Ethereum', icon: '/icons/ethereum.png', color: '#6b6bff' },
    USDC: { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', color: '#2775ca' },
    USDT: { symbol: 'USDT', name: 'Tether', icon: '/icons/Tether.png', color: '#26a17b' },
    SOL: { symbol: 'SOL', name: 'Solana', icon: '/icons/solana.png', color: '#00ffa3' },
    ADA: { symbol: 'ADA', name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', color: '#0033ad' },
    XRP: { symbol: 'XRP', name: 'XRP', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', color: '#0a0a0a' },
    BNB: { symbol: 'BNB', name: 'BNB', icon: '/icons/bnb-icon2_2x.png', color: '#f3ba2f' },
    DOGE: { symbol: 'DOGE', name: 'Dogecoin', icon: '/icons/dogecoin.png', color: '#c3a634' },
    DOT: { symbol: 'DOT', name: 'Polkadot', icon: 'https://assets.coingecko.com/coins/images/12171/small/aJGBjJFU_400x400.jpg', color: '#e6007a' },
    LINK: { symbol: 'LINK', name: 'Chainlink', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', color: '#345dd9' },
    LTC: { symbol: 'LTC', name: 'Litecoin', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', color: '#b5b5b5' },
    BCH: { symbol: 'BCH', name: 'Bitcoin Cash', icon: 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png', color: '#8dc351' },
    TRX: { symbol: 'TRX', name: 'TRON', icon: '/icons/tron-logo.png', color: '#ff060a' },
    MATIC: { symbol: 'MATIC', name: 'Polygon', icon: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png', color: '#8247e5' },
    XLM: { symbol: 'XLM', name: 'Stellar', icon: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png', color: '#1b1b1b' },
    XMR: { symbol: 'XMR', name: 'Monero', icon: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png', color: '#ff6b00' },
    ZEC: { symbol: 'ZEC', name: 'Zcash', icon: 'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png', color: '#f4b728' },
    AVAX: { symbol: 'AVAX', name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png', color: '#e84142' },
    DAI: { symbol: 'DAI', name: 'Dai', icon: 'https://assets.coingecko.com/coins/images/9956/small/4943.png', color: '#f5ac37' },
    SUI: { symbol: 'SUI', name: 'Sui', icon: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', color: '#57a7ff' },
    SHIB: { symbol: 'SHIB', name: 'Shiba Inu', icon: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', color: '#f26a1a' },
    CRO: { symbol: 'CRO', name: 'Cronos', icon: 'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png', color: '#003185' },
    LEO: { symbol: 'LEO', name: 'UNUS SED LEO', icon: 'https://assets.coingecko.com/coins/images/8418/small/leo-token.png', color: '#121826' },
    PYUSD: { symbol: 'PYUSD', name: 'PayPal USD', icon: 'https://assets.coingecko.com/coins/images/31085/small/PYUSD.jpg', color: '#2c2c2c' },
    HBAR: { symbol: 'HBAR', name: 'Hedera', icon: 'https://assets.coingecko.com/coins/images/3688/small/hbar.png', color: '#101010' },
    UNI: { symbol: 'UNI', name: 'Uniswap', icon: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', color: '#ff007a' },
    AAVE: { symbol: 'AAVE', name: 'Aave', icon: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png', color: '#b6509e' },
    TON: { symbol: 'TON', name: 'Toncoin', icon: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', color: '#0098ea' },
    MNT: { symbol: 'MNT', name: 'Mantle', icon: 'https://assets.coingecko.com/coins/images/30980/small/token-logo.png', color: '#0d857c' },
    METIS: { symbol: 'METIS', name: 'Metis', icon: 'https://assets.coingecko.com/coins/images/15595/small/metis.jpeg', color: '#47c2b1' },
    EUR: { symbol: 'EUR', name: 'Euro', color: '#1e4dd8' },
    USD: { symbol: 'USD', name: 'US Dollar', icon: '/icons/coins/USD.png', color: '#1463ff' },
};

export const assetMeta: Record<string, AssetMeta> = {
    ...baseAssetMeta,
    ...generatedAssetMeta,
};

const geckoCache: Record<string, string> = {};

/** Looks up metadata for an asset symbol (includes icons/colors when known). */
export function getAssetMeta(symbol: string): AssetMeta | undefined {
    return assetMeta[symbol.toUpperCase()];
}

function getCoinGeckoUrl(id: string): string {
    return `https://assets.coingecko.com/coins/images/${id}/small.png`;
}

// Simple CoinGecko ID hints (for common assets not in alias map)
const geckoHints: Record<string, string> = {
    EUR: '279', // Euro Token
    USD: '825', // Tether USDt as a rough USD icon fallback
    USDR: '31234', // PayPal-related icon placeholder (proxy)
    USDQ: '4680', // USDQ Stablecoin (old), best-effort
    ADA: '975',
    DOT: '12171',
    LINK: '877',
    LTC: '2',
    BCH: '780',
    TRX: '1094',
    MATIC: '4713',
    XLM: '100',
    XMR: '69',
    ZEC: '486',
    AVAX: '12559',
    DAI: '9956',
    SUI: '26375',
    SHIB: '11939',
    CRO: '7310',
    LEO: '8418',
    PYUSD: '31085',
    HBAR: '3688',
    UNI: '12504',
    AAVE: '12645',
    TON: '17980',
    MNT: '30980',
    METIS: '15595',
    SOL: '4128',
};

export function getAssetIconUrl(symbol: string): string | undefined {
    const meta = getAssetMeta(symbol);
    if (meta?.icon) return meta.icon;
    const upper = symbol.toUpperCase();

    // Check cache for gecko ids
    if (geckoCache[upper]) {
        return getCoinGeckoUrl(geckoCache[upper]);
    }

    // Alias map to CoinGecko slugs (we map to IDs via known slugs)
    const slug = iconAliases[upper];
    if (slug) {
        // Known CoinGecko images path via slug is not stable; use hints where we know IDs
        if (geckoHints[upper]) {
            geckoCache[upper] = geckoHints[upper];
            return getCoinGeckoUrl(geckoHints[upper]);
        }
    }

    // Fallback to cryptoicons slug-style
    const symSlug = upper.toLowerCase();
    if (/^[0-9a-z]+$/.test(symSlug)) {
        return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symSlug}.png`;
    }

    return undefined;
}

/** Deterministic color helper for assets when brand colors are missing. */
export function hashedColor(symbol: string, offset = 0): string {
    let hash = 0;
    const input = symbol.toUpperCase();
    for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = (hash + offset * 57) % 360;
    const s = 60;
    const l = 50;
    return `hsl(${h < 0 ? h + 360 : h}, ${s}%, ${l}%)`;
}
