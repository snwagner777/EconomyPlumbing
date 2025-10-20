import { EmailLayout } from '../components/EmailLayout';
import { EmailSection, EmailHeading, EmailParagraph } from '../components/EmailSection';
import { EmailButton } from '../components/EmailButton';

export interface UnsoldEstimateData {
  customerFirstName: string;
  estimateTotal: string;
  estimateDate: string;
  jobDescription: string;
  technicianNotes?: string;
  equipmentAge?: string;
  discountOffer?: string;
  trackingPhoneNumber?: string;
}

export function UnsoldEstimateEmail(data: UnsoldEstimateData) {
  const {
    customerFirstName,
    estimateTotal,
    estimateDate,
    jobDescription,
    technicianNotes,
    equipmentAge,
    discountOffer,
    trackingPhoneNumber = '(512) 355-0584',
  } = data;

  const preview = `${customerFirstName}, still thinking about that ${jobDescription}?${discountOffer ? ` Special offer inside!` : ''}`;

  return (
    <EmailLayout preview={preview}>
      <EmailSection>
        <EmailHeading>Hi {customerFirstName},</EmailHeading>
        <EmailParagraph>
          We wanted to follow up on the <strong>{estimateTotal}</strong> estimate we provided for
          your <strong>{jobDescription}</strong> on {estimateDate}.
        </EmailParagraph>

        {technicianNotes && (
          <EmailParagraph>
            Your technician noted: <em>"{technicianNotes}"</em>
          </EmailParagraph>
        )}

        {equipmentAge && (
          <EmailParagraph>
            With your equipment being {equipmentAge} old, now is a great time to take care of this
            before it becomes an emergency.
          </EmailParagraph>
        )}

        {discountOffer && (
          <EmailSection spacing="tight">
            <div
              style={{
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center' as const,
              }}
            >
              <EmailHeading level={2}>Special Offer</EmailHeading>
              <EmailParagraph>
                <strong style={{ fontSize: '20px', color: '#d97706' }}>{discountOffer}</strong>
              </EmailParagraph>
              <EmailParagraph>
                <em>Limited time only - expires in 7 days</em>
              </EmailParagraph>
            </div>
          </EmailSection>
        )}

        <EmailParagraph>
          We understand choosing the right plumbing service is important. If you have any
          questions or would like to move forward, we're here to help.
        </EmailParagraph>

        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <EmailButton href={`tel:${trackingPhoneNumber}`}>
            Call Now: {trackingPhoneNumber}
          </EmailButton>
        </div>

        <EmailParagraph>
          Or schedule online at{' '}
          <a href="https://economyplumbing.com/schedule" style={{ color: '#3b82f6' }}>
            economyplumbing.com/schedule
          </a>
        </EmailParagraph>
      </EmailSection>
    </EmailLayout>
  );
}
