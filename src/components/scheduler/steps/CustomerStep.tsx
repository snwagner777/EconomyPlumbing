/**
 * Customer Information Step
 * 
 * Polished form to collect customer contact details and service address.
 * Includes account lookup to auto-populate returning customers.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Search, Loader2, CheckCircle, MapPin } from 'lucide-react';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerStepProps {
  onSubmit: (data: CustomerFormData) => void;
  initialData?: Partial<CustomerFormData>;
}

export function CustomerStep({ onSubmit, initialData }: CustomerStepProps) {
  const [lookupValue, setLookupValue] = useState('');
  const [customerFound, setCustomerFound] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || 'Austin',
      state: initialData?.state || 'TX',
      zip: initialData?.zip || '',
      notes: initialData?.notes || '',
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (value: string) => {
      const response = await apiRequest('POST', '/api/scheduler/lookup-customer', {
        phone: value.match(/\d/) ? value : undefined,
        email: value.includes('@') ? value : undefined,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.customer) {
        setCustomerFound(true);
        setLocations(data.locations || []);
        
        const nameParts = data.customer.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        form.reset({
          firstName,
          lastName,
          email: data.customer.email || '',
          phone: data.customer.phoneNumber || lookupValue,
          address: data.customer.address?.street || '',
          city: data.customer.address?.city || 'Austin',
          state: data.customer.address?.state || 'TX',
          zip: data.customer.address?.zip || '',
          notes: '',
        });
        
        setShowForm(true);
      } else {
        setCustomerFound(false);
        setLocations([]);
        form.setValue('phone', lookupValue.match(/\d/) ? lookupValue : '');
        form.setValue('email', lookupValue.includes('@') ? lookupValue : '');
        setShowForm(true);
      }
    },
  });

  const handleLookup = () => {
    if (lookupValue.trim()) {
      lookupMutation.mutate(lookupValue.trim());
    }
  };

  const handleLocationSelect = (location: any) => {
    form.setValue('address', location.address.street);
    form.setValue('city', location.address.city);
    form.setValue('state', location.address.state);
    form.setValue('zip', location.address.zip);
  };

  // Show lookup interface first
  if (!showForm) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Let's Find Your Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your phone number or email to see if you're already in our system
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="(512) 555-0123 or email@example.com"
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              data-testid="input-lookup"
            />
            <Button
              onClick={handleLookup}
              disabled={lookupMutation.isPending}
              data-testid="button-lookup"
            >
              {lookupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
          data-testid="button-skip-lookup"
        >
          Skip - I'm a New Customer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Found Banner */}
        {customerFound && (
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Welcome Back!
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  We found your account. Your information has been filled in below.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Multiple Locations */}
        {locations.length > 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Select Service Location</h3>
            <div className="grid gap-2">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className="p-3 cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleLocationSelect(location)}
                  data-testid={`card-location-${location.id}`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {location.address.street}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.address.city}, {location.address.state} {location.address.zip}
                      </p>
                      {location.isPrimary && (
                        <Badge variant="secondary" className="text-xs mt-1">Primary</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} data-testid="input-firstName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(512) 555-0123" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} data-testid="input-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Austin" {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-1">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="TX" maxLength={2} {...field} data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="78701" {...field} data-testid="input-zip" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific instructions or details about your plumbing issue..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" data-testid="button-continue">
          Continue to Appointment Times
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Form>
  );
}
