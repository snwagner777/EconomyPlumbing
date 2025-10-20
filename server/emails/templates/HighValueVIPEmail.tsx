import { EmailLayout } from '../components/EmailLayout';
import { EmailSection, EmailHeading, EmailParagraph } from '../components/EmailSection';
import { EmailButton } from '../components/EmailButton';
import { Text } from '@react-email/components';

export interface HighValueVIPData {
  customerFirstName: string;
  lifetimeValue: string;
  yearsAsCustomer: number;
  totalJobs: number;
  exclusiveOffer?: string;
  vipPerks?: string[];
  trackingPhoneNumber?: string;
}

export function HighValueVIPEmail(data: HighValueVIPData) {
  const {
    customerFirstName,
    lifetimeValue,
    yearsAsCustomer,
    totalJobs,
    exclusiveOffer,
    vipPerks = [
      'Priority scheduling',
      'Extended warranty on all work',
      'Exclusive discounts on future services',
      'Dedicated VIP support line',
    ],
    trackingPhoneNumber = '(512) 355-0584',
  } = data;

  const preview = `${customerFirstName}, thank you for being a valued customer for ${yearsAsCustomer} years!`;

  return (
    <EmailLayout preview={preview}>
      <EmailSection>
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '3px solid #f59e0b',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center' as const,
            marginBottom: '24px',
          }}
        >
          <EmailHeading level={1}>VIP Customer Appreciation</EmailHeading>
        </div>

        <EmailHeading>Dear {customerFirstName},</EmailHeading>
        <EmailParagraph>
          We wanted to take a moment to thank you for being such a loyal customer. Over the past{' '}
          <strong>{yearsAsCustomer} years</strong>, you've trusted us with <strong>{totalJobs}</strong>{' '}
          service calls totaling <strong>{lifetimeValue}</strong>.
        </EmailParagraph>

        <EmailParagraph>
          That kind of trust means everything to us, and we don't take it for granted.
        </EmailParagraph>

        {exclusiveOffer && (
          <EmailSection spacing="tight">
            <div
              style={{
                backgroundColor: '#1e40af',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center' as const,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                Exclusive VIP Offer
              </Text>
              <Text style={{ color: '#fbbf24', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                {exclusiveOffer}
              </Text>
            </div>
          </EmailSection>
        )}

        <EmailHeading level={3}>Your VIP Benefits Include:</EmailHeading>
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151', margin: '0 0 16px 24px' }}>
          {vipPerks.map((perk, index) => (
            <li key={index}>{perk}</li>
          ))}
        </ul>

        <EmailParagraph>
          If there's anything we can do to improve your experience or if you have any plumbing
          needs, please don't hesitate to reach out.
        </EmailParagraph>

        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <EmailButton href={`tel:${trackingPhoneNumber}`}>
            Call Your VIP Line: {trackingPhoneNumber}
          </EmailButton>
        </div>

        <EmailParagraph>
          Thank you for being part of the Economy Plumbing family!
        </EmailParagraph>
      </EmailSection>
    </EmailLayout>
  );
}
