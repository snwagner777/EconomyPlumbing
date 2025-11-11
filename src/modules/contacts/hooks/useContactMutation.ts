/**
 * Contact Mutations
 * 
 * React Query mutations for adding/updating contacts on customers and locations.
 * Targets existing portal API endpoints for ServiceTitan contact management.
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { CustomerContactValues, LocationContactValues } from '../types';

// ============================================================================
// Customer Contact Mutations
// ============================================================================

/**
 * Add contact to customer account
 * 
 * Endpoint: POST /api/portal/customer-contacts
 * Invalidates: Customer data queries
 */
export function useAddCustomerContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CustomerContactValues) => {
      const response = await fetch('/api/portal/customer-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customerId,
          type: data.type,
          value: data.value.trim(),
          memo: data.memo?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to add contact' }));
        throw new Error(error.error || 'Failed to add contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Added',
        description: 'Your contact information has been updated.',
      });
      
      // Invalidate customer data to refresh contacts list
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Location Contact Mutations
// ============================================================================

/**
 * Add contact to service location
 * 
 * Endpoint: POST /api/portal/location-contacts
 * Invalidates: Location data queries
 */
export function useAddLocationContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LocationContactValues) => {
      const response = await fetch('/api/portal/location-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.locationId,
          type: data.type,
          value: data.value.trim(),
          memo: data.memo?.trim() || undefined,
          name: data.name?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to add contact' }));
        throw new Error(error.error || 'Failed to add contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Added',
        description: 'Location contact information has been updated.',
      });
      
      // Invalidate location data to refresh contacts list
      queryClient.invalidateQueries({ queryKey: ['/api/portal/locations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
