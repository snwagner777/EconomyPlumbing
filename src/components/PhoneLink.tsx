'use client';

import { useEffect, useState } from 'react';
import { usePhoneConfig, useMarbleFallsPhone } from "@/hooks/usePhoneConfig";
import { Button } from "@/components/ui/button";

interface PhoneLinkProps {
  location?: 'austin' | 'marble-falls';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
  // Server-rendered values (for SEO)
  initialDisplay: string;
  initialTel: string;
}

/**
 * Phone link that server-renders for SEO, then upgrades client-side for tracking
 */
export function PhoneLink({ 
  location = 'austin', 
  variant = 'default',
  size = 'default',
  className,
  children,
  'data-testid': testId,
  initialDisplay,
  initialTel,
}: PhoneLinkProps) {
  const austinPhone = usePhoneConfig();
  const marbleFallsPhone = useMarbleFallsPhone();
  
  // Start with server-rendered values, upgrade after hydration
  const [phone, setPhone] = useState({ display: initialDisplay, tel: initialTel });
  
  useEffect(() => {
    // Upgrade to tracked phone number after client-side hydration
    const clientPhone = location === 'marble-falls' ? marbleFallsPhone : austinPhone;
    setPhone(clientPhone);
  }, [location, austinPhone, marbleFallsPhone]);
  
  const defaultLabel = location === 'marble-falls' 
    ? `Call Marble Falls: ${phone.display}`
    : `Call Austin: ${phone.display}`;

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      data-testid={testId}
    >
      <a href={phone.tel}>
        {children || defaultLabel}
      </a>
    </Button>
  );
}

export function PhoneNumber({ 
  location = 'austin',
  initialDisplay,
}: { 
  location?: 'austin' | 'marble-falls';
  initialDisplay: string;
}) {
  const austinPhone = usePhoneConfig();
  const marbleFallsPhone = useMarbleFallsPhone();
  
  // Start with server-rendered value
  const [display, setDisplay] = useState(initialDisplay);
  
  useEffect(() => {
    // Upgrade after hydration
    const phone = location === 'marble-falls' ? marbleFallsPhone : austinPhone;
    setDisplay(phone.display);
  }, [location, austinPhone, marbleFallsPhone]);
  
  return <>{display}</>;
}
