/**
 * Account Form Validation Schemas
 * 
 * Zod schemas for account creation forms.
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
 * CRITICAL: ServiceTitan API accepts optional email (see crm.ts lines 102-111)
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
 * Base address schema (reusable)
 */
const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.enum(US_STATES, { errorMap: () => ({ message: 'Invalid state' }) }),
  zip: zipSchema,
});

/**
 * Account form validation schema
 * Includes conditional validation for separate service location
 */
export const accountFormSchema = z.object({
  // Customer Info
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: phoneSchema,
  email: emailSchema,
  customerType: z.enum(['Residential', 'Commercial']),
  
  // Billing Address
  billingStreet: z.string().min(1, 'Billing street is required'),
  billingUnit: z.string().optional(),
  billingCity: z.string().min(1, 'Billing city is required'),
  billingState: z.enum(US_STATES),
  billingZip: zipSchema,
  
  // Service Location Toggle
  hasSeparateServiceLocation: z.boolean(),
  
  // Service Location (conditionally required)
  serviceLocationName: z.string().optional(),
  serviceStreet: z.string().optional(),
  serviceUnit: z.string().optional(),
  serviceCity: z.string().optional(),
  serviceState: z.enum(US_STATES).optional(),
  serviceZip: zipSchema.optional(),
}).superRefine((data, ctx) => {
  // If separate service location is enabled, validate those fields
  if (data.hasSeparateServiceLocation) {
    if (!data.serviceLocationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Service location name is required',
        path: ['serviceLocationName'],
      });
    }
    if (!data.serviceStreet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Service street is required',
        path: ['serviceStreet'],
      });
    }
    if (!data.serviceCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Service city is required',
        path: ['serviceCity'],
      });
    }
    if (!data.serviceState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Service state is required',
        path: ['serviceState'],
      });
    }
    if (!data.serviceZip) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Service ZIP code is required',
        path: ['serviceZip'],
      });
    }
  }
});

/**
 * Type inference from schema
 */
export type AccountFormInput = z.infer<typeof accountFormSchema>;

/**
 * Default form values
 */
export const defaultAccountFormValues: Partial<AccountFormInput> = {
  customerType: 'Residential',
  hasSeparateServiceLocation: false,
  billingState: 'TX', // Default to Texas for Economy Plumbing
  serviceState: 'TX',
};
