'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface SparklineProps {
  pairId: number;
  stroke?: string;
  height?: number;
  width?: number;
}

interface RawPoint {
  time: number | string;
  open: number | string;
}

export function Sparkline({ pairId, stroke, height = 36, width = 120 }: SparklineProps) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartColor, setChartColor] = useState<string>('#007bff');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`https://chart.brokex.trade/history?pair=${pairId}&interval=3600`, { cache: 'no-store' });
        let text = (await res.text()).trim();
        if (!text.startsWith('[')) {
          text = '[' + text.replace(/}\s*,?\s*{/g, '},{').replace(/,+\s*$/, '') + ']';
        }
        const raw: Array<any> = JSON.parse(text);

        const rows: Array<RawPoint> = raw
          .filter((o) => o && o.time && o.open !== undefined)
          .map((o) => ({ time: Number(o.time), open: Number(o.open) }))
          .sort((a, b) => Number(a.time) - Number(b.time));

        // Deduplicate flat runs (identical consecutive opens)
        const EPS = 1e-8;
        const dedup: Array<{ t: number; v: number }> = [];
        for (let i = 0; i < rows.length; i++) {
          const t = Number(rows[i].time);
          const v = Number(rows[i].open);
          const prev = dedup[dedup.length - 1];
          if (!prev || Math.abs(v - prev.v) > EPS) {
            dedup.push({ t, v });
          }
        }

        // Keep only the last 3/4 of points
        const startIndex = Math.floor(dedup.length * 0.25);
        const filteredDedup = dedup.slice(startIndex);

        // Reduce points to make smoother curve (keep every nth point)
        const maxPoints = 20; // Maximum number of points to display
        const step = Math.max(1, Math.floor(filteredDedup.length / maxPoints));
        const smoothedDedup = filteredDedup.filter((_, index) => index % step === 0);

        if (cancelled) return;

        // Determine color based on first vs last point of smoothed data
        if (smoothedDedup.length >= 2) {
          const firstValue = smoothedDedup[0].v;
          const lastValue = smoothedDedup[smoothedDedup.length - 1].v;
          const color = lastValue > firstValue ? '#3b82f6' : '#ef4444'; // blue if up, red if down
          setChartColor(color);
        }

        // Map to SVG coordinates
        const xs = smoothedDedup.map((d) => d.t);
        const ys = smoothedDedup.map((d) => d.v);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const spanX = maxX - minX || 1;
        const spanY = maxY - minY || 1;

        const padding = 2; // keep a small margin inside the box
        const w = width - padding * 2;
        const h = height - padding * 2;

        const mapped = smoothedDedup.map((d) => {
          const x = padding + ((d.t - minX) / spanX) * w;
          // invert y for SVG (0 at top)
          const y = padding + (1 - (d.v - minY) / spanY) * h;
          return { x, y };
        });

        setPoints(mapped);
      } catch {
        setPoints([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [pairId, height, width]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  }, [points]);

  return (
    <div style={{ width, height }} className="shrink-0">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden>
        <path d={pathData} fill="none" stroke={stroke || chartColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}


