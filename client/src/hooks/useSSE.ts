import { useEffect, useRef, useCallback, useState } from 'react';
import type { SSEMessage } from '../../../shared/types/api';

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        if (message.type !== 'heartbeat') {
          setLastUpdate(message.timestamp);
        }
        options.onMessage?.(message);
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = (event) => {
      setConnected(false);
      options.onError?.(event);
      // EventSource auto-reconnects
    };

    return es;
  }, [options.onMessage, options.onError]);

  useEffect(() => {
    const es = connect();
    return () => {
      es.close();
      setConnected(false);
    };
  }, [connect]);

  return { connected, lastUpdate };
}
