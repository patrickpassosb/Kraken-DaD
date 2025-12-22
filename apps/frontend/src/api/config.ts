/**
 * Default backend origin for local development; overridable via Vite env.
 */
const PRODUCTION_API_BASE = 'https://kraken-dad-backend-622807662374.us-central1.run.app';
const LOCAL_API_BASE = 'http://127.0.0.1:3001';

/** Resolved API base URL consumed by fetch helpers */
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? LOCAL_API_BASE : PRODUCTION_API_BASE);
