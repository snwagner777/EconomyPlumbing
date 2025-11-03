import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Link | Economy Plumbing Services',
  description: 'Referral tracking page',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
