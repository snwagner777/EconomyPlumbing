import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Request | Economy Plumbing Services',
  description: 'Review request landing page',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ReviewRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
