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

interface ReviewClickedFollowupEmailProps {
  customerName: string;
  firstName?: string;
  platformClicked?: string; // 'google', 'facebook', 'yelp', 'website'
  reviewUrl: string;
  platformReviewUrl?: string;
}

export default function ReviewClickedFollowupEmail({
  customerName = 'Valued Customer',
  firstName,
  platformClicked = 'our review page',
  reviewUrl,
  platformReviewUrl,
}: ReviewClickedFollowupEmailProps) {
  const displayName = firstName || customerName;

  const platformDisplayName = platformClicked === 'google' ? 'Google' :
                               platformClicked === 'facebook' ? 'Facebook' :
                               platformClicked === 'yelp' ? 'Yelp' : 'our website';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            {/* Header */}
            <Text style={heading}>
              Hey {displayName}, almost there! 🎯
            </Text>

            {/* Main Message */}
            <Text style={paragraph}>
              We noticed you clicked on our {platformDisplayName} review link — that's awesome! 
            </Text>

            <Text style={paragraph}>
              Sometimes things come up, or the review page can be a bit tricky. We just wanted to make it super easy for you to finish up if you still have a moment.
            </Text>

            <Text style={highlightBox}>
              <strong>💡 Pro tip:</strong> Most reviews take just 30-60 seconds. You don't need to write a novel — even a sentence or two with a star rating makes a huge difference!
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              {platformReviewUrl && (
                <Link href={platformReviewUrl} style={button}>
                  ⭐ Complete your {platformDisplayName} review
                </Link>
              )}
              <Link href={reviewUrl} style={buttonSecondary}>
                💬 Or leave a review on our website instead
              </Link>
            </Section>

            <Text style={paragraphSmall}>
              We totally get it if you're too busy — no worries at all!
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              Thanks for even considering it!<br />
              — The Economy Plumbing Team
            </Text>

            <Text style={footerSmall}>
              Not interested anymore?{' '}
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

const highlightBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '16px',
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#78350f',
  marginBottom: '24px',
  borderRadius: '4px',
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
