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
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Search, Loader2, CheckCircle, MapPin, Plus, ArrowLeft, Info, Phone, Mail, User, AlertCircle } from 'lucide-react';
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
  grouponVoucher: z.string().optional(),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface SchedulerSession {
  token: string;
  verificationMethod: 'phone' | 'email';
  verifiedAt: number;
  customerId: number | null;
  expiresAt: number;
}

interface CustomerStepProps {
  onSubmit: (data: CustomerFormData & { locationId?: number; serviceTitanId?: number; customerTags?: string[] }) => void;
  initialData?: Partial<CustomerFormData>;
  selectedService?: {
    id: number;
    name: string;
    code: string;
  };
  onVipError?: () => void;
  onSessionUpdate?: (session: Partial<SchedulerSession>) => void;
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

export function CustomerStep({ onSubmit, initialData, selectedService, onVipError, onSessionUpdate }: CustomerStepProps) {
  const { toast } = useToast();
  const [lookupValue, setLookupValue] = useState('');
  const [lookupMode, setLookupMode] = useState<'phone' | 'email'>('phone'); // Toggle between phone and email
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedContact, setVerifiedContact] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [customersFound, setCustomersFound] = useState<any[]>([]);
  const [customerFound, setCustomerFound] = useState<any>(null);
  const [locations, setLocations] = useState<STLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<STLocation | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [customerContacts, setCustomerContacts] = useState<any[]>([]);

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

  // Check if this is a Groupon service
  const isGrouponService = selectedService && (() => {
    const serviceName = selectedService.name.toLowerCase();
    return serviceName.includes('groupon') || serviceName.includes('$49');
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
      grouponVoucher: initialData?.grouponVoucher || '',
      specialInstructions: initialData?.specialInstructions || '',
      notes: initialData?.notes || '',
    },
  });

  // Send OTP for verification (SMS or Email)
  const sendOTPMutation = useMutation({
    mutationFn: async ({ contact, type }: { contact: string; type: 'phone' | 'email' }) => {
      const response = await apiRequest('POST', '/api/scheduler/otp/send', { contact, type });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification code');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setShowVerification(true);
      setVerificationCode('');
      setSendError(null);
      toast({
        title: "Verification code sent!",
        description: data.method === 'sms' 
          ? "Check your phone for the SMS code" 
          : "Check your email inbox for the verification code",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      setSendError(errorMessage);
      
      // Show different toast messages based on error type
      if (errorMessage.includes('wait a minute')) {
        toast({
          title: "Too many requests",
          description: "Please wait a minute before requesting another code",
          variant: "destructive"
        });
      } else if (errorMessage.includes('not available')) {
        toast({
          title: "Service unavailable",
          description: lookupMode === 'phone' 
            ? "SMS service is temporarily unavailable. Try using email instead." 
            : "Email service is temporarily unavailable. Try using phone instead.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error sending code",
          description: errorMessage,
          variant: "destructive"
        });
      }
    },
  });

  // Verify OTP code
  const verifyOTPMutation = useMutation({
    mutationFn: async ({ contact, code }: { contact: string; code: string }) => {
      const response = await apiRequest('POST', '/api/scheduler/otp/verify', { contact, code });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Verification failed');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.verified && data.session) {
        // Update session state in parent
        onSessionUpdate?.(data.session);
        
        setIsVerified(true);
        setVerifiedContact(data.session.verificationMethod === 'phone' ? lookupValue : lookupValue);
        setShowVerification(false);
        toast({
          title: "Verified!",
          description: "Your contact has been verified successfully",
        });
        // Now proceed with customer lookup
        lookupMutation.mutate(lookupValue);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Lookup customer in local DB (called AFTER verification)
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
    
    // Immediately fetch locations and contacts from ServiceTitan
    if (customer.serviceTitanId) {
      fetchLocationsMutation.mutate(customer.serviceTitanId);
      fetchContactsMutation.mutate(customer.serviceTitanId);
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

  // Fetch contacts from ServiceTitan (read-only)
  const fetchContactsMutation = useMutation({
    mutationFn: async (serviceTitanCustomerId: number) => {
      const response = await fetch(`/api/scheduler/customer-contacts?customerId=${serviceTitanCustomerId}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.contacts) {
        console.log('[CustomerStep] Fetched customer contacts:', data.contacts);
        setCustomerContacts(data.contacts);
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
        
        // Automatically proceed with the new location
        handleLocationSelect(data.location);
      }
    },
  });

  const handleLookup = () => {
    if (lookupValue.trim()) {
      // Send OTP for verification first
      sendOTPMutation.mutate({
        contact: lookupValue.trim(),
        type: lookupMode
      });
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode.trim().length === 6) {
      verifyOTPMutation.mutate({
        contact: lookupValue.trim(),
        code: verificationCode.trim()
      });
    }
  };

  const handleResendCode = () => {
    setVerificationCode('');
    sendOTPMutation.mutate({
      contact: lookupValue.trim(),
      type: lookupMode
    });
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

  // Show verification code input if OTP was sent
  if (showVerification && !isVerified) {
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
            <h3 className="text-base font-semibold text-center">Enter Verification Code</h3>
            <p className="text-sm text-muted-foreground text-center">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-foreground">
                {lookupMode === 'phone' 
                  ? lookupValue 
                  : lookupValue
                }
              </span>
            </p>
          </div>

          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only digits
                setVerificationCode(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && verificationCode.length === 6) {
                  handleVerifyCode();
                }
              }}
              data-testid="input-verification-code"
            />
            <Button
              onClick={handleVerifyCode}
              disabled={verifyOTPMutation.isPending || verificationCode.length !== 6}
              data-testid="button-verify"
            >
              {verifyOTPMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>

          {verifyOTPMutation.isError && (
            <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                Invalid or expired code. Please try again.
              </p>
            </Card>
          )}

          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendCode}
              disabled={sendOTPMutation.isPending}
              className="text-xs"
              data-testid="button-resend-code"
            >
              {sendOTPMutation.isPending ? 'Sending...' : 'Resend Code'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowVerification(false);
                setVerificationCode('');
              }}
              className="text-xs"
              data-testid="button-change-contact"
            >
              Change {lookupMode === 'phone' ? 'Phone Number' : 'Email Address'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-center">How should we reach you?</h3>
            
            {/* Toggle buttons for phone/email selection */}
            <div className="flex gap-2 justify-center">
              <Button
                variant={lookupMode === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLookupMode('phone');
                  setLookupValue('');
                }}
                className="flex items-center gap-2"
                data-testid="button-mode-phone"
              >
                <Phone className="w-4 h-4" />
                Cell Phone
              </Button>
              <Button
                variant={lookupMode === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLookupMode('email');
                  setLookupValue('');
                }}
                className="flex items-center gap-2"
                data-testid="button-mode-email"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>

            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                type={lookupMode === 'phone' ? 'tel' : 'email'}
                placeholder={lookupMode === 'phone' ? '(512) 555-0123' : 'your.email@example.com'}
                value={lookupValue}
                className="max-w-xs"
                onChange={(e) => {
                  if (lookupMode === 'phone') {
                    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    
                    // Format phone number as user types: (512) 555-0123
                    if (value.length >= 10) {
                      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                    } else if (value.length >= 6) {
                      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
                    } else if (value.length >= 3) {
                      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                    }
                    
                    setLookupValue(value);
                    setSendError(null); // Clear error when typing
                  } else {
                    setLookupValue(e.target.value);
                    setSendError(null); // Clear error when typing
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lookupValue.trim() && !sendOTPMutation.isPending) {
                    handleLookup();
                  }
                }}
                data-testid={lookupMode === 'phone' ? 'input-phone' : 'input-email'}
              />
              <Button
                onClick={handleLookup}
                disabled={sendOTPMutation.isPending || !lookupValue.trim()}
                data-testid="button-continue"
              >
                {sendOTPMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
            
            {sendError && (
              <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{sendError}</p>
                </div>
              </Card>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              {lookupMode === 'phone' 
                ? 'We need a cell phone to send SMS verification codes and appointment reminders'
                : 'We\'ll send an email verification code and appointment confirmations'
              }
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

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddLocation(true)}
                data-testid="button-add-location"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowContactsDialog(true)}
                data-testid="button-view-contacts"
              >
                <User className="w-4 h-4 mr-2" />
                View Contacts
              </Button>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setCustomerFound(null);
            setLocations([]);
            setCustomerContacts([]);
            setShowForm(false);
          }}
          data-testid="button-back-lookup"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lookup
        </Button>

        {/* Contacts Dialog */}
        <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
          <DialogContent className="max-w-md" data-testid="dialog-customer-contacts">
            <DialogHeader>
              <DialogTitle>Contact Information</DialogTitle>
              <DialogDescription>
                Review your contact information on file. To update, please visit the customer portal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {fetchContactsMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : fetchContactsMutation.isError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-2">Failed to load contact information</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchContactsMutation.mutate(customerFound.serviceTitanId)}
                  >
                    Retry
                  </Button>
                </div>
              ) : customerContacts.length > 0 ? (
                customerContacts.map((contact) => (
                  <div key={contact.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {contact.name}
                    </div>
                    {contact.methods.map((method: any) => (
                      <div
                        key={method.id}
                        className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                        data-testid={`contact-method-${method.id}`}
                      >
                        {method.type === 'Email' ? (
                          <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                        ) : (
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{method.value}</div>
                          {method.memo && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {method.memo}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No contact information on file
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowContactsDialog(false)} data-testid="button-close-contacts">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          defaultPhone={customerFound.phone}
          defaultEmail={customerFound.email}
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
                phone: locationData.phone,
                email: locationData.email || undefined,
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
        isGrouponService={isGrouponService || false}
      />
    </div>
  );
}
