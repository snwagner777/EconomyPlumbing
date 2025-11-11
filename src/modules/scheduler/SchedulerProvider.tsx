/**
 * SchedulerProvider - Unified State Management for Scheduler System
 * 
 * Provides centralized state and dispatch for all scheduler implementations:
 * - SchedulerFlow (homepage widget)
 * - SchedulerDialog (customer portal reschedule)
 * - AI Chatbot scheduler
 * - Future implementations
 * 
 * ARCHITECTURE: Eliminates duplicate reducers and state management across components.
 * All scheduler UI now shares a single source of truth.
 */

'use client';

import { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { schedulerReducer, getInitialState } from './reducer';
import type {
  SchedulerState,
  SchedulerAction,
  SchedulerConfig,
  SchedulerProviderProps,
  UseSchedulerStateReturn,
  UseSchedulerDispatchReturn,
  UseSchedulerReturn,
} from './types';

import type {
  JobType,
  TimeSlot,
  CustomerInfo,
} from '@shared/types/scheduler';

// Import DEFAULT_SCHEDULER_CONFIG from types
import { DEFAULT_SCHEDULER_CONFIG as DEFAULT_CONFIG } from './types';

// ============================================================================
// Contexts
// ============================================================================

const SchedulerStateContext = createContext<SchedulerState | null>(null);
const SchedulerDispatchContext = createContext<React.Dispatch<SchedulerAction> | null>(null);
const SchedulerConfigContext = createContext<SchedulerConfig>(DEFAULT_CONFIG);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * SchedulerProvider - Wrap your scheduler UI with this provider.
 * 
 * @example
 * ```tsx
 * <SchedulerProvider
 *   config={{
 *     initialStep: 'availability', // Skip to availability
 *     prefillCustomer: existingCustomerData,
 *   }}
 *   onComplete={(result) => {
 *     console.log('Booking complete:', result.jobNumber);
 *   }}
 * >
 *   <SchedulerFlow />
 * </SchedulerProvider>
 * ```
 */
export function SchedulerProvider({
  children,
  config: userConfig,
  onComplete,
  onCancel,
}: SchedulerProviderProps) {
  // Merge user config with defaults
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );
  
  // Initialize reducer with config-driven initial state
  // Wrap reducer to inject config for step navigation
  const reducerWithConfig = useCallback(
    (state: SchedulerState, action: SchedulerAction) => 
      schedulerReducer(state, action, config),
    [config]
  );
  
  const [state, dispatch] = useReducer(
    reducerWithConfig,
    config,
    getInitialState
  );
  
  // Track if onComplete has been called to prevent duplicate calls
  const onCompleteCalledRef = useRef(false);
  
  // Trigger onComplete callback when booking succeeds (in effect to avoid render violations)
  useEffect(() => {
    if (state.bookingSuccess && onComplete && !onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete(state.bookingSuccess);
    }
  }, [state.bookingSuccess, onComplete]);
  
  // Reset onCompleteCalledRef when state is reset
  useEffect(() => {
    if (!state.bookingSuccess) {
      onCompleteCalledRef.current = false;
    }
  }, [state.bookingSuccess]);
  
  return (
    <SchedulerConfigContext.Provider value={config}>
      <SchedulerStateContext.Provider value={state}>
        <SchedulerDispatchContext.Provider value={dispatch}>
          {children}
        </SchedulerDispatchContext.Provider>
      </SchedulerStateContext.Provider>
    </SchedulerConfigContext.Provider>
  );
}

// ============================================================================
// Hooks - Typed access to scheduler context
// ============================================================================

/**
 * useSchedulerState - Access current scheduler state.
 * 
 * @example
 * ```tsx
 * const { state, config } = useSchedulerState();
 * console.log(state.currentStep); // 'service', 'availability', etc.
 * ```
 */
export function useSchedulerState(): UseSchedulerStateReturn {
  const state = useContext(SchedulerStateContext);
  const config = useContext(SchedulerConfigContext);
  
  if (!state) {
    throw new Error('useSchedulerState must be used within SchedulerProvider');
  }
  
  return { state, config };
}

/**
 * useSchedulerDispatch - Access dispatch and convenience methods.
 * 
 * @example
 * ```tsx
 * const { dispatch, selectJobType, nextStep } = useSchedulerDispatch();
 * 
 * // Option 1: Use dispatch directly
 * dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType });
 * 
 * // Option 2: Use convenience method
 * selectJobType(jobType);
 * ```
 */
export function useSchedulerDispatch(): UseSchedulerDispatchReturn {
  const dispatch = useContext(SchedulerDispatchContext);
  
  if (!dispatch) {
    throw new Error('useSchedulerDispatch must be used within SchedulerProvider');
  }
  
  // Convenience methods (memoized to prevent re-renders)
  const selectJobType = useCallback(
    (jobType: JobType) => dispatch({ type: 'SELECT_JOB_TYPE', payload: jobType }),
    [dispatch]
  );
  
  const selectTimeSlot = useCallback(
    (slot: TimeSlot) => dispatch({ type: 'SELECT_TIME_SLOT', payload: slot }),
    [dispatch]
  );
  
  const setCustomerInfo = useCallback(
    (info: CustomerInfo) => dispatch({ type: 'SET_CUSTOMER_INFO', payload: info }),
    [dispatch]
  );
  
  const nextStep = useCallback(
    () => dispatch({ type: 'NEXT_STEP' }),
    [dispatch]
  );
  
  const prevStep = useCallback(
    () => dispatch({ type: 'PREV_STEP' }),
    [dispatch]
  );
  
  const reset = useCallback(
    () => dispatch({ type: 'RESET' }),
    [dispatch]
  );
  
  return {
    dispatch,
    selectJobType,
    selectTimeSlot,
    setCustomerInfo,
    nextStep,
    prevStep,
    reset,
  };
}

/**
 * useScheduler - Combined hook for state + dispatch.
 * Convenience hook for components that need both.
 * 
 * @example
 * ```tsx
 * const { state, config, dispatch, selectJobType, nextStep } = useScheduler();
 * ```
 */
export function useScheduler(): UseSchedulerReturn {
  const stateProps = useSchedulerState();
  const dispatchProps = useSchedulerDispatch();
  
  return {
    ...stateProps,
    ...dispatchProps,
  };
}
