import { Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailSectionProps {
  children: ReactNode;
  spacing?: 'normal' | 'tight' | 'loose';
}

export function EmailSection({ children, spacing = 'normal' }: EmailSectionProps) {
  const paddingMap = {
    tight: '16px 24px',
    normal: '24px 24px',
    loose: '32px 24px',
  };

  return <Section style={{ padding: paddingMap[spacing] }}>{children}</Section>;
}

interface EmailHeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
}

export function EmailHeading({ children, level = 1 }: EmailHeadingProps) {
  const styles = {
    1: { fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' },
    2: { fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0' },
    3: { fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' },
  };

  return <Text style={styles[level]}>{children}</Text>;
}

interface EmailParagraphProps {
  children: ReactNode;
}

export function EmailParagraph({ children }: EmailParagraphProps) {
  return (
    <Text
      style={{
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#374151',
        margin: '0 0 16px 0',
      }}
    >
      {children}
    </Text>
  );
}
