/**
 * Settings Section - Account Settings and Preferences
 * Displays customer contacts and service locations with contact management
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, User, MapPin, Mail, Phone, CheckCircle2 } from "lucide-react";
import { CustomerContactMethodsCard } from "../CustomerContactMethodsCard";
import { LocationContactsAccordion } from "../LocationContactsAccordion";
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

interface AccountSummary {
  id: number;
  name: string;
  type: string;
  email: string | null;
  phoneNumber: string | null;
  locationCount: number;
  primaryLocationId: number | null;
}

interface SettingsSectionProps {
  customerId: number;
  onAddLocation?: () => void;
  onAddAccount?: () => void;
  formatPhoneNumber?: (phone: string) => string;
  accountSummaries?: AccountSummary[];
  onSwitchAccount?: (accountId: number) => void;
}

export function SettingsSection({
  customerId,
  onAddLocation,
  onAddAccount,
  formatPhoneNumber,
  accountSummaries = [],
  onSwitchAccount,
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
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <CardTitle>Account Management</CardTitle>
            </div>
            <CardDescription>
              {accountSummaries.length > 1 
                ? `You have ${accountSummaries.length} accounts. Switch between them to view different properties or businesses.`
                : 'Create new accounts for additional properties or businesses'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show account switcher if multiple accounts */}
            {accountSummaries.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Your Accounts</h4>
                <div className="space-y-2">
                  {accountSummaries.map((account) => {
                    const isCurrentAccount = account.id === customerId;
                    
                    return (
                      <div
                        key={account.id}
                        className={`
                          relative p-3 rounded-lg border transition-colors
                          ${isCurrentAccount 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-card border-border hover-elevate active-elevate-2'
                          }
                        `}
                        data-testid={`account-card-${account.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <h5 className="font-medium text-sm truncate">{account.name}</h5>
                              {isCurrentAccount && (
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {account.type && account.type !== 'Residential' && (
                                  <Badge variant="outline" className="text-xs">
                                    {account.type}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span>{account.locationCount} {account.locationCount === 1 ? 'location' : 'locations'}</span>
                                </div>
                              </div>
                              
                              {(account.email || account.phoneNumber) && (
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                  {account.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{account.email}</span>
                                    </div>
                                  )}
                                  {account.phoneNumber && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span>{formatPhoneNumber ? formatPhoneNumber(account.phoneNumber) : account.phoneNumber}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {!isCurrentAccount && onSwitchAccount && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSwitchAccount(account.id)}
                              data-testid={`button-switch-to-${account.id}`}
                            >
                              Switch
                            </Button>
                          )}
                        </div>
                        
                        {isCurrentAccount && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Info box about multiple accounts */}
            {accountSummaries.length === 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Multiple Accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage residential and commercial properties from one portal. Each account has its own service history and locations.
                  </p>
                </div>
              </div>
            )}
            
            {onAddAccount && (
              <Button
                onClick={onAddAccount}
                className="w-full"
                data-testid="button-create-account"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
