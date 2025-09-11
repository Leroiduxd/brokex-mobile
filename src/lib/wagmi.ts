import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { dplabsTestnet } from './chain';

export const wagmiConfig = getDefaultConfig({
  appName: 'Brokex Protocol',
  projectId: 'brokex-protocol-app',
  chains: [dplabsTestnet],
  transports: {
    [dplabsTestnet.id]: http('https://testnet.dplabs-internal.com')
  }
});