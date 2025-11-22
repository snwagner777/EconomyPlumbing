'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ContactMethodFormDialog, ContactMethodFormData } from './ContactMethodFormDialog';
import { Phone, Mail, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAddCustomerContact, useUpdateCustomerContact, useDeleteCustomerContact } from '@/modules/contacts';

interface ContactMethod {
  id: number;
  type: string;
  value: string;
  memo?: string;
}

interface CustomerContactMethodsCardProps {
  customerId: number;
  contacts: ContactMethod[];
  formatPhoneNumber?: (phone: string) => string;
}

export function CustomerContactMethodsCard({
  customerId,
  contacts,
  formatPhoneNumber,
}: CustomerContactMethodsCardProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactMethod | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactMethod | null>(null);

  const addMutation = useAddCustomerContact();
  const updateMutation = useUpdateCustomerContact();
  const deleteMutation = useDeleteCustomerContact();

  const handleAdd = async (data: ContactMethodFormData) => {
    await addMutation.mutateAsync({
      customerId,
      type: data.type,
      value: data.value,
      memo: data.memo,
    });
  };

  const handleEdit = async (data: ContactMethodFormData) => {
    if (!editingContact) return;
    
    await updateMutation.mutateAsync({
      customerId,
      contactId: editingContact.id,
      ...data,
    });
    
    setEditingContact(null);
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    
    await deleteMutation.mutateAsync({
      customerId,
      contactId: deletingContact.id,
    });
    
    setDeletingContact(null);
  };

  const renderContactIcon = (type: string) => {
    if (type === 'Email') {
      return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
    return <Phone className="w-4 h-4 text-muted-foreground" />;
  };

  const phoneContacts = contacts.filter(c => c.type.includes('Phone'));
  const emailContacts = contacts.filter(c => c.type === 'Email');

  return (
    <>
      <Card data-testid="card-customer-contacts">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Methods</CardTitle>
              <CardDescription>
                Your primary contact information
              </CardDescription>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
              variant="outline"
              data-testid="button-add-customer-contact"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contact methods added yet
            </p>
          ) : (
            <>
              {phoneContacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Phone Numbers</p>
                  {phoneContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      data-testid={`customer-contact-${contact.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {renderContactIcon(contact.type)}
                        <div>
                          <p className="font-medium">
                            {formatPhoneNumber ? formatPhoneNumber(contact.value) : contact.value}
                          </p>
                          {contact.memo && (
                            <p className="text-xs text-muted-foreground">{contact.memo}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{contact.type === 'MobilePhone' ? 'Mobile' : contact.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContact(contact)}
                          data-testid={`button-edit-contact-${contact.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingContact(contact)}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      data-testid={`customer-contact-${contact.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {renderContactIcon(contact.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-all">{contact.value}</p>
                          {contact.memo && (
                            <p className="text-xs text-muted-foreground">{contact.memo}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContact(contact)}
                          data-testid={`button-edit-contact-${contact.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingContact(contact)}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ContactMethodFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAdd}
        title="Add Contact Method"
        description="Add a new phone number or email address"
        isSubmitting={addMutation.isPending}
      />

      <ContactMethodFormDialog
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        onSubmit={handleEdit}
        initialData={editingContact ? {
          type: editingContact.type as ContactMethodFormData['type'],
          value: editingContact.value,
          memo: editingContact.memo,
        } : undefined}
        title="Edit Contact Method"
        description="Update contact information"
        isSubmitting={updateMutation.isPending}
      />

      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Method?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
