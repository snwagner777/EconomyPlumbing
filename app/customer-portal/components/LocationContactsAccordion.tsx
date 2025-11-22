'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ContactMethodFormDialog, ContactMethodFormData } from './ContactMethodFormDialog';
import { MapPin, Phone, Mail, Plus, Edit2, Trash2, Home } from 'lucide-react';
import { useState } from 'react';
import { useAddLocationContact, useUpdateLocationContact, useDeleteLocationContact } from '@/modules/contacts';

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

interface LocationContactsAccordionProps {
  customerId: number;
  locations: Location[];
  formatPhoneNumber?: (phone: string) => string;
  onAddLocation?: () => void;
}

export function LocationContactsAccordion({
  customerId,
  locations,
  formatPhoneNumber,
  onAddLocation,
}: LocationContactsAccordionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactMethod | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactMethod | null>(null);

  const addMutation = useAddLocationContact();
  const updateMutation = useUpdateLocationContact();
  const deleteMutation = useDeleteLocationContact();

  const handleAddContact = async (data: ContactMethodFormData) => {
    if (!selectedLocationId) return;
    
    await addMutation.mutateAsync({
      customerId,
      locationId: selectedLocationId,
      type: data.type,
      value: data.value,
      memo: data.memo,
    });
    
    setAddDialogOpen(false);
    setSelectedLocationId(null);
  };

  const handleEditContact = async (data: ContactMethodFormData) => {
    if (!editingContact || !selectedLocationId) return;
    
    await updateMutation.mutateAsync({
      customerId,
      locationId: selectedLocationId,
      contactId: editingContact.id,
      type: data.type,
      value: data.value,
      memo: data.memo,
    });
    
    setEditingContact(null);
    setSelectedLocationId(null);
  };

  const handleDeleteContact = async () => {
    if (!deletingContact || !selectedLocationId) return;
    
    await deleteMutation.mutateAsync({
      customerId,
      locationId: selectedLocationId,
      contactId: deletingContact.id,
    });
    
    setDeletingContact(null);
    setSelectedLocationId(null);
  };

  const renderContactIcon = (type: string) => {
    if (type === 'Email') {
      return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
    return <Phone className="w-4 h-4 text-muted-foreground" />;
  };

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Home className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No service locations added yet</p>
          {onAddLocation && (
            <Button onClick={onAddLocation} data-testid="button-add-first-location">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-service-locations">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Service Locations ({locations.length})
              </CardTitle>
              <CardDescription>
                Locations where you receive service
              </CardDescription>
            </div>
            {onAddLocation && (
              <Button
                onClick={onAddLocation}
                size="sm"
                variant="outline"
                data-testid="button-add-location"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {locations.map((location, index) => {
              const contacts = location.contactMethods || [];
              const phoneContacts = contacts.filter(c => c.type.includes('Phone'));
              const emailContacts = contacts.filter(c => c.type === 'Email');

              return (
                <AccordionItem key={location.id} value={`location-${location.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <Home className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {location.name && (
                          <p className="text-sm font-semibold">{location.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {location.address.street}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {location.address.city}, {location.address.state} {location.address.zip}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3 pl-8">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Location Contacts</p>
                        <Button
                          onClick={() => {
                            setSelectedLocationId(location.id);
                            setAddDialogOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                          data-testid={`button-add-contact-location-${location.id}`}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add Contact
                        </Button>
                      </div>

                      {contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No contacts for this location
                        </p>
                      ) : (
                        <>
                          {phoneContacts.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Phone Numbers</p>
                              {phoneContacts.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="flex items-center justify-between p-2 bg-background/50 rounded"
                                  data-testid={`location-${location.id}-contact-${contact.id}`}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {renderContactIcon(contact.type)}
                                    <div>
                                      <p className="text-sm font-medium">
                                        {formatPhoneNumber ? formatPhoneNumber(contact.value) : contact.value}
                                      </p>
                                      {contact.memo && (
                                        <p className="text-xs text-muted-foreground">{contact.memo}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLocationId(location.id);
                                        setEditingContact(contact);
                                      }}
                                      data-testid={`button-edit-location-contact-${location.id}-${contact.id}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLocationId(location.id);
                                        setDeletingContact(contact);
                                      }}
                                      data-testid={`button-delete-location-contact-${location.id}-${contact.id}`}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {emailContacts.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Email Addresses</p>
                              {emailContacts.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="flex items-center justify-between p-2 bg-background/50 rounded"
                                  data-testid={`location-${location.id}-contact-${contact.id}`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {renderContactIcon(contact.type)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium break-all">{contact.value}</p>
                                      {contact.memo && (
                                        <p className="text-xs text-muted-foreground">{contact.memo}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLocationId(location.id);
                                        setEditingContact(contact);
                                      }}
                                      data-testid={`button-edit-location-contact-${location.id}-${contact.id}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLocationId(location.id);
                                        setDeletingContact(contact);
                                      }}
                                      data-testid={`button-delete-location-contact-${location.id}-${contact.id}`}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <ContactMethodFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddContact}
        title="Add Location Contact"
        description="Add a contact for this specific location"
        isSubmitting={addMutation.isPending}
      />

      <ContactMethodFormDialog
        open={!!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setEditingContact(null);
            setSelectedLocationId(null);
          }
        }}
        onSubmit={handleEditContact}
        initialData={editingContact ? {
          type: editingContact.type as ContactMethodFormData['type'],
          value: editingContact.value,
          memo: editingContact.memo,
        } : undefined}
        title="Edit Location Contact"
        description="Update contact information for this location"
        isSubmitting={updateMutation.isPending}
      />

      <AlertDialog 
        open={!!deletingContact} 
        onOpenChange={(open) => {
          if (!open) {
            setDeletingContact(null);
            setSelectedLocationId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact from this location? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
