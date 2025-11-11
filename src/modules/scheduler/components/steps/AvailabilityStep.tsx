/**
 * AvailabilityStep - Select appointment time
 */

'use client';

import type { UseSchedulerFlowReturn } from '../../hooks/useSchedulerFlow';
import type { UseLocationSelectorReturn } from '../../hooks/useLocationSelector';
import type { CustomerDataStrategy } from '../../strategies/CustomerDataStrategy';

interface AvailabilityStepProps {
  schedulerFlow: UseSchedulerFlowReturn;
  strategy: CustomerDataStrategy | null;
  locationSelector: UseLocationSelectorReturn;
}

export function AvailabilityStep({ schedulerFlow, strategy, locationSelector }: AvailabilityStepProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Time</h2>
      <p className="text-muted-foreground mb-6">
        When works best for you?
      </p>
      {/* TODO: Implement availability calendar */}
      <div className="text-center text-muted-foreground">
        Availability calendar coming soon...
      </div>
    </div>
  );
}
