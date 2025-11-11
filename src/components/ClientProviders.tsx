'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { PhoneConfigProvider } from '@/contexts/PhoneConfigProvider';
import { SchedulerProvider } from '@/contexts/SchedulerContext';
import { Toaster } from '@/components/ui/toaster';
import { SchedulerBridge } from '@/modules/scheduler/components/SchedulerBridge';

const AIChatbot = dynamic(() => import('@/components/AIChatbot'), {
  ssr: false,
});

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PhoneConfigProvider>
        <SchedulerProvider>
          {children}
          <AIChatbot />
          <SchedulerBridge />
          <Toaster />
        </SchedulerProvider>
      </PhoneConfigProvider>
    </QueryClientProvider>
  );
}
