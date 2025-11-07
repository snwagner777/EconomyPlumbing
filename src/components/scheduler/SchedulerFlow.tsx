/**
 * SchedulerFlow - Embedded scheduler for the /schedule-appointment page
 * 
 * This is a non-modal version of the scheduler wizard that can be embedded
 * directly into pages. Uses the same SchedulerWizard logic but without the dialog.
 */

'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Wrench, User, Calendar, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { ProblemDescriptionStep } from './steps/ProblemDescriptionStep';
import { AISuggestionStep } from './steps/AISuggestionStep';
import { ServiceStep } from './steps/ServiceStep';
import { CustomerStep } from './steps/CustomerStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { ReviewStep } from './steps/ReviewStep';
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
  technicianId?: number | null; // Pre-assigned technician for optimal routing
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
  problemDescription: string | null;
  enrichedSummary: string | null;
  jobType: JobType | null;
  customer: CustomerInfo | null;
  timeSlot: TimeSlot | null;
}

type FlowAction =
  | { type: 'SET_PROBLEM_DESCRIPTION'; payload: string }
  | { type: 'SELECT_JOB_TYPE'; payload: { jobType: JobType; enrichedSummary?: string } }
  | { type: 'SET_CUSTOMER_INFO'; payload: CustomerInfo }
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_PROBLEM_DESCRIPTION':
      // Step 1 → Step 1.5 (AI Suggestion)
      return { ...state, problemDescription: action.payload, step: 1.5 };
    case 'SELECT_JOB_TYPE':
      // Step 1.5 or direct selection → Step 2 (Customer Info)
      return { 
        ...state, 
        jobType: action.payload.jobType, 
        enrichedSummary: action.payload.enrichedSummary || null,
        step: 2 
      };
    case 'SET_CUSTOMER_INFO':
      return { ...state, customer: action.payload, step: 3 };
    case 'SELECT_TIME_SLOT':
      return { ...state, timeSlot: action.payload, step: 4 };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 4) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'RESET':
      return { step: 1, problemDescription: null, enrichedSummary: null, jobType: null, customer: null, timeSlot: null };
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
}

const STEP_CONFIG: Record<number, { icon: any | null; title: string; subtitle: string }> = {
  0: { icon: null, title: '', subtitle: '' },
  1: { 
    icon: MessageSquare, 
    title: "What's the problem?",
    subtitle: "Describe your plumbing issue in your own words"
  },
  1.5: { 
    icon: Wrench, 
    title: "Recommended Service",
    subtitle: "Based on your description"
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
  prefilledCustomerId
}: SchedulerFlowProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(flowReducer, {
    step: 1,
    problemDescription: null,
    enrichedSummary: null,
    jobType: null,
    customer: null,
    timeSlot: null,
  });
  const [vipError, setVipError] = useState(false);

  const handleProblemDescription = (description: string) => {
    dispatch({ type: 'SET_PROBLEM_DESCRIPTION', payload: description });
  };

  const handleAIAccept = (jobType: JobType, enrichedSummary: string) => {
    dispatch({ type: 'SELECT_JOB_TYPE', payload: { jobType, enrichedSummary } });
    setVipError(false);
  };

  const handleManualSelect = (jobType: JobType, enrichedSummary: string) => {
    // Even if user manually selects different job type, keep the enrichedSummary - it has valuable context
    dispatch({ type: 'SELECT_JOB_TYPE', payload: { jobType, enrichedSummary } });
    setVipError(false);
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
        {/* Step 1: Problem Description */}
        {state.step === 1 && (
          <ProblemDescriptionStep 
            onSubmit={handleProblemDescription}
            initialDescription={state.problemDescription || undefined}
            data-testid="step-problem-description"
          />
        )}

        {/* Step 1.5: AI Suggestion */}
        {state.step === 1.5 && state.problemDescription && (
          <AISuggestionStep 
            problemDescription={state.problemDescription}
            onAccept={handleAIAccept}
            onManualSelect={handleManualSelect}
            data-testid="step-ai-suggestion"
          />
        )}

        {/* Step 2: Customer Information */}
        {state.step === 2 && (
          <div>
            {state.step > 1 && (
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
            )}
            <CustomerStep 
              onSubmit={handleCustomerSubmit}
              selectedService={state.jobType || undefined}
              onVipError={() => setVipError(true)}
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
              customer={{
                ...state.customer,
                notes: state.enrichedSummary || state.customer.notes, // Use AI-enriched summary if available
              }}
              timeSlot={state.timeSlot}
              onSuccess={handleComplete}
              data-testid="step-review"
            />
          </div>
        )}
      </div>
    </div>
  );
}
