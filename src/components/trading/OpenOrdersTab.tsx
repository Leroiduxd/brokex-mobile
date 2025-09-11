import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { OpenOrder } from '@/types/trading';
import { formatPrice } from '@/lib/contracts';

interface Props {
  orders: OpenOrder[];
  loading: boolean;
  hasFirstData: boolean;
  getPairName: (assetIndex: number) => string;
  getLivePrice: (assetIndex: number) => number;
  onCancelOrder: (orderId: bigint) => Promise<void>;
}

export function OpenOrdersTab({ 
  orders, 
  loading, 
  hasFirstData, 
  getPairName, 
  getLivePrice, 
  onCancelOrder 
}: Props) {
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());

  const handleCancelOrder = async (order: OpenOrder) => {
    const orderId = order.id.toString();
    setCancelingIds(prev => new Set([...prev, orderId]));
    
    try {
      await onCancelOrder(order.id);
    } finally {
      setCancelingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (loading && !hasFirstData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading orders...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">No open orders</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const assetIndex = Number(order.assetIndex);
        const pairName = getPairName(assetIndex);
        const livePrice = getLivePrice(assetIndex);
        const orderPrice = Number(formatUnits(order.orderPrice, 18));
        const sizeUsd = Number(formatUnits(order.sizeUsd, 6));
        const leverage = Number(order.leverage);
        const timestamp = new Date(Number(order.timestamp) * 1000);
        const isCanceling = cancelingIds.has(order.id.toString());
        
        return (
          <div 
            key={order.id.toString()}
            className="bg-card rounded-lg border p-6"
            data-id={order.id.toString()}
            data-asset-index={assetIndex}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Order Info */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground pair-name">
                  Pair: {pairName}
                </div>
                 <div className="flex items-center gap-2">
                   <Badge 
                     variant={order.isLong ? "default" : "outline"}
                     className="flex items-center gap-1"
                   >
                     {order.isLong ? (
                       <TrendingUp className="w-3 h-3" />
                     ) : (
                       <TrendingDown className="w-3 h-3" />
                     )}
                     {order.isLong ? 'Long' : 'Short'}
                   </Badge>
                   <Badge variant="outline">×{leverage}</Badge>
                 </div>
                <div className="text-sm text-muted-foreground">
                  ID: {order.id.toString()}
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Order Price:</span>
                  <div className="font-mono">${formatPrice(orderPrice)}</div>
                </div>
                <div className="text-sm live-price">
                  <span className="text-muted-foreground">Live Price:</span>
                  <div className="font-mono">${formatPrice(livePrice)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Size USD:</span>
                  <div className="font-mono">${sizeUsd.toFixed(2)}</div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2">
                   <div className="text-sm">
                     <span className="text-muted-foreground">Status:</span>
                     <div className="text-accent-foreground font-medium">Pending</div>
                   </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <div className="text-xs">{timestamp.toLocaleString()}</div>
                </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Distance:</span>
                      <div className="text-xs text-primary">
                        {((orderPrice - livePrice) / livePrice * 100).toFixed(2)}%
                      </div>
                    </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center">
                 <Button
                   variant="default"
                   onClick={() => handleCancelOrder(order)}
                   disabled={isCanceling}
                   className="w-full"
                 >
                   {isCanceling ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Canceling...
                     </>
                   ) : (
                     'Cancel Order'
                   )}
                 </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}