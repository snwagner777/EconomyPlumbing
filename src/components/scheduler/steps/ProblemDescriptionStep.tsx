/**
 * Problem Description Step (Step 1)
 * 
 * Natural language input where users describe their plumbing issue.
 * AI analyzes the description to suggest the best job type.
 */

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Sparkles } from 'lucide-react';

interface ProblemDescriptionStepProps {
  onSubmit: (description: string) => void;
  initialDescription?: string;
}

export function ProblemDescriptionStep({ onSubmit, initialDescription }: ProblemDescriptionStepProps) {
  const [description, setDescription] = useState(initialDescription || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = description.trim();
    
    if (trimmed.length < 10) {
      setError('Please provide more details (at least 10 characters)');
      return;
    }
    
    if (trimmed.length > 500) {
      setError('Please keep your description under 500 characters');
      return;
    }
    
    setError('');
    onSubmit(trimmed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">What's the problem?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your plumbing issue in your own words
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Label htmlFor="description" className="text-base font-semibold">
            Tell us what's happening
          </Label>
          
          <Textarea
            id="description"
            placeholder="Example: My water heater is leaking and making a loud banging noise..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            rows={6}
            maxLength={500}
            className="resize-none"
            autoFocus
            data-testid="textarea-problem-description"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Be as specific as possible - location, sounds, when it started, etc.</p>
            <p>{description.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              AI-Powered Service Matching
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Our AI will analyze your description and suggest the best service type for your needs.
            </p>
          </div>
        </div>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={description.trim().length < 10}
        size="lg"
        className="w-full"
        data-testid="button-continue-description"
      >
        Continue
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Tip: Press Cmd/Ctrl + Enter to continue
      </p>
    </div>
  );
}
