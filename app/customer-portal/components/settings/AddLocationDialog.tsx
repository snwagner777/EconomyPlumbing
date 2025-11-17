'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin } from 'lucide-react';

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
}

export function AddLocationDialog({ open, onOpenChange, customerId }: AddLocationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    address: '',
    unit: '',
    city: 'Austin',
    state: 'TX',
    zipCode: '',
    phone: '',
    email: '',
    specialInstructions: '',
  });

  const addLocation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/portal/add-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add location');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location added',
        description: 'New service location has been added to your account',
      });
      
      // Reset form
      setFormData({
        address: '',
        unit: '',
        city: 'Austin',
        state: 'TX',
        zipCode: '',
        phone: '',
        email: '',
        specialInstructions: '',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/portal'] });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add location',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.phone) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    addLocation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Add New Service Location
          </DialogTitle>
          <DialogDescription>
            Add another location where we can provide service for your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
                required
                data-testid="input-address"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="unit">Apt / Suite / Unit (optional)</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Apt 4B"
                data-testid="input-unit"
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                data-testid="input-city"
              />
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
                required
                data-testid="input-state"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="78701"
                required
                data-testid="input-zip"
              />
            </div>

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

            <div className="col-span-2">
              <Label htmlFor="specialInstructions">Special Instructions (optional)</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                placeholder="Gate code, parking instructions, etc."
                rows={3}
                data-testid="input-instructions"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addLocation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addLocation.isPending}
              data-testid="button-submit"
            >
              {addLocation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Location
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
