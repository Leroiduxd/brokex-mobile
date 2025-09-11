import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { toast } from 'sonner';
import { TRADING_ABI, TRADING_CONTRACT_ADDRESS } from '@/lib/trading-abi';
import type { OpenPosition, OpenOrder, ClosedPosition } from '@/types/trading';

export function useTradingData() {
  const { address } = useAccount();
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, isPending, error: writeError } = useWriteContract();
  const publicClient = usePublicClient();

  // Fetch user's open position IDs
  const { data: openIds, refetch: refetchOpenIds } = useReadContract({
    address: TRADING_CONTRACT_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'getUserOpenIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch user's order IDs  
  const { data: orderIds, refetch: refetchOrderIds } = useReadContract({
    address: TRADING_CONTRACT_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'getUserOrderIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch user's closed positions
  const { data: closedData, refetch: refetchClosedPositions } = useReadContract({
    address: TRADING_CONTRACT_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'getUserCloseds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const fetchPositionsData = useCallback(async () => {
    if (!openIds || (openIds as readonly bigint[]).length === 0) {
      setOpenPositions([]);
      return;
    }
    if (!publicClient) return;

    setLoading(true);
    try {
      const ids = openIds as readonly bigint[];
      const results = await Promise.all(
        ids.map((id) =>
          (publicClient as any).readContract({
            address: TRADING_CONTRACT_ADDRESS,
            abi: TRADING_ABI,
            functionName: 'getOpenById',
            args: [id],
          } as const)
        )
      );

      setOpenPositions(results as unknown as OpenPosition[]);
    } catch (err) {
      setError('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [openIds, publicClient]);

  const fetchOrdersData = useCallback(async () => {
    if (!orderIds || (orderIds as readonly bigint[]).length === 0) {
      setOpenOrders([]);
      return;
    }
    if (!publicClient) return;

    setLoading(true);
    try {
      const ids = orderIds as readonly bigint[];
      const results = await Promise.all(
        ids.map((id) =>
          (publicClient as any).readContract({
            address: TRADING_CONTRACT_ADDRESS,
            abi: TRADING_ABI,
            functionName: 'getOrderById',
            args: [id],
          } as const)
        )
      );

      setOpenOrders(results as unknown as OpenOrder[]);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [orderIds, publicClient]);

  const closePosition = async (openId: bigint, assetIndex: number) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer la preuve depuis l'API
      const proofResponse = await fetch(`https://proof.brokex.trade/proof?pairs=${assetIndex}`);
      if (!proofResponse.ok) {
        throw new Error('Failed to get proof');
      }
      
      const { proof } = await proofResponse.json();
      
      // Appeler le contrat smart contract
      writeContract({
        address: TRADING_CONTRACT_ADDRESS,
        abi: TRADING_ABI,
        functionName: 'closePosition',
        args: [openId, proof as `0x${string}`],
      } as any);
      
      toast.success('Position closing transaction submitted');
      
      // Actualiser les données après quelques secondes
      setTimeout(() => {
        refreshData();
      }, 5000);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to close position';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: bigint) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      writeContract({
        address: TRADING_CONTRACT_ADDRESS,
        abi: TRADING_ABI,
        functionName: 'cancelOrder',
        args: [orderId],
      } as any);
      
      toast.success('Order cancellation transaction submitted');
      
      // Actualiser les données après quelques secondes
      setTimeout(() => {
        refreshData();
      }, 5000);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to cancel order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    if (!address) return;
    
    try {
      await Promise.all([
        refetchOpenIds(),
        refetchOrderIds(),
        refetchClosedPositions()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [address, refetchOpenIds, refetchOrderIds, refetchClosedPositions]);

  // Effect pour charger les positions quand les IDs changent
  useEffect(() => {
    fetchPositionsData();
  }, [fetchPositionsData]);

  // Effect pour charger les ordres quand les IDs changent
  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  // Effect pour traiter les positions fermées
  useEffect(() => {
    if (closedData) {
      setClosedPositions(closedData as ClosedPosition[]);
    } else {
      setClosedPositions([]);
    }
  }, [closedData]);

  useEffect(() => {
    if (address) {
      refreshData();
      
      // Auto refresh every 10 seconds
      const interval = setInterval(() => {
        refreshData();
      }, 10000);
      
      return () => clearInterval(interval);
    } else {
      setOpenPositions([]);
      setOpenOrders([]);
      setClosedPositions([]);
      setLoading(false);
    }
  }, [address, refreshData]);

  return {
    openPositions,
    openOrders,
    closedPositions,
    loading: loading || isPending,
    error: error || writeError?.message,
    closePosition,
    cancelOrder,
    refreshData
  };
}