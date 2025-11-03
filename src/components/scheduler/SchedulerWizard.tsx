/**
 * Scheduler Wizard - Multi-Step Appointment Booking Funnel
 * 
 * Beautiful, interactive flow:
 * Step 1: Select Service (with icons)
 * Step 2: Customer Information  
 * Step 3: Choose Smart Availability
 * Step 4: Confirmation
 */

import { useState, useReducer } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { ServiceStep } from '../scheduler/steps/ServiceStep';
import { CustomerStep } from '../scheduler/steps/CustomerStep';
import { AvailabilityStep } from '../scheduler/steps/AvailabilityStep';
import { ReviewStep } from '../scheduler/steps/ReviewStep';

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
  proximityScore?: number;
  nearbyJobs?: number;
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
}

interface WizardState {
  step: number;
  jobType: JobType | null;
  customer: CustomerInfo | null;
  timeSlot: TimeSlot | null;
}

type WizardAction =
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
  | { type: 'SET_CUSTOMER_INFO'; payload: CustomerInfo }
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SELECT_JOB_TYPE':
      return { ...state, jobType: action.payload, step: 2 };
    case 'SET_CUSTOMER_INFO':
      return { ...state, customer: action.payload, step: 3 };
    case 'SELECT_TIME_SLOT':
      return { ...state, timeSlot: action.payload, step: 4 };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 4) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'RESET':
      return { step: 1, jobType: null, customer: null, timeSlot: null };
    default:
      return state;
  }
}

interface SchedulerWizardProps {
  open: boolean;
  onClose: () => void;
  preselectedService?: string;
}

const STEP_TITLES = [
  '',
  'Select Your Service',
  'Your Information',
  'Choose Appointment Time',
  'Confirm Booking',
];

export function SchedulerWizard({ open, onClose, preselectedService }: SchedulerWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    step: 1,
    jobType: null,
    customer: null,
    timeSlot: null,
  });

  const handleClose = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };

  const handleSelectJobType = (jobType: JobType) => {
    dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
  };

  const handleCustomerSubmit = (customer: CustomerInfo) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: customer });
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  // Progress calculation
  const progress = ((state.step - 1) / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{STEP_TITLES[state.step]}</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={state.step >= 1 ? 'text-primary font-medium' : ''}>Service</span>
            <span className={state.step >= 2 ? 'text-primary font-medium' : ''}>Info</span>
            <span className={state.step >= 3 ? 'text-primary font-medium' : ''}>Time</span>
            <span className={state.step >= 4 ? 'text-primary font-medium' : ''}>Confirm</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {state.step === 1 && (
            <ServiceStep
              onSelect={handleSelectJobType}
              preselectedService={preselectedService}
            />
          )}
          
          {state.step === 2 && (
            <CustomerStep
              onSubmit={handleCustomerSubmit}
              initialData={state.customer || undefined}
            />
          )}
          
          {state.step === 3 && state.jobType && state.customer && (
            <AvailabilityStep
              jobTypeId={state.jobType.id}
              customerZip={state.customer.zip}
              onSelect={handleSelectTimeSlot}
              selectedSlot={state.timeSlot || undefined}
            />
          )}
          
          {state.step === 4 && state.jobType && state.customer && state.timeSlot && (
            <ReviewStep
              jobType={state.jobType}
              customer={state.customer}
              timeSlot={state.timeSlot}
              onSuccess={handleClose}
            />
          )}
        </div>

        {/* Navigation */}
        {state.step > 1 && state.step < 4 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step {state.step} of 4
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
