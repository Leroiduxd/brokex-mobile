import React from 'react';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { ClosedPosition } from '@/types/trading';
import { formatPrice } from '@/lib/contracts';

interface Props {
  positions: ClosedPosition[];
  loading: boolean;
  hasFirstData: boolean;
  getPairName: (assetIndex: number) => string;
}

export function ClosedPositionsTab({ 
  positions, 
  loading, 
  hasFirstData, 
  getPairName 
}: Props) {
  if (loading && !hasFirstData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading closed positions...</span>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">No closed positions</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position, index) => {
        const assetIndex = Number(position.assetIndex);
        const pairName = getPairName(assetIndex);
        const openPrice = Number(formatUnits(position.openPrice, 18));
        const closePrice = Number(formatUnits(position.closePrice, 18));
        const sizeUsd = Number(formatUnits(position.sizeUsd, 6));
        const leverage = Number(position.leverage);
        const pnlUsd = Number(formatUnits(position.pnl, 6));
        const pnlPct = (pnlUsd / sizeUsd) * 100;
        const openTimestamp = new Date(Number(position.openTimestamp) * 1000);
        const closeTimestamp = new Date(Number(position.closeTimestamp) * 1000);
        
        return (
          <div 
            key={`${assetIndex}-${index}`}
            className="bg-card rounded-lg border p-6"
            data-asset-index={assetIndex}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Position Info */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground pair-name">
                  Pair: {pairName}
                </div>
                 <div className="flex items-center gap-2">
                   <Badge 
                     variant={position.isLong ? "default" : "outline"}
                     className="flex items-center gap-1"
                   >
                     {position.isLong ? (
                       <TrendingUp className="w-3 h-3" />
                     ) : (
                       <TrendingDown className="w-3 h-3" />
                     )}
                     {position.isLong ? 'Long' : 'Short'}
                   </Badge>
                   <Badge variant="outline">×{leverage}</Badge>
                 </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Size USD:</span>
                  <div className="font-mono">${sizeUsd.toFixed(2)}</div>
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Open Price:</span>
                  <div className="font-mono">${formatPrice(openPrice)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Close Price:</span>
                  <div className="font-mono">${formatPrice(closePrice)}</div>
                </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Price Change:</span>
                    <div className="font-mono text-primary">
                      {((closePrice - openPrice) / openPrice * 100).toFixed(2)}%
                    </div>
                  </div>
              </div>

              {/* PnL */}
              <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">PnL USD:</span>
                    <div className={`font-mono font-semibold ${
                      pnlUsd >= 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">PnL %:</span>
                    <div className={`font-mono font-semibold ${
                      pnlPct >= 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </div>
                  </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Opened:</span>
                  <div className="text-xs">{openTimestamp.toLocaleString()}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Closed:</span>
                  <div className="text-xs">{closeTimestamp.toLocaleString()}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="text-xs">
                    {Math.floor((closeTimestamp.getTime() - openTimestamp.getTime()) / (1000 * 60))} min
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}