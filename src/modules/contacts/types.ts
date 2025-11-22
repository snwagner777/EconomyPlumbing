/**
 * Contacts Module - Type Definitions
 * 
 * Shared types and validation schemas for managing customer and location contacts
 * in the customer portal. Contacts are always tied to a parent (customer or location).
 */

import { z } from 'zod';

// ============================================================================
// Contact Form Data Types
// ============================================================================

/**
 * Contact types supported by ServiceTitan
 */
export const CONTACT_TYPES = ['Phone', 'MobilePhone', 'Email'] as const;
export type ContactType = typeof CONTACT_TYPES[number];

/**
 * Base contact form data
 */
export interface ContactFormData {
  type: ContactType;
  value: string;
  memo?: string; // Optional label like "Work", "Home", "Personal"
}

/**
 * Customer contact submission (includes customerId)
 */
export interface CustomerContactFormData extends ContactFormData {
  customerId: number;
}

/**
 * Location contact submission (includes locationId + customerId + name)
 * Customer ID required for proper cache invalidation
 */
export interface LocationContactFormData extends ContactFormData {
  customerId: number; // Parent customer ID for cache invalidation
  locationId: number;
  name?: string; // Contact person name for location
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Base contact schema with type-specific validation
 */
export const contactFormSchema = z.object({
  type: z.enum(CONTACT_TYPES, {
    required_error: 'Contact type is required',
  }),
  value: z.string().min(1, 'Contact value is required'),
  memo: z.string().optional(),
  name: z.string().optional(), // Optional contact person name (used for locations)
}).refine((data) => {
  // Email validation
  if (data.type === 'Email') {
    return z.string().email().safeParse(data.value).success;
  }
  // Phone validation (basic - allows various formats)
  if (data.type === 'Phone' || data.type === 'MobilePhone') {
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    return phoneRegex.test(data.value) && data.value.replace(/\D/g, '').length >= 10;
  }
  return true;
}, {
  message: 'Invalid contact value for selected type',
  path: ['value'],
});

/**
 * Customer contact submission schema
 */
export const customerContactSchema = z.object({
  customerId: z.number().positive('Customer ID is required'),
  type: z.enum(CONTACT_TYPES, {
    required_error: 'Contact type is required',
  }),
  value: z.string().min(1, 'Contact value is required'),
  memo: z.string().optional(),
}).refine((data) => {
  // Email validation
  if (data.type === 'Email') {
    return z.string().email().safeParse(data.value).success;
  }
  // Phone validation (basic - allows various formats)
  if (data.type === 'Phone' || data.type === 'MobilePhone') {
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    return phoneRegex.test(data.value) && data.value.replace(/\D/g, '').length >= 10;
  }
  return true;
}, {
  message: 'Invalid contact value for selected type',
  path: ['value'],
});

/**
 * Location contact submission schema
 */
export const locationContactSchema = z.object({
  customerId: z.number().positive('Customer ID is required'),
  locationId: z.number().positive('Location ID is required'),
  type: z.enum(CONTACT_TYPES, {
    required_error: 'Contact type is required',
  }),
  value: z.string().min(1, 'Contact value is required'),
  memo: z.string().optional(),
  name: z.string().optional(), // Contact person name
}).refine((data) => {
  // Email validation
  if (data.type === 'Email') {
    return z.string().email().safeParse(data.value).success;
  }
  // Phone validation (basic - allows various formats)
  if (data.type === 'Phone' || data.type === 'MobilePhone') {
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    return phoneRegex.test(data.value) && data.value.replace(/\D/g, '').length >= 10;
  }
  return true;
}, {
  message: 'Invalid contact value for selected type',
  path: ['value'],
});

// ============================================================================
// Type Inference
// ============================================================================

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type CustomerContactValues = z.infer<typeof customerContactSchema>;
export type LocationContactValues = z.infer<typeof locationContactSchema>;

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get user-friendly label for contact type
 */
export function getContactTypeLabel(type: ContactType): string {
  switch (type) {
    case 'Phone':
      return 'Phone';
    case 'MobilePhone':
      return 'Mobile Phone';
    case 'Email':
      return 'Email';
    default:
      return type;
  }
}

/**
 * Get placeholder text for contact value input
 */
export function getContactPlaceholder(type: ContactType): string {
  switch (type) {
    case 'Email':
      return 'you@example.com';
    case 'Phone':
    case 'MobilePhone':
      return '(512) 555-1234';
    default:
      return '';
  }
}

/**
 * Get input type for contact value field
 */
export function getContactInputType(type: ContactType): 'email' | 'tel' | 'text' {
  switch (type) {
    case 'Email':
      return 'email';
    case 'Phone':
    case 'MobilePhone':
      return 'tel';
    default:
      return 'text';
  }
}
