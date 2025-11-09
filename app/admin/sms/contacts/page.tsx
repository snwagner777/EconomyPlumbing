'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, UserPlus, Upload, Download, Trash2, Check, X, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SMSContact = {
  id: number;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  optedIn: boolean;
  optedOut: boolean;
  optedInAt: string | null;
  optedOutAt: string | null;
  providerContactId: string | null;
  providerListIds: string[] | null;
  tags: string[] | null;
  customFields: any;
  lastMessageAt: string | null;
  createdAt: string;
};

export default function SMSContactsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'opted-in' | 'opted-out'>('all');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<SMSContact | null>(null);

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery<SMSContact[]>({
    queryKey: ['/api/admin/sms/contacts'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/sms/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/contacts'] });
      toast({ title: 'Contact deleted successfully' });
      setSelectedContacts([]);
    },
    onError: () => {
      toast({ title: 'Failed to delete contact', variant: 'destructive' });
    },
  });

  // Bulk opt-in/out mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: 'opt-in' | 'opt-out' }) => {
      const updates = ids.map(id =>
        apiRequest('PATCH', `/api/admin/sms/contacts/${id}`, {
          optedIn: action === 'opt-in',
          optedOut: action === 'opt-out',
        })
      );
      return await Promise.all(updates);
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/contacts'] });
      toast({ title: `Contacts ${action === 'opt-in' ? 'opted in' : 'opted out'} successfully` });
      setSelectedContacts([]);
    },
    onError: () => {
      toast({ title: 'Failed to update contacts', variant: 'destructive' });
    },
  });

  // Filtered contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      search === '' ||
      contact.phone.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'opted-in' && contact.optedIn && !contact.optedOut) ||
      (statusFilter === 'opted-out' && contact.optedOut);

    return matchesSearch && matchesStatus;
  });

  const selectAllVisible = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const toggleContact = (id: number) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
      Promise.all(selectedContacts.map(id => deleteMutation.mutateAsync(id)));
    }
  };

  const optedInCount = contacts.filter(c => c.optedIn && !c.optedOut).length;
  const optedOutCount = contacts.filter(c => c.optedOut).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            SMS Contacts
          </h1>
          <p className="text-muted-foreground">
            Manage your SMS contact list and opt-in status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" data-testid="button-import">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <AddContactDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/contacts'] });
              setShowAddDialog(false);
            }}
          >
            <Button data-testid="button-add-contact">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </AddContactDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-contacts">
              {contacts.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-opted-in">
              {optedInCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {contacts.length > 0 ? Math.round((optedInCount / contacts.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-opted-out">
              {optedOutCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {contacts.length > 0 ? Math.round((optedOutCount / contacts.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>
                {filteredContacts.length} contacts
                {selectedContacts.length > 0 && ` (${selectedContacts.length} selected)`}
              </CardDescription>
            </div>
            {selectedContacts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateMutation.mutate({ ids: selectedContacts, action: 'opt-in' })}
                  data-testid="button-bulk-opt-in"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Opt In Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateMutation.mutate({ ids: selectedContacts, action: 'opt-out' })}
                  data-testid="button-bulk-opt-out"
                >
                  <X className="w-4 h-4 mr-2" />
                  Opt Out Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone, email, or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="opted-in">Opted In</SelectItem>
                <SelectItem value="opted-out">Opted Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== 'all' ? 'No contacts match your filters' : 'No contacts yet'}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === filteredContacts.length}
                        onCheckedChange={selectAllVisible}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => (
                    <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                          data-testid={`checkbox-contact-${contact.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{contact.phone}</TableCell>
                      <TableCell>
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>
                        {contact.optedOut ? (
                          <Badge variant="destructive" data-testid={`badge-opted-out-${contact.id}`}>
                            Opted Out
                          </Badge>
                        ) : contact.optedIn ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400" data-testid={`badge-opted-in-${contact.id}`}>
                            Opted In
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-pending-${contact.id}`}>
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {contact.lastMessageAt
                          ? new Date(contact.lastMessageAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingContact(contact)}
                            data-testid={`button-edit-${contact.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                            data-testid={`button-delete-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={open => !open && setEditingContact(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/contacts'] });
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}

function AddContactDialog({
  children,
  open,
  onOpenChange,
  onSuccess,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    firstName: '',
    lastName: '',
    optedIn: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/admin/sms/contacts', data);
    },
    onSuccess: () => {
      toast({ title: 'Contact created successfully' });
      onSuccess();
      setFormData({ phone: '', email: '', firstName: '', lastName: '', optedIn: true });
    },
    onError: () => {
      toast({ title: 'Failed to create contact', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast({ title: 'Phone number is required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent data-testid="dialog-add-contact">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>Create a new SMS contact</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+15125551234"
              data-testid="input-phone"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              data-testid="input-email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optedIn"
              checked={formData.optedIn}
              onCheckedChange={checked => setFormData({ ...formData, optedIn: !!checked })}
              data-testid="checkbox-opted-in"
            />
            <Label htmlFor="optedIn">Opted in to SMS messages</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
              {createMutation.isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditContactDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
}: {
  contact: SMSContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    phone: contact.phone,
    email: contact.email || '',
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    optedIn: contact.optedIn,
    optedOut: contact.optedOut,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('PATCH', `/api/admin/sms/contacts/${contact.id}`, data);
    },
    onSuccess: () => {
      toast({ title: 'Contact updated successfully' });
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Failed to update contact', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-contact">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update contact information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-phone">Phone Number *</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-edit-phone"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-edit-email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-edit-first-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-edit-last-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-optedIn"
                checked={formData.optedIn}
                onCheckedChange={checked => setFormData({ ...formData, optedIn: !!checked, optedOut: false })}
                data-testid="checkbox-edit-opted-in"
              />
              <Label htmlFor="edit-optedIn">Opted in to SMS messages</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-optedOut"
                checked={formData.optedOut}
                onCheckedChange={checked => setFormData({ ...formData, optedOut: !!checked, optedIn: false })}
                data-testid="checkbox-edit-opted-out"
              />
              <Label htmlFor="edit-optedOut">Opted out (TCPA protected)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? 'Updating...' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
