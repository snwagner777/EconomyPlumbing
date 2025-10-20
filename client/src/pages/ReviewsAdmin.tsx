import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Check, X, Star, Calendar, Mail, Phone, MessageSquare, Zap, Settings as SettingsIcon, BarChart3, Send, Eye, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

type Review = {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  rating: number;
  reviewText: string;
  serviceDate: string | null;
  photoUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requestId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReviewCampaign = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  generatedByAI: boolean;
  totalSent: number;
  totalClicks: number;
  totalReviewsCompleted: number;
  conversionRate: number;
  createdAt: string;
};

type DripEmail = {
  id: string;
  campaignId: string;
  sequenceNumber: number;
  dayOffset: number;
  subject: string;
  messagingTactic: string | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  enabled: boolean;
};

type AIReviewResponse = {
  id: string;
  reviewType: string;
  customerName: string;
  rating: number;
  reviewText: string;
  generatedResponse: string;
  sentiment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type ReputationSetting = {
  id: string;
  settingKey: string;
  settingValue: string;
  updatedAt: string;
};

export default function ReviewsAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch all reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<{ reviews: Review[] }>({
    queryKey: ['/api/admin/reviews'],
  });

  // Fetch review campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<{ campaigns: ReviewCampaign[] }>({
    queryKey: ['/api/admin/review-campaigns'],
  });

  // Fetch AI review responses
  const { data: aiResponsesData, isLoading: aiResponsesLoading } = useQuery<{ responses: AIReviewResponse[] }>({
    queryKey: ['/api/admin/ai-review-responses'],
  });

  // Fetch reputation settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery<ReputationSetting[]>({
    queryKey: ['/api/admin/reputation-settings'],
  });

  // Create AI campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/review-campaigns");
    },
    onSuccess: () => {
      toast({
        title: "AI Campaign Created",
        description: "New review request campaign has been generated with AI-optimized messaging.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve AI response mutation
  const approveAIResponseMutation = useMutation({
    mutationFn: async ({ id, editedResponse }: { id: string; editedResponse?: string }) => {
      return await apiRequest("POST", `/api/admin/ai-review-responses/${id}/approve`, {
        editedResponse,
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Approved",
        description: "AI-generated review response has been approved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-review-responses'] });
    },
  });

  // Update reputation setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest("PUT", "/api/admin/reputation-settings", {
        settingKey: key,
        settingValue: value,
      });
    },
    onSuccess: (data: any, variables) => {
      toast({
        title: "Setting Updated",
        description: `${variables.key} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reputation-settings'] });
    },
  });

  const reviews = reviewsData?.reviews || [];
  const campaigns = campaignsData?.campaigns || [];
  const aiResponses = aiResponsesData?.responses || [];
  const settings = settingsData || [];

  const masterEmailSwitch = settings.find(s => s.settingKey === 'master_email_switch_enabled')?.settingValue === 'true';

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  if (reviewsLoading || campaignsLoading || aiResponsesLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                data-testid="button-back-to-admin"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                Reputation Management
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              AI-powered review requests, drip campaigns, and response generation
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              <Send className="w-4 h-4 mr-2" />
              Review Requests
            </TabsTrigger>
            <TabsTrigger value="drip" data-testid="tab-drip">
              <Zap className="w-4 h-4 mr-2" />
              Drip Templates
            </TabsTrigger>
            <TabsTrigger value="ai-responses" data-testid="tab-ai-responses">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Responses
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-campaigns">
                    {campaigns.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaigns.filter(c => c.isActive).length} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-sent">
                    {campaigns.reduce((sum, c) => sum + c.totalSent, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaigns.reduce((sum, c) => sum + c.totalClicks, 0)} clicks
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviews Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-reviews">
                    {campaigns.reduce((sum, c) => sum + c.totalReviewsCompleted, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaigns.length > 0 
                      ? `${((campaigns.reduce((sum, c) => sum + c.totalReviewsCompleted, 0) / campaigns.reduce((sum, c) => sum + c.totalSent, 0) * 100) || 0).toFixed(1)}% conversion`
                      : '0% conversion'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>Review statistics across all platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">Google Reviews</p>
                    <p className="text-sm text-muted-foreground">Coming soon - API integration</p>
                  </div>
                  <Badge variant="secondary">Not Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">Facebook Reviews</p>
                    <p className="text-sm text-muted-foreground">Coming soon - API integration</p>
                  </div>
                  <Badge variant="secondary">Not Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">Website Reviews</p>
                    <p className="text-sm text-muted-foreground">{reviews.filter(r => r.status === 'approved').length} approved reviews</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Requests Tab */}
          <TabsContent value="requests" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Active Campaigns</h2>
                <p className="text-sm text-muted-foreground">Track review request drip campaigns</p>
              </div>
              <Button
                onClick={() => createCampaignMutation.mutate()}
                disabled={createCampaignMutation.isPending}
                data-testid="button-create-campaign"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Campaign
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <p className="text-muted-foreground">No campaigns yet. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg" data-testid={`text-campaign-name-${campaign.id}`}>
                              {campaign.name}
                            </CardTitle>
                            {campaign.isActive && <Badge>Active</Badge>}
                            {campaign.generatedByAI && <Badge variant="secondary"><Zap className="w-3 h-3 mr-1" />AI Generated</Badge>}
                          </div>
                          {campaign.description && (
                            <CardDescription>{campaign.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Sent</p>
                          <p className="text-2xl font-semibold" data-testid={`text-sent-${campaign.id}`}>{campaign.totalSent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Clicks</p>
                          <p className="text-2xl font-semibold" data-testid={`text-clicks-${campaign.id}`}>{campaign.totalClicks}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Reviews</p>
                          <p className="text-2xl font-semibold" data-testid={`text-reviews-${campaign.id}`}>{campaign.totalReviewsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Conversion</p>
                          <p className="text-2xl font-semibold" data-testid={`text-conversion-${campaign.id}`}>
                            {campaign.totalSent > 0 ? ((campaign.totalReviewsCompleted / campaign.totalSent) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Drip Templates Tab */}
          <TabsContent value="drip" className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">AI Drip Email Templates</h2>
              <p className="text-sm text-muted-foreground">Intelligent email sequences with behavioral branching</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>How AI Drip Campaigns Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">1</div>
                  <div>
                    <p className="font-medium">Initial Request (Day 0)</p>
                    <p className="text-sm text-muted-foreground">Sent immediately after job completion with all platform links</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">2</div>
                  <div>
                    <p className="font-medium">Smart Follow-ups (Days 3, 5, 7)</p>
                    <p className="text-sm text-muted-foreground">AI adjusts messaging based on customer behavior</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">3</div>
                  <div>
                    <p className="font-medium">Behavioral Branching</p>
                    <p className="text-sm text-muted-foreground">Different tactics if customer clicked but didn't review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance</CardTitle>
                  <CardDescription>Click-through and conversion rates by sequence</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Detailed email performance metrics coming soon
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Responses Tab */}
          <TabsContent value="ai-responses" className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">AI Review Responses</h2>
              <p className="text-sm text-muted-foreground">GPT-4o generated responses to customer reviews</p>
            </div>

            {aiResponses.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <p className="text-muted-foreground">No AI responses generated yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {aiResponses.map((response) => (
                  <Card key={response.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{response.customerName}</CardTitle>
                            <Badge variant={
                              response.status === 'approved' ? 'default' :
                              response.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {response.status}
                            </Badge>
                            <Badge variant="outline">{response.sentiment}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(response.rating)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Original Review:</p>
                        <p className="text-sm text-muted-foreground">{response.reviewText}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">AI Generated Response:</p>
                        <p className="text-sm">{response.generatedResponse}</p>
                      </div>
                      {response.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveAIResponseMutation.mutate({ id: response.id })}
                            disabled={approveAIResponseMutation.isPending}
                            data-testid={`button-approve-response-${response.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-response-${response.id}`}
                          >
                            Edit & Approve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Reputation System Settings</h2>
              <p className="text-sm text-muted-foreground">Configure master switches and system behavior</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Master Email Control</CardTitle>
                <CardDescription>Global on/off switch for review request emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="master-switch" className="text-base font-medium cursor-pointer">
                      Enable Review Request Emails
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {masterEmailSwitch 
                        ? 'Emails are being sent automatically after job completion' 
                        : 'All review request emails are PAUSED - no emails will be sent'}
                    </p>
                  </div>
                  <Switch
                    id="master-switch"
                    checked={masterEmailSwitch}
                    onCheckedChange={(checked) => {
                      updateSettingMutation.mutate({
                        key: 'master_email_switch_enabled',
                        value: checked.toString(),
                      });
                    }}
                    data-testid="switch-master-email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Configure when and how review requests are sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trigger Event</Label>
                  <p className="text-sm text-muted-foreground">
                    Review requests are automatically sent when a job is marked as completed in ServiceTitan
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Delay After Job Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Default: Same day (within 1 hour of job completion)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>OpenAI model settings and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm">Drip Campaign Model</p>
                  <p className="text-sm font-medium">GPT-4o</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm">Review Response Model</p>
                  <p className="text-sm font-medium">GPT-4o</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm">Temperature</p>
                  <p className="text-sm font-medium">0.7</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
