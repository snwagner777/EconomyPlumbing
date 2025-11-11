/**
 * ServiceStep - Select service type
 */

'use client';

import type { UseSchedulerFlowReturn } from '../../hooks/useSchedulerFlow';

interface ServiceStepProps {
  schedulerFlow: UseSchedulerFlowReturn;
  prefilledService?: string;
}

export function ServiceStep({ schedulerFlow, prefilledService }: ServiceStepProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Service</h2>
      <p className="text-muted-foreground mb-6">
        What can we help you with today?
      </p>
      {/* TODO: Implement service selection */}
      <div className="text-center text-muted-foreground">
        Service selection coming soon...
      </div>
    </div>
  );
}
