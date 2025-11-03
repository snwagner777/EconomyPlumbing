import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule Appointment | Economy Plumbing Services',
  description: 'Schedule your plumbing service appointment',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ScheduleAppointmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
