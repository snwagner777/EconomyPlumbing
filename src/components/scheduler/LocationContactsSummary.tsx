/**
 * Location Contacts Summary
 * 
 * Shows contacts linked to a specific service location in the scheduler ReviewStep.
 * - Unauthenticated: Read-only masked view for privacy
 * - Authenticated: Full view with edit button to open ContactsManager
 * 
 * Architecture: Thin wrapper that fetches location-filtered contacts and delegates
 * CRUD operations to ContactsManager component.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Users, Edit } from 'lucide-react';
import { ContactsManager } from './ContactsManager';

interface Contact {
  id: string;
  name?: string;
  methods: Array<{
    id: string;
    type: 'MobilePhone' | 'Email';
    value: string; // May be masked if unauthenticated
    memo?: string;
  }>;
}

interface LocationContactsSummaryProps {
  customerId: number;
  locationId: number | undefined;
  sessionToken?: string | null; // Session token for authenticated users
}

export function LocationContactsSummary({ customerId, locationId, sessionToken }: LocationContactsSummaryProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  // Fetch location-specific contacts
  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; contacts: Contact[] }>({
    queryKey: ['/api/scheduler/customer-contacts', customerId, locationId],
    enabled: !!customerId && !!locationId, // Only fetch if both IDs are present
    retry: 1,
  });

  // Defensive: Hide section if locationId is missing (fail-closed)
  if (!locationId) {
    console.warn('[LocationContactsSummary] locationId is missing, hiding contact section');
    return null;
  }

  // Hide section if fetch failed (fail-closed)
  if (error) {
    console.error('[LocationContactsSummary] Failed to fetch contacts:', error);
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Location Contacts</h3>
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  const contacts = data?.contacts || [];
  const isAuthenticated = !!sessionToken;

  // Empty state: No contacts linked to this location
  if (contacts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Location Contacts</h3>
          </div>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManagerOpen(true)}
              data-testid="button-add-location-contact"
            >
              <Edit className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          No contacts linked to this service location yet.
        </p>
        
        {isAuthenticated && (
          <ContactsManager
            customerId={customerId}
            locationId={locationId}
            sessionToken={sessionToken}
            open={isManagerOpen}
            onOpenChange={(open) => {
              if (!open) {
                refetch(); // Refresh contacts when dialog closes
              }
              setIsManagerOpen(open);
            }}
          />
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="font-semibold">Location Contacts</h3>
          {!isAuthenticated && (
            <Badge variant="secondary" className="text-xs">
              Read-only
            </Badge>
          )}
        </div>
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManagerOpen(true)}
            data-testid="button-edit-location-contacts"
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            data-testid={`contact-summary-${contact.id}`}
          >
            <div className="flex-1 min-w-0">
              {contact.name && (
                <p className="font-medium text-sm mb-1">{contact.name}</p>
              )}
              <div className="space-y-1">
                {contact.methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    {method.type === 'MobilePhone' ? (
                      <Phone className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Mail className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{method.value}</span>
                    {method.memo && (
                      <Badge variant="outline" className="text-xs">
                        {method.memo}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground mt-3">
          Contact information is masked for privacy. Verify your identity to edit contacts.
        </p>
      )}

      {isAuthenticated && (
        <ContactsManager
          customerId={customerId}
          locationId={locationId}
          sessionToken={sessionToken}
          open={isManagerOpen}
          onOpenChange={(open) => {
            if (!open) {
              refetch(); // Refresh contacts when dialog closes
            }
            setIsManagerOpen(open);
          }}
        />
      )}
    </Card>
  );
}
