import type { Metadata } from 'next';
import { ReferralOfferClient } from './ReferralOfferClient';

export const metadata: Metadata = {
  title: 'Referral Offer | Economy Plumbing Services',
  description: 'Claim your $25 referral discount on your first plumbing service.',
};

export default async function ReferralOffer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const referralCode = params.code as string | undefined;

  return <ReferralOfferClient referralCode={referralCode} />;
}
