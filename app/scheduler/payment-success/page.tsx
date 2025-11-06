/**
 * Backflow Payment Success Page
 * 
 * Handles the Stripe checkout return, completes the booking with payment info.
 */

import type { Metadata } from 'next';
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
