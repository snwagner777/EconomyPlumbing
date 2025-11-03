'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useScheduler } from '@/contexts/SchedulerContext';
import { SchedulerFlow } from '@/components/scheduler/SchedulerFlow';

export function SchedulerModal() {
  const { isOpen, closeScheduler, options } = useScheduler();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeScheduler()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Schedule Service</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <SchedulerFlow
            initialUtmSource={options.utmSource}
            initialUtmMedium={options.utmMedium}
            initialUtmCampaign={options.utmCampaign}
            initialReferralCode={options.referralCode}
            prefilledCustomerId={options.customerId}
            prefilledService={options.prefilledService}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
