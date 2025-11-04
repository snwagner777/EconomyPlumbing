/**
 * Service Selection Step
 * 
 * Beautiful icon grid showing all available plumbing services with descriptions.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ChevronRight } from 'lucide-react';
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

const CATEGORY_LABELS = {
  emergency: 'Emergency Services',
  repair: 'Repairs',
  installation: 'Installations',
  maintenance: 'Maintenance & Inspections',
  inspection: 'Inspections',
};

const CATEGORY_COLORS = {
  emergency: 'destructive',
  repair: 'default',
  installation: 'secondary',
  maintenance: 'outline',
  inspection: 'outline',
} as const;

export function ServiceStep({ onSelect, preselectedService }: ServiceStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof CATEGORY_LABELS | null>(null);

  // Fetch job types from ServiceTitan
  const { data, isLoading } = useQuery<{ success: boolean; jobTypes: JobType[] }>({
    queryKey: ['/api/scheduler/options'],
  });

  const jobTypes = data?.jobTypes || [];

  // Filter by search query and selected category
  const filteredJobTypes = jobTypes.filter(jt => {
    const matchesSearch = jt.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (selectedCategory) {
      const meta = getJobTypeMeta(jt.name);
      return meta.category === selectedCategory;
    }
    
    return true;
  });

  // Group by category
  const groupedByCategory = filteredJobTypes.reduce((acc, jt) => {
    const meta = getJobTypeMeta(jt.name);
    const category = meta.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...jt, meta });
    return acc;
  }, {} as Record<string, Array<JobType & { meta: ReturnType<typeof getJobTypeMeta> }>>);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show category selection first if no category selected and no search
  if (!selectedCategory && !searchQuery) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">What type of service do you need?</h3>
          <p className="text-sm text-muted-foreground">Choose a category to see available services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((category) => {
            const categoryServices = jobTypes.filter(jt => getJobTypeMeta(jt.name).category === category);
            if (categoryServices.length === 0) return null;

            return (
              <Card
                key={category}
                className="relative overflow-hidden min-h-[176px] cursor-pointer group border-2 transition-all hover:border-primary/40 hover:shadow-lg active:scale-[0.98]"
                onClick={() => setSelectedCategory(category)}
                data-testid={`card-category-${category}`}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
                
                <div className="relative p-6 h-full flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {CATEGORY_LABELS[category]}
                      </h3>
                      <Badge variant={CATEGORY_COLORS[category]} className="shrink-0">
                        {categoryServices.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
                    <span>View services</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Or search for a specific service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-service"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Search */}
      <div className="flex items-center gap-3">
        {selectedCategory && !searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="button-back-categories"
          >
            ← Back to Categories
          </Button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-service"
          />
        </div>
      </div>

      {/* Service Categories */}
      {(Object.keys(groupedByCategory) as Array<keyof typeof CATEGORY_LABELS>).map((category) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{CATEGORY_LABELS[category]}</h3>
            <Badge variant={CATEGORY_COLORS[category]}>
              {groupedByCategory[category].length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedByCategory[category].map((jt) => {
              const Icon = jt.meta.icon;
              return (
                <Card
                  key={jt.id}
                  className="p-4 cursor-pointer group border transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
                  onClick={() => onSelect(jt)}
                  data-testid={`card-service-${jt.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 ${jt.meta.color} shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
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
        </div>
      ))}

      {filteredJobTypes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No services found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
