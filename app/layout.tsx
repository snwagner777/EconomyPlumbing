import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PhoneConfigProvider } from '@/contexts/PhoneConfigProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ClerkProvider } from '@clerk/nextjs';

const AIChatbot = dynamic(() => import('@/components/AIChatbot'), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          <QueryClientProvider client={queryClient}>
            <PhoneConfigProvider>
              {children}
              <AIChatbot />
              <Toaster />
            </PhoneConfigProvider>
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
