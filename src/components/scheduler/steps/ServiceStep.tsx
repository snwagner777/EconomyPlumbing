/**
 * Service Selection Step
 * 
 * Clean, simplified service selection matching ServiceTitan's UX:
 * Step 1: Three large pill buttons (Repair, Install, Maintenance)
 * Step 2: Expand to show specific services within selected category
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Construction, ClipboardCheck, Loader2, ArrowLeft } from 'lucide-react';
import { getJobTypeMeta } from '@/lib/schedulerJobCatalog';

interface JobType {
  id: number;
  name: string;
  code: string;
}

interface ServiceStepProps {
  onSelect: (jobType: JobType) => void;
  preselectedService?: string;
}

type MainCategory = 'repair' | 'installation' | 'maintenance';

const MAIN_CATEGORIES = [
  {
    key: 'repair' as MainCategory,
    label: 'Repair',
    description: 'Fix leaks, clogs, and plumbing issues',
    icon: Wrench,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  {
    key: 'installation' as MainCategory,
    label: 'Install',
    description: 'New fixtures, water heaters, and appliances',
    icon: Construction,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'hover:border-green-300 dark:hover:border-green-700',
  },
  {
    key: 'maintenance' as MainCategory,
    label: 'Maintenance',
    description: 'Inspections, tune-ups, and preventive care',
    icon: ClipboardCheck,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
];

export function ServiceStep({ onSelect, preselectedService }: ServiceStepProps) {
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);

  // Fetch job types from ServiceTitan
  const { data, isLoading } = useQuery<{ success: boolean; jobTypes: JobType[] }>({
    queryKey: ['/api/scheduler/options'],
  });

  const jobTypes = data?.jobTypes || [];

  // Map ServiceTitan job types to our simplified categories
  const categorizedServices = jobTypes.reduce((acc, jt) => {
    const meta = getJobTypeMeta(jt.name);
    let mainCategory: MainCategory;
    
    // Map detailed categories to our 3 main categories
    if (meta.category === 'repair' || meta.category === 'emergency') {
      mainCategory = 'repair';
    } else if (meta.category === 'installation') {
      mainCategory = 'installation';
    } else {
      mainCategory = 'maintenance';
    }
    
    if (!acc[mainCategory]) {
      acc[mainCategory] = [];
    }
    acc[mainCategory].push({ ...jt, meta });
    return acc;
  }, {} as Record<MainCategory, Array<JobType & { meta: ReturnType<typeof getJobTypeMeta> }>>);

  // Auto-select if preselected service matches
  useEffect(() => {
    if (preselectedService && typeof preselectedService === 'string' && jobTypes.length > 0) {
      const match = jobTypes.find(jt =>
        jt.name.toLowerCase().includes(preselectedService.toLowerCase())
      );
      if (match) {
        onSelect(match);
      }
    }
  }, [preselectedService, jobTypes, onSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  // Step 1: Show 3 large category pills
  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">What do you need help with?</h2>
          <p className="text-sm text-muted-foreground">Select the type of service you need</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-8">
          {MAIN_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const servicesCount = categorizedServices[category.key]?.length || 0;
            
            if (servicesCount === 0) return null;

            return (
              <Card
                key={category.key}
                className={`relative overflow-hidden cursor-pointer border-2 transition-all ${category.borderColor} hover:shadow-lg active:scale-[0.99]`}
                onClick={() => setSelectedCategory(category.key)}
                data-testid={`button-category-${category.key}`}
              >
                <div className={`absolute inset-0 ${category.bgColor} opacity-40`} />
                
                <div className="relative p-6 flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${category.bgColor} border border-current/20 ${category.color} shrink-0`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{category.label}</h3>
                      <Badge variant="outline" className="shrink-0">
                        {servicesCount} services
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Show specific services within selected category
  const selectedCategoryData = MAIN_CATEGORIES.find(c => c.key === selectedCategory);
  const services = categorizedServices[selectedCategory] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCategory(null)}
          data-testid="button-back-categories"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {selectedCategoryData && (
          <div className="flex items-center gap-2">
            <selectedCategoryData.icon className={`w-5 h-5 ${selectedCategoryData.color}`} />
            <h3 className="text-lg font-bold">{selectedCategoryData.label} Services</h3>
            <Badge variant="outline">{services.length}</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((jt) => {
          const Icon = jt.meta.icon;
          return (
            <Card
              key={jt.id}
              className="p-4 cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
              onClick={() => onSelect(jt)}
              data-testid={`card-service-${jt.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base leading-tight mb-1.5">
                    {jt.meta.displayName || jt.name}
                  </h4>
                  {jt.meta.marketingCopy && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {jt.meta.marketingCopy}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services available in this category</p>
        </div>
      )}
    </div>
  );
}
