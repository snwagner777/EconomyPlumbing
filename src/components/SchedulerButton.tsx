'use client';

import { Button } from "@/components/ui/button";
import { openScheduler } from "@/lib/scheduler";

interface SchedulerButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export function SchedulerButton({
  variant = 'default',
  size = 'default',
  className,
  children = 'Schedule Service',
  'data-testid': testId,
}: SchedulerButtonProps) {
  return (
    <Button
      onClick={() => openScheduler()}
      variant={variant}
      size={size}
      className={className}
      data-testid={testId}
    >
      {children}
    </Button>
  );
}
