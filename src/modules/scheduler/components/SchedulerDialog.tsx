/**
 * SchedulerDialog Component - Modular Version
 * 
 * Reusable 4-step appointment booking dialog using modular hooks.
 * Steps: Service -> Customer/Verification -> Availability -> Review
 * Can be used in customer portal, admin, or AI chatbot.
 */

'use client';

import { useEffect } from 'react';
import { ChevronLeft, AlertCircle, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceStep } from '@/components/scheduler/steps/ServiceStep';
import { CustomerStep } from '@/components/scheduler/steps/CustomerStep';
import { AvailabilityStep } from '@/components/scheduler/steps/AvailabilityStep';
import { ReviewStep } from '@/components/scheduler/steps/ReviewStep';

// Modular hooks
import { useSchedulerFlow } from '../hooks/useSchedulerFlow';
import { useLocationSelector } from '../hooks/useLocationSelector';
import { useVipGuard } from '../hooks/useVipGuard';

// Types
import type { CustomerInfo, CustomerLocation } from '@shared/types/scheduler';

// ============================================================================
// Props
// ============================================================================

export interface SchedulerDialogProps {
  /** Dialog open state */
  open: boolean;
  
  /** Dialog state change handler */
  onOpenChange: (open: boolean) => void;
  
  /** Customer information */
  customerInfo: CustomerInfo;
  
  /** Available customer locations (optional, for multi-location customers) */
  locations?: CustomerLocation[];
  
  /** UTM tracking parameters */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  /** Callback after successful booking (optional) */
  onComplete?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modular 4-step scheduler dialog with verification, VIP validation, and location selection.
 * 
 * Features:
 * - Service selection (Step 1)
 * - Customer information and SMS verification (Step 2)
 * - Time slot selection (Step 3)
 * - Booking review and confirmation (Step 4)
 * - VIP service validation
 * - Multi-location support with smart ZIP selection
 * - Enforces "no billing address fallback" rule
 * 
 * @example
 * ```tsx
 * <SchedulerDialog
 *   open={schedulerOpen}
 *   onOpenChange={setSchedulerOpen}
 *   customerInfo={customerData.customer}
 *   locations={customerLocations}
 *   utmSource="customer-portal"
 * />
 * ```
 */
export function SchedulerDialog({
  open,
  onOpenChange,
  customerInfo,
  locations = [],
  utmSource = 'customer-portal',
  utmMedium,
  utmCampaign,
  onComplete,
}: SchedulerDialogProps) {
  // Modular hooks
  const { state, currentStepConfig, canGoBack, selectJobType, setCustomerData, selectTimeSlot, prevStep, reset } = useSchedulerFlow();
  
  const { 
    selectedLocationId, 
    selectedLocation, 
    serviceZip, 
    hasMultipleLocations, 
    setLocationId 
  } = useLocationSelector({
    locations,
    autoSelect: true,
  });
  
  const { vipError, guardedSelect, clearError } = useVipGuard({
    customerTags: customerInfo.customerTags,
  });

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      reset();
      clearError();
    }
  }, [open, reset, clearError]);

  // Handlers
  const handleSelectJobType = (data: { jobType: import('@shared/types/scheduler').JobType; voucherCode?: string }) => {
    guardedSelect(data.jobType, selectJobType);
  };

  const handleSelectTimeSlot = (slot: import('@shared/types/scheduler').TimeSlot) => {
    selectTimeSlot(slot);
  };

  const handleBack = () => {
    clearError();
    prevStep();
  };

  const handleComplete = () => {
    // Call optional callback
    onComplete?.();
    
    // Reset and close
    reset();
    onOpenChange(false);
    
    // Redirect to success page
    window.location.href = `/scheduler/payment-success?utm_source=${utmSource}`;
  };

  // Get current step icon
  const StepIcon = currentStepConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {StepIcon && (
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                <StepIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{currentStepConfig.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{currentStepConfig.subtitle}</p>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Location Selector - Show if multiple locations */}
        {hasMultipleLocations && (
          <div className="space-y-2 mb-4 p-4 bg-muted/30 rounded-lg border">
            <Label htmlFor="service-location" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              Service Location
            </Label>
            <Select
              value={selectedLocationId?.toString() || ''}
              onValueChange={(value) => setLocationId(parseInt(value, 10))}
            >
              <SelectTrigger id="service-location" data-testid="select-service-location">
                <SelectValue placeholder="Select service location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem 
                    key={location.id} 
                    value={location.id.toString()}
                    data-testid={`location-option-${location.id}`}
                  >
                    {location.name || location.address.street} - {location.address.city}, {location.address.state} {location.address.zip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scheduling for: {selectedLocation?.address.city}, {selectedLocation?.address.zip}
            </p>
          </div>
        )}

        {/* VIP Error Alert */}
        {vipError && (
          <Card className="p-6 mb-6 bg-destructive/10 border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-destructive mb-2">VIP Membership Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This service is only available to VIP members. Would you like to join our VIP membership program?
                </p>
                <div className="flex gap-3">
                  <Button 
                    size="sm"
                    onClick={() => window.location.href = '/membership-benefits'}
                    data-testid="button-join-vip"
                  >
                    Learn More About VIP
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={clearError}
                    data-testid="button-dismiss-vip-error"
                  >
                    Choose Different Service
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step Content */}
        <div className="mt-4">
          {/* Step 1: Service Selection */}
          {state.step === 1 && (
            <ServiceStep
              onSelect={handleSelectJobType}
            />
          )}

          {/* Step 2: Customer Information & Verification */}
          {state.step === 2 && state.jobType && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-6 gap-2 -ml-2"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <CustomerStep
                onSubmit={setCustomerData}
                initialData={{
                  firstName: customerInfo.firstName || '',
                  lastName: customerInfo.lastName || '',
                  email: customerInfo.email || '',
                  phone: customerInfo.phone || '',
                  address: (typeof selectedLocation?.address === 'string' ? selectedLocation.address : selectedLocation?.address.street) || customerInfo.address || '',
                  city: selectedLocation?.address?.city || customerInfo.city || '',
                  state: selectedLocation?.address?.state || customerInfo.state || 'TX',
                  zip: selectedLocation?.address?.zip || customerInfo.zip || '',
                }}
                selectedService={state.jobType}
                onVipError={clearError}
              />
            </div>
          )}

          {/* Step 3: Availability Selection */}
          {state.step === 3 && state.jobType && state.customerData && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-6 gap-2 -ml-2"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <AvailabilityStep
                jobTypeId={state.jobType.id}
                customerZip={state.customerData.zip || serviceZip}
                onSelect={handleSelectTimeSlot}
                selectedSlot={state.timeSlot || undefined}
              />
            </div>
          )}

          {/* Step 4: Review & Confirmation */}
          {state.step === 4 && state.jobType && state.customerData && state.timeSlot && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-6 gap-2 -ml-2"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <ReviewStep
                jobType={state.jobType}
                customer={{
                  firstName: state.customerData.firstName,
                  lastName: state.customerData.lastName,
                  email: state.customerData.email,
                  phone: state.customerData.phone,
                  address: state.customerData.address,
                  city: state.customerData.city,
                  state: state.customerData.state,
                  zip: state.customerData.zip,
                  serviceTitanId: state.customerData.serviceTitanId,
                }}
                timeSlot={state.timeSlot}
                onSuccess={handleComplete}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
