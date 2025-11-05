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
import { Button } from "@/components/ui/button";
import { ChevronLeft, Wrench, User, Calendar, CheckCircle2 } from 'lucide-react';
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
  period: 'morning' | 'afternoon' | 'evening';
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
  serviceTitanId?: number;
  customerTags?: string[];
  locationId?: number;
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

const STEP_CONFIG = [
  { icon: null, title: '', subtitle: '' },
  { 
    icon: Wrench, 
    title: "What can we help you with?",
    subtitle: "Choose the service you need"
  },
  { 
    icon: User, 
    title: "Let's get your details",
    subtitle: "We'll use this to create your appointment"
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
    // Check if VIP service selected but customer is not VIP (case-insensitive)
    const isVIPService = state.jobType?.name.toLowerCase().includes('vip');
    const isVIPCustomer = customer.customerTags?.some(tag => tag.toLowerCase() === 'vip');
    
    if (isVIPService && !isVIPCustomer) {
      alert('VIP Service is only available to VIP members. Please go back and select a different service, or contact us to learn about becoming a VIP member.');
      return;
    }
    
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: customer });
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const currentConfig = STEP_CONFIG[state.step];
  const StepIcon = currentConfig.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          {/* Conversational header with icon */}
          <div className="flex items-center gap-4">
            {StepIcon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                <StepIcon className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold mb-1">
                {currentConfig.title}
              </DialogTitle>
              {currentConfig.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {currentConfig.subtitle}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Step Content with smooth transitions */}
        <div className="flex-1 overflow-y-auto py-4 animate-in fade-in duration-300">
          {state.step === 1 && (
            <div className="animate-in slide-in-from-right-5 duration-300">
              <ServiceStep
                onSelect={handleSelectJobType}
                preselectedService={preselectedService}
              />
            </div>
          )}
          
          {state.step === 2 && (
            <div className="animate-in slide-in-from-right-5 duration-300">
              <CustomerStep
                onSubmit={handleCustomerSubmit}
                initialData={state.customer || undefined}
              />
            </div>
          )}
          
          {state.step === 3 && state.jobType && state.customer && (
            <div className="animate-in slide-in-from-right-5 duration-300">
              <AvailabilityStep
                jobTypeId={state.jobType.id}
                customerZip={state.customer.zip}
                onSelect={handleSelectTimeSlot}
                selectedSlot={state.timeSlot || undefined}
              />
            </div>
          )}
          
          {state.step === 4 && state.jobType && state.customer && state.timeSlot && (
            <div className="animate-in slide-in-from-right-5 duration-300">
              <ReviewStep
                jobType={state.jobType}
                customer={state.customer}
                timeSlot={state.timeSlot}
                onSuccess={handleClose}
              />
            </div>
          )}
        </div>

        {/* Back button - always visible except on first step */}
        {state.step > 1 && (
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              data-testid="button-back"
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
