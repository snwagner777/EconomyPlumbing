/**
 * useLocationMutation Hook
 * 
 * Mutation hook for creating ServiceTitan locations (service addresses).
 * Handles API communication, error handling, and cache invalidation.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { LocationFormData, LocationCreationResult, LocationCreationError } from '../types';

/**
 * API request format for /api/scheduler/create-location
 * Matches the structure in app/api/scheduler/create-location/route.ts
 */
interface CreateLocationRequest {
  customerId: number;
  name?: string;
  address: {
    street: string;
    unit?: string; // CRITICAL: Include unit field
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email?: string;
}

/**
 * Transform form data to API request format
 */
function transformFormData(data: LocationFormData): CreateLocationRequest {
  return {
    customerId: data.customerId,
    name: data.name,
    address: {
      street: data.street,
      unit: data.unit, // CRITICAL: Preserve unit field for apartments/suites
      city: data.city,
      state: data.state,
      zip: data.zip,
    },
    phone: data.phone,
    email: data.email || undefined,
  };
}

/**
 * Hook for creating locations (ServiceTitan service addresses)
 */
export function useLocationMutation() {
  const queryClient = useQueryClient();
  
  return useMutation<LocationCreationResult, Error, LocationFormData>({
    mutationFn: async (formData: LocationFormData) => {
      const request = transformFormData(formData);
      
      // Call ServiceTitan location creation endpoint
      const response = await apiRequest('POST', '/api/scheduler/create-location', request);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create location');
      }
      
      return response.json() as Promise<LocationCreationResult>;
    },
    
    onSuccess: (data, variables) => {
      // Invalidate location queries for this customer
      queryClient.invalidateQueries({
        queryKey: ['/api/servicetitan/locations', variables.customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/servicetitan/locations'],
      });
      
      console.log('[useLocationMutation] Location created successfully:', data.location.id);
    },
    
    onError: (error) => {
      console.error('[useLocationMutation] Location creation failed:', error);
    },
  });
}
