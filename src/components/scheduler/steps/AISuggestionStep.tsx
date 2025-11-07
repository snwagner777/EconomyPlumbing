/**
 * AI Suggestion Step (Step 1.5)
 * 
 * Shows the AI's suggested job type with option to accept or manually change it.
 */

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, CheckCircle, AlertCircle, ChevronRight, Edit3 } from 'lucide-react';
import { ServiceStep } from './ServiceStep';
import { getJobTypeMeta } from '@/lib/schedulerJobCatalog';

interface JobType {
  id: number;
  name: string;
  code: string;
}

interface AIAnalysis {
  suggestedJobTypeId: number;
  suggestedJobTypeName: string;
  confidence: number;
  urgency: string;
  enrichedSummary: string;
  keyIssues: string[];
  reasoning: string;
}

interface AISuggestionStepProps {
  problemDescription: string;
  onAccept: (jobType: JobType, enrichedSummary: string) => void;
  onManualSelect: (jobType: JobType, enrichedSummary: string) => void; // Also pass enrichedSummary for manual selections
}

export function AISuggestionStep({ problemDescription, onAccept, onManualSelect }: AISuggestionStepProps) {
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const hasAnalyzed = useRef(false); // Guard to prevent duplicate API calls in StrictMode

  // Fetch real job types from ServiceTitan (for ID lookup)
  const { data: jobTypesData } = useQuery({
    queryKey: ['/api/scheduler/options'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scheduler/options', {});
      return await response.json();
    },
  });

  // Analyze problem description with AI
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/analyze-problem', {
        description: problemDescription,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    },
  });

  // Trigger analysis exactly once on mount (guard prevents StrictMode double-invocation)
  useEffect(() => {
    if (!hasAnalyzed.current && !analyzeMutation.isPending) {
      hasAnalyzed.current = true;
      analyzeMutation.mutate();
    }
  }, []); // Empty deps = run once on mount

  if (showManualSelection) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManualSelection(false)}
          data-testid="button-back-ai-suggestion"
        >
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
          Back to AI Suggestion
        </Button>
        
        <ServiceStep
          onSelect={(jobType) => {
            // Even if user changes job type, pass enrichedSummary - it has valuable context
            onManualSelect(jobType, analysis?.enrichedSummary || '');
          }}
        />
      </div>
    );
  }

  if (analyzeMutation.isPending || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Finding the right service...</p>
      </div>
    );
  }

  if (analyzeMutation.isError) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">Unable to Suggest Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please select the service type manually.
              </p>
              <Button
                onClick={() => setShowManualSelection(true)}
                variant="outline"
                data-testid="button-manual-select-error"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Choose Service Type
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const meta = getJobTypeMeta(analysis.suggestedJobTypeName);
  const Icon = meta.icon;
  const confidenceColor = analysis.confidence >= 80 ? 'text-green-600 dark:text-green-400' : 
                         analysis.confidence >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                         'text-orange-600 dark:text-orange-400';

  return (
    <div className="space-y-6">
      {/* Recommended Service */}
      <Card className="p-6 border-primary">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Recommended Service</h3>
            <p className="text-sm text-muted-foreground">
              Based on your description:
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-muted ${meta.color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold mb-2">{analysis.suggestedJobTypeName}</h4>
            {meta.marketingCopy && (
              <p className="text-sm text-muted-foreground mb-3">{meta.marketingCopy}</p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{meta.category}</Badge>
              {analysis.urgency === 'emergency' && (
                <Badge variant="destructive">Emergency</Badge>
              )}
              {analysis.urgency === 'urgent' && (
                <Badge className="bg-orange-500 text-white">Urgent</Badge>
              )}
            </div>
          </div>
        </div>

        {analysis.keyIssues && analysis.keyIssues.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Issues Identified:</p>
              <ul className="space-y-1">
                {analysis.keyIssues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator className="my-4" />

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Why this suggestion:</strong> {analysis.reasoning}
          </p>
        </div>
      </Card>

      {/* Your Description */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-2">Your Description:</p>
        <p className="text-sm text-muted-foreground italic">"{problemDescription}"</p>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowManualSelection(true)}
          data-testid="button-change-service"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Change Service Type
        </Button>
        <Button
          onClick={() => {
            // Find the real ServiceTitan job type by name
            const realJobType = jobTypesData?.jobTypes?.find(
              (jt: any) => jt.name === analysis.suggestedJobTypeName
            );
            
            if (realJobType) {
              onAccept(realJobType, analysis.enrichedSummary);
            } else {
              // Fallback if exact match not found
              console.warn('Could not find matching job type:', analysis.suggestedJobTypeName);
              onAccept(
                {
                  id: 0,
                  name: analysis.suggestedJobTypeName,
                  code: '',
                },
                analysis.enrichedSummary
              );
            }
          }}
          disabled={!jobTypesData?.jobTypes}
          data-testid="button-accept-suggestion"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Looks Good, Continue
        </Button>
      </div>

      {analysis.confidence < 70 && (
        <p className="text-xs text-center text-muted-foreground">
          💡 Not sure? You can change the service type anytime before booking.
        </p>
      )}
    </div>
  );
}
