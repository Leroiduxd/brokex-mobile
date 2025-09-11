import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, ChevronDown, LogOut, Copy } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full hover:bg-muted transition-colors touch-target"
        >
          <div className="w-2 h-2 bg-long rounded-full" />
          <span className="text-sm font-medium">{formatAddress(address)}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-white/30 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)}
            />
            <div className="relative bg-card border border-border rounded-xl shadow-lg max-w-sm w-full mx-4">
              <div className="p-4 border-b border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Connected Wallet</div>
                <div className="text-lg font-semibold mt-1">{formatAddress(address)}</div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted rounded-full transition-colors touch-target"
                >
                  <Copy className="w-4 h-4" />
                  <span className="font-medium">Copy Address</span>
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-muted rounded-full transition-colors touch-target"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Disconnect</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium touch-target"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-white/30 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-xl shadow-lg max-w-sm w-full mx-4">
            <div className="p-4 border-b border-border">
              <div className="text-lg font-semibold mb-1">Connect a Wallet</div>
              <div className="text-sm text-muted-foreground">Choose your preferred wallet to connect</div>
            </div>
            <div className="p-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted rounded-full transition-colors text-left touch-target"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{connector.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}