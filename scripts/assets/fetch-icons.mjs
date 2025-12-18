#!/usr/bin/env node
// Fetch Kraken-supported assets, map to CoinGecko, download icons locally, and emit assets.generated.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const KRAKEN_ASSETS_URL = 'https://api.kraken.com/0/public/Assets';
const KRAKEN_PAIRS_URL = 'https://api.kraken.com/0/public/AssetPairs';
const COINGECKO_LIST_URL = 'https://api.coingecko.com/api/v3/coins/list';
const COINGECKO_COIN_URL = (id) =>
    `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
const COINGECKO_MARKETS_URL = (ids) =>
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=${ids.length}&page=1&sparkline=false&price_change_percentage=&ids=${encodeURIComponent(
        ids.join(','),
    )}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const iconDir = path.join(repoRoot, 'apps', 'frontend', 'public', 'icons', 'coins');
const generatedPath = path.join(repoRoot, 'apps', 'frontend', 'src', 'data', 'assets.generated.ts');
const cryptoIconsBase =
    'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color';

// Prefer exact CoinGecko IDs for ambiguous symbols
const coingeckoOverrides = {
    BTC: 'bitcoin',
    XBT: 'bitcoin',
    WBTC: 'wrapped-bitcoin',
    ETH: 'ethereum',
    XETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    DAI: 'dai',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    LINK: 'chainlink',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    TRX: 'tron',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    XLM: 'stellar',
    XMR: 'monero',
    ZEC: 'zcash',
    SHIB: 'shiba-inu',
    CRO: 'crypto-com-chain',
    UNI: 'uniswap',
    AAVE: 'aave',
    HBAR: 'hedera-hashgraph',
    PYUSD: 'paypal-usd',
    TON: 'the-open-network',
    SUI: 'sui',
    LEO: 'leo-token',
    MNT: 'mantle',
    METIS: 'metis-token',
};

const symbolAliases = {
    XXBT: 'BTC',
    XBT: 'BTC',
    WBTC: 'WBTC',
    XETH: 'ETH',
    USDT: 'USDT',
    USDC: 'USDC',
    XDG: 'DOGE',
    ZUSD: 'USD',
    ZEUR: 'EUR',
    ZGBP: 'GBP',
};

async function fetchJson(url, label) {
    const res = await fetchWithRetry(url, label);
    return res.json();
}

async function fetchWithRetry(url, label, attempt = 1) {
    const res = await fetch(url);
    if (res.status === 429 && attempt < 8) {
        const delayMs = Math.min(2000 * 2 ** (attempt - 1), 15000);
        console.warn(`${label} hit rate limit, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
        await sleep(delayMs);
        return fetchWithRetry(url, label, attempt + 1);
    }
    if (!res.ok) throw new Error(`${label} request failed: ${res.status} ${res.statusText}`);
    return res;
}

async function loadKrakenAssets() {
    const [assetsResp, pairsResp] = await Promise.all([
        fetchJson(KRAKEN_ASSETS_URL, 'kraken assets'),
        fetchJson(KRAKEN_PAIRS_URL, 'kraken pairs'),
    ]);
    if (assetsResp.error?.length) throw new Error(`Kraken assets error: ${assetsResp.error.join(', ')}`);
    if (pairsResp.error?.length) throw new Error(`Kraken pairs error: ${pairsResp.error.join(', ')}`);

    const assetById = assetsResp.result || {};
    const tradableIds = new Set();
    for (const pair of Object.values(pairsResp.result || {})) {
        if (!pair) continue;
        if (pair.base) tradableIds.add(pair.base);
        if (pair.quote) tradableIds.add(pair.quote);
    }
    const assets = [];
    for (const [id, meta] of Object.entries(assetById)) {
        if (tradableIds.size && !tradableIds.has(id)) continue;
        const symbolRaw = meta.altname || id;
        const symbol = (symbolAliases[symbolRaw] || symbolRaw).toUpperCase();
        assets.push({
            krakenId: id,
            symbol,
            name: meta.asset_name || meta.altname || id,
        });
    }
    return assets;
}

async function loadCoinGeckoList() {
    const list = await fetchJson(COINGECKO_LIST_URL, 'coingecko list');
    const bySymbol = new Map();
    for (const coin of list) {
        const sym = (coin.symbol || '').toUpperCase();
        if (!sym) continue;
        if (!bySymbol.has(sym)) bySymbol.set(sym, []);
        bySymbol.get(sym).push(coin);
    }
    return { list, bySymbol };
}

function resolveCoinId(asset, geckoBySymbol) {
    const override = coingeckoOverrides[asset.symbol];
    if (override) return override;
    const matches = geckoBySymbol.get(asset.symbol) || [];
    if (matches.length === 1) return matches[0].id;
    if (matches.length > 1) {
        const exact = matches.find((c) => c.name?.toLowerCase() === asset.name.toLowerCase());
        if (exact) return exact.id;
        return matches[0].id;
    }
    return null;
}

async function downloadFromUrl(imageUrl, label) {
    const res = await fetchWithRetry(imageUrl, label);
    const contentType = res.headers.get('content-type') || '';
    let ext = '.png';
    if (contentType.includes('svg')) ext = '.svg';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else {
        const urlPath = new URL(imageUrl).pathname;
        const maybeExt = path.extname(urlPath);
        if (maybeExt) ext = maybeExt;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, ext };
}

async function downloadCryptoIcon(symbol) {
    const url = `${cryptoIconsBase}/${symbol.toLowerCase()}.png`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, ext: '.png' };
}

async function fetchMarketImages(coinIds) {
    const map = new Map();
    const chunkSize = 200;
    for (let i = 0; i < coinIds.length; i += chunkSize) {
        const chunk = coinIds.slice(i, i + chunkSize);
        const url = COINGECKO_MARKETS_URL(chunk);
        const data = await fetchJson(url, 'coingecko markets');
        for (const coin of data) {
            if (coin?.id && coin.image) {
                map.set(coin.id, coin.image);
            }
        }
        await sleep(1100);
    }
    return map;
}

async function downloadFromCoinDetail(id) {
    const coin = await fetchJson(COINGECKO_COIN_URL(id), `coingecko coin ${id}`);
    const imageUrl = coin?.image?.small || coin?.image?.thumb;
    if (!imageUrl) return null;
    return downloadFromUrl(imageUrl, `download ${id}`);
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function writeMetadata(entries) {
    const lines = entries
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .map(
            (e) =>
                `    ${e.symbol}: { symbol: '${e.symbol}', name: '${e.name.replace(/'/g, "\\'")}', icon: '${e.icon}', coinGeckoId: '${e.coinGeckoId}', krakenId: '${e.krakenId}' },`,
        );
    const content = `// Generated by scripts/assets/fetch-icons.mjs\n` +
        `export const assetMeta: Record<string, { symbol: string; name: string; icon?: string; color?: string; coinGeckoId?: string; krakenId?: string; }> = {\n` +
        `${lines.join('\n')}\n` +
        `};\n`;
    await fs.writeFile(generatedPath, content, 'utf8');
}

async function withConcurrency(items, limit, worker) {
    const results = [];
    let idx = 0;
    const errors = [];
    async function run() {
        while (idx < items.length) {
            const current = items[idx++];
            try {
                const value = await worker(current);
                results.push(value);
            } catch (err) {
                errors.push({ item: current, error: err });
            }
            await sleep(200);
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, run);
    await Promise.all(workers);
    return { results, errors };
}

async function main() {
    const maxAssets = Number.isFinite(Number.parseInt(process.env.MAX_ASSETS || '', 10))
        ? Number.parseInt(process.env.MAX_ASSETS, 10)
        : null;
    console.log('Loading Kraken assets and pairs…');
    const krakenAssets = await loadKrakenAssets();
    console.log(`Kraken tradable assets: ${krakenAssets.length}`);

    console.log('Loading CoinGecko list…');
    const { bySymbol: geckoBySymbol } = await loadCoinGeckoList();

    const resolved = [];
    const unresolved = [];
    for (const asset of krakenAssets) {
        const coinGeckoId = resolveCoinId(asset, geckoBySymbol);
        if (!coinGeckoId) {
            unresolved.push(asset);
            continue;
        }
        resolved.push({ ...asset, coinGeckoId });
    }
    console.log(`Resolved ${resolved.length} assets to CoinGecko IDs; unresolved: ${unresolved.length}`);
    if (unresolved.length) {
        console.warn('Unresolved symbols:', unresolved.map((a) => a.symbol).join(', '));
    }

    await ensureDir(iconDir);
    const downloadTargets = maxAssets ? resolved.slice(0, maxAssets) : resolved;
    console.log(`Fetching market images for ${downloadTargets.length} assets…`);
    const marketImages = await fetchMarketImages(downloadTargets.map((a) => a.coinGeckoId));

    console.log(`Downloading ${downloadTargets.length} icons to ${iconDir}…`);
    const { results: downloaded, errors } = await withConcurrency(downloadTargets, 1, async (asset) => {
        const cryptoIcon = await downloadCryptoIcon(asset.symbol);
        const imageUrl = marketImages.get(asset.coinGeckoId);
        const source =
            cryptoIcon ||
            (imageUrl ? await downloadFromUrl(imageUrl, `download ${asset.coinGeckoId}`) : null) ||
            (await downloadFromCoinDetail(asset.coinGeckoId));
        if (!source) throw new Error(`No icon source for ${asset.symbol}`);
        const filename = `${asset.symbol.toUpperCase()}${source.ext}`;
        const filepath = path.join(iconDir, filename);
        await fs.writeFile(filepath, source.buffer);
        return { ...asset, icon: `/icons/coins/${filename}` };
    });
    if (errors.length) {
        console.warn(`Icon download errors (${errors.length}):`, errors.map((e) => `${e.item.symbol}:${e.error}`));
    }

    const usable = downloaded;
    await writeMetadata(usable);
    console.log(`Wrote metadata for ${usable.length} assets -> ${generatedPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
