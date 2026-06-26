'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 10;

  // Stable ref — always points to the latest callback without causing re-renders
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; });

  // connect is stable (empty deps) — it reads the latest callback via ref
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current && wsRef.current.readyState < 2) return; // already open/connecting

    try {
      const ws = new WebSocket(`${WS_BASE}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryCount.current = 0;
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);
        ws._ping = ping;
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const msg = JSON.parse(event.data);
          if (onMessageRef.current) onMessageRef.current(msg);
        } catch {
          // non-JSON, ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (ws._ping) clearInterval(ws._ping);
        if (retryCount.current < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
          retryCount.current++;
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => { ws.close(); };
    } catch {
      // WebSocket not available
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [connect]);

  return { connected };
}
