import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3 } from 'lucide-react';
import { ConnectWallet } from './ConnectWallet';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTradeSheetOpen } = useUIStore();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Markets'
    },
    {
      path: '/trading',
      icon: BarChart3,
      label: 'Trading'
    }
  ];

  if (isTradeSheetOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom pointer-events-none">
      <div className="mx-4 mb-4 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 pointer-events-auto">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-colors touch-target",
                    isActive 
                      ? "bg-black text-white" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          {/* Connect Wallet Button */}
          <div className="flex-shrink-0">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  );
}