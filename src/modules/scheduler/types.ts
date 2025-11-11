/**
 * Scheduler Module - Frontend Types
 * 
 * UI-specific state, actions, and types for the scheduler system.
 * These types are ONLY used by frontend components (not backend/API routes).
 * 
 * API contracts live in shared/types/scheduler.ts
 */

import type {
  TimeSlot,
  JobType,
  CustomerInfo,
  CustomerLocation,
} from '@shared/types/scheduler';

// ============================================================================
// Scheduler Steps & Flow
// ============================================================================

export type SchedulerStep = 
  | 'ai-suggestion' // AI-powered problem diagnosis (optional)
  | 'service' // Service selection
  | 'customer' // Customer info collection
  | 'availability' // Time slot selection
  | 'review'; // Final confirmation

// ============================================================================
// Scheduler State Machine
// ============================================================================

/**
 * Complete scheduler state managed by SchedulerProvider.
 * All wizard/dialog implementations share this unified state structure.
 */
export interface SchedulerState {
  // Current step in the flow
  currentStep: SchedulerStep;
  
  // Selected service/job type
  jobType: JobType | null;
  
  // Selected time slot
  timeSlot: TimeSlot | null;
  
  // Customer information
  customerInfo: CustomerInfo | null;
  
  // Optional special instructions
  specialInstructions?: string;
  
  // Customer type flags
  isExistingCustomer: boolean;
  serviceTitanCustomerId?: number; // If existing customer found
  
  // Location selection (for multi-location customers)
  selectedLocationId?: number;
  availableLocations?: CustomerLocation[];
  
  // AI suggestion state (optional)
  aiSuggestion?: {
    problem: string;
    recommendedServices: JobType[];
    confidence: number;
  };
  
  // Booking state
  isSubmitting: boolean;
  bookingError?: string;
  bookingSuccess?: {
    jobId: number;
    appointmentId: number;
    jobNumber: string;
  };
}

// ============================================================================
// Scheduler Actions (Reducer Pattern)
// ============================================================================

export type SchedulerAction =
  // Step navigation
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: SchedulerStep }
  | { type: 'RESET' }
  
  // Service selection
  | { type: 'SELECT_JOB_TYPE'; payload: JobType }
  | { type: 'CLEAR_JOB_TYPE' }
  
  // Time slot selection
  | { type: 'SELECT_TIME_SLOT'; payload: TimeSlot }
  | { type: 'CLEAR_TIME_SLOT' }
  
  // Customer information
  | { type: 'SET_CUSTOMER_INFO'; payload: CustomerInfo }
  | { type: 'SET_EXISTING_CUSTOMER'; payload: { customerId: number; info: CustomerInfo } }
  | { type: 'CLEAR_CUSTOMER_INFO' }
  
  // Location selection
  | { type: 'SET_AVAILABLE_LOCATIONS'; payload: CustomerLocation[] }
  | { type: 'SELECT_LOCATION'; payload: number } // locationId
  
  // Additional details
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  
  // AI suggestions
  | { type: 'SET_AI_SUGGESTION'; payload: {
      problem: string;
      recommendedServices: JobType[];
      confidence: number;
    }}
  | { type: 'CLEAR_AI_SUGGESTION' }
  
  // Booking state
  | { type: 'START_BOOKING' }
  | { type: 'BOOKING_SUCCESS'; payload: {
      jobId: number;
      appointmentId: number;
      jobNumber: string;
    }}
  | { type: 'BOOKING_ERROR'; payload: string }
  | { type: 'CLEAR_BOOKING_ERROR' };

// ============================================================================
// Scheduler Configuration
// ============================================================================

/**
 * Configuration for scheduler behavior (can be overridden per instance).
 */
export interface SchedulerConfig {
  // ServiceTitan IDs
  defaultJobTypeId: number; // Default plumbing service (140551181)
  defaultCampaignId: number; // Tracking campaign ID
  businessUnitId: number; // ServiceTitan business unit
  
  // Date range constraints
  minDaysOut: number; // Minimum days in advance for booking (default: 0 = today)
  maxDaysOut: number; // Maximum days in advance to show (default: 45)
  
  // Feature flags
  allowBackflowBooking: boolean; // Enable backflow testing
  enableAISuggestions: boolean; // Show AI problem diagnosis step
  requireSmsConsent: boolean; // Enforce SMS opt-in checkbox
  requireEmailConsent: boolean; // Enforce email opt-in checkbox
  
  // Initial step (allows skipping AI suggestion, customer lookup, etc.)
  initialStep?: SchedulerStep;
  
  // Pre-filled data (for reschedule, existing customer flows)
  prefillCustomer?: CustomerInfo;
  prefillLocation?: number; // locationId
  prefillJobType?: JobType;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  defaultJobTypeId: 140551181, // Standard plumbing
  defaultCampaignId: 140551181, // Default campaign
  businessUnitId: 140551181, // Default business unit
  minDaysOut: 0, // Allow same-day booking
  maxDaysOut: 45, // 45 days out
  allowBackflowBooking: true,
  enableAISuggestions: false, // AI step optional/hidden by default
  requireSmsConsent: true, // A2P 10DLC compliance
  requireEmailConsent: false, // Email consent optional
  initialStep: 'service', // Start at service selection
};

// ============================================================================
// Scheduler Context Props
// ============================================================================

/**
 * Props for SchedulerProvider component.
 */
export interface SchedulerProviderProps {
  children: React.ReactNode;
  config?: Partial<SchedulerConfig>; // Override default config
  onComplete?: (result: {
    jobId: number;
    appointmentId: number;
    jobNumber: string;
  }) => void; // Callback after successful booking
  onCancel?: () => void; // Callback when user cancels
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useSchedulerState hook.
 */
export interface UseSchedulerStateReturn {
  state: SchedulerState;
  config: SchedulerConfig;
}

/**
 * Return type for useSchedulerDispatch hook.
 */
export interface UseSchedulerDispatchReturn {
  dispatch: React.Dispatch<SchedulerAction>;
  // Convenience methods (optional - can use dispatch directly)
  selectJobType: (jobType: JobType) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  setCustomerInfo: (info: CustomerInfo) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

/**
 * Combined return type for useScheduler hook (state + dispatch).
 */
export interface UseSchedulerReturn extends UseSchedulerStateReturn, UseSchedulerDispatchReturn {}
