'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, MessageCircle, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

function SerpApiStatusCard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleManualSync = async (clearFirst: boolean = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clearFirst }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const data = await response.json();
      toast({
        title: "Sync Complete",
        description: `Fetched ${data.newReviews} new reviews (Google: ${data.google}, Yelp: ${data.yelp}, Facebook: ${data.facebook})`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google-reviews'] });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Multi-Platform Review Sync (SerpAPI)</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Automatically fetches reviews from Google, Yelp, and Facebook every 24 hours. Click "Sync Now" to fetch latest reviews immediately.
              </p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              onClick={() => handleManualSync(false)}
              disabled={isSyncing}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              data-testid="button-sync-reviews"
            >
              <Star className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              onClick={() => handleManualSync(true)}
              disabled={isSyncing}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              data-testid="button-clear-and-sync"
            >
              <Star className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Clearing & Syncing...' : 'Clear & Sync'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewsPage() {
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [aiReply, setAiReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Check Google OAuth status
  const { data: oauthStatus, isLoading: isLoadingOAuth, isError: isErrorOAuth } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ['/api/oauth/status'],
    queryFn: async () => {
      const response = await fetch('/api/oauth/status', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch OAuth status');
      }
      return response.json();
    },
  });

  // Fetch Google Reviews (includes Google, Facebook, Yelp via source field)
  const { data: googleReviewsData, isLoading: loadingGoogle } = useQuery<{ reviews: any[] }>({
    queryKey: ['/api/admin/google-reviews'],
    queryFn: async () => {
      const response = await fetch('/api/admin/google-reviews', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  // Fetch Custom Reviews (website submissions)
  const { data: customReviewsData, isLoading: loadingCustom } = useQuery<any[]>({
    queryKey: ['/api/admin/reviews'],
  });

  const googleReviews = googleReviewsData?.reviews || [];
  const customReviews = customReviewsData || [];

  // Combine and normalize all reviews
  const allReviews = [
    ...googleReviews.map((r: any) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      timestamp: r.timestamp * 1000, // Convert to milliseconds
      source: r.source === 'places_api' || r.source === 'gmb_api' || r.source === 'dataforseo' ? 'Google' :
              r.source.toLowerCase() === 'yelp' ? 'Yelp' :
              r.source === 'facebook' ? 'Facebook' : 
              r.source.charAt(0).toUpperCase() + r.source.slice(1), // Capitalize first letter
      profilePhotoUrl: r.profilePhotoUrl,
      type: 'google' as const,
    })),
    ...customReviews.map((r: any) => ({
      id: r.id,
      authorName: r.customerName,
      rating: r.rating,
      text: r.text,
      timestamp: new Date(r.submittedAt).getTime(),
      source: 'Website',
      status: r.status,
      type: 'custom' as const,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Filter reviews
  const filteredReviews = allReviews.filter(review => {
    if (selectedSource !== 'all' && review.source !== selectedSource) return false;
    if (selectedRating !== 'all' && review.rating.toString() !== selectedRating) return false;
    return true;
  });

  const isLoading = loadingGoogle || loadingCustom;

  // Get unique sources
  const sources = ['all', ...new Set(allReviews.map(r => r.source))];

  // Reply handlers
  const handleGenerateReply = async (review: any) => {
    setSelectedReview(review);
    setIsGenerating(true);
    setReplyDialogOpen(true);
    setAiReply('');

    try {
      const response = await fetch(`/api/admin/reviews/${review.id}/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: review.type }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate reply');
      }

      const data = await response.json();
      setAiReply(data.reply);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI reply. Please try again.",
        variant: "destructive",
      });
      setReplyDialogOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostReply = async () => {
    if (!selectedReview || !aiReply.trim()) return;

    setIsPosting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}/post-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: selectedReview.type,
          replyText: aiReply,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      toast({
        title: "Success",
        description: "Reply posted successfully!",
      });

      // Refresh reviews
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });

      setReplyDialogOpen(false);
      setSelectedReview(null);
      setAiReply('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Stats
  const totalReviews = allReviews.length;
  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '0.0';
  const fiveStarCount = allReviews.filter(r => r.rating === 5).length;
  const pendingCount = customReviews.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-1">Manage and respond to customer reviews across all platforms</p>
      </div>

      {/* Google Connection Status */}
      {!isLoadingOAuth && !isErrorOAuth && !oauthStatus?.isAuthenticated && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">Google Business Profile Not Connected</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Connect your Google Business Profile to post AI-generated replies directly to Google reviews
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/api/google/oauth/init'}
                className="bg-orange-600 hover:bg-orange-700"
                data-testid="button-connect-google"
              >
                <Settings className="w-4 h-4 mr-2" />
                Connect Google
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingOAuth && !isErrorOAuth && oauthStatus?.isAuthenticated && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100">Google Business Profile - Automated</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Reviews are fetched automatically every 6 hours. AI-powered replies are generated and posted automatically for new reviews.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SerpAPI Multi-Platform Review Sync */}
      <SerpApiStatusCard />

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold mt-1">{totalReviews}</p>
              </div>
              <Star className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-3xl font-bold mt-1">{averageRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                <p className="text-3xl font-bold mt-1">{fiveStarCount}</p>
              </div>
              <Star className="w-8 h-8 text-green-500 fill-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold mt-1">{pendingCount}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="source-filter" className="text-sm">Source</Label>
              <select
                id="source-filter"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                data-testid="select-source-filter"
              >
                {sources.map(source => (
                  <option key={source} value={source}>
                    {source === 'all' ? 'All Sources' : source}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="rating-filter" className="text-sm">Rating</Label>
              <select
                id="rating-filter"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                data-testid="select-rating-filter"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover-elevate" data-testid={`review-${review.id}`}>
                  <div className="flex items-start gap-4">
                    {('profilePhotoUrl' in review && review.profilePhotoUrl) ? (
                      <img
                        src={review.profilePhotoUrl}
                        alt={review.authorName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {review.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{review.authorName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {review.source}
                            </Badge>
                            {review.type === 'custom' && review.status && (
                              <Badge
                                variant={
                                  review.status === 'approved' ? 'default' :
                                  review.status === 'pending' ? 'outline' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {review.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mb-3">{review.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Reply</DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated response before posting
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Generating AI reply...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-reply">Reply Text</Label>
                <Textarea
                  id="ai-reply"
                  value={aiReply}
                  onChange={(e) => setAiReply(e.target.value)}
                  rows={6}
                  className="mt-1"
                  placeholder="AI-generated reply will appear here..."
                  data-testid="textarea-ai-reply"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              disabled={isPosting}
              data-testid="button-cancel-reply"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostReply}
              disabled={isPosting || isGenerating || !aiReply.trim()}
              data-testid="button-post-reply"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Reply'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
