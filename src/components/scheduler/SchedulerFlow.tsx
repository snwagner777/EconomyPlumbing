/**
 * SchedulerFlow - Embedded scheduler for the /schedule-appointment page
 * 
 * This is a non-modal version of the scheduler wizard that can be embedded
 * directly into pages. Uses the same SchedulerWizard logic but without the dialog.
 */

'use client';

import { useState, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Wrench, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { ServiceStep } from './steps/ServiceStep';
import { CustomerStep } from './steps/CustomerStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { ReviewStep } from './steps/ReviewStep';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSchedulerSession } from '@/hooks/useSchedulerSession';
import type { TimeSlot, JobType, CustomerInfo } from '@shared/types/scheduler';

interface SchedulerSession {
  token: string | null;
  verificationMethod: 'phone' | 'email' | null;
  verifiedAt: number | null;
  customerId: number | null;
  expiresAt: number | null;
}

interface FlowState {
  step: number;
  jobType: JobType | null;
  problemDescription: string;
  customer: CustomerInfo | null;
  timeSlot: TimeSlot | null;
  session: SchedulerSession;
}

type FlowAction =
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
  | { type: 'SET_PROBLEM_DESCRIPTION'; payload: string }
  | { type: 'SET_CUSTOMER_INFO'; payload: CustomerInfo }
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'SET_SESSION'; payload: Partial<SchedulerSession> }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SELECT_JOB_TYPE':
      return { ...state, jobType: action.payload, step: 2 };
    case 'SET_PROBLEM_DESCRIPTION':
      return { ...state, problemDescription: action.payload };
    case 'SET_CUSTOMER_INFO':
      return { ...state, customer: action.payload, step: 3 };
    case 'SELECT_TIME_SLOT':
      return { ...state, timeSlot: action.payload, step: 4 };
    case 'SET_SESSION':
      return { ...state, session: { ...state.session, ...action.payload } };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 4) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'RESET':
      return { 
        step: 1, 
        jobType: null, 
        problemDescription: '', 
        customer: null, 
        timeSlot: null,
        session: {
          token: null,
          verificationMethod: null,
          verifiedAt: null,
          customerId: null,
          expiresAt: null,
        }
      };
    default:
      return state;
  }
}

interface SchedulerFlowProps {
  initialUtmSource?: string;
  initialUtmMedium?: string;
  initialUtmCampaign?: string;
  initialReferralCode?: string;
  prefilledCustomerId?: number;
  initialCustomerData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
}

const STEP_CONFIG: Record<number, { icon: any | null; title: string; subtitle: string }> = {
  0: { icon: null, title: '', subtitle: '' },
  1: { 
    icon: Wrench, 
    title: "What service do you need?",
    subtitle: "Select the type of plumbing service"
  },
  2: { 
    icon: User, 
    title: "Let's get your details",
    subtitle: "We'll use this to create your appointment"
  },
  3: { 
    icon: Calendar, 
    title: "When works best for you?",
    subtitle: "We've optimized these times for your area"
  },
  4: { 
    icon: CheckCircle2, 
    title: "You're all set!",
    subtitle: "Review and confirm your booking"
  },
};

export function SchedulerFlow({ 
  initialUtmSource,
  initialUtmMedium,
  initialUtmCampaign,
  initialReferralCode,
  prefilledCustomerId,
  initialCustomerData
}: SchedulerFlowProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(flowReducer, {
    step: 1,
    jobType: null,
    problemDescription: '',
    customer: null,
    timeSlot: null,
    session: {
      token: null,
      verificationMethod: null,
      verifiedAt: null,
      customerId: null,
      expiresAt: null,
    }
  });
  const [vipError, setVipError] = useState(false);
  
  // Wire scheduler session management with sessionStorage persistence
  const {
    setSession,
    clearSession,
    isSessionValid,
    isSessionExpiringSoon,
  } = useSchedulerSession({
    session: state.session,
    onSessionUpdate: (sessionData) => {
      dispatch({ type: 'SET_SESSION', payload: sessionData });
    },
  });
  
  // Handle session updates from CustomerStep
  const handleSessionUpdate = useCallback((sessionData: Partial<SchedulerSession>) => {
    dispatch({ type: 'SET_SESSION', payload: sessionData });
  }, []);

  const handleSelectJobType = (jobType: JobType) => {
    dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
    setVipError(false);
  };

  const handleProblemDescription = (description: string) => {
    dispatch({ type: 'SET_PROBLEM_DESCRIPTION', payload: description });
  };

  const handleCustomerSubmit = (customer: CustomerInfo) => {
    // Check if VIP service selected but customer is not VIP (case-insensitive)
    const isVIPService = state.jobType?.name.toLowerCase().includes('vip');
    const isVIPCustomer = customer.customerTags?.some(tag => tag.toLowerCase() === 'vip');
    
    if (isVIPService && !isVIPCustomer) {
      setVipError(true);
      return;
    }
    
    setVipError(false);
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: customer });
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleComplete = () => {
    // Redirect to scheduler success page
    const params = new URLSearchParams();
    if (initialUtmSource) params.set('utm_source', initialUtmSource);
    if (initialUtmMedium) params.set('utm_medium', initialUtmMedium);
    if (initialUtmCampaign) params.set('utm_campaign', initialUtmCampaign);
    
    router.push(`/scheduler/payment-success?${params.toString()}`);
  };

  const currentConfig = STEP_CONFIG[state.step];
  const StepIcon = currentConfig.icon;

  return (
    <div className="w-full px-2 sm:px-0">
      {/* Header */}
      {StepIcon && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 shrink-0">
              <StepIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1" data-testid="text-step-title">
                {currentConfig.title}
              </h2>
              <p className="text-muted-foreground" data-testid="text-step-subtitle">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

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
                  onClick={() => router.push('/vip-membership')}
                  data-testid="button-join-vip"
                >
                  Learn About VIP Membership
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setVipError(false);
                    dispatch({ type: 'PREV_STEP' });
                  }}
                  data-testid="button-choose-different-service"
                >
                  Choose Different Service
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Service Selection */}
        {state.step === 1 && (
          <ServiceStep 
            onSelect={handleSelectJobType}
            data-testid="step-service"
          />
        )}

        {/* Step 2: Customer Information */}
        {state.step === 2 && (
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
            <CustomerStep 
              onSubmit={handleCustomerSubmit}
              selectedService={state.jobType || undefined}
              onVipError={() => setVipError(true)}
              initialData={initialCustomerData}
              onSessionUpdate={handleSessionUpdate}
              data-testid="step-customer"
            />
          </div>
        )}

        {/* Step 3: Availability Selection */}
        {state.step === 3 && state.jobType && state.customer && (
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
              customerZip={state.customer.zip}
              onSelect={handleSelectTimeSlot}
              selectedSlot={state.timeSlot || undefined}
              data-testid="step-availability"
            />
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {state.step === 4 && state.jobType && state.customer && state.timeSlot && (
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
              customer={state.customer}
              timeSlot={state.timeSlot}
              problemDescription={state.problemDescription}
              onProblemDescriptionChange={handleProblemDescription}
              onSuccess={handleComplete}
              utmSource={initialUtmSource}
              utmMedium={initialUtmMedium}
              utmCampaign={initialUtmCampaign}
              referralCode={initialReferralCode}
              data-testid="step-review"
            />
          </div>
        )}
      </div>
    </div>
  );
}
