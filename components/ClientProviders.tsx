'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { PhoneConfigProvider } from '@/contexts/PhoneConfigProvider';
import { Toaster } from '@/components/ui/toaster';

const AIChatbot = dynamic(() => import('@/components/AIChatbot'), {
  ssr: false,
});

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PhoneConfigProvider>
        {children}
        <AIChatbot />
        <Toaster />
      </PhoneConfigProvider>
    </QueryClientProvider>
  );
}
