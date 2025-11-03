import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe | Email Preferences',
  description: 'Manage your email subscription preferences',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
