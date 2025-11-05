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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Search, Loader2, CheckCircle, MapPin, Plus, ArrowLeft, Info } from 'lucide-react';
import { NewCustomerWizard } from '../NewCustomerWizard';
import { NewLocationWizard } from '../NewLocationWizard';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\.]+$/, 'Phone number can only contain numbers and formatting characters')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, 'Phone number must be exactly 10 digits'),
  customerType: z.enum(['Residential', 'Commercial']),
  address: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
  locationName: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerStepProps {
  onSubmit: (data: CustomerFormData & { locationId?: number; serviceTitanId?: number; customerTags?: string[] }) => void;
  initialData?: Partial<CustomerFormData>;
  selectedService?: {
    id: number;
    name: string;
    code: string;
  };
  onVipError?: () => void;
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

// Helper to normalize state to 2-letter code
const normalizeState = (state: string): string => {
  if (!state) return 'TX';
  
  // If already 2 characters, return uppercase
  if (state.length === 2) return state.toUpperCase();
  
  // Common state mappings
  const stateMap: { [key: string]: string } = {
    'texas': 'TX',
    'california': 'CA',
    'new york': 'NY',
    'florida': 'FL',
    'illinois': 'IL',
    // Add more as needed
  };
  
  const normalized = stateMap[state.toLowerCase()];
  return normalized || state.substring(0, 2).toUpperCase();
};

export function CustomerStep({ onSubmit, initialData, selectedService, onVipError }: CustomerStepProps) {
  const [lookupValue, setLookupValue] = useState('');
  const [customersFound, setCustomersFound] = useState<any[]>([]);
  const [customerFound, setCustomerFound] = useState<any>(null);
  const [locations, setLocations] = useState<STLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<STLocation | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Check if service qualifies for free estimate message
  const showFreeEstimateBanner = selectedService && (() => {
    const serviceName = selectedService.name.toLowerCase();
    return (
      serviceName.includes('repair') ||
      serviceName.includes('gas') ||
      serviceName.includes('water heater') ||
      serviceName.includes('food truck') ||
      serviceName.includes('propane') ||
      serviceName.includes('natural gas')
    );
  })();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      customerType: 'Residential',
      address: initialData?.address || '',
      unit: initialData?.unit || '',
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
      if (data.success && data.customers && data.customers.length > 0) {
        setCustomersFound(data.customers);
        
        // If only one customer, auto-select it
        if (data.customers.length === 1) {
          handleCustomerSelect(data.customers[0]);
        }
        // Otherwise, show customer selection UI
      } else {
        setCustomersFound([]);
        setCustomerFound(null);
        setLocations([]);
        form.setValue('phone', lookupValue.match(/\d/) ? lookupValue : '');
        form.setValue('email', lookupValue.includes('@') ? lookupValue : '');
        setShowForm(true);
      }
    },
  });
  
  const handleCustomerSelect = (customer: any) => {
    setCustomerFound(customer);
    
    // Immediately fetch locations from ServiceTitan
    if (customer.serviceTitanId) {
      fetchLocationsMutation.mutate(customer.serviceTitanId);
    }
    
    // Pre-fill form with customer data
    const nameParts = customer.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    form.reset({
      firstName,
      lastName,
      email: customer.email || '',
      phone: customer.phoneNumber || lookupValue,
      address: customer.locations?.[0]?.street || '',
      city: customer.locations?.[0]?.city || 'Austin',
      state: normalizeState(customer.locations?.[0]?.state || 'TX'),
      zip: customer.locations?.[0]?.zip || '',
      notes: '',
    });
  };

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
    form.setValue('state', normalizeState(location.address.state));
    form.setValue('zip', location.address.zip);
    
    // Immediately submit with the selected location for existing customers
    if (customerFound) {
      // Check VIP status before submitting
      const isVIPService = selectedService?.name.toLowerCase().includes('vip');
      const isVIPCustomer = customerFound.customerTags?.some((tag: string) => tag.toLowerCase() === 'vip');
      
      if (isVIPService && !isVIPCustomer) {
        onVipError?.();
        return;
      }
      
      const submitData = {
        firstName: form.getValues('firstName'),
        lastName: form.getValues('lastName'),
        email: form.getValues('email'),
        phone: form.getValues('phone'),
        customerType: 'Residential' as const,
        address: location.address.street,
        unit: '',
        city: location.address.city,
        state: normalizeState(location.address.state),
        zip: location.address.zip,
        notes: form.getValues('notes') || '',
        locationId: location.id,
        serviceTitanId: customerFound.serviceTitanId,
        customerTags: customerFound.customerTags || [],
      };
      onSubmit(submitData);
    } else {
      setShowForm(true);
    }
  };

  const handleAddNewLocation = () => {
    const formData = form.getValues();
    if (customerFound && customerFound.serviceTitanId) {
      createLocationMutation.mutate({
        customerId: customerFound.serviceTitanId,
        name: formData.locationName || undefined,
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

  // Create new customer in ServiceTitan
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest('POST', '/api/scheduler/ensure-customer', customerData);
      return await response.json();
    },
    onSuccess: (data: any, variables: CustomerFormData) => {
      if (data.success && data.customer) {
        console.log('[CustomerStep] Created customer in ServiceTitan:', data.customer.id);
        // Submit with ServiceTitan customer ID
        const submitData = {
          ...variables,
          serviceTitanId: data.customer.id,
          customerTags: [],
        };
        onSubmit(submitData);
      }
    },
  });

  const handleSubmit = (data: CustomerFormData) => {
    // Check VIP status before proceeding
    const isVIPService = selectedService?.name.toLowerCase().includes('vip');
    const isVIPCustomer = customerFound?.customerTags?.some((tag: string) => tag.toLowerCase() === 'vip');
    
    if (isVIPService && !isVIPCustomer && !customerFound) {
      // New customer trying to book VIP service
      onVipError?.();
      return;
    }
    
    // If existing customer, include their metadata
    if (customerFound) {
      const submitData = {
        ...data,
        locationId: selectedLocation?.id,
        serviceTitanId: customerFound.serviceTitanId,
        customerTags: customerFound.customerTags || [],
      };
      onSubmit(submitData);
    } else {
      // New customer - create in ServiceTitan first
      createCustomerMutation.mutate(data);
    }
  };

  // Show customer selection if multiple customers found (check this FIRST)
  if (customersFound.length > 1 && !customerFound) {
    return (
      <div className="space-y-6">
        {showFreeEstimateBanner && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Free Estimate Included
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This service includes a complimentary estimate. We'll assess your needs and provide transparent pricing before any work begins.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Is this you?</h3>
          <p className="text-sm text-muted-foreground">
            We found multiple accounts with this phone number. Please select your account:
          </p>
        </div>

        <div className="space-y-3">
          {customersFound.map((customer, index) => {
            const isVIP = customer.customerTags?.some((tag: string) => tag.toLowerCase() === 'vip');
            const isVIPService = selectedService?.name.toLowerCase().includes('vip');
            const isDisabled = isVIPService && !isVIP;
            
            return (
              <Card
                key={customer.id}
                className={`p-4 cursor-pointer hover-elevate active-elevate-2 border-2 transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (isDisabled) {
                    onVipError?.();
                    return;
                  }
                  handleCustomerSelect(customer);
                }}
                data-testid={`card-customer-${customer.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{customer.name}</p>
                      {isVIP && (
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs">
                          VIP
                        </Badge>
                      )}
                    </div>
                    {customer.email && (
                      <p className="text-xs text-muted-foreground mt-1">{customer.email}</p>
                    )}
                    {customer.locations?.[0] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {customer.locations[0].street}, {customer.locations[0].city}, {customer.locations[0].state}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCustomersFound([]);
            setShowForm(true);
          }}
          data-testid="button-new-customer"
        >
          None of these - Create New Account
        </Button>
      </div>
    );
  }

  // Show lookup interface if no customer found yet
  if (!showForm && !customerFound && customersFound.length <= 1) {
    return (
      <div className="space-y-6">
        {showFreeEstimateBanner && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Free Estimate Included
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This service includes a complimentary estimate. We'll assess your needs and provide transparent pricing before any work begins.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What's the best phone number to reach you?</label>
            <div className="flex gap-2 max-w-md">
              <Input
                type="tel"
                placeholder="(512) 555-0123"
                value={lookupValue}
                className="max-w-xs"
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
        {showFreeEstimateBanner && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Free Estimate Included
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This service includes a complimentary estimate. We'll assess your needs and provide transparent pricing before any work begins.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Welcome Back, {customerFound.name}!
                </h3>
                {customerFound.customerTags?.some((tag: string) => tag.toLowerCase() === 'vip') && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs">
                    VIP
                  </Badge>
                )}
              </div>
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

  // Show add location wizard
  if (showAddLocation && customerFound) {
    return (
      <div className="space-y-6">
        {showFreeEstimateBanner && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Free Estimate Included
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This service includes a complimentary estimate. We'll assess your needs and provide transparent pricing before any work begins.
                </p>
              </div>
            </div>
          </Card>
        )}

        <NewLocationWizard
          customerName={customerFound.name}
          onSubmit={(locationData) => {
            if (customerFound && customerFound.serviceTitanId) {
              createLocationMutation.mutate({
                customerId: customerFound.serviceTitanId,
                name: locationData.locationName || undefined,
                address: {
                  street: locationData.address,
                  unit: locationData.unit || undefined,
                  city: locationData.city,
                  state: locationData.state,
                  zip: locationData.zip,
                },
                phone: customerFound.phone || '',
                email: customerFound.email || '',
              });
            }
          }}
          onCancel={() => setShowAddLocation(false)}
          isSubmitting={createLocationMutation.isPending}
        />
      </div>
    );
  }

  // Show new customer wizard
  return (
    <div className="space-y-6">
      {showFreeEstimateBanner && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Free Estimate Included
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                This service includes a complimentary estimate. We'll assess your needs and provide transparent pricing before any work begins.
              </p>
            </div>
          </div>
        </Card>
      )}

      <NewCustomerWizard
        onSubmit={(wizardData) => {
          // Create customer in ServiceTitan immediately with wizard data
          createCustomerMutation.mutate({
            ...wizardData,
            forceCreate: true, // Always create new when user explicitly chooses "Create New Customer"
          });
        }}
        onCancel={() => {
          setShowForm(false);
          setCustomersFound([]);
        }}
        isSubmitting={createCustomerMutation.isPending}
      />
    </div>
  );
}
