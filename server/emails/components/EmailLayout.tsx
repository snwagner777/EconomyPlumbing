import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>
              <strong>Economy Plumbing Services</strong>
            </Text>
            <Text style={headerSubtext}>
              Austin & Marble Falls, TX
            </Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Economy Plumbing Services
            </Text>
            <Text style={footerText}>
              (512) 355-0584 | Austin & Marble Falls, TX
            </Text>
            <Text style={footerText}>
              Licensed & Insured | 24/7 Emergency Service
            </Text>
            <Text style={footerLinks}>
              <a href="https://economyplumbing.com" style={link}>
                Visit Website
              </a>
              {' • '}
              <a href="https://economyplumbing.com/unsubscribe" style={link}>
                Manage Preferences
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const header = {
  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const headerSubtext = {
  color: '#e0e7ff',
  fontSize: '14px',
  margin: '0',
};

const footer = {
  backgroundColor: '#f3f4f6',
  padding: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '4px 0',
};

const footerLinks = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '12px 0 0 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
};
