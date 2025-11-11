/**
 * Locations Module - Public API
 * 
 * Exports for location (service address) creation and management.
 */

export { LocationForm } from './LocationForm';
export { useLocationMutation } from './hooks/useLocationMutation';
export { locationFormSchema, defaultLocationFormValues, US_STATES } from './validation';
export type {
  LocationFormData,
  LocationCreationResult,
  LocationCreationError,
} from './types';
export type { LocationFormInput } from './validation';
export type { LocationFormProps } from './LocationForm';
