import { EmailLayout } from '../components/EmailLayout';
import { EmailSection, EmailHeading, EmailParagraph } from '../components/EmailSection';
import { EmailButton } from '../components/EmailButton';

export interface WinBackData {
  customerFirstName: string;
  lastServiceDate: string;
  lastServiceType: string;
  monthsSinceService: number;
  seasonalMessage?: string;
  discountOffer?: string;
  trackingPhoneNumber?: string;
}

export function WinBackEmail(data: WinBackData) {
  const {
    customerFirstName,
    lastServiceDate,
    lastServiceType,
    monthsSinceService,
    seasonalMessage,
    discountOffer,
    trackingPhoneNumber = '(512) 355-0584',
  } = data;

  const preview = `${customerFirstName}, it's been ${monthsSinceService} months since your last service${discountOffer ? ' - Special offer inside!' : ''}`;

  return (
    <EmailLayout preview={preview}>
      <EmailSection>
        <EmailHeading>We Miss You, {customerFirstName}!</EmailHeading>
        <EmailParagraph>
          It's been <strong>{monthsSinceService} months</strong> since your last service with us (
          {lastServiceType} on {lastServiceDate}), and we wanted to check in.
        </EmailParagraph>

        {seasonalMessage && (
          <EmailParagraph>
            <strong>{seasonalMessage}</strong>
          </EmailParagraph>
        )}

        <EmailParagraph>
          Regular maintenance helps prevent costly emergencies and keeps your plumbing system
          running smoothly year-round.
        </EmailParagraph>

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
              <EmailHeading level={2}>Welcome Back Offer</EmailHeading>
              <EmailParagraph>
                <strong style={{ fontSize: '20px', color: '#1e40af' }}>{discountOffer}</strong>
              </EmailParagraph>
              <EmailParagraph>
                <em>Because we value your business</em>
              </EmailParagraph>
            </div>
          </EmailSection>
        )}

        <EmailHeading level={3}>Why Choose Economy Plumbing?</EmailHeading>
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151', margin: '0 0 16px 24px' }}>
          <li>Licensed & insured professionals</li>
          <li>24/7 emergency service available</li>
          <li>Upfront pricing, no hidden fees</li>
          <li>Serving Austin & Marble Falls for years</li>
        </ul>

        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <EmailButton href={`tel:${trackingPhoneNumber}`}>
            Call Now: {trackingPhoneNumber}
          </EmailButton>
        </div>

        <EmailParagraph>
          We look forward to serving you again!
        </EmailParagraph>
      </EmailSection>
    </EmailLayout>
  );
}
