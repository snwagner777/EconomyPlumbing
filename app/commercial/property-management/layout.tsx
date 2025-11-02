import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property Management Plumbing Services Austin TX | Multi-Unit Experts',
  description: 'Expert plumbing for Austin property managers. Multi-property service plans, 24/7 tenant support, preventive maintenance. Reduce costs and keep tenants happy!',
  openGraph: {
    title: 'Property Management Plumbing Services Austin TX',
    description: 'Expert plumbing for property managers. Multi-property plans, 24/7 tenant support.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
