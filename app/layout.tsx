import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Economy Plumbing Services - Austin & Marble Falls',
  description: 'Professional plumbing services in Austin, Cedar Park, Round Rock, Georgetown, Marble Falls, and surrounding areas. 24/7 emergency service available.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
