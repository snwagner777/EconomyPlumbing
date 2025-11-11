/**
 * useAccountMutation Hook
 * 
 * Mutation hook for creating ServiceTitan accounts (customers).
 * Handles API communication, error handling, and cache invalidation.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { AccountFormData, AccountCreationResult, AccountCreationError } from '../types';

/**
 * API request format for /api/scheduler/ensure-customer
 * Matches the structure in app/api/scheduler/ensure-customer/route.ts
 */
interface EnsureCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  customerType: 'Residential' | 'Commercial';
  // Billing address fields (flattened)
  address: string; // street
  unit?: string;
  city: string;
  state: string;
  zip: string;
  // Service location fields (optional, flattened)
  sameAsBilling?: boolean;
  locationName?: string;
  locationAddress?: string; // street
  locationUnit?: string;
  locationCity?: string;
  locationState?: string;
  locationZip?: string;
}

/**
 * Transform form data to API request format
 */
function transformFormData(data: AccountFormData): EnsureCustomerRequest {
  const request: EnsureCustomerRequest = {
    name: data.name,
    phone: data.phone,
    email: data.email || undefined,
    customerType: data.customerType,
    // Billing address (flattened)
    address: data.billingStreet,
    unit: data.billingUnit,
    city: data.billingCity,
    state: data.billingState,
    zip: data.billingZip,
    // Service location same as billing by default
    sameAsBilling: !data.hasSeparateServiceLocation,
  };
  
  // Add separate service location fields if enabled
  if (data.hasSeparateServiceLocation && data.serviceStreet) {
    request.locationName = data.serviceLocationName || undefined;
    request.locationAddress = data.serviceStreet;
    request.locationUnit = data.serviceUnit;
    request.locationCity = data.serviceCity!;
    request.locationState = data.serviceState!;
    request.locationZip = data.serviceZip!;
  }
  
  return request;
}

/**
 * Hook for creating accounts (ServiceTitan customers)
 */
export function useAccountMutation() {
  const queryClient = useQueryClient();
  
  return useMutation<AccountCreationResult, Error, AccountFormData>({
    mutationFn: async (formData: AccountFormData) => {
      const request = transformFormData(formData);
      
      // Call ServiceTitan account creation endpoint
      const response = await apiRequest('POST', '/api/scheduler/ensure-customer', request);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }
      
      return response.json() as Promise<AccountCreationResult>;
    },
    
    onSuccess: (data) => {
      // Invalidate customer-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/locations'] });
      
      console.log('[useAccountMutation] Account created successfully:', data.customer.id);
    },
    
    onError: (error) => {
      console.error('[useAccountMutation] Account creation failed:', error);
    },
  });
}
