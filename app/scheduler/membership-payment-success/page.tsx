import type { Metadata } from 'next';
import { MembershipPaymentSuccessClient } from './MembershipPaymentSuccessClient';

export const metadata: Metadata = {
  title: 'Membership Purchase Complete | Economy Plumbing Services',
  description: 'Your VIP membership has been successfully purchased.',
};

export default async function MembershipPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id as string | undefined;

  return <MembershipPaymentSuccessClient sessionId={sessionId} />;
}
