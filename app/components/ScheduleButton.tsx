'use client';

import { Button } from '../../client/src/components/ui/button';

// Client-side ServiceTitan scheduler trigger
function openScheduler() {
  if (typeof window !== 'undefined' && (window as any).STWidgetManager) {
    (window as any).STWidgetManager.openWidget();
  } else {
    console.warn('ServiceTitan widget not loaded');
  }
}

export function ScheduleButton({ 
  variant = 'default',
  size = 'lg',
  className = '',
  children = 'Schedule Service'
}: {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={openScheduler}
      className={className}
      data-testid="button-schedule"
    >
      {children}
    </Button>
  );
}
