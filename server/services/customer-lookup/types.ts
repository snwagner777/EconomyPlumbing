/**
 * Customer Lookup Service - Shared Types
 * 
 * Common types used across lookup adapters and service
 */

export type LookupSource = 'xlsx-only' | 'servicetitan-only' | 'hybrid-prefer-xlsx' | 'hybrid-prefer-servicetitan';

export interface CustomerLookupOptions {
  phone?: string;
  email?: string;
  source: LookupSource;
  createPlaceholderIfMissing?: boolean;
  includeInactive?: boolean;
}

export interface CustomerMatch {
  customerId: number;
  serviceTitanId: number;
  name: string;
  email: string | null;
  phone: string | null;
  type: 'Residential' | 'Commercial';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  locations?: Array<{
    id: number;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    isPrimary?: boolean;
  }>;
  customerTags?: string[];
  source: 'xlsx' | 'servicetitan';
}

export interface CustomerLookupResult {
  found: boolean;
  matches: CustomerMatch[];
  isPlaceholder?: boolean;
  error?: {
    type: 'validation' | 'servicetitan_error' | 'database_error' | 'unknown';
    message: string;
    retryable: boolean;
  };
}
