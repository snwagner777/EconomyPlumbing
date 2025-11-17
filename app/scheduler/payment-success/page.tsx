/**
 * DISABLED: Backflow Payment Success Page
 * 
 * Payment integrations have been removed from the scheduler.
 * This page redirects to schedule-appointment.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Payment Not Available | Economy Plumbing Services',
  description: 'Payment integration has been disabled.',
};

export default async function PaymentSuccessPage() {
  // Redirect to schedule appointment page
  redirect('/schedule-appointment');
}

/* PAYMENT INTEGRATION DISABLED - Original code commented out

import { PaymentSuccessClient } from './PaymentSuccessClient';

export const metadata: Metadata = {
  title: 'Payment Success | Economy Plumbing Services',
  description: 'Your payment has been successfully processed.',
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id as string | undefined;

  return <PaymentSuccessClient sessionId={sessionId} />;
}

*/
