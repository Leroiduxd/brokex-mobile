import { create } from 'zustand';
import type { Asset } from '@/types/trading';

interface UIState {
  // Global loading
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Trade sheet
  isTradeSheetOpen: boolean;
  selectedAsset: Asset | null;
  openTradeSheet: (asset: Asset) => void;
  closeTradeSheet: () => void;
  
  // Body scroll lock
  isBodyScrollLocked: boolean;
  lockBodyScroll: () => void;
  unlockBodyScroll: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isGlobalLoading: true,
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  
  isTradeSheetOpen: false,
  selectedAsset: null,
  openTradeSheet: (asset) => {
    set({ 
      isTradeSheetOpen: true, 
      selectedAsset: asset 
    });
    get().lockBodyScroll();
  },
  closeTradeSheet: () => {
    set({ 
      isTradeSheetOpen: false, 
      selectedAsset: null 
    });
    get().unlockBodyScroll();
  },
  
  isBodyScrollLocked: false,
  lockBodyScroll: () => {
    document.body.classList.add('body-scroll-locked');
    set({ isBodyScrollLocked: true });
  },
  unlockBodyScroll: () => {
    document.body.classList.remove('body-scroll-locked');
    set({ isBodyScrollLocked: false });
  }
}));