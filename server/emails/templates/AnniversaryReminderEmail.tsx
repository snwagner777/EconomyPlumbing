import { EmailLayout } from '../components/EmailLayout';
import { EmailSection, EmailHeading, EmailParagraph } from '../components/EmailSection';
import { EmailButton } from '../components/EmailButton';
import { Text } from '@react-email/components';

export interface AnniversaryReminderData {
  customerFirstName: string;
  serviceType: string; // e.g., "water heater installation", "drain cleaning"
  serviceDate: string;
  anniversaryYears: number;
  maintenanceTip: string;
  discountOffer?: string;
  trackingPhoneNumber?: string;
}

export function AnniversaryReminderEmail(data: AnniversaryReminderData) {
  const {
    customerFirstName,
    serviceType,
    serviceDate,
    anniversaryYears,
    maintenanceTip,
    discountOffer,
    trackingPhoneNumber = '(512) 355-0584',
  } = data;

  const preview = `${customerFirstName}, it's been ${anniversaryYears} year${anniversaryYears > 1 ? 's' : ''} since your ${serviceType}`;

  return (
    <EmailLayout preview={preview}>
      <EmailSection>
        <EmailHeading>Hi {customerFirstName},</EmailHeading>
        <EmailParagraph>
          Time flies! It's been <strong>{anniversaryYears} year{anniversaryYears > 1 ? 's' : ''}</strong>{' '}
          since your <strong>{serviceType}</strong> on {serviceDate}.
        </EmailParagraph>

        <EmailParagraph>
          We wanted to check in and remind you that regular maintenance can extend the life of
          your plumbing system and prevent unexpected issues.
        </EmailParagraph>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <Text style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
            Maintenance Tip
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151', margin: 0 }}>
            {maintenanceTip}
          </Text>
        </div>

        {discountOffer && (
          <EmailSection spacing="tight">
            <div
              style={{
                backgroundColor: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center' as const,
              }}
            >
              <EmailHeading level={2}>Anniversary Special</EmailHeading>
              <EmailParagraph>
                <strong style={{ fontSize: '20px', color: '#1e40af' }}>{discountOffer}</strong>
              </EmailParagraph>
              <EmailParagraph>
                <em>Because you've been a great customer!</em>
              </EmailParagraph>
            </div>
          </EmailSection>
        )}

        <EmailParagraph>
          Whether it's time for a checkup, you have questions, or you need service on something
          else entirely, we're here to help.
        </EmailParagraph>

        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <EmailButton href={`tel:${trackingPhoneNumber}`}>
            Call Now: {trackingPhoneNumber}
          </EmailButton>
        </div>

        <EmailParagraph>
          Thank you for being a valued customer!
        </EmailParagraph>
      </EmailSection>
    </EmailLayout>
  );
}
