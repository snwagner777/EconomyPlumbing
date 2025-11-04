'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useScheduler } from '@/contexts/SchedulerContext';
import { SchedulerWizard } from '@/components/scheduler/SchedulerWizard';

export function SchedulerModal() {
  const { isOpen, closeScheduler, options } = useScheduler();

  return (
    <SchedulerWizard
      open={isOpen}
      onClose={closeScheduler}
      preselectedService={options.prefilledService}
    />
  );
}
