import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { wagmiConfig } from "./lib/wagmi";
import { dplabsTestnet } from "./lib/chain";
import { GlobalLoader } from "./components/GlobalLoader";
import { NotificationSystem } from "./components/NotificationSystem";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TradingDashboard } from "./pages/TradingDashboard";

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider 
        initialChain={dplabsTestnet}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationSystem />
          <GlobalLoader />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/trading" element={<TradingDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
