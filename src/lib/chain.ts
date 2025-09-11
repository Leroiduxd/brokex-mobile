import { defineChain } from 'viem';

export const dplabsTestnet = defineChain({
  id: 688688,
  name: 'DPLabs Testnet',
  nativeCurrency: { 
    name: 'Testnet Ether', 
    symbol: 'tETH', 
    decimals: 18 
  },
  rpcUrls: { 
    default: { 
      http: ['https://testnet.dplabs-internal.com'] 
    } 
  },
  blockExplorers: {
    default: { 
      name: 'DPLabs Explorer',
      url: 'https://explorer.dplabs-internal.com'
    }
  }
});