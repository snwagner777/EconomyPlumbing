import { Button } from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function EmailButton({ href, children, variant = 'primary' }: EmailButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Button
      href={href}
      style={{
        backgroundColor: isPrimary ? '#1e40af' : '#ffffff',
        color: isPrimary ? '#ffffff' : '#1e40af',
        fontSize: '16px',
        fontWeight: 'bold',
        textDecoration: 'none',
        textAlign: 'center' as const,
        padding: '14px 28px',
        borderRadius: '6px',
        border: isPrimary ? 'none' : '2px solid #1e40af',
        display: 'inline-block',
        cursor: 'pointer',
      }}
    >
      {children}
    </Button>
  );
}
