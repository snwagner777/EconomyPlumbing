'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface CommercialCustomer {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  location?: string;
  industry?: string;
  customerSince?: number;
  displayOrder: number;
  active: boolean;
}

export default function CommercialCustomersPage() {
  const [editingCustomer, setEditingCustomer] = useState<CommercialCustomer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    location: "",
    industry: "",
    customerSince: new Date().getFullYear(),
    displayOrder: 0,
    active: true,
  });

  const { data: customersData, isLoading } = useQuery<{ customers: CommercialCustomer[] }>({
    queryKey: ['/api/admin/commercial-customers'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/commercial-customers", data);
    },
    onSuccess: () => {
      toast({
        title: "Customer Added",
        description: "Commercial customer has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof formData> }) => {
      return await apiRequest("PUT", `/api/admin/commercial-customers/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Customer Updated",
        description: "Commercial customer has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/commercial-customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Customer Deleted",
        description: "Commercial customer has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingCustomer(null);
    setFormData({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      location: "",
      industry: "",
      customerSince: new Date().getFullYear(),
      displayOrder: (customersData?.customers.length || 0) + 1,
      active: true,
    });
    setLogoFile(null);
    setLogoPreview("");
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: CommercialCustomer) => {
    setIsAddingNew(false);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      logoUrl: customer.logoUrl,
      websiteUrl: customer.websiteUrl || "",
      location: customer.location || "",
      industry: customer.industry || "",
      customerSince: customer.customerSince || new Date().getFullYear(),
      displayOrder: customer.displayOrder,
      active: customer.active,
    });
    setLogoPreview(customer.logoUrl);
    setLogoFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this commercial customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setIsAddingNew(false);
    setLogoFile(null);
    setLogoPreview("");
    setFormData({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      location: "",
      industry: "",
      customerSince: new Date().getFullYear(),
      displayOrder: 0,
      active: true,
    });
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Automatically upload and process the logo
      await handleProcessLogoAuto(file);
    }
  };

  const handleProcessLogoAuto = async (file: File) => {
    setIsProcessingLogo(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Failed to upload logo' }));
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const { logoUrl } = await uploadResponse.json();

      const processResponse = await apiRequest("POST", "/api/admin/process-logo", {
        logoUrl,
        customerName: formData.name || "Logo",
      });

      const processData = await processResponse.json();
      const { processedLogoUrl } = processData;

      setFormData(prev => ({ ...prev, logoUrl: processedLogoUrl }));
      setLogoPreview(processedLogoUrl);

      toast({
        title: "Logo Uploaded",
        description: "Logo uploaded and processed successfully.",
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleProcessLogo = async () => {
    if (!logoFile) {
      toast({
        title: "No Logo Selected",
        description: "Please select a logo file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingLogo(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', logoFile);

      const uploadResponse = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      const { logoUrl } = await uploadResponse.json();

      const processResponse = await apiRequest("POST", "/api/admin/process-logo", {
        logoUrl,
        customerName: formData.name || "Logo",
      });

      const { processedLogoUrl } = await processResponse.json();

      setFormData(prev => ({ ...prev, logoUrl: processedLogoUrl }));
      setLogoPreview(processedLogoUrl);

      toast({
        title: "Logo Processed Successfully",
        description: "Your logo has been optimized and background removed.",
      });
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process logo",
        variant: "destructive",
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.logoUrl) {
      toast({
        title: "Missing Information",
        description: "Customer name and logo are required.",
        variant: "destructive",
      });
      return;
    }

    if (isAddingNew) {
      createMutation.mutate(formData);
    } else if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer.id,
        updates: formData,
      });
    }
  };

  const handleToggleActive = (customer: CommercialCustomer) => {
    updateMutation.mutate({
      id: customer.id,
      updates: { active: !customer.active }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commercial Customers</h1>
          <p className="text-muted-foreground mt-1">Manage customer logos displayed on commercial services page</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-customer">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customersData?.customers.map((customer) => (
          <Card key={customer.id} data-testid={`customer-card-${customer.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {customer.logoUrl && (
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-md p-2 flex items-center justify-center min-w-[60px]">
                      <img
                        src={customer.logoUrl}
                        alt={`${customer.name} logo`}
                        className="h-12 w-auto object-contain"
                        data-testid={`logo-preview-${customer.id}`}
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.location && (
                      <CardDescription>{customer.location}</CardDescription>
                    )}
                  </div>
                </div>
                <Switch
                  checked={customer.active}
                  onCheckedChange={() => handleToggleActive(customer)}
                  data-testid={`switch-active-${customer.id}`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                {customer.industry && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Industry:</span> {customer.industry}
                  </p>
                )}
                {customer.customerSince && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Customer Since:</span> {customer.customerSince}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium">Display Order:</span> {customer.displayOrder}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(customer)}
                  data-testid={`button-edit-${customer.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(customer.id)}
                  data-testid={`button-delete-${customer.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? "Add Commercial Customer" : "Edit Commercial Customer"}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew
                ? "Add a new commercial customer to display on the commercial services page."
                : "Update the commercial customer information."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label>Logo *</Label>
              <div className="flex gap-4 items-start">
                {logoPreview && (
                  <div className="border rounded-lg p-4 bg-slate-900 dark:bg-slate-800 flex items-center justify-center min-w-[120px]">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-auto object-contain"
                      data-testid="logo-preview"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={isProcessingLogo}
                    data-testid="input-logo-file"
                  />
                  {isProcessingLogo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing logo...</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload any image format (PNG, JPEG, SVG, etc.). Logo will be automatically processed and optimized.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="O'Reilly Auto Parts"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://www.example.com"
                data-testid="input-website"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Austin, TX"
                  data-testid="input-location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Restaurant, Auto Services, etc."
                  data-testid="input-industry"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerSince">Customer Since (Year)</Label>
                <Input
                  id="customerSince"
                  type="number"
                  value={formData.customerSince}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerSince: parseInt(e.target.value) }))}
                  placeholder="2020"
                  data-testid="input-customer-since"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                  placeholder="1"
                  data-testid="input-display-order"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                data-testid="switch-active-form"
              />
              <Label htmlFor="active">Active (Show on website)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
