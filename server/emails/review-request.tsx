import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from '@react-email/components';

interface ReviewRequestEmailProps {
  customerName: string;
  firstName?: string;
  technicianName?: string;
  jobType?: string;
  completedDate?: string;
  reviewUrl: string;
  googleReviewUrl?: string;
  facebookReviewUrl?: string;
  yelpReviewUrl?: string;
}

export default function ReviewRequestEmail({
  customerName = 'Valued Customer',
  firstName,
  technicianName = 'our team',
  jobType = 'plumbing service',
  completedDate,
  reviewUrl,
  googleReviewUrl,
  facebookReviewUrl,
  yelpReviewUrl,
}: ReviewRequestEmailProps) {
  const displayName = firstName || customerName;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            {/* Header */}
            <Text style={heading}>
              Thanks for trusting us, {displayName}! 🙏
            </Text>

            {/* Main Message */}
            <Text style={paragraph}>
              We hope you're happy with your recent {jobType}. {technicianName} loved working with you!
            </Text>

            <Text style={paragraph}>
              We'd really appreciate if you could share your experience with others. It only takes 60 seconds and helps families find quality plumbing help.
            </Text>

            {/* CTA Buttons */}
            <Section style={buttonContainer}>
              {googleReviewUrl && (
                <Link href={googleReviewUrl} style={button}>
                  ⭐ Review us on Google
                </Link>
              )}
              {facebookReviewUrl && (
                <Link href={facebookReviewUrl} style={buttonSecondary}>
                  👍 Review us on Facebook
                </Link>
              )}
              {yelpReviewUrl && (
                <Link href={yelpReviewUrl} style={buttonSecondary}>
                  📝 Review us on Yelp
                </Link>
              )}
              <Link href={reviewUrl} style={buttonSecondary}>
                💬 Leave a review on our website
              </Link>
            </Section>

            <Text style={paragraphSmall}>
              Choose your favorite platform above — whatever's easiest for you!
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              Thanks for being awesome!<br />
              — The Economy Plumbing Team
            </Text>

            <Text style={footerSmall}>
              Not interested in leaving a review?{' '}
              <Link href={reviewUrl + '/unsubscribe'} style={link}>
                Click here to opt out
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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
  fontSize: '28px',
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
