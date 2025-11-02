import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Building Plumbing Services Austin TX | Commercial Experts',
  description: 'Professional office building plumbing in Austin. Multi-floor systems, restroom facilities, emergency response. Keep your tenants comfortable and productive!',
  openGraph: {
    title: 'Office Building Plumbing Services Austin TX',
    description: 'Professional office building plumbing. Multi-floor systems, emergency response.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
