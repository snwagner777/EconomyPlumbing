/**
 * ReviewStep - Review and confirm booking
 */

'use client';

import type { UseSchedulerFlowReturn } from '../../hooks/useSchedulerFlow';
import type { UseLocationSelectorReturn } from '../../hooks/useLocationSelector';
import type { CustomerDataStrategy } from '../../strategies/CustomerDataStrategy';

interface ReviewStepProps {
  schedulerFlow: UseSchedulerFlowReturn;
  strategy: CustomerDataStrategy | null;
  locationSelector: UseLocationSelectorReturn;
  onBook: () => Promise<void>;
  isBooking: boolean;
  bookingError: string | null;
}

export function ReviewStep({ 
  schedulerFlow, 
  strategy, 
  locationSelector,
  onBook,
  isBooking,
  bookingError 
}: ReviewStepProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Review Booking</h2>
      <p className="text-muted-foreground mb-6">
        Please review your appointment details.
      </p>
      {/* TODO: Implement booking review */}
      <div className="text-center text-muted-foreground">
        Booking review coming soon...
      </div>
    </div>
  );
}
