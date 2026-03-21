import { useRef, useCallback, useEffect } from 'react';

export function useRafThrottle(callback: (event: any) => void) {
  const rafId = useRef<number | null>(null);
  const latestEvent = useRef<any>(null);

  const throttledCallback = useCallback((event: any) => {
    latestEvent.current = event;
    
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        callback(latestEvent.current);
        rafId.current = null;
      });
    }
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return throttledCallback;
}
