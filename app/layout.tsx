'use client';

import type { ReactNode } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PhoneConfigProvider } from '@/contexts/PhoneConfigProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          <PhoneConfigProvider>
            {children}
            <Toaster />
          </PhoneConfigProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
