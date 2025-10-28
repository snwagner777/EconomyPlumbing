'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Star, Mail, MessageSquare, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ReputationDashboard() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Fetch review request campaigns
  const {
    data: reviewRequests,
    isLoading: reviewRequestsLoading,
    isError: reviewRequestsError
  } = useQuery<{ campaigns?: any[] }>({
    queryKey: ['/api/admin/review-requests'],
  });

  // Fetch email templates
  const {
    data: emailTemplates,
    isLoading: emailTemplatesLoading,
    isError: emailTemplatesError
  } = useQuery<{ templates?: any[] }>({
    queryKey: ['/api/admin/email-templates'],
  });

  // Fetch GMB reviews
  const {
    data: gmbReviews,
    isLoading: gmbReviewsLoading,
    isError: gmbReviewsError
  } = useQuery<{ reviews?: any[] }>({
    queryKey: ['/api/google-reviews'],
  });

  // Fetch reputation stats (from google-reviews/stats endpoint)
  const {
    data: reputationStats,
    isLoading: statsLoading,
    isError: statsError
  } = useQuery<{ totalReviews?: number; averageRating?: number; displayableReviews?: number }>({
    queryKey: ['/api/google-reviews/stats'],
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.pushState({}, '', `/admin/reputation?tab=${value}`);
  };

  const handlePlaceholderAction = (action: string) => {
    toast({
      title: 'Coming Soon',
      description: `${action} feature will be implemented in the next phase.`,
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-reputation">
            Reputation Management
          </h1>
          <p className="text-muted-foreground" data-testid="text-description">
            AI-powered review request automation and template management
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6" data-testid="stat-active-campaigns">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            {reviewRequestsLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-active-campaigns" />
            ) : reviewRequestsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-active-campaigns-count">
                {reviewRequests?.campaigns?.filter((r: any) => r.status === 'active')?.length ?? 0}
              </div>
            )}
          </Card>

          <Card className="p-6" data-testid="stat-pending-reviews">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Pending Reviews</div>
            </div>
            {statsLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-pending-reviews" />
            ) : statsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-pending-reviews-count">
                {reputationStats?.displayableReviews || 0}
              </div>
            )}
          </Card>

          <Card className="p-6" data-testid="stat-gmb-reviews">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">GMB Reviews</div>
            </div>
            {gmbReviewsLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-gmb-reviews" />
            ) : gmbReviewsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-gmb-reviews-count">
                {gmbReviews?.reviews?.length ?? 0}
              </div>
            )}
          </Card>

          <Card className="p-6" data-testid="stat-avg-rating">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
            {statsLoading ? (
              <Skeleton className="h-9 w-16" data-testid="skeleton-avg-rating" />
            ) : statsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-avg-rating-value">
                {reputationStats?.averageRating?.toFixed(1) || '—'}
              </div>
            )}
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              Review Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="gmb-reviews" data-testid="tab-gmb-reviews">
              GMB Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Reputation Overview</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Link 
                    href="/admin/reputation?tab=campaigns"
                    className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                    data-testid="link-review-campaigns"
                  >
                    <h3 className="font-semibold text-lg mb-2">Review Request Campaigns</h3>
                    <p className="text-sm text-muted-foreground">
                      4-email drip campaign over 21 days to request customer reviews
                    </p>
                    <div className="mt-4 text-sm">
                      {reviewRequestsLoading ? (
                        <Skeleton className="h-5 w-32" data-testid="skeleton-overview-campaigns" />
                      ) : reviewRequestsError ? (
                        <span className="font-medium text-destructive">—</span>
                      ) : (
                        <span className="font-medium">
                          {reviewRequests?.campaigns?.filter((r: any) => r.status === 'active')?.length ?? 0} active campaigns
                        </span>
                      )}
                    </div>
                  </Link>

                  <Link
                    href="/admin/reputation?tab=templates"
                    className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                    data-testid="link-email-templates"
                  >
                    <h3 className="font-semibold text-lg mb-2">AI Email Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      GPT-4o generated templates with preview/edit/approve workflow
                    </p>
                    <div className="mt-4 text-sm">
                      {emailTemplatesLoading ? (
                        <Skeleton className="h-5 w-32" data-testid="skeleton-overview-templates" />
                      ) : emailTemplatesError ? (
                        <span className="font-medium text-destructive">—</span>
                      ) : (
                        <span className="font-medium">
                          {emailTemplates?.templates?.length ?? 0} templates ready
                        </span>
                      )}
                    </div>
                  </Link>

                  <Link
                    href="/admin/reputation?tab=gmb-reviews"
                    className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                    data-testid="link-gmb-reviews"
                  >
                    <h3 className="font-semibold text-lg mb-2">Google My Business Reviews</h3>
                    <p className="text-sm text-muted-foreground">
                      Automated fetching and AI-powered reply generation
                    </p>
                    <div className="mt-4 text-sm">
                      {gmbReviewsLoading ? (
                        <Skeleton className="h-5 w-32" data-testid="skeleton-overview-gmb" />
                      ) : gmbReviewsError ? (
                        <span className="font-medium text-destructive">—</span>
                      ) : (
                        <span className="font-medium">
                          {gmbReviews?.reviews?.length ?? 0} total reviews
                        </span>
                      )}
                    </div>
                  </Link>

                  <div
                    className="p-6 bg-accent/50 rounded-lg"
                    data-testid="card-settings"
                  >
                    <h3 className="font-semibold text-lg mb-2">Campaign Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Master email switch and campaign-specific phone numbers
                    </p>
                    <div className="mt-4 text-sm">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePlaceholderAction('Settings')}
                        data-testid="button-manage-settings"
                      >
                        Manage Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Review Request Campaigns</h2>
                <Button data-testid="button-create-campaign">
                  Create Campaign
                </Button>
              </div>
              <p className="text-muted-foreground mb-6">
                4-email drip campaign sent over 21 days after job completion. Automatically pauses when customer submits a review.
              </p>
              
              {reviewRequestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-6 w-48 mb-2" data-testid={`skeleton-campaign-${i}`} />
                      <Skeleton className="h-4 w-64" data-testid={`skeleton-campaign-desc-${i}`} />
                    </div>
                  ))}
                </div>
              ) : reviewRequestsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load review request campaigns. Please try again.
                  </AlertDescription>
                </Alert>
              ) : reviewRequests?.campaigns && reviewRequests.campaigns.length > 0 ? (
                <div className="space-y-3">
                  {reviewRequests.campaigns.map((request: any) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg"
                      data-testid={`campaign-${request.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{request.customerName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              request.status === 'active' ? 'bg-green-500/10 text-green-600' :
                              request.status === 'completed' ? 'bg-blue-500/10 text-blue-600' :
                              request.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-gray-500/10 text-gray-600'
                            }`} data-testid={`status-${request.id}`}>
                              {request.status}
                            </span>
                            <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-0.5 rounded" data-testid={`email-${request.id}`}>
                              Email {request.currentEmail || 1}/4
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.email} • Started {new Date(request.startedAt).toLocaleDateString()}
                          </div>
                          {request.lastEmailSent && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Last email: {new Date(request.lastEmailSent).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePlaceholderAction('Campaign details')}
                          data-testid={`button-view-${request.id}`}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground" data-testid="text-empty-campaigns">
                    No active review request campaigns
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">AI Email Templates</h2>
                <Button data-testid="button-generate-template">
                  Generate Template
                </Button>
              </div>
              <p className="text-muted-foreground mb-6">
                GPT-4o powered email templates with preview, edit, and approve workflow. Templates support merge tags for personalization.
              </p>
              
              {emailTemplatesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-6 w-64 mb-2" data-testid={`skeleton-template-${i}`} />
                      <Skeleton className="h-4 w-48" data-testid={`skeleton-template-desc-${i}`} />
                    </div>
                  ))}
                </div>
              ) : emailTemplatesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load email templates. Please try again.
                  </AlertDescription>
                </Alert>
              ) : emailTemplates?.templates && emailTemplates.templates.length > 0 ? (
                <div className="space-y-3">
                  {emailTemplates.templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="p-4 border rounded-lg"
                      data-testid={`template-${template.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{template.subject}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" data-testid={`type-${template.id}`}>
                              Email {template.emailNumber}
                            </span>
                            {template.generatedByAI && (
                              <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                                AI Generated
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.campaignType} • Created {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaceholderAction('Template preview')}
                            data-testid={`button-preview-${template.id}`}
                          >
                            Preview
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaceholderAction('Template edit')}
                            data-testid={`button-edit-${template.id}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground" data-testid="text-empty-templates">
                    No email templates yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generate your first AI-powered email template
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="gmb-reviews">
            <Card className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Google My Business Reviews</h2>
                <Button data-testid="button-fetch-gmb-reviews">
                  Fetch Latest Reviews
                </Button>
              </div>
              <p className="text-muted-foreground mb-6">
                Automatically fetched GMB reviews with AI-powered reply generation and moderation workflow.
              </p>
              
              {gmbReviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-6 w-40 mb-2" data-testid={`skeleton-gmb-review-${i}`} />
                      <Skeleton className="h-4 w-full mb-2" data-testid={`skeleton-gmb-review-text-${i}`} />
                      <Skeleton className="h-4 w-32" data-testid={`skeleton-gmb-review-date-${i}`} />
                    </div>
                  ))}
                </div>
              ) : gmbReviewsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load GMB reviews. Please try again.
                  </AlertDescription>
                </Alert>
              ) : gmbReviews?.reviews && gmbReviews.reviews.length > 0 ? (
                <div className="space-y-3">
                  {gmbReviews.reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg"
                      data-testid={`gmb-review-${review.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.authorName}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.replyText && (
                              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                                Replied
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2">{review.text}</p>
                          <div className="text-sm text-muted-foreground">
                            {new Date(review.createTime).toLocaleDateString()}
                          </div>
                        </div>
                        {!review.replyText && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaceholderAction('Generate AI reply')}
                            data-testid={`button-reply-${review.id}`}
                          >
                            Generate Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground" data-testid="text-empty-gmb-reviews">
                    No GMB reviews found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Fetch Latest Reviews" to import from Google My Business
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
