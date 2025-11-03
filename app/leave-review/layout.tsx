import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave a Review | Economy Plumbing Services',
  description: 'Share your experience with Economy Plumbing Services',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LeaveReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
