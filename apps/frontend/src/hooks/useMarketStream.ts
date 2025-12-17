import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../api/config';

type StreamPayload = {
    pair: string;
    last: number;
    ask?: number;
    bid?: number;
    spread?: number;
    timestamp: number;
    source: 'kraken-ws' | 'kraken-rest' | 'fallback';
};

export function useMarketStream(pair: string) {
    const [data, setData] = useState<StreamPayload | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const lastTsRef = useRef(0);

    useEffect(() => {
        if (!pair) return;

        const url = `${API_BASE}/market/stream?pair=${encodeURIComponent(pair)}&retry=2000`;
        const es = new EventSource(url);

        setWarning(null);
        lastTsRef.current = 0;

        es.onopen = () => {
            setWarning(null);
        };

        const handler = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data) as StreamPayload;
                if (!payload?.timestamp) return;
                if (payload.timestamp <= lastTsRef.current) return;
                lastTsRef.current = payload.timestamp;
                setData(payload);
                setWarning(null);
            } catch {
                // ignore parse errors
            }
        };

        es.addEventListener('ticker', handler);
        es.onmessage = handler; // fallback if event field missing

        es.onerror = () => {
            setWarning('Live stream unavailable; using snapshot.');
        };

        return () => {
            es.removeEventListener('ticker', handler);
            es.close();
        };
    }, [pair]);

    return { data, warning };
}
