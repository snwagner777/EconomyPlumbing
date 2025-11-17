/**
 * Contact Management Dialog
 * 
 * Full-featured dialog for managing customer and location contacts in the portal.
 * Supports CRUD operations for phone numbers and emails on both customers and locations.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ContactForm, 
  useAddCustomerContact, 
  useUpdateCustomerContact, 
  useDeleteCustomerContact,
  useAddLocationContact,
  useUpdateLocationContact,
  useDeleteLocationContact,
} from '@/modules/contacts';
import { Phone, Mail, Plus, Edit2, Trash2, MapPin } from 'lucide-react';

interface Contact {
  id: number;
  type: string;
  value: string;
  memo?: string;
}

interface Location {
  id: number;
  name: string;
  address?: any;
  contacts?: Contact[];
}

interface ContactManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  customerContacts?: Contact[];
  locations?: Location[];
  formatPhoneNumber?: (phone: string) => string;
}

type DialogMode = 'list' | 'add' | 'edit';

export function ContactManagementDialog({
  open,
  onOpenChange,
  customerId,
  customerContacts = [],
  locations = [],
  formatPhoneNumber,
}: ContactManagementDialogProps) {
  const [mode, setMode] = useState<DialogMode>('list');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [deleteConfirmContact, setDeleteConfirmContact] = useState<Contact | null>(null);

  // Customer contact hooks
  const addContact = useAddCustomerContact();
  const updateContact = useUpdateCustomerContact();
  const deleteContact = useDeleteCustomerContact();

  // Location contact hooks
  const addLocationContact = useAddLocationContact();
  const updateLocationContact = useUpdateLocationContact();
  const deleteLocationContact = useDeleteLocationContact();

  // Reset dialog state when closed
  useEffect(() => {
    if (!open) {
      setMode('list');
      setEditingContact(null);
      setEditingLocationId(null);
      setDeleteConfirmContact(null);
    }
  }, [open]);

  // Debug: Log contact data structure
  useEffect(() => {
    if (open && customerContacts.length > 0) {
      console.log('[ContactDialog] Customer contacts:', customerContacts);
      console.log('[ContactDialog] Sample contact structure:', customerContacts[0]);
    }
  }, [open, customerContacts]);

  const handleAddContact = async (data: any) => {
    if (!customerId) {
      console.error('[ContactDialog] Missing customerId');
      return;
    }
    
    try {
      await addContact.mutateAsync({
        customerId,
        type: data.type,
        value: data.value,
        memo: data.memo,
      });
      setMode('list');
    } catch (error) {
      console.error('[ContactDialog] Add contact failed:', error);
    }
  };

  const handleUpdateContact = async (data: any) => {
    if (!customerId || !editingContact) {
      console.error('[ContactDialog] Missing customerId or editingContact');
      return;
    }
    
    try {
      await updateContact.mutateAsync({
        customerId,
        contactId: editingContact.id,
        type: data.type,
        value: data.value,
        memo: data.memo,
      });
      setMode('list');
      setEditingContact(null);
    } catch (error) {
      console.error('[ContactDialog] Update contact failed:', error);
    }
  };

  const handleDeleteContact = async () => {
    if (!customerId || !deleteConfirmContact) {
      console.error('[ContactDialog] Missing customerId or deleteConfirmContact');
      return;
    }
    
    try {
      // Delete customer contact or location contact based on editing context
      if (editingLocationId) {
        await deleteLocationContact.mutateAsync({
          customerId,
          locationId: editingLocationId,
          contactId: deleteConfirmContact.id,
        });
      } else {
        await deleteContact.mutateAsync({
          customerId,
          contactId: deleteConfirmContact.id,
        });
      }
      setDeleteConfirmContact(null);
      setEditingLocationId(null);
    } catch (error) {
      console.error('[ContactDialog] Delete contact failed:', error);
    }
  };

  const handleAddLocationContact = async (locationId: number, data: any) => {
    if (!customerId) {
      console.error('[ContactDialog] Missing customerId for location contact');
      return;
    }
    
    try {
      await addLocationContact.mutateAsync({
        customerId,
        locationId,
        type: data.type,
        value: data.value,
        memo: data.memo,
      });
      setMode('list');
      setEditingLocationId(null);
    } catch (error) {
      console.error('[ContactDialog] Add location contact failed:', error);
    }
  };

  const handleUpdateLocationContact = async (data: any) => {
    if (!customerId || !editingLocationId || !editingContact) {
      console.error('[ContactDialog] Missing required IDs for location contact update');
      return;
    }
    
    try {
      await updateLocationContact.mutateAsync({
        customerId,
        locationId: editingLocationId,
        contactId: editingContact.id,
        type: data.type,
        value: data.value,
        memo: data.memo,
      });
      setMode('list');
      setEditingContact(null);
      setEditingLocationId(null);
    } catch (error) {
      console.error('[ContactDialog] Update location contact failed:', error);
    }
  };

  const renderContactIcon = (type: string) => {
    if (type === 'Email') return <Mail className="w-4 h-4 text-muted-foreground" />;
    return <Phone className="w-4 h-4 text-muted-foreground" />;
  };

  const renderContactsList = () => (
    <div className="space-y-4">
      {/* Customer Contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Account Contacts</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingLocationId(null); // Clear location context for customer add
              setMode('add');
            }}
            data-testid="button-add-customer-contact"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {customerContacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <Phone className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No contact information on file.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {customerContacts.map((contact) => (
              <Card key={contact.id} data-testid={`card-customer-contact-${contact.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {renderContactIcon(contact.type)}
                      <div>
                        <p className="text-sm font-medium">
                          {contact.type === 'Email' 
                            ? contact.value 
                            : formatPhoneNumber 
                              ? formatPhoneNumber(contact.value) 
                              : contact.value
                          }
                        </p>
                        {contact.memo && (
                          <p className="text-xs text-muted-foreground">{contact.memo}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {contact.type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingContact(contact);
                          setEditingLocationId(null); // Clear location context for customer edit
                          setMode('edit');
                        }}
                        data-testid={`button-edit-contact-${contact.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteConfirmContact(contact);
                          setEditingLocationId(null); // Clear location context for customer delete
                        }}
                        data-testid={`button-delete-contact-${contact.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Location Contacts */}
      {locations.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Location Contacts</h3>
          <div className="space-y-4">
            {locations.map((location) => (
              <Card key={location.id} data-testid={`card-location-${location.id}`}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{location.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLocationId(location.id);
                        setMode('add');
                      }}
                      data-testid={`button-add-location-contact-${location.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {location.address && (
                    <CardDescription className="text-xs">
                      {location.address.street}, {location.address.city}
                    </CardDescription>
                  )}
                </CardHeader>
                {location.contacts && location.contacts.length > 0 && (
                  <CardContent className="pt-0 space-y-2">
                    {location.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-3">
                          {renderContactIcon(contact.type)}
                          <div>
                            <p className="text-sm font-medium">
                              {contact.type === 'Email' 
                                ? contact.value 
                                : formatPhoneNumber 
                                  ? formatPhoneNumber(contact.value) 
                                  : contact.value
                              }
                            </p>
                            {contact.memo && (
                              <p className="text-xs text-muted-foreground">{contact.memo}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {contact.type}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContact(contact);
                              setEditingLocationId(location.id);
                              setMode('edit');
                            }}
                            data-testid={`button-edit-location-contact-${location.id}-${contact.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteConfirmContact(contact);
                              setEditingLocationId(location.id);
                            }}
                            data-testid={`button-delete-location-contact-${location.id}-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAddForm = () => {
    // Determine if we're adding to a location or customer
    const isLocationAdd = editingLocationId !== null;
    
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMode('list');
            setEditingLocationId(null);
          }}
          className="mb-4"
          data-testid="button-back-to-list"
        >
          ← Back to Contacts
        </Button>
        {isLocationAdd && (
          <div className="mb-3 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Adding contact to location: {locations.find(l => l.id === editingLocationId)?.name}
            </p>
          </div>
        )}
        <ContactForm
          onSubmit={isLocationAdd 
            ? (data) => handleAddLocationContact(editingLocationId!, data)
            : handleAddContact
          }
          onCancel={() => {
            setMode('list');
            setEditingLocationId(null);
          }}
          isSubmitting={isLocationAdd ? addLocationContact.isPending : addContact.isPending}
          submitText="Add Contact"
        />
      </div>
    );
  };

  const renderEditForm = () => {
    if (!editingContact) return null;

    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMode('list');
            setEditingContact(null);
          }}
          className="mb-4"
          data-testid="button-back-from-edit"
        >
          ← Back to Contacts
        </Button>
        <ContactForm
          defaultValues={{
            type: editingContact.type as 'Phone' | 'MobilePhone' | 'Email',
            value: editingContact.value,
            memo: editingContact.memo || '',
          }}
          onSubmit={editingLocationId ? handleUpdateLocationContact : handleUpdateContact}
          onCancel={() => {
            setMode('list');
            setEditingContact(null);
            setEditingLocationId(null);
          }}
          isSubmitting={editingLocationId ? updateLocationContact.isPending : updateContact.isPending}
          submitText="Update Contact"
        />
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'add' ? 'Add Contact' : mode === 'edit' ? 'Edit Contact' : 'Manage Contacts'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'list' 
                ? 'Add, edit, or remove contact information for your account and locations.'
                : mode === 'add'
                  ? 'Add a new phone number or email address to your account.'
                  : 'Update the contact information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {mode === 'list' && renderContactsList()}
            {mode === 'add' && renderAddForm()}
            {mode === 'edit' && renderEditForm()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmContact} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmContact(null);
          setEditingLocationId(null); // Clear location context when cancel is clicked
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
              {deleteConfirmContact && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-medium text-sm">
                    {deleteConfirmContact.type === 'Email' 
                      ? deleteConfirmContact.value 
                      : formatPhoneNumber 
                        ? formatPhoneNumber(deleteConfirmContact.value) 
                        : deleteConfirmContact.value
                    }
                  </p>
                  {deleteConfirmContact.memo && (
                    <p className="text-xs text-muted-foreground mt-1">{deleteConfirmContact.memo}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
