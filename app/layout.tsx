import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '../client/src/components/ui/toaster';
import { TooltipProvider } from '../client/src/components/ui/tooltip';
import { Providers } from './providers';
import { ServiceTitanScript } from './components/ServiceTitanScript';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.plumbersthatcare.com'),
  title: {
    default: 'Economy Plumbing Services | Austin Plumbing Experts',
    template: '%s | Economy Plumbing Services',
  },
  description: 'Professional plumbing services in Austin, TX. 24/7 emergency service, water heaters, drain cleaning, leak repair, and more. Licensed, insured, and locally owned.',
  keywords: ['plumbing Austin TX', 'emergency plumber Austin', 'water heater repair Austin', 'drain cleaning Austin', 'leak repair Austin'],
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
    url: 'https://www.plumbersthatcare.com',
    siteName: 'Economy Plumbing Services',
    title: 'Economy Plumbing Services | Austin Plumbing Experts',
    description: 'Professional plumbing services in Austin, TX. 24/7 emergency service, licensed & insured.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Economy Plumbing Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economy Plumbing Services | Austin Plumbing Experts',
    description: 'Professional plumbing services in Austin, TX. 24/7 emergency service.',
    images: ['/og-image.jpg'],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
        <ServiceTitanScript />
      </body>
    </html>
  );
}
