'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';

import { useMarketsWSS } from '@/hooks/useMarketsWSS';
import { useUIStore } from '@/store/ui';
import { TradeSheet } from '@/components/TradeSheetSimple';
import { cn } from '@/lib/utils';
import { formatPrice, formatPercentage } from '@/lib/contracts';
import { Sparkline } from '@/components/Sparkline';

import type { Asset } from '@/types/trading';

type SortKey = 'pair' | 'price' | 'change';

export function MarketsPage() {
  const { assets, isConnected, error, hasFirstData } = useMarketsWSS();
  const { setGlobalLoading, openTradeSheet, selectedAsset, closeTradeSheet } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('pair');
  const [sortAsc, setSortAsc] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Hide global loader when first data arrives
  useEffect(() => {
    if (hasFirstData) {
      setGlobalLoading(false);
    }
  }, [hasFirstData, setGlobalLoading]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = assets.filter(asset => 
        asset.pair.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case 'pair':
          aVal = a.pair;
          bVal = b.pair;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change':
          aVal = a.changePct24h;
          bVal = b.changePct24h;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortAsc 
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    return filtered;
  }, [assets, searchQuery, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    openTradeSheet(asset);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <TrendingDown className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b0f1a' }}>
      {/* Fixed Dark Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{ 
          height: '92px',
          backgroundColor: '#0b0f1a',
          paddingTop: 'env(safe-area-inset-top, 0)'
        }}
      >
        <h1 className="text-white text-2xl font-bold" style={{ fontSize: '24px', fontWeight: '800' }}>
          Brokex Protocol
        </h1>
        
        <button 
          onClick={() => setShowSearchModal(true)}
          className="flex items-center justify-center"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* White Sheet Content - Fixed container */}
      <div 
        className="fixed bg-white"
        style={{
          top: '92px',
          left: '0',
          right: '0',
          bottom: '0', // Extend to bottom of screen
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          color: '#0b1220'
        }}
      >
        {/* Scrollable content */}
        <div 
          className="h-full overflow-y-auto"
          style={{
            padding: '18px 16px 100px', // Add bottom padding for navbar
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px'
          }}
        >
          {/* Assets Grid */}
          <div className="space-y-3">
          {filteredAndSortedAssets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                <Search className="w-8 h-8 mx-auto mb-2" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery ? 'No markets match your search' : 'No markets available'}
              </p>
            </div>
          ) : (
            filteredAndSortedAssets.map((asset) => (
              <button
                key={`${asset.pair}-${asset.id}`}
                onClick={() => handleAssetClick(asset)}
                className="w-full p-4 bg-card border border-border rounded-xl hover:bg-card/80 transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{asset.pair}</h3>
                        {asset.name && (
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Mini chart per asset */}
                  <Sparkline pairId={asset.id} width={120} height={36} />
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatPrice(asset.price)}
                    </div>
                    <div className={cn(
                      "text-sm font-medium flex items-center justify-end gap-1",
                      asset.changePct24h >= 0 ? "text-long" : "text-short"
                    )}>
                      {asset.changePct24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatPercentage(asset.changePct24h)}
                    </div>
                  </div>
                </div>
                
              </button>
            ))
          )}
        </div>

          {/* Connection Status */}
          {!isConnected && hasFirstData && (
            <div className="fixed bottom-24 left-4 right-4 mx-auto max-w-sm bg-muted/90 backdrop-blur-sm border border-border rounded-lg p-3 text-center text-sm text-muted-foreground">
              Reconnecting to market data...
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-start justify-center pt-20"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-lg bg-transparent border-none outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Search Results */}
              <div className="max-h-60 overflow-y-auto">
                {filteredAndSortedAssets.slice(0, 5).map((asset) => (
                  <button
                    key={`${asset.pair}-${asset.id}`}
                    onClick={() => {
                      handleAssetClick(asset);
                      setShowSearchModal(false);
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">{asset.pair}</div>
                      <div className="text-sm text-gray-500">{asset.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(asset.price)}</div>
                      <div className={cn(
                        "text-sm",
                        asset.changePct24h >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatPercentage(asset.changePct24h)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Sheet */}
      <TradeSheet 
        asset={selectedAsset} 
        onClose={closeTradeSheet} 
      />
    </div>
  );
}