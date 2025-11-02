import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Winter Freeze Protection | Prevent Frozen Pipes Austin TX',
  description: 'Protect your Austin home from frozen pipes. Free winter plumbing checklist, freeze prevention tips, and emergency service. Call (512) 368-9159.',
  openGraph: {
    title: 'Winter Freeze Protection - Prevent Frozen Pipes',
    description: 'Protect your home from frozen pipes with our winter plumbing checklist',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
