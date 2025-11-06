'use client';

import { useState, useReducer, useEffect } from 'react';
import { Wrench, Calendar, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceStep } from '@/components/scheduler/steps/ServiceStep';
import { AvailabilityStep } from '@/components/scheduler/steps/AvailabilityStep';
import { ReviewStep } from '@/components/scheduler/steps/ReviewStep';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JobType {
  id: number;
  name: string;
  code: string;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  proximityScore?: number;
  nearbyJobs?: number;
  technicianId?: number | null;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  serviceTitanId?: number;
  customerTags?: string[];
  locationId?: number;
}

interface FlowState {
  step: number;
  jobType: JobType | null;
  timeSlot: TimeSlot | null;
}

type FlowAction =
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SELECT_JOB_TYPE':
      return { ...state, jobType: action.payload, step: 2 };
    case 'SELECT_TIME_SLOT':
      return { ...state, timeSlot: action.payload, step: 3 };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 3) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'RESET':
      return { step: 1, jobType: null, timeSlot: null };
    default:
      return state;
  }
}

interface SchedulerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerInfo: CustomerInfo;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const STEP_CONFIG = [
  { icon: null, title: '', subtitle: '' },
  { 
    icon: Wrench, 
    title: "What can we help you with?",
    subtitle: "Choose the service you need"
  },
  { 
    icon: Calendar, 
    title: "When works best for you?",
    subtitle: "We've optimized these times for your area"
  },
  { 
    icon: CheckCircle2, 
    title: "You're all set!",
    subtitle: "Review and confirm your booking"
  },
];

export function SchedulerDialog({ 
  open,
  onOpenChange,
  customerInfo,
  utmSource = 'customer-portal',
  utmMedium,
  utmCampaign
}: SchedulerDialogProps) {
  const [state, dispatch] = useReducer(flowReducer, {
    step: 1,
    jobType: null,
    timeSlot: null,
  });
  const [vipError, setVipError] = useState(false);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      dispatch({ type: 'RESET' });
      setVipError(false);
    }
  }, [open]);

  const handleSelectJobType = (jobType: JobType) => {
    // Check if VIP service selected but customer is not VIP
    const isVIPService = jobType.name.toLowerCase().includes('vip');
    const isVIPCustomer = customerInfo.customerTags?.some(tag => tag.toLowerCase() === 'vip');
    
    if (isVIPService && !isVIPCustomer) {
      setVipError(true);
      return;
    }
    
    setVipError(false);
    dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    setVipError(false);
    dispatch({ type: 'PREV_STEP' });
  };

  const handleComplete = () => {
    // Reset and close
    dispatch({ type: 'RESET' });
    onOpenChange(false);
    
    // Show success message or redirect
    window.location.href = '/scheduler/payment-success?utm_source=customer-portal';
  };

  const currentConfig = STEP_CONFIG[state.step];
  const StepIcon = currentConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {StepIcon && (
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                <StepIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{currentConfig.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{currentConfig.subtitle}</p>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* VIP Error Alert */}
        {vipError && (
          <Card className="p-6 mb-6 bg-destructive/10 border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-destructive mb-2">VIP Membership Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This service is only available to VIP members. Would you like to join our VIP membership program?
                </p>
                <div className="flex gap-3">
                  <Button 
                    size="sm"
                    onClick={() => window.location.href = '/vip-membership'}
                    data-testid="button-join-vip"
                  >
                    Learn More About VIP
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setVipError(false)}
                    data-testid="button-dismiss-vip-error"
                  >
                    Choose Different Service
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step Content */}
        <div className="mt-4">
          {state.step === 1 && (
            <ServiceStep
              onSelect={handleSelectJobType}
            />
          )}

          {state.step === 2 && state.jobType && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-6 gap-2 -ml-2"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <AvailabilityStep
                jobTypeId={state.jobType.id}
                customerZip={customerInfo.zip}
                onSelect={handleSelectTimeSlot}
                selectedSlot={state.timeSlot || undefined}
              />
            </div>
          )}

          {state.step === 3 && state.jobType && state.timeSlot && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-6 gap-2 -ml-2"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <ReviewStep
                jobType={state.jobType}
                customer={customerInfo}
                timeSlot={state.timeSlot}
                onSuccess={handleComplete}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
