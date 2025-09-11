'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

export function NotificationSystem() {
  const { theme } = useTheme();

  return (
    <Toaster 
      theme={theme}
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px'
        }
      }}
      richColors
    />
  );
}