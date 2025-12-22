/**
 * Runtime credential storage routes (in-memory) so live orders require explicit approval.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { clearPrivateCreds, getPrivateCredsStatus, setPrivateCreds } from '@kraken-dad/kraken-client';

interface CredentialsBody {
    key: string;
    secret: string;
}

export async function krakenCredentialsRoute(fastify: FastifyInstance) {
    /**
     * GET /kraken/credentials/status
     *
     * Indicates whether private API keys are configured and their source.
     */
    fastify.get(
        '/kraken/credentials/status',
        {
            schema: {
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            configured: { type: 'boolean' },
                            source: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            return reply.status(200).send(getPrivateCredsStatus());
        }
    );

    fastify.post<{ Body: CredentialsBody }>(
        '/kraken/credentials',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['key', 'secret'],
                    properties: {
                        key: { type: 'string' },
                        secret: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            configured: { type: 'boolean' },
                            source: { type: 'string' },
                        },
                    },
                    400: {
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: CredentialsBody }>, reply: FastifyReply) => {
            const key = request.body.key?.trim();
            const secret = request.body.secret?.trim();
            if (!key || !secret) {
                return reply.status(400).send({ error: 'API key and secret are required.' });
            }
            setPrivateCreds({ key, secret });
            return reply.status(200).send(getPrivateCredsStatus());
        }
    );

    fastify.delete(
        '/kraken/credentials',
        {
            schema: {
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            configured: { type: 'boolean' },
                            source: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            clearPrivateCreds();
            return reply.status(200).send(getPrivateCredsStatus());
        }
    );
}
