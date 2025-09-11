'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import type { Theme } from '@/types/trading';

interface ChartProps {
  pairId: number | null;
  intervalSec: number;
  theme: Theme;
}

interface CandleData {
  time: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface OhlcData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const INTERVALS = [
  { s: 60, label: '1m' },
  { s: 300, label: '5m' },
  { s: 900, label: '15m' },
  { s: 1800, label: '30m' },
  { s: 3600, label: '1h' },
  { s: 14400, label: '4h' },
];

export function Chart({ pairId, intervalSec, theme }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInterval, setCurrentInterval] = useState(intervalSec);

  const fetchHistoryData = useCallback(async (pairId: number, intervalSec: number): Promise<OhlcData[]> => {
    console.log('Fetching chart data for pairId:', pairId, 'interval:', intervalSec);
    const response = await fetch(`https://chart.brokex.trade/history?pair=${pairId}&interval=${intervalSec}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Failed to fetch chart data`);
    }
    
    const data: CandleData[] = await response.json();
    console.log('Raw chart data:', data);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No chart data received');
      return [];
    }
    
    const ohlcData: OhlcData[] = data.map((row) => ({
      time: Math.floor(Number(row.time) / 1000), // Convert ms to seconds
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close)
    }));
    
    console.log('Processed OHLC data:', ohlcData);
    return ohlcData;
  }, []);

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    const themeOptions = theme === 'dark' ? {
      layout: {
        background: { color: 'hsl(0 0% 6%)' },
        textColor: 'hsl(240 5% 94%)'
      },
      grid: {
        vertLines: { color: 'hsl(217.2 32.6% 17.5%)' },
        horzLines: { color: 'hsl(217.2 32.6% 17.5%)' }
      },
      rightPriceScale: { borderColor: 'hsl(217.2 32.6% 17.5%)' },
      timeScale: { borderColor: 'hsl(217.2 32.6% 17.5%)', timeVisible: true, secondsVisible: false }
    } : {
      layout: {
        background: { color: 'hsl(0 0% 100%)' },
        textColor: 'hsl(222.2 84% 4.9%)'
      },
      grid: {
        vertLines: { color: 'hsl(214.3 31.8% 91.4%)' },
        horzLines: { color: 'hsl(214.3 31.8% 91.4%)' }
      },
      rightPriceScale: { borderColor: 'hsl(214.3 31.8% 91.4%)' },
      timeScale: { borderColor: 'hsl(214.3 31.8% 91.4%)', timeVisible: true, secondsVisible: false }
    };

    // Custom price formatter based on digits before decimal
    const priceFormatter = (price: number) => {
      const priceStr = Math.abs(price).toString();
      const digitsBeforeDecimal = priceStr.split('.')[0].length;
      
      let decimals = 2; // default
      if (digitsBeforeDecimal === 1) {
        decimals = 4;
      } else if (digitsBeforeDecimal === 2) {
        decimals = 3;
      }
      
      return price.toFixed(decimals);
    };

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 800,
      height: 400,
      ...themeOptions,
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, axisPressedMouseMove: true, pinch: true },
      localization: {
        priceFormatter,
      },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#3b82f6', // Blue for up candles
      downColor: '#ef4444', // Red for down candles
      borderUpColor: '#3b82f6',
      borderDownColor: '#ef4444',
      wickUpColor: '#3b82f6',
      wickDownColor: '#ef4444'
    });

    // Setup resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });

    resizeObserverRef.current.observe(chartContainerRef.current);
  }, [theme]);

  const updateChartTheme = useCallback(() => {
    if (!chartRef.current) return;

    const themeOptions = theme === 'dark' ? {
      layout: {
        background: { color: 'hsl(0 0% 6%)' },
        textColor: 'hsl(240 5% 94%)'
      },
      grid: {
        vertLines: { color: 'hsl(217.2 32.6% 17.5%)' },
        horzLines: { color: 'hsl(217.2 32.6% 17.5%)' }
      },
      rightPriceScale: { borderColor: 'hsl(217.2 32.6% 17.5%)' },
      timeScale: { borderColor: 'hsl(217.2 32.6% 17.5%)' }
    } : {
      layout: {
        background: { color: 'hsl(0 0% 100%)' },
        textColor: 'hsl(222.2 84% 4.9%)'
      },
      grid: {
        vertLines: { color: 'hsl(214.3 31.8% 91.4%)' },
        horzLines: { color: 'hsl(214.3 31.8% 91.4%)' }
      },
      rightPriceScale: { borderColor: 'hsl(214.3 31.8% 91.4%)' },
      timeScale: { borderColor: 'hsl(214.3 31.8% 91.4%)' }
    };

    chartRef.current.applyOptions(themeOptions);
  }, [theme]);

  const fetchAndApplyData = useCallback(async (pairId: number, intervalSec: number) => {
    if (!seriesRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchHistoryData(pairId, intervalSec);
      
      if (data.length > 0) {
        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoryData]);

  const handleIntervalChange = useCallback((newInterval: number) => {
    setCurrentInterval(newInterval);
    if (pairId !== null) {
      fetchAndApplyData(pairId, newInterval);
    }
  }, [pairId, fetchAndApplyData]);

  // Initialize chart
  useEffect(() => {
    initChart();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [initChart]);

  // Update theme
  useEffect(() => {
    updateChartTheme();
  }, [theme, updateChartTheme]);

  // Fetch data when pairId or interval changes
  useEffect(() => {
    if (pairId !== null && seriesRef.current) {
      fetchAndApplyData(pairId, currentInterval);
    }
  }, [pairId, currentInterval, fetchAndApplyData]);

  if (error) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-muted rounded-lg">
        <p className="text-destructive mb-2">{error}</p>
        <Button 
          onClick={() => pairId !== null && fetchAndApplyData(pairId, currentInterval)}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interval Toolbar */}
      <div className="flex gap-2 flex-wrap">
        {INTERVALS.map((interval) => (
          <Button
            key={interval.s}
            variant={currentInterval === interval.s ? "default" : "outline"}
            size="sm"
            onClick={() => handleIntervalChange(interval.s)}
            className="text-xs"
          >
            {interval.label}
          </Button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          className="h-[400px] w-full rounded-lg overflow-hidden border"
        />
      </div>
    </div>
  );
}