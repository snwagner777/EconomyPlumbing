import { EmailLayout } from '../components/EmailLayout';
import { EmailSection, EmailHeading, EmailParagraph } from '../components/EmailSection';
import { EmailButton } from '../components/EmailButton';
import { Text } from '@react-email/components';

export interface TechnicianConcernData {
  customerFirstName: string;
  technicianName: string;
  technicianNote: string;
  serviceDate: string;
  concernType: string; // e.g., "aging water heater", "corroded pipes", etc.
  recommendedAction: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  discountOffer?: string;
  trackingPhoneNumber?: string;
}

export function TechnicianConcernEmail(data: TechnicianConcernData) {
  const {
    customerFirstName,
    technicianName,
    technicianNote,
    serviceDate,
    concernType,
    recommendedAction,
    urgencyLevel,
    discountOffer,
    trackingPhoneNumber = '(512) 355-0584',
  } = data;

  const urgencyColors = {
    low: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    medium: { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' },
    high: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' },
  };

  const urgencyLabels = {
    low: 'Recommended Maintenance',
    medium: 'Important Notice',
    high: 'Urgent Attention Needed',
  };

  const colors = urgencyColors[urgencyLevel];
  const label = urgencyLabels[urgencyLevel];

  const preview = `${customerFirstName}, ${technicianName} noticed something important about your ${concernType}`;

  return (
    <EmailLayout preview={preview}>
      <EmailSection>
        <div
          style={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <Text style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            {label}
          </Text>
        </div>

        <EmailHeading>Hi {customerFirstName},</EmailHeading>
        <EmailParagraph>
          During your recent service on {serviceDate}, {technicianName} noticed something about
          your <strong>{concernType}</strong> that we wanted to bring to your attention.
        </EmailParagraph>

        <div
          style={{
            backgroundColor: '#f3f4f6',
            borderLeft: '4px solid #3b82f6',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151', margin: 0 }}>
            <strong>Technician's Note:</strong>
            <br />
            <em>"{technicianNote}"</em>
          </Text>
        </div>

        <EmailHeading level={3}>Our Recommendation</EmailHeading>
        <EmailParagraph>{recommendedAction}</EmailParagraph>

        {urgencyLevel === 'high' && (
          <EmailParagraph>
            <strong style={{ color: '#dc2626' }}>
              We recommend addressing this soon to avoid potential emergencies or costly repairs.
            </strong>
          </EmailParagraph>
        )}

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
              <EmailHeading level={2}>Special Offer</EmailHeading>
              <EmailParagraph>
                <strong style={{ fontSize: '20px', color: '#1e40af' }}>{discountOffer}</strong>
              </EmailParagraph>
              <EmailParagraph>
                <em>To help you take care of this concern</em>
              </EmailParagraph>
            </div>
          </EmailSection>
        )}

        <EmailParagraph>
          We're here to answer any questions and help you make the best decision for your home.
        </EmailParagraph>

        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <EmailButton href={`tel:${trackingPhoneNumber}`}>
            Call Now: {trackingPhoneNumber}
          </EmailButton>
        </div>

        <EmailParagraph>
          Thank you for trusting Economy Plumbing with your home!
        </EmailParagraph>
      </EmailSection>
    </EmailLayout>
  );
}
