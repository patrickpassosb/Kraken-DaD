import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchAssets, fetchAssetPairs } from '@kraken-dad/kraken-client';

export async function pairsRoute(fastify: FastifyInstance) {
    fastify.get('/market/pairs', async (_req: FastifyRequest, reply: FastifyReply) => {
        try {
            const [assets, pairs] = await Promise.all([fetchAssets(), fetchAssetPairs()]);
            const assetMeta = Object.entries(assets).reduce<Record<string, { symbol: string; name: string }>>(
                (acc, [key, val]) => {
                    const symbol = val.altname.replace(/^X/, '').replace(/^Z/, '');
                    acc[key] = { symbol, name: val.altname };
                    return acc;
                },
                {}
            );

            const list = Object.values(pairs).map((p) => {
                const baseMeta = assetMeta[p.base] ?? { symbol: p.base, name: p.base };
                const quoteMeta = assetMeta[p.quote] ?? { symbol: p.quote, name: p.quote };
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
