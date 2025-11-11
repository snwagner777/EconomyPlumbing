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
    onSuccess: (_, variables) => {
      toast({
        title: 'Contact Added',
        description: 'Your contact information has been updated.',
      });
      
      // Invalidate customer data to refresh contacts list (both new and legacy keys)
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/customer', variables.customerId] });
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
      
      // CRITICAL: Invalidate customer-locations queries (used by portal)
      // Use predicate to match both array and template string patterns
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0]?.toString().startsWith('/api/portal/customer-locations') ?? false,
      });
      // Also invalidate main customer query to refresh all data
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
