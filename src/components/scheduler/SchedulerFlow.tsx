'use client';

import { useState } from 'react';
import { ServiceCategoryStep } from './ServiceCategoryStep';
import { CustomerInfoStep } from './CustomerInfoStep';
import { LocationStep } from './LocationStep';
import { TimeSelectionStep } from './TimeSelectionStep';
import { BookingSummaryStep } from './BookingSummaryStep';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
}

const STEPS = [
  { id: 1, name: 'Service', label: 'Select Service' },
  { id: 2, name: 'Info', label: 'Your Information' },
  { id: 3, name: 'Location', label: 'Service Location' },
  { id: 4, name: 'Time', label: 'Choose Time' },
  { id: 5, name: 'Confirm', label: 'Confirm & Book' },
];

export function SchedulerFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<SchedulerData>({});

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

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <Card className="mb-8" data-testid="card-scheduler-progress">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold" data-testid="text-current-step">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
              </h2>
              <span className="text-sm text-muted-foreground" data-testid="text-progress-percent">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-scheduler" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  step.id < currentStep
                    ? 'text-primary'
                    : step.id === currentStep
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
                data-testid={`step-indicator-${step.id}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${
                    step.id < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'bg-background border-primary text-primary'
                      : 'bg-background border-border'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className="text-xs text-center hidden sm:block">{step.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div data-testid={`scheduler-step-${currentStep}`}>
        {currentStep === 1 && (
          <ServiceCategoryStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <CustomerInfoStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={previousStep}
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
          />
        )}
      </div>
    </div>
  );
}
