/**
 * Default backend origin for local development; overridable via Vite env.
 */
const DEFAULT_API_BASE = 'http://127.0.0.1:3001';

/** Resolved API base URL consumed by fetch helpers */
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || DEFAULT_API_BASE;
