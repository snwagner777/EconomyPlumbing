import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retail Store Plumbing Services Austin TX | Minimize Downtime',
  description: 'Expert retail plumbing for Austin stores. Customer restroom maintenance, emergency repairs, ADA compliance. Keep your store open and customers happy!',
  openGraph: {
    title: 'Retail Store Plumbing Services Austin TX',
    description: 'Expert retail plumbing. Restroom maintenance, emergency repairs, ADA compliance.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
