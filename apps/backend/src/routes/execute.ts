/**
 * Kraken DaD - Execute Routes
 *
 * Exposes dry-run execution endpoint.
 *
 * @module backend/routes/execute
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    Strategy,
    ExecutionContext,
} from '../../../../packages/strategy-core/schema.ts';
import {
    executeDryRun,
    ExecutionResult,
} from '../../../../packages/strategy-core/executor/dryRunExecutor.ts';

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

interface ExecuteRequestBody {
    strategy: Strategy;
}

// =============================================================================
// ROUTE PLUGIN
// =============================================================================

export async function executeRoute(fastify: FastifyInstance) {
    /**
     * POST /execute/dry-run
     *
     * Execute a strategy in dry-run mode.
     * No side effects, no API calls, deterministic behavior.
     */
    fastify.post<{ Body: ExecuteRequestBody }>(
        '/execute/dry-run',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['strategy'],
                    properties: {
                        strategy: {
                            type: 'object',
                            required: ['version', 'metadata', 'nodes', 'edges'],
                            properties: {
                                version: { type: 'number' },
                                metadata: {
                                    type: 'object',
                                    required: ['name', 'createdAt', 'updatedAt'],
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        createdAt: { type: 'string' },
                                        updatedAt: { type: 'string' },
                                        author: { type: 'string' },
                                        tags: { type: 'array', items: { type: 'string' } },
                                    },
                                },
                                nodes: { type: 'array' },
                                edges: { type: 'array' },
                            },
                        },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            mode: { type: 'string' },
                            startedAt: { type: 'string' },
                            completedAt: { type: 'string' },
                            nodesExecuted: { type: 'number' },
                            log: { type: 'array' },
                            errors: { type: 'array' },
                            warnings: { type: 'array' },
                            actionIntents: { type: 'array' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: ExecuteRequestBody }>, reply: FastifyReply) => {
            const { strategy } = request.body;

            // Create execution context for dry-run mode
            const ctx: ExecutionContext = {
                mode: 'dry-run',
            };

            // Execute strategy
            const result: ExecutionResult = executeDryRun(strategy, ctx);

            return reply.status(200).send(result);
        }
    );
}
