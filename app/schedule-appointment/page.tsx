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
  
  // Capture referral code for pre-filling and automatic discount
  const referralCode = params.referral as string | undefined;
  
  // Capture UTM parameters for campaign tracking (server-side for SEO)
  // Default to 'referral' if referral token exists but no utm_source provided
  const utmSource = (params.utm_source as string) || 
                    (params.source as string) || 
                    (referralCode ? 'referral' : 'website');
  const utmMedium = params.utm_medium as string | undefined;
  const utmCampaign = params.utm_campaign as string | undefined;
  
  // Capture customer ID for pre-filling (will fetch details server-side for security)
  const prefilledCustomerId = params.customerId 
    ? parseInt(params.customerId as string) 
    : undefined;
  
  // Capture referral prefill data (name, phone, email) for form prefilling
  let initialCustomerData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  } | undefined = undefined;
  
  if (referralCode && (params.name || params.phone || params.email)) {
    // Sanitize and normalize referral data
    const fullName = (params.name as string)?.trim() || '';
    let phone = (params.phone as string)?.replace(/\D/g, '') || ''; // digits only
    const email = (params.email as string)?.trim() || '';
    
    // Normalize phone to 10 digits (strip leading country code "1" if present)
    if (phone.length === 11 && phone.startsWith('1')) {
      phone = phone.substring(1);
    }
    
    // Split full name into first/last
    // Simple approach: everything before first space is first name, rest is last name
    let firstName = '';
    let lastName = '';
    if (fullName) {
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    initialCustomerData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && phone.length === 10 && { phone }), // Only prefill if exactly 10 digits
      ...(email && { email }),
    };
  }
  
  return (
    <ScheduleAppointmentClient
      utmSource={utmSource}
      utmMedium={utmMedium}
      utmCampaign={utmCampaign}
      referralCode={referralCode}
      prefilledCustomerId={prefilledCustomerId}
      initialCustomerData={initialCustomerData}
    />
  );
}
