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

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as StreamPayload;
                if (!payload?.timestamp) return;
                // Throttle by timestamp progression
                if (payload.timestamp <= lastTsRef.current) return;
                lastTsRef.current = payload.timestamp;
                setData(payload);
                setWarning(null);
            } catch (err) {
                // ignore parse errors
            }
        };

        es.onerror = () => {
            setWarning('Live stream unavailable; using snapshot.');
        };

        return () => {
            es.close();
        };
    }, [pair]);

    return { data, warning };
}
