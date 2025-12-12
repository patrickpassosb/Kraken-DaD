/**
 * Kraken DaD - Backend Server
 *
 * Minimal Fastify HTTP API exposing the dry-run execution engine.
 * No auth, no database, no WebSockets.
 *
 * @module backend/server
 */

import Fastify from 'fastify';
import { executeRoute } from './routes/execute.js';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main() {
    const fastify = Fastify({
        logger: {
            level: 'info',
        },
    });

    // CORS middleware for frontend access
    fastify.addHook('onRequest', async (request, reply) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type');

        if (request.method === 'OPTIONS') {
            reply.status(204).send();
        }
    });

    // Health check
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register execute routes
    await fastify.register(executeRoute);

    // Start server
    try {
        await fastify.listen({ host: HOST, port: PORT });
        console.log(`Server running at http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

main();
