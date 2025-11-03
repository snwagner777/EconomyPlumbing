'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  Zap,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Flame,
  Waves,
  ClipboardList,
} from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';

interface ServiceCategoryStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onNext: () => void;
}

const SERVICE_CATEGORIES = [
  {
    id: 'water-heater',
    name: 'Water Heater Services',
    description: 'Installation, repair, and maintenance',
    icon: Flame,
    color: 'text-orange-500',
    jobTypeId: 1, // Replace with actual ServiceTitan job type ID
  },
  {
    id: 'drain-cleaning',
    name: 'Drain Cleaning',
    description: 'Clogged drains and sewer lines',
    icon: Waves,
    color: 'text-blue-500',
    jobTypeId: 2,
  },
  {
    id: 'leak-repair',
    name: 'Leak Detection & Repair',
    description: 'Find and fix water leaks',
    icon: Droplets,
    color: 'text-cyan-500',
    jobTypeId: 3,
  },
  {
    id: 'backflow-testing',
    name: 'Backflow Testing',
    description: 'Required annual certification',
    icon: CheckCircle,
    color: 'text-green-500',
    jobTypeId: 4,
  },
  {
    id: 'emergency',
    name: 'Emergency Service',
    description: 'Urgent plumbing issues 24/7',
    icon: AlertTriangle,
    color: 'text-red-500',
    jobTypeId: 5,
  },
  {
    id: 'gas-services',
    name: 'Gas Line Services',
    description: 'Gas leak detection and repair',
    icon: Zap,
    color: 'text-yellow-500',
    jobTypeId: 6,
  },
  {
    id: 'fixture-installation',
    name: 'Fixture Installation',
    description: 'Faucets, toilets, and more',
    icon: Wrench,
    color: 'text-purple-500',
    jobTypeId: 7,
  },
  {
    id: 'inspection',
    name: 'Plumbing Inspection',
    description: 'Complete system evaluation',
    icon: ClipboardList,
    color: 'text-indigo-500',
    jobTypeId: 8,
  },
];

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
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${service.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
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
