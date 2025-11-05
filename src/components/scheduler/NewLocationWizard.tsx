/**
 * Conversational Wizard for Adding New Location to Existing Customer
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from 'lucide-react';

const locationSchema = z.object({
  locationName: z.string().optional(),
  address: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
});

interface NewLocationWizardProps {
  onSubmit: (data: z.infer<typeof locationSchema>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  customerName?: string;
}

export function NewLocationWizard({ onSubmit, onCancel, isSubmitting, customerName }: NewLocationWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [wizardData, setWizardData] = useState<any>({
    city: 'Austin',
    state: 'TX',
  });

  const step1Form = useForm({
    resolver: zodResolver(z.object({
      locationName: z.string().optional(),
    })),
    defaultValues: {
      locationName: wizardData.locationName || '',
    },
  });

  const step2Form = useForm({
    resolver: zodResolver(z.object({
      address: z.string().min(1, 'Street address is required'),
      unit: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(2, 'State is required').max(2),
      zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
    })),
    defaultValues: {
      address: wizardData.address || '',
      unit: wizardData.unit || '',
      city: wizardData.city || 'Austin',
      state: wizardData.state || 'TX',
      zip: wizardData.zip || '',
    },
  });

  const handleStep1Submit = step1Form.handleSubmit((data) => {
    setWizardData({ ...wizardData, ...data });
    setCurrentStep(2);
  });

  const handleStep2Submit = step2Form.handleSubmit((data) => {
    const finalData = { ...wizardData, ...data };
    onSubmit(finalData);
  });

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2].map((step) => (
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

      {/* Step 1: Location Name */}
      {currentStep === 1 && (
        <Form {...step1Form}>
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Name this location</h3>
              <p className="text-sm text-muted-foreground">
                {customerName ? `Adding a new location for ${customerName}` : 'Give this location a memorable name (optional)'}
              </p>
            </div>

            <FormField
              control={step1Form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Main Office, Vacation Home, Rental Property" 
                      {...field} 
                      data-testid="input-location-name"
                      autoFocus
                    />
                  </FormControl>
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
                Next
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Step 2: Address */}
      {currentStep === 2 && (
        <Form {...step2Form}>
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Where is this location?</h3>
              <p className="text-sm text-muted-foreground">This is where we'll perform the service.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FormField
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                onClick={() => setCurrentStep(1)}
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-add-location">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Location'
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
