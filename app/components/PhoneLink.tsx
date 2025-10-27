'use client';

import { Button } from './Button';
import { Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PhoneConfig {
  display: string;
  tel: string;
}

// Client-side phone number detection based on UTM parameters
export function PhoneLink({ 
  variant = 'outline',
  size = 'lg',
  className = '',
  showIcon = true,
  location = 'austin'
}: {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
  location?: 'austin' | 'marble-falls';
}) {
  const [phoneConfig, setPhoneConfig] = useState<PhoneConfig>({
    display: location === 'austin' ? '(512) 368-9159' : '(830) 265-9944',
    tel: location === 'austin' ? 'tel:+15123689159' : 'tel:+18302659944',
  });

  useEffect(() => {
    // In production, this would detect UTM parameters and fetch the appropriate tracking number
    // For now, using static numbers
    const fetchPhoneNumber = async () => {
      try {
        const response = await fetch(`/api/tracking-numbers?location=${location}`);
        if (response.ok) {
          const data = await response.json();
          if (data.display && data.tel) {
            setPhoneConfig(data);
          }
        }
      } catch (error) {
        console.log('Using default phone number');
      }
    };

    fetchPhoneNumber();
  }, [location]);

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      asChild
      data-testid={`button-call-${location}`}
    >
      <a href={phoneConfig.tel} className="flex items-center gap-2">
        {showIcon && <Phone className="w-5 h-5" />}
        {phoneConfig.display}
      </a>
    </Button>
  );
}
