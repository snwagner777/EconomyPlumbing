import type { Metadata } from 'next';
import { ScheduleAppointmentClient } from './ScheduleAppointmentClient';

export const metadata: Metadata = {
  title: 'Schedule Your Appointment | Economy Plumbing Services',
  description: 'Book your plumbing service online with Economy Plumbing Services. Choose your preferred date and time, and we\'ll take care of the rest.',
};

export default async function ScheduleAppointment({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Capture UTM parameters for campaign tracking (server-side for SEO)
  const utmSource = (params.utm_source as string) || 
                    (params.source as string) || 
                    'website';
  const utmMedium = params.utm_medium as string | undefined;
  const utmCampaign = params.utm_campaign as string | undefined;
  
  // Capture referral code for pre-filling and automatic discount
  const referralCode = params.referral as string | undefined;
  
  // Capture customer ID for pre-filling (will fetch details server-side for security)
  const prefilledCustomerId = params.customerId 
    ? parseInt(params.customerId as string) 
    : undefined;
  
  return (
    <ScheduleAppointmentClient
      utmSource={utmSource}
      utmMedium={utmMedium}
      utmCampaign={utmCampaign}
      referralCode={referralCode}
      prefilledCustomerId={prefilledCustomerId}
    />
  );
}
