/**
 * Scheduler Module - Public API
 * 
 * Centralized exports for the modular scheduler system.
 * Import from this barrel file to keep imports clean and consistent.
 */

// Components
export { SchedulerDialog } from './components/SchedulerDialog';
export type { SchedulerDialogProps } from './components/SchedulerDialog';

// Provider & Hooks (Advanced - for future complex flows)
export {
  SchedulerProvider,
  useScheduler,
  useSchedulerState,
  useSchedulerDispatch,
} from './SchedulerProvider';

// Custom Hooks (Lightweight - for simple dialogs)
export {
  useSmartAvailability,
  type UseSmartAvailabilityOptions,
  type UseSmartAvailabilityReturn,
} from './hooks/useSmartAvailability';

export {
  useSchedulerFlow,
  useLocationSelector,
  useVipGuard,
  SCHEDULER_STEP_CONFIG,
  type UseSchedulerFlowReturn,
  type UseLocationSelectorOptions,
  type UseLocationSelectorReturn,
  type UseVipGuardOptions,
  type UseVipGuardReturn,
} from './hooks';

// Types (re-export for convenience)
export type {
  // State & Actions
  SchedulerState,
  SchedulerAction,
  SchedulerStep,
  SchedulerConfig,
  
  // Provider Props
  SchedulerProviderProps,
  
  // Hook Returns
  UseSchedulerReturn,
  UseSchedulerStateReturn,
  UseSchedulerDispatchReturn,
} from './types';

export type { TimeSlot, JobType, CustomerInfo, CustomerLocation } from '@shared/types/scheduler';

// Default Config
export { DEFAULT_SCHEDULER_CONFIG } from './types';
