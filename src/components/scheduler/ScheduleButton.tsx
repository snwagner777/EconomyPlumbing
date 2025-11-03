'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useScheduler } from '@/contexts/SchedulerContext';
import { useEffect, useState } from 'react';

interface ScheduleButtonProps extends Omit<ButtonProps, 'onClick'> {
  text?: string;
  showIcon?: boolean;
  prefilledService?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
  customerId?: number;
}

export function ScheduleButton({
  text = 'Schedule Service',
  showIcon = true,
  prefilledService,
  utmSource,
  utmMedium,
  utmCampaign,
  referralCode,
  customerId,
  ...buttonProps
}: ScheduleButtonProps) {
  const { openScheduler } = useScheduler();
  const [capturedUtms, setCapturedUtms] = useState<{
    source?: string;
    medium?: string;
    campaign?: string;
  }>({});

  // Capture UTM parameters from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    setCapturedUtms({
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    });
  }, []);

  const handleClick = () => {
    openScheduler({
      prefilledService,
      utmSource: utmSource || capturedUtms.source,
      utmMedium: utmMedium || capturedUtms.medium,
      utmCampaign: utmCampaign || capturedUtms.campaign,
      referralCode,
      customerId,
    });
  };

  return (
    <Button onClick={handleClick} data-testid="button-schedule-modal" {...buttonProps}>
      {showIcon && <Calendar className="w-4 h-4 mr-2" />}
      {text}
    </Button>
  );
}
