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
// Contact Update/Delete Mutations (Customer Portal)
// ============================================================================

interface UpdateContactValues {
  contactId: string; // Contact person GUID
  name?: string;
  phone?: string;
  phoneMethodId?: string; // Contact method GUID for phone
  email?: string;
  emailMethodId?: string; // Contact method GUID for email
}

/**
 * Update existing contact
 * 
 * Endpoint: PATCH /api/customer-portal/contacts/[id]
 * Invalidates: Customer location queries
 */
export function useUpdateContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateContactValues) => {
      const response = await fetch(`/api/customer-portal/contacts/${data.contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          phoneMethodId: data.phoneMethodId,
          email: data.email?.trim() || undefined,
          emailMethodId: data.emailMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update contact' }));
        throw new Error(error.message || 'Failed to update contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Updated',
        description: 'Contact information has been updated successfully.',
      });
      
      // Invalidate customer-locations queries to refresh enriched contact data
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
 * Delete existing contact
 * 
 * Endpoint: DELETE /api/customer-portal/contacts/[id]
 * Invalidates: Customer location queries
 * 
 * Note: Cannot delete if it's the last contact (enforced by API)
 */
export function useDeleteContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/customer-portal/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete contact' }));
        throw new Error(error.message || 'Failed to delete contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Deleted',
        description: 'Contact has been removed successfully.',
      });
      
      // Invalidate customer-locations queries to refresh contact list
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
