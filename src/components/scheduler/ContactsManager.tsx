/**
 * ContactsManager for Scheduler
 * 
 * Authenticated contact management during scheduler flow.
 * Reuses shared ContactForm component with scheduler-specific mutations.
 * Only enabled when user has verified via 2FA and has active session token.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContactForm } from '@/modules/contacts';
import { useSchedulerAddContact, useSchedulerUpdateContact, useSchedulerDeleteContact } from '@/hooks/useSchedulerContactMutation';
import { Loader2, Phone, Mail, Plus, User, Trash2, AlertCircle, Pencil } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContactsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken?: string | null; // Optional - when provided, shows full CRUD; when null, shows read-only masked view
  customerId: number;
  locationId?: number; // Optional - when provided, filters to location-specific contacts and links new contacts to this location
}

interface Contact {
  id: string;
  name?: string;
  methods: Array<{
    id: string;
    type: 'MobilePhone' | 'Email';
    value: string;
    memo?: string;
  }>;
}

export function ContactsManager({
  open,
  onOpenChange,
  sessionToken,
  customerId,
  locationId,
}: ContactsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ contactId: string; methodId: string; value: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ contactId: string; methodId: string; value: string; type: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Fetch contacts (authenticated - shows full unmasked contacts via Authorization header)
  // Location-aware: when locationId provided, only shows contacts linked to that location
  const { data, isLoading, isError, refetch } = useQuery<{ success: boolean; contacts: Contact[] }>({
    queryKey: ['/api/scheduler/customer-contacts', { customerId, locationId, authenticated: !!sessionToken }],
    queryFn: async () => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // SECURITY: Send session token via Authorization header, not query string
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      // Build query params (locationId is optional for location-specific filtering)
      const params = new URLSearchParams({ customerId: String(customerId) });
      if (locationId) {
        params.append('locationId', String(locationId));
      }
      
      const response = await fetch(`/api/scheduler/customer-contacts?${params}`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    enabled: open && !!customerId,
  });

  const addContactMutation = useSchedulerAddContact();
  const updateContactMutation = useSchedulerUpdateContact();
  const deleteContactMutation = useSchedulerDeleteContact();

  const contacts = data?.contacts || [];
  const isAuthenticated = !!sessionToken;

  const handleAddContact = async (formData: any) => {
    if (!sessionToken) {
      console.error('[ContactsManager] Cannot add contact without session token');
      return;
    }
    
    // BUGFIX: Handle both 'Phone' and 'MobilePhone' types
    const isPhone = formData.type === 'Phone' || formData.type === 'MobilePhone';
    
    await addContactMutation.mutateAsync({
      token: sessionToken,
      phone: isPhone ? formData.value : '',
      email: formData.type === 'Email' ? formData.value : '',
      name: formData.name,
      locationId, // Link to location when provided (location-aware mode)
    });
    
    setShowAddForm(false);
    refetch();
  };

  const handleDeleteContact = async () => {
    if (!sessionToken || !deleteTarget) return;

    await deleteContactMutation.mutateAsync({
      token: sessionToken,
      contactId: deleteTarget.contactId,
      contactMethodId: deleteTarget.methodId,
    });

    setDeleteTarget(null);
    refetch();
  };

  const handleEditContact = async () => {
    if (!sessionToken || !editTarget || !editValue.trim()) return;

    await updateContactMutation.mutateAsync({
      token: sessionToken,
      contactId: editTarget.contactId,
      contactMethodId: editTarget.methodId,
      value: editValue.trim(),
    });

    setEditTarget(null);
    setEditValue('');
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" data-testid="dialog-contacts-manager">
        <DialogHeader>
          <DialogTitle>{isAuthenticated ? 'Manage Contacts' : 'Contact Information'}</DialogTitle>
          <DialogDescription>
            {isAuthenticated 
              ? 'Add or update contact information for this account'
              : 'View contact information on file (masked for privacy)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Contact Form - Only show when authenticated */}
          {isAuthenticated && showAddForm ? (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Add New Contact</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    data-testid="button-cancel-add-contact"
                  >
                    Cancel
                  </Button>
                </div>
                
                <ContactForm
                  onSubmit={handleAddContact}
                  onCancel={() => setShowAddForm(false)}
                  isSubmitting={addContactMutation.isPending}
                  submitText="Add Contact"
                  showNameField={true}
                />
              </div>
            </Card>
          ) : isAuthenticated ? (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
              data-testid="button-add-contact"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Contact
            </Button>
          ) : null}

          {/* Contacts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <p className="text-sm text-destructive">Failed to load contacts</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
                data-testid="button-retry-contacts"
              >
                Retry
              </Button>
            </Card>
          ) : contacts.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                {isAuthenticated ? 'Your Contacts' : 'Contacts on File'} ({contacts.length})
              </div>
              {!isAuthenticated && (
                <Card className="p-3 bg-muted/50 border-muted">
                  <p className="text-xs text-muted-foreground">
                    Contact information is masked for privacy. To manage contacts, please verify your phone or email.
                  </p>
                </Card>
              )}
              {contacts.map((contact) => (
                <Card key={contact.id} className="p-4" data-testid={`card-contact-${contact.id}`}>
                  <div className="space-y-2">
                    {contact.name && (
                      <div className="flex items-center gap-2 font-semibold">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {contact.name}
                      </div>
                    )}
                    
                    {contact.methods.map((method) => (
                      <div key={method.id} className="flex items-start gap-2 text-sm">
                        {method.type === 'MobilePhone' ? (
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                        ) : (
                          <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono">{method.value}</div>
                          {method.memo && (
                            <div className="text-xs text-muted-foreground">{method.memo}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {method.type === 'MobilePhone' ? 'Phone' : 'Email'}
                        </Badge>
                        {isAuthenticated && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditTarget({ 
                                  contactId: contact.id, 
                                  methodId: method.id, 
                                  value: method.value,
                                  type: method.type 
                                });
                                setEditValue(method.value);
                              }}
                              data-testid={`button-edit-contact-${method.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setDeleteTarget({ 
                                contactId: contact.id, 
                                methodId: method.id, 
                                value: method.value 
                              })}
                              data-testid={`button-delete-contact-${method.id}`}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <div className="text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No contacts found</p>
                <p className="text-xs mt-1">Add a contact to get started</p>
              </div>
            </Card>
          )}

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            data-testid="button-close-contacts"
          >
            Done
          </Button>
        </div>
      </DialogContent>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => {
        if (!open) {
          setEditTarget(null);
          setEditValue('');
        }
      }}>
        <DialogContent className="max-w-md" data-testid="dialog-edit-contact">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the {editTarget?.type === 'MobilePhone' ? 'phone number' : 'email address'} below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">
                {editTarget?.type === 'MobilePhone' ? 'Phone Number' : 'Email Address'}
              </Label>
              <Input
                id="edit-value"
                type={editTarget?.type === 'Email' ? 'email' : 'tel'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={editTarget?.type === 'MobilePhone' ? '(512) 555-1234' : 'email@example.com'}
                data-testid="input-edit-contact-value"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditTarget(null);
                  setEditValue('');
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditContact}
                disabled={updateContactMutation.isPending || !editValue.trim()}
                data-testid="button-save-edit"
              >
                {updateContactMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{deleteTarget?.value}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
