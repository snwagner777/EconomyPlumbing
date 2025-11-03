import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SMS Sign Up | Economy Plumbing Services',
  description: 'Sign up for SMS notifications',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SmsSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
