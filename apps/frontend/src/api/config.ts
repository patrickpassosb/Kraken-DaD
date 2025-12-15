const DEFAULT_API_BASE = 'http://127.0.0.1:3001';

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || DEFAULT_API_BASE;
