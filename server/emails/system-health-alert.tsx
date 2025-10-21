import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Link,
} from '@react-email/components';

interface SystemHealthAlertEmailProps {
  serviceName: string;
  serviceType: string;
  status: 'critical' | 'unhealthy' | 'degraded';
  statusMessage: string;
  consecutiveFailures: number;
  lastError?: string;
  lastCheckedAt: string;
  systemHealthUrl?: string;
}

export default function SystemHealthAlertEmail({
  serviceName,
  serviceType,
  status,
  statusMessage,
  consecutiveFailures,
  lastError,
  lastCheckedAt,
  systemHealthUrl = 'https://economyplumbing.com/admin/system-health',
}: SystemHealthAlertEmailProps) {
  const statusColors = {
    critical: '#DC2626',    // Red
    unhealthy: '#F59E0B',   // Orange
    degraded: '#EAB308',    // Yellow
  };

  const statusColor = statusColors[status];
  const isUrgent = status === 'critical';

  return (
    <Html>
      <Head />
      <Preview>
        {isUrgent ? '🚨 URGENT: ' : '⚠️ '}System Health Alert: {serviceName} is {status}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>
              {isUrgent ? '🚨 ' : '⚠️ '}System Health Alert
            </Heading>
          </Section>

          <Section style={content}>
            <div style={{ ...alertBox, borderColor: statusColor }}>
              <Heading as="h2" style={{ ...h2, color: statusColor }}>
                {serviceName} - {status.toUpperCase()}
              </Heading>
              <Text style={text}>
                <strong>Service Type:</strong> {serviceType}
              </Text>
              <Text style={text}>
                <strong>Status Message:</strong> {statusMessage}
              </Text>
              <Text style={text}>
                <strong>Consecutive Failures:</strong> {consecutiveFailures}
              </Text>
              <Text style={text}>
                <strong>Last Checked:</strong> {new Date(lastCheckedAt).toLocaleString('en-US', {
                  timeZone: 'America/Chicago',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </div>

            {lastError && (
              <>
                <Heading as="h3" style={h3}>Error Details</Heading>
                <div style={errorBox}>
                  <Text style={errorText}>{lastError}</Text>
                </div>
              </>
            )}

            <Hr style={hr} />

            <Heading as="h3" style={h3}>Recommended Actions</Heading>
            <ul style={list}>
              {status === 'critical' && (
                <>
                  <li style={listItem}>
                    <strong>Immediate action required:</strong> This service has failed {consecutiveFailures} times consecutively
                  </li>
                  <li style={listItem}>
                    Check application logs for detailed error information
                  </li>
                  <li style={listItem}>
                    Verify external service dependencies (ServiceTitan API, Resend, etc.)
                  </li>
                  <li style={listItem}>
                    Check database connectivity and performance
                  </li>
                </>
              )}
              {status === 'unhealthy' && (
                <>
                  <li style={listItem}>
                    This service needs attention - {consecutiveFailures} consecutive failures
                  </li>
                  <li style={listItem}>
                    Review recent logs for error patterns
                  </li>
                  <li style={listItem}>
                    Monitor for additional failures
                  </li>
                </>
              )}
              {status === 'degraded' && (
                <>
                  <li style={listItem}>
                    Service is experiencing intermittent issues
                  </li>
                  <li style={listItem}>
                    Monitor the situation
                  </li>
                  <li style={listItem}>
                    Investigate if failures continue
                  </li>
                </>
              )}
            </ul>

            <Section style={buttonSection}>
              <Link
                href={systemHealthUrl}
                style={{
                  ...button,
                  backgroundColor: statusColor,
                }}
              >
                View System Health Dashboard
              </Link>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              This is an automated alert from Economy Plumbing Services monitoring system.
              <br />
              To stop receiving these alerts, update your notification preferences in the admin panel.
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
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#1e293b',
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 16px 0',
  padding: '0',
};

const h3 = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '24px 0 12px 0',
  padding: '0',
};

const content = {
  padding: '24px',
};

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const alertBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '24px',
};

const errorBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '16px',
  fontFamily: 'monospace',
};

const errorText = {
  color: '#1f2937',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  wordBreak: 'break-word' as const,
};

const list = {
  marginLeft: '20px',
  paddingLeft: '0',
};

const listItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const button = {
  backgroundColor: '#DC2626',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '32px',
  textAlign: 'center' as const,
};
