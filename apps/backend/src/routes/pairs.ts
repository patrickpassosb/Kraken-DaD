import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchAssets, fetchAssetPairs } from '@kraken-dad/kraken-client';

const symbolOverrides: Record<string, string> = {
    XBT: 'BTC',
    XXBT: 'BTC',
    TBTC: 'BTC',
    XETH: 'ETH',
    ETH2: 'ETH',
    XDG: 'DOGE',
    XETC: 'ETC',
    XREP: 'REP',
    XXRP: 'XRP',
    DASH: 'DASH',
    MET: 'METIS', // normalize short forms
};

/**
 * Aligns Kraken asset altnames to common symbols (e.g., XBT -> BTC) for frontend display.
 */
function normalizeSymbol(altname: string): string {
    const upper = altname.toUpperCase();
    if (symbolOverrides[upper]) return symbolOverrides[upper];
    if (upper.startsWith('X') && upper.length === 4) return upper.slice(1);
    if (upper.startsWith('Z') && upper.length === 4) return upper.slice(1);
    return upper;
}

export async function pairsRoute(fastify: FastifyInstance) {
    /**
     * GET /market/pairs
     *
     * Returns a flattened pair catalog with normalized symbols for dropdowns.
     */
    fastify.get('/market/pairs', async (_req: FastifyRequest, reply: FastifyReply) => {
        try {
            const [assets, pairs] = await Promise.all([fetchAssets(), fetchAssetPairs()]);
            const assetMeta = Object.entries(assets).reduce<Record<string, { symbol: string; name: string }>>(
                (acc, [key, val]) => {
                    const symbol = normalizeSymbol(val.altname);
                    acc[key] = { symbol, name: val.altname };
                    return acc;
                },
                {}
            );

            const list = Object.values(pairs).map((p) => {
                const baseMeta = assetMeta[p.base] ?? { symbol: normalizeSymbol(p.base), name: p.base };
                const quoteMeta = assetMeta[p.quote] ?? { symbol: normalizeSymbol(p.quote), name: p.quote };
                const label = p.wsname || p.altname || `${baseMeta.symbol}/${quoteMeta.symbol}`;
                return {
                    id: label,
                    base: baseMeta.symbol,
                    quote: quoteMeta.symbol,
                    status: p.status ?? 'online',
                    name: `${baseMeta.symbol}/${quoteMeta.symbol}`,
                };
            });

            return reply.send({ pairs: list });
        } catch (err) {
            fastify.log.error({ err }, 'Failed to fetch Kraken pairs');
            return reply.status(502).send({ error: 'Unable to fetch pair catalog' });
        }
    });
}
