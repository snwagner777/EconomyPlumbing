import type { ReactNode } from 'react';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ClientProviders } from '@/components/ClientProviders';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ClientProviders>
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
