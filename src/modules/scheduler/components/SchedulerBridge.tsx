/**
 * SchedulerBridge - Modal wrapper around the working SchedulerFlow component
 * 
 * Listens to SchedulerContext (openScheduler() events from header buttons)
 * and renders the proven working scheduler in a dialog.
 */

'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useScheduler } from '@/contexts/SchedulerContext';
import { SchedulerFlow } from '@/components/scheduler/SchedulerFlow';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

/**
 * Modal scheduler triggered by header "Schedule Service" buttons
 */
export function SchedulerBridge() {
  const { isOpen, closeScheduler } = useScheduler();

  return (
    <Dialog open={isOpen} onOpenChange={closeScheduler}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>Schedule Service Appointment</DialogTitle>
        </VisuallyHidden>
        <div className="p-6">
          <SchedulerFlow />
        </div>
      </DialogContent>
    </Dialog>
  );
}
