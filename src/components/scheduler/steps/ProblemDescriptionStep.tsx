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
      <Card className="p-6">
        <div className="space-y-4">
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
