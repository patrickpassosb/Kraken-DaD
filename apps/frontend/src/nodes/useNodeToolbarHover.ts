import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small hover helper that delays toolbar hide/show to avoid flicker when moving between buttons.
 */
export function useNodeToolbarHover(delay: number = 240) {
    const [nodeHover, setNodeHover] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const schedule = useCallback(
        (fn: () => void) => {
            clearTimer();
            timeoutRef.current = window.setTimeout(fn, delay);
        },
        [clearTimer, delay]
    );

    const onNodeEnter = useCallback(() => {
        clearTimer();
        setNodeHover(true);
    }, [clearTimer]);

    const onNodeLeave = useCallback(() => {
        schedule(() => setNodeHover(false));
    }, [schedule]);

    useEffect(() => () => clearTimer(), [clearTimer]);

    return {
        visible: nodeHover,
        onNodeEnter,
        onNodeLeave,
    };
}
