import { parseUnits } from 'viem';

// Core contract address
export const CORE_CONTRACT_ADDRESS = '0x34f89ca5a1c6dc4eb67dfe0af5b621185df32854' as const;

// USD Token address
export const USD_TOKEN_ADDRESS = '0x78ac5e2d8a78a8b8e6d10c7b7274b03c10c91cef' as const;

// Core contract ABI (exact from specs)
export const CORE_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "idx", "type": "uint256"},
      {"internalType": "bool", "name": "isLong", "type": "bool"},
      {"internalType": "uint256", "name": "lev", "type": "uint256"},
      {"internalType": "uint256", "name": "orderPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "sizeUsd", "type": "uint256"},
      {"internalType": "uint256", "name": "sl", "type": "uint256"},
      {"internalType": "uint256", "name": "tp", "type": "uint256"}
    ],
    "name": "placeOrder",
    "outputs": [{"internalType": "uint256", "name": "orderId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "idx", "type": "uint256"},
      {"internalType": "bytes", "name": "proof", "type": "bytes"},
      {"internalType": "bool", "name": "isLong", "type": "bool"},
      {"internalType": "uint256", "name": "lev", "type": "uint256"},
      {"internalType": "uint256", "name": "sizeUsd", "type": "uint256"},
      {"internalType": "uint256", "name": "slPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "tpPrice", "type": "uint256"}
    ],
    "name": "openPosition",
    "outputs": [{"internalType": "uint256", "name": "openId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// ERC-20 ABI
export const ERC20_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Utility functions for unit conversion
export const to6 = (x: string) => parseUnits(x || '0', 6);
export const to18 = (x: string) => parseUnits(x || '0', 18);

// Format price with dynamic decimals
export const formatPrice = (price: number): string => {
  if (price <= 1) return price.toFixed(6);
  if (price < 10) return price.toFixed(4);
  return price.toFixed(2);
};

// Format percentage
export const formatPercentage = (pct: number): string => {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
};

// Format balance
export const formatBalance = (balance: bigint, decimals: number): string => {
  const formatted = Number(balance) / Math.pow(10, decimals);
  return formatted.toFixed(2);
};