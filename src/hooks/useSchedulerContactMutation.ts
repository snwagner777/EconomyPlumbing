/**
 * Scheduler Contact Mutations
 * 
 * React Query mutations for managing contacts in the scheduler flow.
 * Uses scheduler session token for authentication instead of portal cookies.
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface SchedulerContactData {
  token: string;
  phone: string;
  email?: string;
  locationId?: number;
  name?: string;
}

/**
 * Add contact via scheduler (requires session token from 2FA)
 */
export function useSchedulerAddContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SchedulerContactData) => {
      const response = await fetch('/api/scheduler/customer-contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`, // SECURITY: Token in Authorization header, not body
        },
        body: JSON.stringify({
          phone: data.phone,
          email: data.email?.trim() || undefined,
          locationId: data.locationId || undefined,
          name: data.name?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to add contact' }));
        throw new Error(error.message || 'Failed to add contact');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact Added',
        description: 'Your contact information has been added successfully.',
      });
      
      // Invalidate scheduler contacts queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('/api/scheduler/customer-contacts') ?? false 
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update contact via scheduler (requires session token from 2FA)
 */
export function useSchedulerUpdateContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      token: string; 
      contactId: string; 
      contactMethodId: string; 
      value: string; 
      memo?: string; 
    }) => {
      const response = await fetch('/api/scheduler/customer-contacts', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`, // SECURITY: Token in Authorization header, not body
        },
        body: JSON.stringify({
          contactId: data.contactId,
          contactMethodId: data.contactMethodId,
          value: data.value.trim(),
          memo: data.memo?.trim() || undefined,
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
      
      // Invalidate scheduler contacts queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('/api/scheduler/customer-contacts') ?? false 
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete contact via scheduler (requires session token from 2FA)
 */
export function useSchedulerDeleteContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      token: string; 
      contactId: string; 
      contactMethodId: string; 
    }) => {
      const response = await fetch('/api/scheduler/customer-contacts', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`, // SECURITY: Token in Authorization header, not body
        },
        body: JSON.stringify({
          contactId: data.contactId,
          contactMethodId: data.contactMethodId,
        }),
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
      
      // Invalidate scheduler contacts queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('/api/scheduler/customer-contacts') ?? false 
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
