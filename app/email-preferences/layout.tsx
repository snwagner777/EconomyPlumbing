import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Preferences | Economy Plumbing Services',
  description: 'Manage your email communication preferences',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function EmailPreferencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
