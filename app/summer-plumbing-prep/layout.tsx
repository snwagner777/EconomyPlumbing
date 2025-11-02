import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Summer Plumbing Prep Checklist | Economy Plumbing Services Austin',
  description: 'Prepare your plumbing for summer in Austin. AC drain lines, sprinklers, water heaters. Get your free summer plumbing checklist!',
  openGraph: {
    title: 'Summer Plumbing Prep Checklist',
    description: 'Prepare your plumbing for summer with this essential checklist',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
