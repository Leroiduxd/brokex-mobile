import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { OpenPosition } from '@/types/trading';
import { formatPrice } from '@/lib/contracts';

interface Props {
  positions: OpenPosition[];
  loading: boolean;
  hasFirstData: boolean;
  getPairName: (assetIndex: number) => string;
  getLivePrice: (assetIndex: number) => number;
  onClosePosition: (openId: bigint, assetIndex: number) => Promise<void>;
}

export function OpenPositionsTab({ 
  positions, 
  loading, 
  hasFirstData, 
  getPairName, 
  getLivePrice, 
  onClosePosition 
}: Props) {
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

  const handleClosePosition = async (position: OpenPosition) => {
    const positionId = position.id.toString();
    setClosingIds(prev => new Set([...prev, positionId]));
    
    try {
      await onClosePosition(position.id, Number(position.assetIndex));
    } finally {
      setClosingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(positionId);
        return newSet;
      });
    }
  };

  const calculatePnl = (position: OpenPosition, livePrice: number) => {
    const openPrice = Number(formatUnits(position.openPrice, 18));
    const sizeUsd = Number(formatUnits(position.sizeUsd, 6));
    const leverage = Number(position.leverage);
    const dir = position.isLong ? 1 : -1;
    
    if (livePrice === 0 || openPrice === 0) return { pnlUsd: 0, pnlPct: 0 };
    
    const pnlUsd = sizeUsd * ((livePrice / openPrice - 1) * dir);
    const pnlPct = (pnlUsd / (sizeUsd / leverage)) * 100;
    
    return { pnlUsd, pnlPct };
  };

  if (loading && !hasFirstData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading positions...</span>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">No open positions</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map((position) => {
        const assetIndex = Number(position.assetIndex);
        const pairName = getPairName(assetIndex);
        const livePrice = getLivePrice(assetIndex);
        const openPrice = Number(formatUnits(position.openPrice, 18));
        const sizeUsd = Number(formatUnits(position.sizeUsd, 6));
        const leverage = Number(position.leverage);
        const timestamp = new Date(Number(position.timestamp) * 1000);
        const { pnlUsd, pnlPct } = calculatePnl(position, livePrice);
        const isClosing = closingIds.has(position.id.toString());
        
        return (
          <div 
            key={position.id.toString()}
            className="bg-card rounded-xl border p-4 trading-card shadow-sm"
            data-id={position.id.toString()}
            data-asset-index={assetIndex}
            data-openprice={openPrice}
            data-sizeusd={sizeUsd}
            data-leverage={leverage}
            data-islong={position.isLong.toString()}
          >
            {/* Header avec pair et direction */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg text-foreground truncate-mobile">
                  {pairName}
                </div>
                 <Badge 
                   variant={position.isLong ? "default" : "outline"}
                   className="flex items-center gap-1 text-xs"
                 >
                  {position.isLong ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {position.isLong ? 'Long' : 'Short'}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">×{leverage}</Badge>
            </div>

            {/* Grid mobile-first avec prix et PnL */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Prix d'ouverture et actuel */}
              <div className="space-y-2">
                 <div>
                   <div className="text-xs text-muted-foreground">Open Price</div>
                   <div className="text-sm font-mono font-medium">${formatPrice(openPrice)}</div>
                 </div>
                 <div className="live-price">
                   <div className="text-xs text-muted-foreground">Current Price</div>
                   <div className="text-sm font-mono font-medium">${formatPrice(livePrice)}</div>
                 </div>
              </div>

              {/* PnL et taille */}
              <div className="space-y-2">
                 <div className="profit-usd">
                   <div className="text-xs text-muted-foreground">P&L USD</div>
                   <div className={`text-sm font-mono font-bold ${pnlUsd >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                     {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}
                   </div>
                 </div>
                 <div className="profit-pct">
                   <div className="text-xs text-muted-foreground">P&L %</div>
                   <div className={`text-sm font-mono font-bold ${pnlPct >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                     {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                   </div>
                 </div>
              </div>
            </div>

            {/* Taille, date et ID */}
             <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-4">
               <div>
                 <div>Size: <span className="font-mono">${sizeUsd.toFixed(2)}</span></div>
                 <div className="mt-1">ID: {position.id.toString()}</div>
               </div>
               <div className="text-right">
                 <div>Opened:</div>
                 <div className="font-mono">
                   {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
             </div>

            {/* Bouton de fermeture */}
            <Button
              variant="default"
              onClick={() => handleClosePosition(position)}
              disabled={isClosing || livePrice === 0}
              className="w-full mobile-button"
              size="sm"
            >
               {isClosing ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Closing...
                 </>
               ) : (
                 `Close at $${formatPrice(livePrice)}`
               )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}