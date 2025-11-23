/**
 * useSchedulerFlow Hook
 * 
 * Manages 4-step scheduler flow state for customer portal dialog.
 * Steps: Service -> Customer/Verification -> Availability -> Review
 * 
 * Lightweight alternative to full SchedulerProvider context.
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { JobType, TimeSlot } from '@shared/types/scheduler';
import { Wrench, User, Calendar, CheckCircle2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SchedulerFlowState {
  step: number; // 1 = service, 2 = customer/verification, 3 = availability, 4 = review
  jobType: JobType | null;
  customerData: any | null;
  timeSlot: TimeSlot | null;
}

type SchedulerFlowAction =
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
  | { type: 'SET_CUSTOMER_DATA'; payload: any }
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

// ============================================================================
// Step Configuration
// ============================================================================

export const SCHEDULER_STEP_CONFIG = [
  { icon: null, title: '', subtitle: '' }, // Index 0 (unused)
  { 
    icon: Wrench, 
    title: "What can we help you with?",
    subtitle: "Choose the service you need"
  },
  { 
    icon: User, 
    title: "Confirm your information",
    subtitle: "We'll send a verification code to get started"
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
] as const;

// ============================================================================
// Reducer
// ============================================================================

function schedulerFlowReducer(state: SchedulerFlowState, action: SchedulerFlowAction): SchedulerFlowState {
  switch (action.type) {
    case 'SELECT_JOB_TYPE':
      return { ...state, jobType: action.payload, step: 2 };
    case 'SET_CUSTOMER_DATA':
      return { ...state, customerData: action.payload, step: 3 };
    case 'SELECT_TIME_SLOT':
      return { ...state, timeSlot: action.payload, step: 4 };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 4) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'RESET':
      return { step: 1, jobType: null, customerData: null, timeSlot: null };
    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface UseSchedulerFlowReturn {
  // State
  state: SchedulerFlowState;
  
  // Derived state
  currentStepConfig: typeof SCHEDULER_STEP_CONFIG[number];
  isComplete: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Actions
  selectJobType: (jobType: JobType) => void;
  setCustomerData: (data: any) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

/**
 * Manages scheduler flow state for 4-step booking dialog.
 * Steps: Service -> Customer/Verification -> Availability -> Review
 * 
 * @example
 * ```tsx
 * const { state, selectJobType, setCustomerData, selectTimeSlot, prevStep } = useSchedulerFlow();
 * 
 * if (state.step === 1) {
 *   return <ServiceStep onSelect={selectJobType} />;
 * } else if (state.step === 2) {
 *   return <CustomerStep onSubmit={setCustomerData} />;
 * }
 * ```
 */
export function useSchedulerFlow(initialState?: Partial<SchedulerFlowState>): UseSchedulerFlowReturn {
  const [state, dispatch] = useReducer(schedulerFlowReducer, {
    step: 1,
    jobType: null,
    customerData: null,
    timeSlot: null,
    ...initialState,
  });

  // Actions
  const selectJobType = useCallback((jobType: JobType) => {
    dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
  }, []);

  const setCustomerData = useCallback((data: any) => {
    dispatch({ type: 'SET_CUSTOMER_DATA', payload: data });
  }, []);

  const selectTimeSlot = useCallback((slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Derived state
  const currentStepConfig = useMemo(
    () => SCHEDULER_STEP_CONFIG[state.step],
    [state.step]
  );

  const isComplete = useMemo(
    () => state.step === 4 && !!state.jobType && !!state.customerData && !!state.timeSlot,
    [state.step, state.jobType, state.customerData, state.timeSlot]
  );

  const canGoBack = useMemo(() => state.step > 1, [state.step]);
  const canGoForward = useMemo(() => state.step < 4, [state.step]);

  return {
    state,
    currentStepConfig,
    isComplete,
    canGoBack,
    canGoForward,
    selectJobType,
    setCustomerData,
    selectTimeSlot,
    nextStep,
    prevStep,
    reset,
  };
}
