/**
 * Location Form Validation Schemas
 * 
 * Zod schemas for location creation forms.
 * Aligned with ServiceTitan CRM API requirements.
 */

import { z } from 'zod';

/**
 * US States for dropdown validation
 */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

/**
 * Phone number validation - accepts various formats
 */
const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\d\s\-\(\)\+\.]+$/, 'Invalid phone number format')
  .transform(val => val.replace(/\D/g, '')); // Strip non-digits for API

/**
 * Email validation - optional but validated if provided
 * CRITICAL: ServiceTitan API accepts optional email (see crm.ts lines 271-274)
 */
const emailSchema = z.string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''));

/**
 * ZIP code validation
 */
const zipSchema = z.string()
  .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits (or 5+4 format)');

/**
 * Location form validation schema
 */
export const locationFormSchema = z.object({
  // Customer association (required - must be ServiceTitan customer ID)
  customerId: z.number().positive('Customer ID is required'),
  
  // Location name (optional - API will generate from address if not provided)
  name: z.string().optional(),
  
  // Address
  street: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.enum(US_STATES),
  zip: zipSchema,
  
  // Contact info
  phone: phoneSchema,
  email: emailSchema,
});

/**
 * Type inference from schema
 */
export type LocationFormInput = z.infer<typeof locationFormSchema>;

/**
 * Default form values
 */
export const defaultLocationFormValues: Partial<LocationFormInput> = {
  state: 'TX', // Default to Texas for Economy Plumbing
};
