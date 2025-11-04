'use client';

import { useState } from 'react';
import { ServiceCategoryStep, SERVICE_CATEGORIES } from './ServiceCategoryStep';
import { CustomerInfoStep } from './CustomerInfoStep';
import { LocationStep } from './LocationStep';
import { TimeSelectionStep } from './TimeSelectionStep';
import { BookingSummaryStep } from './BookingSummaryStep';

export interface SchedulerData {
  service?: {
    name: string;
    jobTypeId: number;
    category: string;
  };
  customer?: {
    id?: number;
    name: string;
    email: string;
    phone: string;
    isExisting: boolean;
  };
  location?: {
    id?: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    gateCode?: string;
    isNew: boolean;
  };
  timeSlot?: {
    id: string;
    start: string;
    end: string;
    date: string;
    timeLabel: string;
    proximityScore?: number;
  };
  specialInstructions?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const STEPS = [
  { id: 1, name: 'Service', label: 'Select Service' },
  { id: 2, name: 'Info', label: 'Your Information' },
  { id: 3, name: 'Location', label: 'Service Location' },
  { id: 4, name: 'Time', label: 'Choose Time' },
  { id: 5, name: 'Confirm', label: 'Confirm & Book' },
];

interface SchedulerFlowProps {
  initialUtmSource?: string;
  initialUtmMedium?: string;
  initialUtmCampaign?: string;
  initialReferralCode?: string;
  prefilledCustomerId?: number;
  prefilledService?: string;
}

export function SchedulerFlow({ 
  initialUtmSource = 'website',
  initialUtmMedium,
  initialUtmCampaign,
  initialReferralCode,
  prefilledCustomerId,
  prefilledService
}: SchedulerFlowProps = {}) {
  // Find matching service category if prefilledService is provided
  const matchedService = prefilledService && typeof prefilledService === 'string'
    ? SERVICE_CATEGORIES.find(
        (cat) => {
          const serviceLower = prefilledService.toLowerCase();
          const catLower = cat.name.toLowerCase();
          return catLower.includes(serviceLower) || serviceLower.includes(catLower);
        }
      )
    : undefined;

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<SchedulerData>({
    utmSource: initialUtmSource,
    utmMedium: initialUtmMedium,
    utmCampaign: initialUtmCampaign,
    // Prefill service if matched
    service: matchedService
      ? {
          name: matchedService.name,
          jobTypeId: matchedService.jobTypeId,
          category: matchedService.id,
        }
      : undefined,
  });

  const updateData = (updates: Partial<SchedulerData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Content */}
      <div data-testid={`scheduler-step-${currentStep}`}>
        {currentStep === 1 && (
          <ServiceCategoryStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            prefilledService={prefilledService}
          />
        )}
        {currentStep === 2 && (
          <CustomerInfoStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={previousStep}
            prefilledCustomerId={prefilledCustomerId}
          />
        )}
        {currentStep === 3 && (
          <LocationStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={previousStep}
          />
        )}
        {currentStep === 4 && (
          <TimeSelectionStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={previousStep}
          />
        )}
        {currentStep === 5 && (
          <BookingSummaryStep
            data={data}
            updateData={updateData}
            onBack={previousStep}
            initialReferralCode={initialReferralCode}
            utmSource={initialUtmSource}
            utmMedium={initialUtmMedium}
            utmCampaign={initialUtmCampaign}
          />
        )}
      </div>
    </div>
  );
}
