/**
 * Customer Information Step
 * 
 * Lookup existing customers, poll ServiceTitan for their locations, or create new customer.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Search, Loader2, CheckCircle, MapPin, Plus, ArrowLeft } from 'lucide-react';

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
  onSubmit: (data: CustomerFormData & { locationId?: number }) => void;
  initialData?: Partial<CustomerFormData>;
}

interface STLocation {
  id: number;
  customerId: number;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export function CustomerStep({ onSubmit, initialData }: CustomerStepProps) {
  const [lookupValue, setLookupValue] = useState('');
  const [customerFound, setCustomerFound] = useState<any>(null);
  const [locations, setLocations] = useState<STLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<STLocation | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
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

  // Lookup customer in local DB
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
        setCustomerFound(data.customer);
        
        // Immediately fetch locations from ServiceTitan
        if (data.customer.serviceTitanId) {
          fetchLocationsMutation.mutate(data.customer.serviceTitanId);
        }
        
        // Pre-fill form with customer data
        const nameParts = data.customer.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        form.reset({
          firstName,
          lastName,
          email: data.customer.email || '',
          phone: data.customer.phoneNumber || lookupValue,
          address: data.locations?.[0]?.street || '',
          city: data.locations?.[0]?.city || 'Austin',
          state: data.locations?.[0]?.state || 'TX',
          zip: data.locations?.[0]?.zip || '',
          notes: '',
        });
      } else {
        setCustomerFound(null);
        setLocations([]);
        form.setValue('phone', lookupValue.match(/\d/) ? lookupValue : '');
        form.setValue('email', lookupValue.includes('@') ? lookupValue : '');
        setShowForm(true);
      }
    },
  });

  // Fetch locations from ServiceTitan
  const fetchLocationsMutation = useMutation({
    mutationFn: async (serviceTitanCustomerId: number) => {
      const response = await apiRequest('POST', '/api/scheduler/fetch-locations', {
        serviceTitanCustomerId,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.locations) {
        console.log('[CustomerStep] Fetched ServiceTitan locations:', data.locations);
        setLocations(data.locations);
      }
    },
  });

  // Create new location for existing customer
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      const response = await apiRequest('POST', '/api/scheduler/create-location', locationData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.location) {
        console.log('[CustomerStep] Created new location:', data.location);
        setLocations(prev => [...prev, data.location]);
        setSelectedLocation(data.location);
        setShowAddLocation(false);
      }
    },
  });

  const handleLookup = () => {
    if (lookupValue.trim()) {
      lookupMutation.mutate(lookupValue.trim());
    }
  };

  const handleLocationSelect = (location: STLocation) => {
    setSelectedLocation(location);
    form.setValue('address', location.address.street);
    form.setValue('city', location.address.city);
    form.setValue('state', location.address.state);
    form.setValue('zip', location.address.zip);
    setShowForm(true);
  };

  const handleAddNewLocation = () => {
    const formData = form.getValues();
    if (customerFound && customerFound.serviceTitanId) {
      createLocationMutation.mutate({
        customerId: customerFound.serviceTitanId, // Match API endpoint parameter name
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        phone: formData.phone,
        email: formData.email,
      });
    }
  };

  const handleSubmit = (data: CustomerFormData) => {
    // Include selected location ID if customer has one
    if (selectedLocation) {
      onSubmit({ ...data, locationId: selectedLocation.id });
    } else {
      onSubmit(data);
    }
  };

  // Show lookup interface first
  if (!showForm && !customerFound) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What's the best phone number to reach you?</label>
            <div className="flex gap-2">
              <Input
                placeholder="(512) 555-0123"
                value={lookupValue}
                onChange={(e) => {
                  setLookupValue(e.target.value);
                  // Auto-lookup after user finishes typing (simple debounce)
                  if (e.target.value.length >= 10) {
                    const timer = setTimeout(() => {
                      lookupMutation.mutate(e.target.value.trim());
                    }, 500);
                    return () => clearTimeout(timer);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lookupValue.trim()) {
                    handleLookup();
                  }
                }}
                data-testid="input-phone"
              />
              <Button
                onClick={handleLookup}
                disabled={lookupMutation.isPending || !lookupValue.trim()}
                data-testid="button-continue"
              >
                {lookupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll use this to send appointment reminders
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show location selection if customer found with locations
  if (customerFound && locations.length > 0 && !selectedLocation && !showAddLocation) {
    return (
      <div className="space-y-6">
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
                Welcome Back, {customerFound.name}!
              </h3>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                We found your account. Please select a service location.
              </p>
            </div>
          </div>
        </Card>

        {fetchLocationsMutation.isPending && (
          <Card className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading your service locations from ServiceTitan...</p>
          </Card>
        )}

        {!fetchLocationsMutation.isPending && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Select Service Location</h3>
              <div className="grid gap-2">
                {locations.map((location) => (
                  <Card
                    key={location.id}
                    className="p-4 cursor-pointer hover-elevate active-elevate-2 border-2 transition-colors"
                    onClick={() => handleLocationSelect(location)}
                    data-testid={`card-location-${location.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {location.address.street}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {location.address.city}, {location.address.state} {location.address.zip}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddLocation(true)}
              data-testid="button-add-location"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Service Location
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setCustomerFound(null);
            setLocations([]);
            setShowForm(false);
          }}
          data-testid="button-back-lookup"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lookup
        </Button>
      </div>
    );
  }

  // Show add location form
  if (showAddLocation && customerFound) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => handleAddNewLocation())} className="space-y-6">
          <Card className="p-4 bg-primary/5">
            <h3 className="font-semibold text-sm mb-2">Add New Service Location</h3>
            <p className="text-xs text-muted-foreground">
              Adding location for: {customerFound.name}
            </p>
          </Card>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddLocation(false)}
              data-testid="button-cancel-location"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createLocationMutation.isPending}
              data-testid="button-save-location"
            >
              {createLocationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  // Show full customer form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        {selectedLocation && (
          <Card className="p-4 bg-primary/5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Service Location</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedLocation.address.street}, {selectedLocation.address.city}, {selectedLocation.address.state} {selectedLocation.address.zip}
                </p>
              </div>
            </div>
          </Card>
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
