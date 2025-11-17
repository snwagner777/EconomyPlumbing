'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, ChevronDown, Loader2, Plus } from 'lucide-react';
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

interface AccountSwitcherProps {
  currentCustomerId: number;
  onAccountChanged?: () => void;
  onAddAccount?: () => void;
}

export function AccountSwitcher({ currentCustomerId, onAccountChanged, onAddAccount }: AccountSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available accounts
  const { data: accountsData, isLoading } = useQuery<{ accounts: CustomerAccount[] }>({
    queryKey: ['/api/portal/customer-accounts'],
    refetchOnWindowFocus: false,
  });

  const accounts = accountsData?.accounts || [];
  const currentAccount = accounts.find(a => a.id === currentCustomerId);

  // Switch account mutation
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
      
      // Invalidate all portal queries to refetch with new account
      queryClient.invalidateQueries({ queryKey: ['/api/portal'] });
      
      // Call parent callback
      if (onAccountChanged) {
        onAccountChanged();
      } else {
        // Force page reload if no callback provided
        window.location.reload();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Switch failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (accounts.length <= 1) {
    // Only one account - show simple button to add account
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAddAccount}
        data-testid="button-add-first-account"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Account
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="button-account-switcher"
        >
          <Building2 className="w-4 h-4" />
          <span className="max-w-[150px] truncate">
            {currentAccount?.name || `Account #${currentCustomerId}`}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Your Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => {
              if (account.id !== currentCustomerId) {
                switchAccount.mutate(account.id);
              }
            }}
            className="cursor-pointer"
            data-testid={`account-${account.id}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{account.name}</span>
                  {account.id === currentCustomerId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="capitalize">{account.type}</span>
                  <span>•</span>
                  <span>{account.locationCount} {account.locationCount === 1 ? 'location' : 'locations'}</span>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={onAddAccount}
          className="cursor-pointer text-primary"
          data-testid="button-add-account-dropdown"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
