import { useUIStore } from '@/store/ui';

export function GlobalLoader() {
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);

  if (!isGlobalLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-foreground border-t-transparent"></div>
        <p className="text-lg font-medium text-primary-foreground">Loading Market Data...</p>
      </div>
    </div>
  );
}