import { useState, useEffect, useCallback, useRef } from 'react';
import type { Asset, WssMessage } from '@/types/trading';

const WSS_URL = 'wss://wss.brokex.trade:8443';

export function useMarketsWSS() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFirstData, setHasFirstData] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const parseWssMessage = useCallback((message: WssMessage): Asset[] => {
    const parsedAssets: Asset[] = [];
    
    Object.values(message).forEach((payload) => {
      if (payload.instruments && Array.isArray(payload.instruments)) {
        payload.instruments.forEach((instrument) => {
          const asset: Asset = {
            id: payload.id || null,
            pair: instrument.tradingPair.toUpperCase().replace('_', '/'),
            name: payload.name || '',
            price: Number(instrument.currentPrice) || 0,
            changePct24h: Number(instrument["24h_change"]) || 0,
            high24h: Number(instrument["24h_high"]) || 0,
            low24h: Number(instrument["24h_low"]) || 0,
            timestamp: instrument.timestamp
          };
          parsedAssets.push(asset);
        });
      }
    });
    
    return parsedAssets;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WSS_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WssMessage = JSON.parse(event.data);
          const parsedAssets = parseWssMessage(message);
          
          if (parsedAssets.length > 0) {
            setAssets(parsedAssets);
            
            if (!hasFirstData) {
              setHasFirstData(true);
            }
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
        setError('WebSocket connection error');
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      setError('Failed to connect to market data');
      console.error('Connection error:', err);
    }
  }, [parseWssMessage, hasFirstData]);

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

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    assets,
    isConnected,
    error,
    hasFirstData,
    reconnect: connect
  };
}