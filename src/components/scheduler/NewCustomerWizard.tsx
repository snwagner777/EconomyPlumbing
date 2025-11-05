/**
 * Conversational Multi-Step Wizard for Creating New Customers
 * 
 * Flow: Name → Contact → Billing Address → Service Location
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

// Step schemas
const nameSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  customerType: z.enum(['Residential', 'Commercial']),
});

const contactSchema = z.object({
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

const billingAddressSchema = z.object({
  address: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
});

const serviceLocationSchema = z.object({
  sameAsBilling: z.boolean(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationUnit: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZip: z.string().optional(),
}).refine(
  (data) => {
    if (data.sameAsBilling) return true;
    return !!(data.locationAddress && data.locationCity && data.locationState && data.locationZip);
  },
  { message: 'Complete service location address is required', path: ['locationAddress'] }
);

interface NewCustomerWizardProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function NewCustomerWizard({ onSubmit, onCancel, isSubmitting }: NewCustomerWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardData, setWizardData] = useState<any>({
    customerType: 'Residential',
    sameAsBilling: true,
    city: 'Austin',
    state: 'TX',
    locationCity: 'Austin',
    locationState: 'TX',
  });

  // Step 1: Name + Type
  const step1Form = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      firstName: wizardData.firstName || '',
      lastName: wizardData.lastName || '',
      customerType: wizardData.customerType || 'Residential',
    },
  });

  // Step 2: Contact
  const step2Form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: wizardData.email || '',
      phone: wizardData.phone || '',
    },
  });

  // Step 3: Billing Address
  const step3Form = useForm({
    resolver: zodResolver(billingAddressSchema),
    defaultValues: {
      address: wizardData.address || '',
      unit: wizardData.unit || '',
      city: wizardData.city || 'Austin',
      state: wizardData.state || 'TX',
      zip: wizardData.zip || '',
    },
  });

  // Step 4: Service Location
  const step4Form = useForm({
    resolver: zodResolver(serviceLocationSchema),
    defaultValues: {
      sameAsBilling: wizardData.sameAsBilling ?? true,
      locationName: wizardData.locationName || '',
      locationAddress: wizardData.locationAddress || '',
      locationUnit: wizardData.locationUnit || '',
      locationCity: wizardData.locationCity || 'Austin',
      locationState: wizardData.locationState || 'TX',
      locationZip: wizardData.locationZip || '',
    },
  });

  const handleStep1Submit = step1Form.handleSubmit((data) => {
    setWizardData({ ...wizardData, ...data });
    setCurrentStep(2);
  });

  const handleStep2Submit = step2Form.handleSubmit((data) => {
    setWizardData({ ...wizardData, ...data });
    setCurrentStep(3);
  });

  const handleStep3Submit = step3Form.handleSubmit((data) => {
    setWizardData({ ...wizardData, ...data });
    setCurrentStep(4);
  });

  const handleStep4Submit = step4Form.handleSubmit((data) => {
    const finalData = { ...wizardData, ...data };
    onSubmit(finalData);
  });

  const sameAsBilling = step4Form.watch('sameAsBilling');

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              step === currentStep
                ? 'w-8 bg-primary'
                : step < currentStep
                ? 'w-2 bg-primary/50'
                : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Name + Type */}
      {currentStep === 1 && (
        <Form {...step1Form}>
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">What's your name?</h3>
              <p className="text-sm text-muted-foreground">Let's start with the basics.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={step1Form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-firstName" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={step1Form.control}
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

            <FormField
              control={step1Form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" data-testid="button-next">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Step 2: Contact */}
      {currentStep === 2 && (
        <Form {...step2Form}>
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">How can we reach you?</h3>
              <p className="text-sm text-muted-foreground">We'll use this to send appointment confirmations.</p>
            </div>

            <FormField
              control={step2Form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(512) 555-0123" {...field} data-testid="input-phone" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" className="flex-1" data-testid="button-next">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Step 3: Billing Address */}
      {currentStep === 3 && (
        <Form {...step3Form}>
          <form onSubmit={handleStep3Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">What's your billing address?</h3>
              <p className="text-sm text-muted-foreground">This is where we'll send invoices.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FormField
                  control={step3Form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} data-testid="input-address" autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={step3Form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt 5B" {...field} data-testid="input-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-3">
                <FormField
                  control={step3Form.control}
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
                  control={step3Form.control}
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
                  control={step3Form.control}
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" className="flex-1" data-testid="button-next">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Step 4: Service Location */}
      {currentStep === 4 && (
        <Form {...step4Form}>
          <form onSubmit={handleStep4Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Where do you need service?</h3>
              <p className="text-sm text-muted-foreground">Let us know where the work will be done.</p>
            </div>

            <FormField
              control={step4Form.control}
              name="sameAsBilling"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-same-billing"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Service location is the same as my billing address
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Check this if the work will be done at your billing address
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!sameAsBilling && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <FormField
                  control={step4Form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Vacation Home, Rental Property" {...field} data-testid="input-location-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={step4Form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="456 Oak Ave" {...field} data-testid="input-location-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={step4Form.control}
                      name="locationUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Unit 10" {...field} data-testid="input-location-unit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <FormField
                      control={step4Form.control}
                      name="locationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Austin" {...field} data-testid="input-location-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={step4Form.control}
                      name="locationState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="TX" maxLength={2} {...field} data-testid="input-location-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={step4Form.control}
                      name="locationZip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="78701" {...field} data-testid="input-location-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-create-customer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Customer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
