import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import { PhoneConfigProvider } from '@/providers/PhoneConfigProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://plumbersthatcare.com'),
  title: {
    template: '%s | Economy Plumbing Services',
    default: 'Economy Plumbing Services - Professional Plumbers in Austin & Central Texas',
  },
  description: 'Expert plumbing services in Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Marble Falls, and surrounding areas. 24/7 emergency service, licensed and insured.',
  keywords: ['plumber', 'plumbing services', 'Austin plumber', 'Cedar Park plumber', 'emergency plumbing', 'water heater repair', 'drain cleaning', 'leak repair'],
  authors: [{ name: 'Economy Plumbing Services' }],
  creator: 'Economy Plumbing Services',
  publisher: 'Economy Plumbing Services',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Economy Plumbing Services',
    images: [
      {
        url: '/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg',
        width: 1200,
        height: 630,
        alt: 'Economy Plumbing Services - Professional Plumbers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@plumbersthatcare',
    creator: '@plumbersthatcare',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Core Web Vitals: Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* DNS Prefetch for analytics and tracking */}
        <link rel="dns-prefetch" href="https://www.facebook.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PhoneConfigProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </PhoneConfigProvider>
      </body>
    </html>
  );
}
