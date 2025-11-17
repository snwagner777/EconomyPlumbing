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

// ============================================================================
// Contact Update/Delete Mutations (v2 API - Contact Methods)
// ============================================================================

interface UpdateCustomerContactValues {
  customerId: number;
  contactId: number;
  type: string;
  value: string;
  memo?: string;
}

interface UpdateLocationContactValues {
  customerId: number;
  locationId: number;
  contactId: number;
  type: string;
  value: string;
  memo?: string;
  name?: string;
}

interface DeleteCustomerContactValues {
  customerId: number;
  contactId: number;
}

interface DeleteLocationContactValues {
  customerId: number;
  locationId: number;
  contactId: number;
}

/**
 * Update existing customer contact method
 * 
 * Endpoint: PATCH /api/portal/customer-contacts/[contactId]
 * Invalidates: Customer data queries
 */
export function useUpdateCustomerContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateCustomerContactValues) => {
      const response = await fetch(`/api/portal/customer-contacts/${data.contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customerId,
          type: data.type,
          value: data.value.trim(),
          memo: data.memo?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update contact' }));
        throw new Error(error.error || 'Failed to update contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Updated',
        description: 'Contact information has been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing location contact method
 * 
 * Endpoint: PATCH /api/portal/location-contacts/[contactId]
 * Invalidates: Location data queries
 */
export function useUpdateLocationContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateLocationContactValues) => {
      const response = await fetch(`/api/portal/location-contacts/${data.contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customerId,
          locationId: data.locationId,
          type: data.type,
          value: data.value.trim(),
          memo: data.memo?.trim() || undefined,
          name: data.name?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update location contact' }));
        throw new Error(error.error || 'Failed to update location contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Updated',
        description: 'Location contact has been updated successfully.',
      });
      
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0]?.toString().startsWith('/api/portal/customer-locations') ?? false,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete customer contact method
 * 
 * Endpoint: DELETE /api/portal/customer-contacts/[contactId]
 * Invalidates: Customer data queries
 */
export function useDeleteCustomerContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: DeleteCustomerContactValues) => {
      const response = await fetch(`/api/portal/customer-contacts/${data.contactId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: data.customerId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete contact' }));
        throw new Error(error.error || 'Failed to delete contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Deleted',
        description: 'Contact has been removed successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete location contact method
 * 
 * Endpoint: DELETE /api/portal/location-contacts/[contactId]
 * Invalidates: Location data queries
 */
export function useDeleteLocationContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: DeleteLocationContactValues) => {
      const response = await fetch(`/api/portal/location-contacts/${data.contactId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customerId,
          locationId: data.locationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete location contact' }));
        throw new Error(error.error || 'Failed to delete location contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Deleted',
        description: 'Location contact has been removed successfully.',
      });
      
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0]?.toString().startsWith('/api/portal/customer-locations') ?? false,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Legacy exports for backwards compatibility
export const useUpdateContact = useUpdateCustomerContact;
export const useDeleteContact = useDeleteCustomerContact;
