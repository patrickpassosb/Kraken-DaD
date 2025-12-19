import { API_BASE } from './config';

export interface KrakenCredentialsStatus {
    configured: boolean;
    source: 'runtime' | 'env' | 'none';
}

export async function fetchKrakenCredentialsStatus(): Promise<KrakenCredentialsStatus> {
    const response = await fetch(`${API_BASE}/kraken/credentials/status`);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json();
}

export async function saveKrakenCredentials(
    key: string,
    secret: string
): Promise<KrakenCredentialsStatus> {
    const response = await fetch(`${API_BASE}/kraken/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, secret }),
    });

    const payload = (await response.json()) as { error?: string } & KrakenCredentialsStatus;
    if (!response.ok) {
        throw new Error(payload.error ?? `API error: ${response.status}`);
    }
    return payload;
}

export async function clearKrakenCredentials(): Promise<KrakenCredentialsStatus> {
    const response = await fetch(`${API_BASE}/kraken/credentials`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json();
}
