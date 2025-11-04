'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 z-10"
            onClick={closeScheduler}
            data-testid="button-close-scheduler"
          >
            <X className="w-4 h-4" />
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
