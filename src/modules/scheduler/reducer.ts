/**
 * Scheduler State Reducer
 * 
 * Pure reducer function for scheduler state machine.
 * Handles all state transitions for the unified scheduler system.
 */

import type {
  SchedulerState,
  SchedulerAction,
  SchedulerStep,
  SchedulerConfig,
} from './types';

/**
 * Get enabled steps based on config.
 * Dynamically builds step array based on feature flags.
 */
function getEnabledSteps(config: SchedulerConfig): SchedulerStep[] {
  const steps: SchedulerStep[] = [];
  
  // Add AI suggestion step if enabled
  if (config.enableAISuggestions) {
    steps.push('ai-suggestion');
  }
  
  // Core steps (always included)
  steps.push('service', 'customer', 'availability', 'review');
  
  return steps;
}

/**
 * Get initial state for scheduler.
 * Validates that initialStep is in the enabled steps list.
 */
export function getInitialState(config: SchedulerConfig): SchedulerState {
  const enabledSteps = getEnabledSteps(config);
  const requestedInitialStep = config.initialStep || 'service';
  
  // Validate initialStep is actually enabled, fall back to first enabled step if not
  const initialStep = enabledSteps.includes(requestedInitialStep)
    ? requestedInitialStep
    : enabledSteps[0];
  
  // Log warning if config mismatch detected
  if (requestedInitialStep !== initialStep) {
    console.warn(
      `[Scheduler] Requested initialStep "${requestedInitialStep}" is not enabled. ` +
      `Using "${initialStep}" instead. Check your config.enableAISuggestions setting.`
    );
  }
  
  return {
    currentStep: initialStep,
    jobType: config.prefillJobType || null,
    timeSlot: null,
    customerInfo: config.prefillCustomer || null,
    specialInstructions: undefined,
    isExistingCustomer: Boolean(config.prefillCustomer?.serviceTitanId),
    serviceTitanCustomerId: config.prefillCustomer?.serviceTitanId,
    selectedLocationId: config.prefillLocation,
    availableLocations: undefined,
    aiSuggestion: undefined,
    isSubmitting: false,
    bookingError: undefined,
    bookingSuccess: undefined,
  };
}

/**
 * Scheduler reducer - handles all state transitions.
 * 
 * IMPORTANT: This reducer needs config to build dynamic step arrays,
 * but reducers should be pure. Pass config via action payload for NEXT/PREV.
 */
export function schedulerReducer(
  state: SchedulerState,
  action: SchedulerAction,
  config?: SchedulerConfig // Optional config for step navigation
): SchedulerState {
  switch (action.type) {
    // ========================================================================
    // Step Navigation (requires config to build dynamic step list)
    // ========================================================================
    
    case 'NEXT_STEP': {
      // Build enabled steps dynamically based on config
      const steps = config ? getEnabledSteps(config) : (['service', 'customer', 'availability', 'review'] as SchedulerStep[]);
      const currentIndex = steps.indexOf(state.currentStep);
      const nextStep = (steps[currentIndex + 1] as SchedulerStep | undefined) || state.currentStep;
      
      return {
        ...state,
        currentStep: nextStep,
      };
    }
    
    case 'PREV_STEP': {
      // Build enabled steps dynamically based on config
      const steps = config ? getEnabledSteps(config) : (['service', 'customer', 'availability', 'review'] as SchedulerStep[]);
      const currentIndex = steps.indexOf(state.currentStep);
      const prevStep = (steps[currentIndex - 1] as SchedulerStep | undefined) || state.currentStep;
      
      return {
        ...state,
        currentStep: prevStep,
      };
    }
    
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    
    case 'RESET':
      return {
        currentStep: 'service',
        jobType: null,
        timeSlot: null,
        customerInfo: null,
        specialInstructions: undefined,
        isExistingCustomer: false,
        serviceTitanCustomerId: undefined,
        selectedLocationId: undefined,
        availableLocations: undefined,
        aiSuggestion: undefined,
        isSubmitting: false,
        bookingError: undefined,
        bookingSuccess: undefined,
      };
    
    // ========================================================================
    // Service Selection
    // ========================================================================
    
    case 'SELECT_JOB_TYPE':
      return {
        ...state,
        jobType: action.payload,
      };
    
    case 'CLEAR_JOB_TYPE':
      return {
        ...state,
        jobType: null,
      };
    
    // ========================================================================
    // Time Slot Selection
    // ========================================================================
    
    case 'SELECT_TIME_SLOT':
      return {
        ...state,
        timeSlot: action.payload,
      };
    
    case 'CLEAR_TIME_SLOT':
      return {
        ...state,
        timeSlot: null,
      };
    
    // ========================================================================
    // Customer Information
    // ========================================================================
    
    case 'SET_CUSTOMER_INFO':
      return {
        ...state,
        customerInfo: action.payload,
        isExistingCustomer: false,
        serviceTitanCustomerId: undefined,
      };
    
    case 'SET_EXISTING_CUSTOMER':
      return {
        ...state,
        customerInfo: action.payload.info,
        isExistingCustomer: true,
        serviceTitanCustomerId: action.payload.customerId,
      };
    
    case 'CLEAR_CUSTOMER_INFO':
      return {
        ...state,
        customerInfo: null,
        isExistingCustomer: false,
        serviceTitanCustomerId: undefined,
      };
    
    // ========================================================================
    // Location Selection
    // ========================================================================
    
    case 'SET_AVAILABLE_LOCATIONS':
      return {
        ...state,
        availableLocations: action.payload,
      };
    
    case 'SELECT_LOCATION':
      return {
        ...state,
        selectedLocationId: action.payload,
      };
    
    // ========================================================================
    // Additional Details
    // ========================================================================
    
    case 'SET_SPECIAL_INSTRUCTIONS':
      return {
        ...state,
        specialInstructions: action.payload,
      };
    
    // ========================================================================
    // AI Suggestions
    // ========================================================================
    
    case 'SET_AI_SUGGESTION':
      return {
        ...state,
        aiSuggestion: action.payload,
      };
    
    case 'CLEAR_AI_SUGGESTION':
      return {
        ...state,
        aiSuggestion: undefined,
      };
    
    // ========================================================================
    // Booking State
    // ========================================================================
    
    case 'START_BOOKING':
      return {
        ...state,
        isSubmitting: true,
        bookingError: undefined,
      };
    
    case 'BOOKING_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        bookingSuccess: action.payload,
        bookingError: undefined,
      };
    
    case 'BOOKING_ERROR':
      return {
        ...state,
        isSubmitting: false,
        bookingError: action.payload,
      };
    
    case 'CLEAR_BOOKING_ERROR':
      return {
        ...state,
        bookingError: undefined,
      };
    
    default:
      return state;
  }
}
