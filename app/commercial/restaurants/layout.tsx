import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant Plumbing Services Austin TX | Commercial Kitchen Experts',
  description: 'Expert restaurant plumbing for Austin kitchens. Grease traps, emergency drain clearing, commercial water heaters, gas lines. 24/7 service. Health inspection ready!',
  openGraph: {
    title: 'Restaurant Plumbing Services Austin TX',
    description: 'Expert restaurant plumbing. Grease traps, emergency drain clearing, 24/7 service.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
