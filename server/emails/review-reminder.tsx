import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface ReviewReminderEmailProps {
  customerName: string;
  firstName?: string;
  technicianName?: string;
  jobType?: string;
  reviewUrl: string;
  googleReviewUrl?: string;
  sequenceNumber: number; // 2, 3, 4, etc.
}

export default function ReviewReminderEmail({
  customerName = 'Valued Customer',
  firstName,
  technicianName = 'our team',
  jobType = 'plumbing service',
  reviewUrl,
  googleReviewUrl,
  sequenceNumber = 2,
}: ReviewReminderEmailProps) {
  const displayName = firstName || customerName;

  // Vary the messaging based on sequence number
  const getSubjectVariation = () => {
    if (sequenceNumber === 2) {
      return {
        greeting: `Quick reminder, ${displayName}`,
        message: `Just wanted to check in about your recent ${jobType}. If you have 60 seconds, we'd love to hear how ${technicianName} did!`,
      };
    } else if (sequenceNumber === 3) {
      return {
        greeting: `${displayName}, still have a minute?`,
        message: `We know life gets busy! If you could spare a quick moment to share your experience, it would mean the world to us.`,
      };
    } else {
      return {
        greeting: `Last friendly reminder, ${displayName}`,
        message: `No pressure at all — but if you have a moment to leave a quick review about your ${jobType}, we'd be so grateful!`,
      };
    }
  };

  const variation = getSubjectVariation();

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            {/* Header */}
            <Text style={heading}>
              {variation.greeting}
            </Text>

            {/* Main Message */}
            <Text style={paragraph}>
              {variation.message}
            </Text>

            <Text style={paragraph}>
              Your feedback helps local families find trustworthy plumbing help. Takes just 60 seconds!
            </Text>

            {/* CTA Buttons */}
            <Section style={buttonContainer}>
              {googleReviewUrl && (
                <Link href={googleReviewUrl} style={button}>
                  ⭐ Leave a Google review
                </Link>
              )}
              <Link href={reviewUrl} style={buttonSecondary}>
                💬 Review on our website
              </Link>
            </Section>

            <Text style={paragraphSmall}>
              Click above to share your experience
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              Thanks so much!<br />
              — Economy Plumbing
            </Text>

            <Text style={footerSmall}>
              Don't want reminders?{' '}
              <Link href={reviewUrl + '/unsubscribe'} style={link}>
                Unsubscribe here
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (same as review-request.tsx)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  fontSize: '26px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  marginBottom: '16px',
  lineHeight: '1.3',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#484848',
  marginBottom: '16px',
};

const paragraphSmall = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b6b6b',
  marginBottom: '16px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  marginBottom: '12px',
};

const buttonSecondary = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  marginBottom: '8px',
  border: '1px solid #e5e7eb',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '1.5',
  marginTop: '24px',
};

const footerSmall = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '24px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};
