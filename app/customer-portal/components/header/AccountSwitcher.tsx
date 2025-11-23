'use client';

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
import { useCustomerAccounts } from '../../hooks/useCustomerAccounts';

interface AccountSwitcherProps {
  currentCustomerId: number;
  onAccountChanged?: () => void;
  onAddAccount?: () => void;
}

export function AccountSwitcher({ currentCustomerId, onAccountChanged, onAddAccount }: AccountSwitcherProps) {
  const { accounts, currentAccount, isLoading, switchAccount } = useCustomerAccounts(currentCustomerId);

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
