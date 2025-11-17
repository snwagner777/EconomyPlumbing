'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Home } from 'lucide-react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    customerType: 'Residential' as 'Residential' | 'Commercial',
    phone: '',
    email: '',
    address: {
      street: '',
      unit: '',
      city: 'Austin',
      state: 'TX',
      zip: '',
    },
  });

  const createAccount = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/portal/customer-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Account created',
        description: `New ${formData.customerType.toLowerCase()} account created successfully`,
      });
      
      // Reset form
      setFormData({
        name: '',
        customerType: 'Residential',
        phone: '',
        email: '',
        address: {
          street: '',
          unit: '',
          city: 'Austin',
          state: 'TX',
          zip: '',
        },
      });
      
      // Invalidate queries to refetch account list
      queryClient.invalidateQueries({ queryKey: ['/api/portal/customer-accounts'] });
      
      // Close dialog
      onOpenChange(false);
      
      // Optional: Switch to new account
      toast({
        title: 'Account ready',
        description: 'You can now switch to your new account using the account switcher',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zip) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    createAccount.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Create New Account
          </DialogTitle>
          <DialogDescription>
            Add a new residential or commercial account to your portal. This is useful if you manage multiple properties or businesses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>Account Type *</Label>
            <RadioGroup
              value={formData.customerType}
              onValueChange={(value: 'Residential' | 'Commercial') =>
                setFormData({ ...formData, customerType: value })
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    formData.customerType === 'Residential'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, customerType: 'Residential' })}
                >
                  <RadioGroupItem value="Residential" id="residential" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      <Label htmlFor="residential" className="cursor-pointer font-semibold">
                        Residential
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      For your home or personal property
                    </p>
                  </div>
                </div>

                <div
                  className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    formData.customerType === 'Commercial'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, customerType: 'Commercial' })}
                >
                  <RadioGroupItem value="Commercial" id="commercial" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <Label htmlFor="commercial" className="cursor-pointer font-semibold">
                        Commercial
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      For your business or commercial property
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                {formData.customerType === 'Commercial' ? 'Business Name' : 'Full Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.customerType === 'Commercial' ? 'ABC Company LLC' : 'John Smith'}
                required
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(512) 555-0000"
                  required
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  data-testid="input-email"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="font-semibold">Service Address</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="123 Main St"
                  required
                  data-testid="input-street"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="unit">Apt / Suite / Unit (optional)</Label>
                <Input
                  id="unit"
                  value={formData.address.unit}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, unit: e.target.value }
                  })}
                  placeholder="Apt 4B"
                  data-testid="input-unit"
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  required
                  data-testid="input-city"
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: e.target.value }
                  })}
                  maxLength={2}
                  required
                  data-testid="input-state"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={formData.address.zip}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, zip: e.target.value }
                  })}
                  placeholder="78701"
                  required
                  data-testid="input-zip"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAccount.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAccount.isPending}
              data-testid="button-submit"
            >
              {createAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
