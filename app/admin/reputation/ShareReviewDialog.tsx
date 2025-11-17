'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Share2, Loader2 } from 'lucide-react';

interface ShareReviewDialogProps {
  review: {
    id: string;
    authorName: string;
    text: string;
    rating: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
] as const;

export function ShareReviewDialog({ review, open, onOpenChange }: ShareReviewDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({});
  const [accountIds, setAccountIds] = useState<Record<string, string>>({});

  const shareReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/social-media/share-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to share review');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Review Shared!',
        description: `Successfully shared to ${data.platforms.length} platform(s)`,
      });
      onOpenChange(false);
      // Reset form
      setSelectedPlatforms({});
      setAccountIds({});
    },
    onError: (error: Error) => {
      toast({
        title: 'Share Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleShare = () => {
    // Build platforms array
    const platforms = Object.entries(selectedPlatforms)
      .filter(([_, isSelected]) => isSelected)
      .map(([platform]) => ({
        platform,
        accountId: accountIds[platform] || '',
      }))
      .filter(p => p.accountId); // Only include platforms with account IDs

    if (platforms.length === 0) {
      toast({
        title: 'No Platforms Selected',
        description: 'Please select at least one platform and provide its account ID',
        variant: 'destructive',
      });
      return;
    }

    shareReviewMutation.mutate({
      reviewText: review.text,
      reviewerName: review.authorName,
      rating: review.rating,
      platforms,
    });
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId],
    }));
  };

  const updateAccountId = (platformId: string, value: string) => {
    setAccountIds(prev => ({
      ...prev,
      [platformId]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Review to Social Media
          </DialogTitle>
          <DialogDescription>
            Share this {review.rating}-star review from {review.authorName} to your social media accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Review Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{review.authorName}</span>
              <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{review.text}</p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Platforms</Label>
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.id} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms[platform.id] || false}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    data-testid={`checkbox-platform-${platform.id}`}
                  />
                  <label
                    htmlFor={platform.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <span>{platform.icon}</span>
                    {platform.label}
                  </label>
                </div>
                
                {selectedPlatforms[platform.id] && (
                  <div className="ml-7 mt-2">
                    <Input
                      placeholder={`${platform.label} Account ID`}
                      value={accountIds[platform.id] || ''}
                      onChange={(e) => updateAccountId(platform.id, e.target.value)}
                      className="text-sm"
                      data-testid={`input-account-id-${platform.id}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your Late API account ID for {platform.label}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
            <strong>Need account IDs?</strong> Get them from your Late dashboard at{' '}
            <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer" className="underline">
              getlate.dev
            </a>
            . Navigate to Profiles → Select your profile → Copy the account ID for each connected platform.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={shareReviewMutation.isPending}
            data-testid="button-cancel-share"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={shareReviewMutation.isPending}
            data-testid="button-confirm-share"
          >
            {shareReviewMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Share to Social Media
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
