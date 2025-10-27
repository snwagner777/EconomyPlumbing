'use client';

import { Button } from '../../client/src/components/ui/button';

// Extend window type for ServiceTitan
declare global {
  interface Window {
    STWidgetManager?: (action: string) => void;
  }
}

// Client-side ServiceTitan scheduler trigger
function openScheduler() {
  if (typeof window !== 'undefined' && window.STWidgetManager) {
    try {
      window.STWidgetManager('ws-open');
      console.log('ServiceTitan scheduler opened');
    } catch (error) {
      console.error('Error opening scheduler:', error);
      alert('Online scheduler is temporarily unavailable. Please call us at (512) 368-9159 for Austin or (830) 265-9944 for Marble Falls.');
    }
  } else {
    console.warn('ServiceTitan widget not loaded yet');
    alert('Loading scheduler... Please try again in a moment, or call us at (512) 368-9159 for Austin or (830) 265-9944 for Marble Falls.');
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
