/**
 * Settings Section - Account Settings and Preferences
 * Displays customer contacts and service locations with contact management
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { CustomerContactMethodsCard } from "../CustomerContactMethodsCard";
import { LocationContactsAccordion } from "../LocationContactsAccordion";
import { AccountSwitcher } from '../header/AccountSwitcher';
import { useQuery } from '@tanstack/react-query';

interface ContactMethod {
  id: number;
  type: string;
  value: string;
  memo?: string;
}

interface Location {
  id: number;
  name?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contactMethods?: ContactMethod[];
}

interface SettingsSectionProps {
  customerId: number;
  onAddLocation?: () => void;
  onAddAccount?: () => void;
  formatPhoneNumber?: (phone: string) => string;
}

export function SettingsSection({
  customerId,
  onAddLocation,
  onAddAccount,
  formatPhoneNumber,
}: SettingsSectionProps) {
  // Fetch customer contacts
  const { data: customerContactsData, isLoading: isLoadingContacts } = useQuery<{ contactMethods: ContactMethod[] }>({
    queryKey: ['/api/portal/customer-contacts', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/portal/customer-contacts?customerId=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer contacts');
      return response.json();
    },
    enabled: !!customerId,
  });

  // Fetch customer locations with contacts
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/portal/customer-locations', customerId],
    enabled: !!customerId,
  });

  const customerContacts = customerContactsData?.contactMethods || [];
  const locations = locationsData?.locations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your contact information, locations, and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Contact Methods */}
        {isLoadingContacts ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading contacts...</p>
            </CardContent>
          </Card>
        ) : (
          <CustomerContactMethodsCard
            customerId={customerId}
            contacts={customerContacts}
            formatPhoneNumber={formatPhoneNumber}
          />
        )}

        {/* Service Locations with Contacts */}
        {isLoadingLocations ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading locations...</p>
            </CardContent>
          </Card>
        ) : (
          <LocationContactsAccordion
            customerId={customerId}
            locations={locations}
            formatPhoneNumber={formatPhoneNumber}
            onAddLocation={onAddLocation}
          />
        )}

        {/* Account Management */}
        <Card data-testid="card-account-management">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <CardTitle>Account Management</CardTitle>
                </div>
                <CardDescription>
                  Manage multiple accounts for different properties or businesses
                </CardDescription>
              </div>
              <AccountSwitcher 
                currentCustomerId={customerId}
                onAddAccount={onAddAccount}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Multiple Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  Use the account switcher above to switch between your accounts or create new ones for additional properties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
