'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAccount, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

import { Chart } from './Chart';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { 
  ERC20_ABI, 
  USD_TOKEN_ADDRESS,
  CORE_CONTRACT_ADDRESS,
  CORE_ABI,
  formatPrice,
  formatPercentage,
  formatBalance,
  to6,
  to18
} from '@/lib/contracts';
import { dplabsTestnet } from '@/lib/chain';

import type { Asset, OrderFormState, OrderType, Side } from '@/types/trading';

interface TradeSheetProps {
  asset: Asset | null;
  onClose: () => void;
}

export function TradeSheet({ asset, onClose }: TradeSheetProps) {
  const { theme } = useTheme();
  const { isTradeSheetOpen } = useUIStore();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [prefilledTargetDone, setPrefilledTargetDone] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [form, setForm] = useState<OrderFormState>({
    side: 'buy',
    type: 'market',
    sizeUsd: '',
    leverage: 5,
    enableSlTp: false,
    sl: '',
    tp: '',
    targetPrice: ''
  });

  // Read USD token balance
  const { data: decimals } = useReadContract({
    address: USD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals'
  });

  const { data: balance } = useReadContract({
    address: USD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Smart contract write hooks
  const { writeContract, isPending, error, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction results
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success('Transaction confirmed!', {
        description: `Hash: ${hash.slice(0, 10)}...`
      });
      setIsExecuting(false);
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (error) {
      toast.error('Transaction failed', {
        description: error.message
      });
      setIsExecuting(false);
    }
  }, [error]);

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      setForm({
        side: 'buy',
        type: 'market',
        sizeUsd: '10', // Default to 10 USD minimum
        leverage: 5,
        enableSlTp: false,
        sl: '',
        tp: '',
        targetPrice: ''
      });
      setPrefilledTargetDone(false);
      setIsFormExpanded(false);
    }
  }, [asset]);

  // Prefill target price for limit orders
  useEffect(() => {
    if (form.type === 'limit' && asset && !prefilledTargetDone) {
      setForm(prev => ({ 
        ...prev, 
        targetPrice: formatPrice(asset.price) 
      }));
      setPrefilledTargetDone(true);
    }
  }, [form.type, asset, prefilledTargetDone]);

  const validateForm = useCallback((): string | null => {
    if (!asset?.id) return 'Invalid asset';
    if (form.leverage < 1 || form.leverage > 100) return 'Leverage must be between 1-100';
    
    const sizeUsdNum = parseFloat(form.sizeUsd);
    if (!sizeUsdNum || sizeUsdNum < 10) return 'Position size must be at least $10';
    
    if (form.type === 'limit' && (!form.targetPrice || parseFloat(form.targetPrice) <= 0)) {
      return 'Target price is required for limit orders';
    }
    return null;
  }, [form, asset]);

  const executeTrade = useCallback(async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (chainId !== dplabsTestnet.id) {
      try {
        await switchChain({ chainId: dplabsTestnet.id });
      } catch (error) {
        toast.error('Please switch to DPLabs Testnet');
        return;
      }
    }

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!asset?.id) {
      toast.error('Invalid asset');
      return;
    }

    setIsExecuting(true);

    try {
      const idx = asset.id;
      const isLong = form.side === 'buy';
      const lev = form.leverage;
      const sizeUsd = to6(form.sizeUsd);
      const sl = form.enableSlTp && form.sl ? to18(form.sl) : 0n;
      const tp = form.enableSlTp && form.tp ? to18(form.tp) : 0n;

      if (form.type === 'market') {
        // Fetch proof for market orders
        const proofResponse = await fetch(`https://proof.brokex.trade/proof?pairs=${idx}`);
        if (!proofResponse.ok) {
          throw new Error('Failed to fetch proof');
        }
        const { proof } = await proofResponse.json();
        
        (writeContract as any)({
          address: CORE_CONTRACT_ADDRESS,
          abi: CORE_ABI,
          functionName: 'openPosition',
          args: [BigInt(idx), proof as `0x${string}`, isLong, BigInt(lev), sizeUsd, sl, tp],
        });
      } else {
        // Limit orders
        const orderPrice = to18(form.targetPrice || '0');
        
        (writeContract as any)({
          address: CORE_CONTRACT_ADDRESS,
          abi: CORE_ABI,
          functionName: 'placeOrder',
          args: [BigInt(idx), isLong, BigInt(lev), orderPrice, sizeUsd, sl, tp],
        });
      }
    } catch (error) {
      toast.error('Transaction failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsExecuting(false);
    }
  }, [isConnected, chainId, switchChain, validateForm, form, asset, writeContract]);

  const handleSideClick = (side: Side) => {
    setForm(prev => ({ ...prev, side }));
    setIsFormExpanded(true);
  };

  if (!asset || !isTradeSheetOpen) return null;

  const formattedBalance = balance && decimals 
    ? formatBalance(balance, decimals) 
    : '0.00';

  return (
    <>
      {/* Overlay */}
      <div className="sheet-overlay" onClick={onClose} />
      
      {/* Sheet Content */}
      <div className={cn("sheet-content", isTradeSheetOpen && "open")}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{asset.pair}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatPrice(asset.price)}</span>
                <span>H: {formatPrice(asset.high24h)}</span>
                <span>L: {formatPrice(asset.low24h)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Chart */}
              <div>
                 {asset && (
                   <Chart 
                     pairId={asset.id} 
                     intervalSec={3600} 
                     theme={theme} 
                   />
                 )}
              </div>


              {/* Buy/Sell Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSideClick('buy')}
                  className="flex items-center justify-center gap-2 py-3 bg-long text-long-foreground rounded-xl font-medium hover:bg-long-hover transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Buy / Long
                </button>
                <button
                  onClick={() => handleSideClick('sell')}
                  className="flex items-center justify-center gap-2 py-3 bg-short text-short-foreground rounded-xl font-medium hover:bg-short-hover transition-colors"
                >
                  <TrendingDown className="w-4 h-4" />
                  Sell / Short
                </button>
              </div>

              {/* Trade Form */}
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isFormExpanded ? "max-h-[800px]" : "max-h-0"
                )}
              >
                <div className="space-y-4 pt-4 border-t border-border">
                  {/* Side Indicator */}
                  <div className={cn(
                    "p-3 rounded-lg text-center font-medium",
                    form.side === 'buy' 
                      ? "bg-long-muted text-long border-long/20 border"
                      : "bg-short-muted text-short border-short/20 border"
                  )}>
                    {form.side === 'buy' ? 'Long Position' : 'Short Position'}
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['market', 'limit'] as OrderType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setForm(prev => ({ ...prev, type }))}
                          className={cn(
                            "p-3 rounded-lg font-medium capitalize",
                            form.type === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Price (Limit only) */}
                  {form.type === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Target Price</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={form.targetPrice}
                        onChange={(e) => setForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                        className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Position Size */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Position Size (USD)</label>
                    <input
                      type="number"
                      min="10"
                      step="0.01"
                      value={form.sizeUsd}
                      onChange={(e) => setForm(prev => ({ ...prev, sizeUsd: e.target.value }))}
                      className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="10"
                    />
                  </div>

                  {/* Leverage */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Leverage: {form.leverage}×
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={form.leverage}
                      onChange={(e) => setForm(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1×</span>
                      <span>100×</span>
                    </div>
                  </div>

                  {/* SL/TP Toggle */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={form.enableSlTp}
                        onChange={(e) => setForm(prev => ({ ...prev, enableSlTp: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Enable Stop Loss / Take Profit</span>
                    </label>
                  </div>

                  {/* SL/TP Inputs */}
                  {form.enableSlTp && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Stop Loss</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={form.sl}
                          onChange={(e) => setForm(prev => ({ ...prev, sl: e.target.value }))}
                          className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Take Profit</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={form.tp}
                          onChange={(e) => setForm(prev => ({ ...prev, tp: e.target.value }))}
                          className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    onClick={executeTrade}
                    disabled={!isConnected || !form.sizeUsd || parseFloat(form.sizeUsd) < 10 || isExecuting || isPending || isConfirming}
                    className={cn(
                      "w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                      form.side === 'buy'
                        ? "bg-long text-long-foreground hover:bg-long-hover disabled:bg-long/50"
                        : "bg-short text-short-foreground hover:bg-short-hover disabled:bg-short/50",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    {isExecuting || isPending || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isConfirming ? 'Confirming...' : 'Executing...'}
                      </>
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : (
                      `Execute ${form.side === 'buy' ? 'Long' : 'Short'} Position`
                    )}
                  </button>
                </div>
              </div>

              {/* Wallet Info */}
              {address && (
                <div className="text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
                  <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>
                  <div>Balance: {formattedBalance} USD</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}