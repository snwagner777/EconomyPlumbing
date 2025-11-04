'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench } from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';

interface ServiceCategoryStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onNext: () => void;
  prefilledService?: string;
}

interface JobType {
  id: number;
  name: string;
  code: string;
}

// Placeholder for when API loads
export const SERVICE_CATEGORIES: any[] = [];

export function ServiceCategoryStep({ data, updateData, onNext }: ServiceCategoryStepProps) {
  const handleServiceSelect = (service: typeof SERVICE_CATEGORIES[0]) => {
    updateData({
      service: {
        name: service.name,
        jobTypeId: service.jobTypeId,
        category: service.id,
      },
    });
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-service-title">
          What plumbing service do you need?
        </h2>
        <p className="text-muted-foreground" data-testid="text-service-subtitle">
          Select the service that best matches your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_CATEGORIES.map((service) => {
          const Icon = service.icon;
          const isSelected = data.service?.category === service.id;

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover-elevate ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleServiceSelect(service)}
              data-testid={`card-service-${service.id}`}
            >
              <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${service.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base mb-0.5">{service.name}</CardTitle>
                    <CardDescription className="text-sm">{service.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {data.service && (
        <div className="mt-6 text-center">
          <Button
            onClick={onNext}
            size="lg"
            data-testid="button-continue-service"
          >
            Continue with {data.service.name}
          </Button>
        </div>
      )}
    </div>
  );
}
