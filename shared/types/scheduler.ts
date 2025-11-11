/**
 * Scheduler TypeScript Types - API Contracts & Cross-Tier DTOs
 * 
 * ONLY contains types shared between frontend and backend (API contracts).
 * UI-specific state (SchedulerState, actions) lives in src/modules/scheduler/types.ts
 */

// ============================================================================
// Time Slots & Availability (Discriminated Union)
// ============================================================================

/**
 * Base time slot structure shared by all slot types.
 */
interface BaseTimeSlot {
  id: string; // Unique identifier for the slot
  start: string; // ISO 8601 timestamp - 2-hour internal appointment start
  end: string; // ISO 8601 timestamp - 2-hour internal appointment end
  arrivalWindowStart: string; // ISO 8601 - 4-hour customer promise window start (REQUIRED)
  arrivalWindowEnd: string; // ISO 8601 - 4-hour customer promise window end (REQUIRED)
  timeLabel: string; // Human-readable label (e.g., "8:00 AM - 12:00 PM")
  proximityScore?: number; // Fuel optimization score (0-100, higher = better)
  nearbyJobs?: number; // Count of other jobs in the area
  zone?: string; // Geographic zone identifier
  technicianId?: number | null; // Pre-assigned technician for optimal routing
}

/**
 * Regular service time slot with 4-hour arrival windows.
 * Uses morning/afternoon/evening periods.
 */
export interface RegularTimeSlot extends BaseTimeSlot {
  isBackflow: false; // Regular service (REQUIRED for type discrimination)
  period: 'morning' | 'afternoon' | 'evening'; // Time of day classification
}

/**
 * Backflow testing time slot with 12-hour all-day window (8am-8pm).
 * Backflow ONLY supports all-day periods, not morning/afternoon/evening.
 */
export interface BackflowTimeSlot extends BaseTimeSlot {
  isBackflow: true; // Backflow testing marker
  period: 'all-day'; // Backflow uses 12-hour window, not AM/PM splits
}

/**
 * Discriminated union: Either regular or backflow time slot.
 * Use type guards: `if (slot.isBackflow) { ... }` to narrow type.
 */
export type TimeSlot = RegularTimeSlot | BackflowTimeSlot;

// ============================================================================
// Job Types & Services
// ============================================================================

export interface JobType {
  id: number; // ServiceTitan job type ID
  name: string; // Display name (e.g., "Plumbing Repair")
  code: string; // ServiceTitan job type code
  category?: string; // Optional category grouping
  duration?: number; // Expected duration in minutes
}

// ============================================================================
// Customer Information
// ============================================================================

/**
 * Customer data for scheduler booking.
 * CRITICAL: Email is OPTIONAL per ServiceTitan API.
 */
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email?: string; // OPTIONAL - not required by ServiceTitan
  phone: string; // REQUIRED
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  serviceTitanId?: number; // If existing customer
  customerTags?: string[];
  locationId?: number; // If booking for specific location
}

/**
 * Location selection for existing customers with multiple addresses.
 */
export interface CustomerLocation {
  id: number; // ServiceTitan location ID
  name?: string; // Optional location name
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

// ============================================================================
// Scheduler State Machine (MOVED to src/modules/scheduler/types.ts)
// ============================================================================
// UI-specific state/actions removed from cross-tier types.
// See src/modules/scheduler/types.ts for SchedulerState, SchedulerAction, etc.

// ============================================================================
// Scheduler API Contracts (Request/Response)
// ============================================================================

/**
 * POST /api/scheduler/smart-availability - Request body
 */
export interface SmartAvailabilityRequest {
  jobTypeId: number;
  customerZip: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
}

/**
 * Fuel optimization analytics returned with availability data.
 */
export interface OptimizationSummary {
  averageProximityScore: number; // Mean score across all slots
  totalSlots: number; // Total available slots
  highEfficiencySlots: number; // Count of slots with score > 60
  bestDate?: string; // Date with highest avg score (YYYY-MM-DD)
  bestSlotId?: string; // ID of single highest-scoring slot
}

/**
 * POST /api/scheduler/smart-availability - Response body
 */
export interface SmartAvailabilityResponse {
  success: boolean;
  slots: TimeSlot[]; // All available slots in date range
  optimization: OptimizationSummary; // Fuel optimization analytics
}

/**
 * POST /api/scheduler/book - Request body
 */
export interface BookAppointmentRequest {
  customerId: number;
  locationId: number;
  jobTypeId: number;
  timeSlot: TimeSlot; // Selected time slot with all metadata
  summary: string;
  specialInstructions?: string;
  campaignId: number; // REQUIRED per ServiceTitan API
  technicianId?: number; // Optional pre-assignment
}

/**
 * ServiceTitan booking error structure.
 */
export interface ServiceTitanBookingError {
  code: string; // Error code (e.g., 'DUPLICATE_APPOINTMENT', 'INVALID_SLOT')
  message: string; // Human-readable error
  details?: any; // Additional error context
}

/**
 * POST /api/scheduler/book - Success response
 */
export interface BookAppointmentResult {
  success: true;
  jobId: number;
  appointmentId: number;
  jobNumber: string; // Human-readable job number
  confirmationMessage: string; // Display to customer
}

/**
 * POST /api/scheduler/book - Error response
 */
export interface BookAppointmentError {
  success: false;
  error: ServiceTitanBookingError;
}

// ============================================================================
// Form Validation Schemas
// ============================================================================

/**
 * Minimum required fields for customer creation.
 * Email is explicitly optional.
 */
export interface CustomerFormData {
  firstName: string;
  lastName: string;
  phone: string; // REQUIRED
  email?: string; // OPTIONAL
  address: string;
  city: string;
  state: string;
  zip: string;
  smsConsent?: boolean; // A2P 10DLC compliance
  emailConsent?: boolean; // CAN-SPAM compliance
}

/**
 * Location creation form data.
 */
export interface LocationFormData {
  customerId: number;
  name?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email?: string; // OPTIONAL
}

// ============================================================================
// Scheduler Configuration
// ============================================================================

export interface SchedulerConfig {
  defaultJobTypeId: number; // Default plumbing service
  defaultCampaignId: number; // Tracking campaign ID
  businessUnitId: number; // ServiceTitan business unit
  minDaysOut: number; // Minimum days in advance for booking
  maxDaysOut: number; // Maximum days in advance to show
  allowBackflowBooking: boolean; // Enable backflow testing
  requireSmsConsent: boolean; // Enforce SMS opt-in
}
