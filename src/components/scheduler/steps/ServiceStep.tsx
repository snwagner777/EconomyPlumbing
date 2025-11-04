/**
 * Service Selection Step
 * 
 * Beautiful icon grid showing all available plumbing services with descriptions.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from 'lucide-react';
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

  // Fetch job types from ServiceTitan
  const { data, isLoading } = useQuery<{ success: boolean; jobTypes: JobType[] }>({
    queryKey: ['/api/scheduler/options'],
  });

  const jobTypes = data?.jobTypes || [];

  // Filter by search query
  const filteredJobTypes = jobTypes.filter(jt =>
    jt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search for a service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-service"
        />
      </div>

      {/* Service Categories */}
      {(Object.keys(groupedByCategory) as Array<keyof typeof CATEGORY_LABELS>).map((category) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
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
                  className="p-4 cursor-pointer transition-all hover-elevate active-elevate-2"
                  onClick={() => onSelect(jt)}
                  data-testid={`card-service-${jt.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md bg-muted ${jt.meta.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">
                        {jt.meta.displayName || jt.name}
                      </h4>
                      {jt.meta.marketingCopy && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
