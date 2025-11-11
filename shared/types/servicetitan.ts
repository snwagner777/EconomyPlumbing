/**
 * ServiceTitan API TypeScript Types
 * 
 * Centralized type definitions for all ServiceTitan API responses and requests.
 * Source of truth for ServiceTitan data structures across the application.
 * 
 * CRITICAL: These types reflect the ACTUAL ServiceTitan API response structure.
 * Always verify against existing implementation in server/lib/servicetitan/ before modifying.
 */

// ============================================================================
// Authentication
// ============================================================================

export interface ServiceTitanToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number; // Timestamp when token expires (calculated)
}

// ============================================================================
// CRM - Customers & Locations
// ============================================================================

export interface ServiceTitanContact {
  id: number;
  type: string; // 'Phone', 'MobilePhone', 'Email', etc.
  value: string;
}

export interface ServiceTitanAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ServiceTitanCustomer {
  id: number;
  name: string;
  type: string; // 'Residential' | 'Commercial'
  address: ServiceTitanAddress;
  contacts: ServiceTitanContact[];
}

export interface ServiceTitanLocation {
  id: number;
  customerId: number;
  name?: string;
  address: ServiceTitanAddress;
  contacts: ServiceTitanContact[];
}

// ============================================================================
// CRM - Create/Update Operations
// ============================================================================

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string; // OPTIONAL per ServiceTitan API
  customerType?: 'Residential' | 'Commercial';
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
  serviceLocation?: {
    name: string;
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface CreateLocationData {
  customerId: number;
  name?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email?: string; // OPTIONAL
}

// ============================================================================
// Jobs & Appointments
// ============================================================================

export interface ServiceTitanJob {
  id: number;
  jobNumber: string;
  customerId: number;
  locationId: number;
  businessUnitId: number;
  jobTypeId: number;
  summary: string;
  status: string;
  appointmentCount: number;
  firstAppointmentId: number;
  createdOn: string;
}

export interface ServiceTitanAppointment {
  id: number;
  jobId: number; // CRITICAL: Appointments have jobId, NOT locationId
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
  arrivalWindowStart: string; // Customer promise window start
  arrivalWindowEnd: string; // Customer promise window end
  status: string;
}

export interface CreateJobData {
  customerId: number;
  locationId: number;
  businessUnitId: number;
  jobTypeId: number;
  summary: string;
  preferredDate?: Date;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  arrivalWindowStart?: string; // ISO timestamp for customer promise (e.g., "8-12")
  arrivalWindowEnd?: string; // ISO timestamp for customer promise
  appointmentStart?: string; // ISO timestamp for actual scheduled slot (e.g., "10-12")
  appointmentEnd?: string; // ISO timestamp for actual scheduled slot
  specialInstructions?: string;
  bookingProviderId?: number;
  campaignId: number; // REQUIRED per API docs
  technicianId?: number; // Optional technician assignment
}

// ============================================================================
// Estimates & Pricebook
// ============================================================================

export interface EstimateItem {
  id: number;
  type: 'Service' | 'Material' | 'Equipment';
  skuId: number;
  skuName: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  total: number;
  memberPrice?: number;
  soldHours?: number; // For services - hours of work sold
}

export interface ServiceTitanEstimate {
  id: number;
  jobId?: number; // Estimates can be attached to a job
  projectId?: number;
  name: string;
  estimateNumber: string;
  summary?: string;
  jobNumber?: string;
  expiresOn?: string;
  status: 'Open' | 'Sold' | 'Dismissed';
  soldBy?: string;
  soldOn?: string;
  items: EstimateItem[];
  subtotal: number;
  total: number;
  active: boolean;
}

export interface PricebookImage {
  url: string;
  imageId: number;
}

export interface PricebookItem {
  id: number;
  code: string;
  displayName: string;
  description: string;
  price: number;
  memberPrice?: number;
  type: 'Service' | 'Material' | 'Equipment';
  images?: PricebookImage[];
}

// ============================================================================
// Enriched Types (Backend Joins)
// ============================================================================

/**
 * Enriched appointment with location data from job lookup.
 * Backend performs job API join to attach locationId.
 */
export interface EnrichedAppointment extends ServiceTitanAppointment {
  locationId: number; // Attached via backend job lookup (not in raw API response)
}

/**
 * Enriched estimate with location data from job lookup.
 * Backend performs job API join to attach locationId.
 */
export interface EnrichedEstimate extends ServiceTitanEstimate {
  locationId?: number; // Attached via backend job lookup when jobId exists
}

// ============================================================================
// Portal-Specific Types
// ============================================================================

export interface JobWithLocation {
  id: number;
  jobNumber: string;
  appointmentId: number;
  appointmentStart: string;
  appointmentEnd: string;
  locationId: number;
  summary: string;
  status: string;
}

export interface CustomerAccount {
  customerId: number;
  customerName: string;
  customerType: string;
  locations: ServiceTitanLocation[];
}
