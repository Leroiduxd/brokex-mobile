export type Asset = {
  id: number | null;
  pair: string;
  name: string;
  price: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  timestamp?: string;
};

export type WssMessage = Record<string, {
  id?: number;
  name?: string;
  instruments?: Array<{
    tradingPair: string;
    currentPrice: string | number;
    "24h_change": string | number;
    "24h_high": string | number;
    "24h_low": string | number;
    timestamp?: string;
  }>;
}>;

export type CandleRow = {
  time: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export type Ohlc = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type LinePoint = {
  time: number;
  value: number;
};

export type OrderType = 'market' | 'limit';
export type Side = 'buy' | 'sell';

export interface OrderFormState {
  side: Side;
  type: OrderType;
  sizeUsd: string;
  leverage: number;
  enableSlTp: boolean;
  sl?: string;
  tp?: string;
  targetPrice?: string;
}

export type Theme = 'dark' | 'light';

export interface ProofResponse {
  proof: string;
}

// Trading dashboard types
export interface OpenPosition {
  trader: string;
  id: bigint;
  assetIndex: bigint;
  isLong: boolean;
  leverage: bigint;
  openPrice: bigint;
  sizeUsd: bigint;
  timestamp: bigint;
  slBucketId: bigint;
  tpBucketId: bigint;
  liqBucketId: bigint;
  stopLossPrice: bigint;
  takeProfitPrice: bigint;
  liquidationPrice: bigint;
}

export interface OpenOrder {
  trader: string;
  id: bigint;
  assetIndex: bigint;
  isLong: boolean;
  leverage: bigint;
  orderPrice: bigint;
  sizeUsd: bigint;
  timestamp: bigint;
  stopLoss: bigint;
  takeProfit: bigint;
  limitBucketId: bigint;
}

export interface ClosedPosition {
  assetIndex: bigint;
  isLong: boolean;
  leverage: bigint;
  openPrice: bigint;
  closePrice: bigint;
  sizeUsd: bigint;
  openTimestamp: bigint;
  closeTimestamp: bigint;
  pnl: bigint;
}

export type TabType = 'positions' | 'orders' | 'closed';