/**
 * Marketing Dashboard Client Component
 * 
 * Manage all marketing automation: review requests, referral nurture, tracking numbers
 */

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

export function MarketingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/admin/marketing?tab=${newTab}`);
  };

  const handlePlaceholderAction = (actionName: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `${actionName} functionality will be available in the next update.`,
    });
  };

  // Fetch stats
  const { data: reviewRequests, isLoading: reviewRequestsLoading, isError: reviewRequestsError } = useQuery<{ requests?: any[] }>({
    queryKey: ['/api/admin/review-requests'],
  });

  const { data: referralCampaigns, isLoading: referralCampaignsLoading, isError: referralCampaignsError } = useQuery<{ campaigns?: any[] }>({
    queryKey: ['/api/admin/referral-campaigns'],
  });

  const { data: trackingNumbers, isLoading: trackingNumbersLoading, isError: trackingNumbersError } = useQuery<{ numbers?: any[] }>({
    queryKey: ['/api/admin/tracking-numbers'],
  });

  const { data: emailTemplates, isLoading: emailTemplatesLoading, isError: emailTemplatesError } = useQuery<{ templates?: any[] }>({
    queryKey: ['/api/admin/email-templates'],
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-marketing">
            Marketing Automation
          </h1>
          <p className="text-muted-foreground" data-testid="text-description">
            Manage campaigns, email templates, and phone tracking
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6" data-testid="stat-review-requests">
            <div className="text-sm text-muted-foreground mb-1">Active Review Requests</div>
            {reviewRequestsLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-review-requests" />
            ) : reviewRequestsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-review-requests-count">
                {reviewRequests?.requests?.filter((r: any) => r.status === 'sent').length || 0}
              </div>
            )}
          </Card>
          <Card className="p-6" data-testid="stat-referral-campaigns">
            <div className="text-sm text-muted-foreground mb-1">Referral Campaigns</div>
            {referralCampaignsLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-referral-campaigns" />
            ) : referralCampaignsError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-referral-campaigns-count">
                {referralCampaigns?.campaigns?.length || 0}
              </div>
            )}
          </Card>
          <Card className="p-6" data-testid="stat-tracking-numbers">
            <div className="text-sm text-muted-foreground mb-1">Tracking Numbers</div>
            {trackingNumbersLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-tracking-numbers" />
            ) : trackingNumbersError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-tracking-numbers-count">
                {trackingNumbers?.numbers?.length || 0}
              </div>
            )}
          </Card>
          <Card className="p-6" data-testid="stat-email-templates">
            <div className="text-sm text-muted-foreground mb-1">Email Templates</div>
            {emailTemplatesLoading ? (
              <Skeleton className="h-9 w-12" data-testid="skeleton-email-templates" />
            ) : emailTemplatesError ? (
              <div className="text-3xl font-bold text-destructive">—</div>
            ) : (
              <div className="text-3xl font-bold" data-testid="text-email-templates-count">
                {emailTemplates?.templates?.length || 0}
              </div>
            )}
          </Card>
        </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="review-requests" data-testid="tab-review-requests">
                Review Requests
              </TabsTrigger>
              <TabsTrigger value="referral-nurture" data-testid="tab-referral-nurture">
                Referral Nurture
              </TabsTrigger>
              <TabsTrigger value="tracking" data-testid="tab-tracking">
                Phone Tracking
              </TabsTrigger>
              <TabsTrigger value="templates" data-testid="tab-templates">
                Email Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Marketing Overview</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Link 
                      href="/admin/marketing?tab=review-requests"
                      className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                      data-testid="link-review-requests"
                    >
                      <h3 className="font-semibold text-lg mb-2">Review Request Campaigns</h3>
                      <p className="text-sm text-muted-foreground">
                        4-email sequence to gather customer reviews after job completion
                      </p>
                      <div className="mt-4 text-sm">
                        {reviewRequestsLoading ? (
                          <Skeleton className="h-5 w-32" data-testid="skeleton-overview-review-requests" />
                        ) : reviewRequestsError ? (
                          <span className="font-medium text-destructive">—</span>
                        ) : (
                          <span className="font-medium">
                            {reviewRequests?.requests?.filter((r: any) => r.status === 'sent').length || 0} active campaigns
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link
                      href="/admin/marketing?tab=referral-nurture"
                      className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                      data-testid="link-referral-nurture"
                    >
                      <h3 className="font-semibold text-lg mb-2">Referral Nurture Campaigns</h3>
                      <p className="text-sm text-muted-foreground">
                        4-email sequence over 6 months to encourage referrals from happy customers
                      </p>
                      <div className="mt-4 text-sm">
                        {referralCampaignsLoading ? (
                          <Skeleton className="h-5 w-32" data-testid="skeleton-overview-referral-campaigns" />
                        ) : referralCampaignsError ? (
                          <span className="font-medium text-destructive">—</span>
                        ) : (
                          <span className="font-medium">
                            {referralCampaigns?.campaigns?.length || 0} enrolled customers
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link
                      href="/admin/marketing?tab=tracking"
                      className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                      data-testid="link-tracking-numbers"
                    >
                      <h3 className="font-semibold text-lg mb-2">Campaign Phone Tracking</h3>
                      <p className="text-sm text-muted-foreground">
                        Dedicated tracking phone numbers for each email campaign type
                      </p>
                      <div className="mt-4 text-sm">
                        {trackingNumbersLoading ? (
                          <Skeleton className="h-5 w-32" data-testid="skeleton-overview-tracking-numbers" />
                        ) : trackingNumbersError ? (
                          <span className="font-medium text-destructive">—</span>
                        ) : (
                          <span className="font-medium">
                            {trackingNumbers?.numbers?.length || 0} tracking numbers configured
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link
                      href="/admin/marketing?tab=templates"
                      className="p-6 bg-accent/50 hover:bg-accent rounded-lg transition"
                      data-testid="link-email-templates"
                    >
                      <h3 className="font-semibold text-lg mb-2">AI Email Templates</h3>
                      <p className="text-sm text-muted-foreground">
                        GPT-4o generated email templates with preview/edit workflow
                      </p>
                      <div className="mt-4 text-sm">
                        {emailTemplatesLoading ? (
                          <Skeleton className="h-5 w-32" data-testid="skeleton-overview-email-templates" />
                        ) : emailTemplatesError ? (
                          <span className="font-medium text-destructive">—</span>
                        ) : (
                          <span className="font-medium">
                            {emailTemplates?.templates?.length || 0} templates ready
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="review-requests">
              <Card className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Review Request Campaigns</h2>
                  <Button data-testid="button-create-review-campaign">
                    Create Campaign
                  </Button>
                </div>
                <p className="text-muted-foreground mb-6">
                  4-email drip campaign sent over 21 days to request customer reviews after job completion.
                  Each campaign has a dedicated tracking phone number for attribution.
                </p>
                
                {reviewRequestsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-48 mb-2" data-testid={`skeleton-review-request-${i}`} />
                        <Skeleton className="h-4 w-64" data-testid={`skeleton-review-request-desc-${i}`} />
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
                ) : reviewRequests?.requests && reviewRequests.requests.length > 0 ? (
                  <div className="space-y-3">
                    {reviewRequests.requests.map((request: any) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg"
                        data-testid={`review-request-${request.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{request.customerName}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                request.status === 'sent' ? 'bg-blue-500/10 text-blue-600' :
                                request.status === 'opened' ? 'bg-green-500/10 text-green-600' :
                                'bg-gray-500/10 text-gray-600'
                              }`} data-testid={`status-${request.id}`}>
                                {request.status}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.email} • Started {new Date(request.startedAt).toLocaleDateString()}
                            </div>
                            {request.trackingNumber && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Tracking: {request.trackingNumber}
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
                    <p className="text-muted-foreground" data-testid="text-empty-review-requests">
                      No active review request campaigns
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="referral-nurture">
              <Card className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Referral Nurture Campaigns</h2>
                  <Button data-testid="button-create-referral-campaign">
                    Create Campaign
                  </Button>
                </div>
                <p className="text-muted-foreground mb-6">
                  4-email sequence sent over 6 months (days 14, 60, 150, 210) to encourage referrals.
                  Auto-pauses after 2 consecutive unopened emails. Each campaign has dedicated tracking number.
                </p>
                
                {referralCampaignsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-48 mb-2" data-testid={`skeleton-referral-campaign-${i}`} />
                        <Skeleton className="h-4 w-64" data-testid={`skeleton-referral-campaign-desc-${i}`} />
                      </div>
                    ))}
                  </div>
                ) : referralCampaignsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load referral nurture campaigns. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : referralCampaigns?.campaigns && referralCampaigns.campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {referralCampaigns.campaigns.map((campaign: any) => (
                      <div
                        key={campaign.id}
                        className="p-4 border rounded-lg"
                        data-testid={`referral-campaign-${campaign.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{campaign.customerName}</span>
                              {campaign.isPaused && (
                                <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded" data-testid={`paused-${campaign.id}`}>
                                  Paused
                                </span>
                              )}
                              <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-0.5 rounded" data-testid={`email-${campaign.id}`}>
                                Email {campaign.currentEmail || 1}/4
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.email} • Started {new Date(campaign.startedAt).toLocaleDateString()}
                            </div>
                            {campaign.unopenedCount > 0 && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {campaign.unopenedCount} consecutive unopened emails
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaceholderAction('Campaign details')}
                            data-testid={`button-view-${campaign.id}`}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 p-8 rounded-lg text-center">
                    <p className="text-muted-foreground" data-testid="text-empty-referral-campaigns">
                      No active referral nurture campaigns
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="tracking">
              <Card className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Campaign Phone Tracking</h2>
                  <Button data-testid="button-add-tracking-number">
                    Add Tracking Number
                  </Button>
                </div>
                <p className="text-muted-foreground mb-6">
                  Each email campaign type has its own dedicated tracking phone number for accurate attribution.
                  All email links include automatic UTM parameters.
                </p>
                
                {trackingNumbersLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-40 mb-2" data-testid={`skeleton-tracking-number-${i}`} />
                        <Skeleton className="h-4 w-56" data-testid={`skeleton-tracking-number-desc-${i}`} />
                      </div>
                    ))}
                  </div>
                ) : trackingNumbersError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load tracking numbers. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : trackingNumbers?.numbers && trackingNumbers.numbers.length > 0 ? (
                  <div className="space-y-3">
                    {trackingNumbers.numbers.map((number: any) => (
                      <div
                        key={number.id}
                        className="p-4 border rounded-lg"
                        data-testid={`tracking-number-${number.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">{number.phoneNumber}</span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" data-testid={`campaign-type-${number.id}`}>
                                {number.campaignType}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {number.description || 'No description'}
                            </div>
                            {number.utmSource && (
                              <div className="text-sm text-muted-foreground mt-1">
                                UTM: {number.utmSource} / {number.utmMedium} / {number.utmCampaign}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaceholderAction('Edit tracking number')}
                            data-testid={`button-edit-${number.id}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 p-8 rounded-lg text-center">
                    <p className="text-muted-foreground" data-testid="text-empty-tracking-numbers">
                      No tracking numbers configured
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
                    Generate New Template
                  </Button>
                </div>
                <p className="text-muted-foreground mb-6">
                  GPT-4o powered email template generation with visual HTML preview and edit/approve workflow.
                  Templates support dynamic variables and campaign-specific phone numbers.
                </p>
                
                {emailTemplatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-64 mb-2" data-testid={`skeleton-email-template-${i}`} />
                        <Skeleton className="h-4 w-48" data-testid={`skeleton-email-template-desc-${i}`} />
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
                        data-testid={`email-template-${template.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{template.name || template.subject}</span>
                              {template.isAiGenerated && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  AI Generated
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                template.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                                template.status === 'draft' ? 'bg-gray-500/10 text-gray-600' :
                                'bg-blue-500/10 text-blue-600'
                              }`} data-testid={`status-${template.id}`}>
                                {template.status}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {template.campaignType && <span>Campaign: {template.campaignType}</span>}
                              {template.campaignType && template.createdAt && <span className="mx-2">•</span>}
                              {template.createdAt && <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>}
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
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePlaceholderAction('Edit template')}
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
          </Tabs>
        </div>
    </div>
  );
}
