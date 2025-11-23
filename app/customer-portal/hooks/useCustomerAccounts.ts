/**
 * Shared hook for customer account management
 * Used by both AccountSwitcher dropdown and Settings account list
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CustomerAccount {
  id: number;
  name: string;
  type: string;
  email: string | null;
  phoneNumber: string | null;
  locationCount: number;
  primaryLocationId: number | null;
}

export function useCustomerAccounts(currentCustomerId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading } = useQuery<{ accounts: CustomerAccount[] }>({
    queryKey: ['/api/portal/customer-accounts'],
    refetchOnWindowFocus: false,
  });

  const accounts = accountsData?.accounts || [];
  const currentAccount = accounts.find(a => a.id === currentCustomerId);

  const switchAccount = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await fetch('/api/portal/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch account');
      }

      return response.json();
    },
    onSuccess: (_, customerId) => {
      toast({
        title: 'Account switched',
        description: `Switched to ${accounts.find(a => a.id === customerId)?.name}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/portal'] });
      
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: 'Switch failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    accounts,
    currentAccount,
    isLoading,
    switchAccount,
  };
}
