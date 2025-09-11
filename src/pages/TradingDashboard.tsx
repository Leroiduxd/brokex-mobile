import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTradingData } from '@/hooks/useTradingData';
import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import { useUIStore } from '@/store/ui';
import { OpenPositionsTab } from '@/components/trading/OpenPositionsTab';
import { OpenOrdersTab } from '@/components/trading/OpenOrdersTab';
import { ClosedPositionsTab } from '@/components/trading/ClosedPositionsTab';
import { BottomNavigation } from '@/components/BottomNavigation';
import { TabType } from '@/types/trading';
import { ArrowLeft } from 'lucide-react';

export function TradingDashboard() {
  const { isConnected: isWalletConnected } = useAccount();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const { setGlobalLoading } = useUIStore();
  
  const {
    openPositions,
    openOrders,
    closedPositions,
    loading,
    error,
    closePosition,
    cancelOrder,
    refreshData
  } = useTradingData();
  
  const {
    isConnected: isWSConnected,
    hasFirstData,
    getPairName,
    getLivePrice,
    reconnect
  } = useTradingWebSocket();

  // Disable global loader for trading dashboard
  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="min-h-screen bg-background mobile-scroll safe-area-top">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
              <p className="text-muted-foreground text-center max-w-md text-sm sm:text-base">
                Connect your wallet to view and manage your positions, orders, and trading history.
              </p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-primary pb-16 overflow-hidden">
      <div className="mobile-scroll safe-area-top h-full">
        {/* Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-10 bg-primary"
        >
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold text-primary-foreground m-0">
              Portfolio
            </h1>
          </div>
        </div>

        {/* Content with top margin */}
        <div style={{ marginTop: '80px' }}>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <div className="text-destructive font-medium">Error</div>
              <div className="text-destructive/80 text-sm">{error}</div>
            </div>
          )}

          {/* Fixed Tabs */}
          <div className="fixed left-0 right-0 z-20 bg-white rounded-t-3xl" style={{ top: '80px' }}>
            <div className="px-4 py-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                <TabsList className="grid w-full grid-cols-3 trading-tabs rounded-full bg-muted p-1">
                  <TabsTrigger 
                    value="positions" 
                    className="text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Positions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Orders
                  </TabsTrigger>
                  <TabsTrigger 
                    value="closed" 
                    className="text-xs sm:text-sm rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            className="bg-white overflow-hidden w-full fixed left-0 right-0"
            style={{ 
              top: '140px',
              height: 'calc(100vh - 140px)', // Full height minus header and tabs
              paddingBottom: '80px', // Space for bottom nav
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="flex-1 overflow-y-auto px-4 pt-3.5">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                <TabsContent value="positions" className="m-0 pt-7.5">
                  <OpenPositionsTab
                    positions={openPositions}
                    loading={loading}
                    hasFirstData={hasFirstData}
                    getPairName={getPairName}
                    getLivePrice={getLivePrice}
                    onClosePosition={closePosition}
                  />
                </TabsContent>

                <TabsContent value="orders" className="m-0 pt-7.5">
                  <OpenOrdersTab
                    orders={openOrders}
                    loading={loading}
                    hasFirstData={hasFirstData}
                    getPairName={getPairName}
                    getLivePrice={getLivePrice}
                    onCancelOrder={cancelOrder}
                  />
                </TabsContent>

                <TabsContent value="closed" className="m-0 pt-7.5">
                  <ClosedPositionsTab
                    positions={closedPositions}
                    loading={loading}
                    hasFirstData={hasFirstData}
                    getPairName={getPairName}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}