import { useState, useEffect, useCallback, useRef } from 'react';
import type { WssMessage } from '@/types/trading';

const WSS_URL = 'wss://wss.brokex.trade:8443';

export function useTradingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [idToPair, setIdToPair] = useState<Map<number, string>>(new Map());
  const [lastPrices, setLastPrices] = useState<Record<number, number>>({});
  const [hasFirstData, setHasFirstData] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WSS_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WssMessage = JSON.parse(event.data);
          
          const newPairs = new Map(idToPair);
          const newPrices = { ...lastPrices };
          
          Object.values(data).forEach((payload) => {
            const inst = payload?.instruments?.[0];
            if (!inst || payload.id == null) return;
            
            const id = Number(payload.id);
            const pair = inst.tradingPair.toUpperCase();
            const price = Number(inst.currentPrice);
            
            newPairs.set(id, pair);
            newPrices[id] = price;
          });
          
          setIdToPair(newPairs);
          setLastPrices(newPrices);
          
          if (!hasFirstData && newPairs.size > 0) {
            setHasFirstData(true);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      console.error('Connection error:', err);
    }
  }, [idToPair, lastPrices, hasFirstData]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const getPairName = useCallback((assetIndex: number): string => {
    return idToPair.get(assetIndex) || 'Unknown';
  }, [idToPair]);

  const getLivePrice = useCallback((assetIndex: number): number => {
    return lastPrices[assetIndex] || 0;
  }, [lastPrices]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    hasFirstData,
    getPairName,
    getLivePrice,
    reconnect: connect
  };
}