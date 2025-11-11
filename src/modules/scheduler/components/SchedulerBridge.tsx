/**
 * SchedulerBridge - Unified Scheduler for Public and Authenticated Users
 * 
 * ARCHITECTURE:
 * - Listens to SchedulerContext (openScheduler() events)
 * - Uses modular hooks (useSchedulerFlow, useLocationSelector, useVipGuard)
 * - Strategy Pattern: Switches between public/authenticated flows
 * 
 * FLOWS:
 * - Public: Customer Info → Service → Availability → Review → Confirmation
 * - Authenticated: Service → Availability → Review → Confirmation (location selector if multiple)
 * 
 * This replaces the old SchedulerWizard across the entire platform.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useScheduler } from '@/contexts/SchedulerContext';
import { useSchedulerFlow } from '../hooks/useSchedulerFlow';
import { useLocationSelector } from '../hooks/useLocationSelector';
import { PublicCustomerStrategy, AuthenticatedCustomerStrategy } from '../strategies/CustomerDataStrategy';
import type { CustomerDataStrategy } from '../strategies/CustomerDataStrategy';

// Step components (to be created)
import { CustomerInfoStep } from './steps/CustomerInfoStep';
import { ServiceStep } from './steps/ServiceStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { ReviewStep } from './steps/ReviewStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

/**
 * SchedulerBridge Component
 * 
 * Bridges SchedulerContext events to modular scheduler hooks.
 * Supports both public and authenticated user flows.
 */
export function SchedulerBridge() {
  const { isOpen, closeScheduler, options } = useScheduler();
  const schedulerFlow = useSchedulerFlow();
  
  // Location selector needs locations array - will be populated when fetching customer data
  const [customerLocations, setCustomerLocations] = useState<any[]>([]);
  const locationSelector = useLocationSelector({
    locations: customerLocations,
    autoSelect: true,
  });

  // Strategy state
  const [strategy, setStrategy] = useState<CustomerDataStrategy | null>(null);
  const [showCustomerStep, setShowCustomerStep] = useState(false);
  const [customerStepComplete, setCustomerStepComplete] = useState(false);

  // Booking state
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Determine strategy based on options
  useEffect(() => {
    if (!isOpen) return;

    if (options.customerId) {
      // Authenticated flow
      const authStrategy = new AuthenticatedCustomerStrategy(options.customerId);
      setStrategy(authStrategy);
      setShowCustomerStep(false);
      setCustomerStepComplete(true);
    } else {
      // Public flow
      const publicStrategy = new PublicCustomerStrategy();
      setStrategy(publicStrategy);
      setShowCustomerStep(true);
      setCustomerStepComplete(false);
    }
  }, [isOpen, options.customerId]);

  // Handle dialog close
  const handleClose = () => {
    // Reset all state
    schedulerFlow.reset();
    locationSelector.clearSelection();
    setCustomerLocations([]);
    setShowCustomerStep(false);
    setCustomerStepComplete(false);
    setIsBooking(false);
    setBookingSuccess(false);
    setBookingError(null);
    
    // Reset public strategy if applicable
    if (strategy instanceof PublicCustomerStrategy) {
      strategy.reset();
    }
    
    closeScheduler();
  };

  // Handle customer info step completion
  const handleCustomerInfoComplete = (customerId: number, locationId: number) => {
    if (strategy instanceof PublicCustomerStrategy) {
      // Note: Customer info is already stored in strategy during form submission
      setCustomerStepComplete(true);
      setShowCustomerStep(false);
    }
  };

  // Handle booking submission (MUST be before useMemo to avoid TDZ)
  async function handleBooking() {
    if (!strategy) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const customerId = strategy.getCustomerId();
      const locationId = strategy.getLocationId();

      if (!customerId || !locationId) {
        throw new Error('Customer ID and Location ID are required');
      }

      // Call booking API
      const response = await fetch('/api/scheduler/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          locationId,
          jobTypeId: schedulerFlow.state.jobType?.id,
          timeSlot: schedulerFlow.state.timeSlot,
          summary: schedulerFlow.state.jobType?.name || 'Service Request',
          campaignId: 1, // TODO: Get from config
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Booking failed');
      }

      setBookingSuccess(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  }

  // Determine current step to render
  const currentStepComponent = useMemo(() => {
    // If booking is complete, show confirmation
    if (bookingSuccess) {
      return <ConfirmationStep onClose={handleClose} />;
    }

    // If public user and customer step not complete, show customer form
    if (showCustomerStep && !customerStepComplete) {
      return (
        <CustomerInfoStep
          strategy={strategy as PublicCustomerStrategy}
          onComplete={handleCustomerInfoComplete}
          onBack={handleClose}
        />
      );
    }

    // Otherwise, follow scheduler flow steps
    const { step } = schedulerFlow.state;

    switch (step) {
      case 1:
        return (
          <ServiceStep
            schedulerFlow={schedulerFlow}
            prefilledService={options.prefilledService}
          />
        );
      case 2:
        return (
          <AvailabilityStep
            schedulerFlow={schedulerFlow}
            strategy={strategy}
            locationSelector={locationSelector}
          />
        );
      case 3:
        return (
          <ReviewStep
            schedulerFlow={schedulerFlow}
            strategy={strategy}
            locationSelector={locationSelector}
            onBook={handleBooking}
            isBooking={isBooking}
            bookingError={bookingError}
          />
        );
      default:
        return null;
    }
  }, [
    bookingSuccess,
    showCustomerStep,
    customerStepComplete,
    schedulerFlow.state.step,
    strategy,
    options.prefilledService,
    isBooking,
    bookingError,
    handleBooking, // CRITICAL: Include handleBooking to avoid stale closures
    locationSelector,
    schedulerFlow,
  ]);

  // Guard against null strategy during initial render
  if (!strategy) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {currentStepComponent}
      </DialogContent>
    </Dialog>
  );
}
