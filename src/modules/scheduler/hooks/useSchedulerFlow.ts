/**
 * useSchedulerFlow Hook
 * 
 * Manages simple 3-step scheduler flow state for customer portal dialog.
 * Lightweight alternative to full SchedulerProvider context.
 * 
 * Can later be adapted to consume SchedulerProvider context when advanced features are needed.
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { JobType, TimeSlot } from '@shared/types/scheduler';
import { Wrench, Calendar, CheckCircle2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SchedulerFlowState {
  step: number; // 1 = service, 2 = availability, 3 = review
  jobType: JobType | null;
  timeSlot: TimeSlot | null;
}

type SchedulerFlowAction =
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
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
  selectTimeSlot: (slot: TimeSlot) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

/**
 * Manages scheduler flow state for simple 3-step booking dialog.
 * 
 * @example
 * ```tsx
 * const { state, selectJobType, selectTimeSlot, prevStep } = useSchedulerFlow();
 * 
 * if (state.step === 1) {
 *   return <ServiceStep onSelect={selectJobType} />;
 * }
 * ```
 */
export function useSchedulerFlow(): UseSchedulerFlowReturn {
  const [state, dispatch] = useReducer(schedulerFlowReducer, {
    step: 1,
    jobType: null,
    timeSlot: null,
  });

  // Actions
  const selectJobType = useCallback((jobType: JobType) => {
    dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
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
    () => state.step === 3 && !!state.jobType && !!state.timeSlot,
    [state.step, state.jobType, state.timeSlot]
  );

  const canGoBack = useMemo(() => state.step > 1, [state.step]);
  const canGoForward = useMemo(() => state.step < 3, [state.step]);

  return {
    state,
    currentStepConfig,
    isComplete,
    canGoBack,
    canGoForward,
    selectJobType,
    selectTimeSlot,
    nextStep,
    prevStep,
    reset,
  };
}
