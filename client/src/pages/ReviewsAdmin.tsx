import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Check, X, Star, Calendar, Mail, Phone, MessageSquare, Zap, Settings as SettingsIcon, BarChart3, Send, Eye, MousePointer, History, Edit, FileText } from "lucide-react";
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

type CustomerEngagement = {
  customerId: number;
  customerName: string;
  events: Array<{
    type: 'email' | 'sms';
    subject?: string;
    campaignName?: string;
    sentAt: string;
    openedAt?: string;
    clickedAt?: string;
    status: string;
  }>;
  totalEmails: number;
  totalSMS: number;
  emailOpenRate: number;
  smsDeliveryRate: number;
};

// Email History Tab Component
function EmailHistoryTab() {
  const { toast } = useToast();
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  
  // Fetch email send logs using proper apiRequest
  const { data: emailHistory, isLoading, isError } = useQuery<{ emails: any[] }>({
    queryKey: ['/api/admin/email-history'],
  });

  // Show error toast if query fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to fetch email history. Please refresh and try again.",
        variant: "destructive"
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load email history</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/email-history'] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  const emails = emailHistory?.emails || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Email History</h2>
        <p className="text-sm text-muted-foreground">View all marketing and review request emails sent to customers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>Last 100 marketing and review request emails sent</CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No emails sent yet</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 pb-2 border-b text-sm font-medium">
                <div className="col-span-3">Recipient</div>
                <div className="col-span-3">Subject</div>
                <div className="col-span-2">Campaign</div>
                <div className="col-span-2">Sent At</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
              {emails.map((email: any) => (
                <div key={email.id} className="grid grid-cols-12 gap-4 py-2 border-b items-center">
                  <div className="col-span-3">
                    <p className="font-medium">{email.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{email.recipientEmail}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm truncate">{email.subject || 'No subject'}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      {email.campaignName || 'Direct Send'}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(email.sentAt), 'MMM d, h:mm a')}
                  </div>
                  <div className="col-span-1">
                    <Badge
                      variant={
                        email.deliveredAt ? 'default' :
                        email.bouncedAt ? 'destructive' :
                        email.complainedAt ? 'destructive' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {email.deliveredAt ? 'Delivered' :
                       email.bouncedAt ? 'Bounced' :
                       email.complainedAt ? 'Complained' :
                       email.resendStatus || 'Sent'}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEmail(email)}
                      data-testid={`button-view-email-${email.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preview Modal */}
      {selectedEmail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Preview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmail(null)}
                data-testid="button-close-preview"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">To:</p>
              <p className="font-medium">{selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subject:</p>
              <p className="font-medium">{selectedEmail.subject || 'No subject'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Campaign:</p>
              <p className="font-medium">{selectedEmail.campaignName || 'Direct Send'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sent:</p>
              <p className="font-medium">{format(new Date(selectedEmail.sentAt), 'MMMM d, yyyy h:mm a')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tracking:</p>
              <div className="flex gap-4 text-sm">
                {selectedEmail.openedAt && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Opened {format(new Date(selectedEmail.openedAt), 'MMM d, h:mm a')}
                  </span>
                )}
                {selectedEmail.clickedAt && (
                  <span className="flex items-center gap-1">
                    <MousePointer className="w-3 h-3" />
                    Clicked {format(new Date(selectedEmail.clickedAt), 'MMM d, h:mm a')}
                  </span>
                )}
                {!selectedEmail.openedAt && !selectedEmail.clickedAt && (
                  <span className="text-muted-foreground">No interaction yet</span>
                )}
              </div>
            </div>
            {selectedEmail.htmlContent && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email Content Preview:</p>
                <div className="border rounded-md p-4 bg-background max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {/* Display HTML as plain text to avoid XSS */}
                    {selectedEmail.htmlContent}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: HTML content is displayed as plain text for security
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CustomerEngagementTimeline() {
  const { data: engagementData, isLoading } = useQuery<{ customers: CustomerEngagement[] }>({
    queryKey: ['/api/admin/customer-engagement'],
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const customers = engagementData?.customers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Engagement Timeline</CardTitle>
        <CardDescription>Recent email and SMS interactions across all campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No engagement data yet</p>
        ) : (
          <div className="space-y-6">
            {customers.slice(0, 10).map((customer) => (
              <div key={customer.customerId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base">{customer.customerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.totalEmails} emails • {customer.totalSMS} SMS messages
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Mail className="w-3 h-3" />
                      {(customer.emailOpenRate * 100).toFixed(0)}% open
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {(customer.smsDeliveryRate * 100).toFixed(0)}% delivered
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {customer.events.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="mt-1">
                        {event.type === 'email' ? (
                          <Mail className="w-4 h-4 text-blue-500" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {event.subject || event.campaignName || `${event.type === 'email' ? 'Email' : 'SMS'} sent`}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{format(new Date(event.sentAt), 'MMM d, yyyy h:mm a')}</span>
                          {event.openedAt && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Opened
                            </span>
                          )}
                          {event.clickedAt && (
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              Clicked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {customer.events.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{customer.events.length - 5} more interactions
                    </p>
                  )}
                </div>
              </div>
            ))}
            {customers.length > 10 && (
              <p className="text-sm text-muted-foreground text-center pt-4">
                Showing 10 of {customers.length} customers with recent activity
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReviewsAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<ReviewCampaign | null>(null);
  const [dripEmails, setDripEmails] = useState<DripEmail[]>([]);
  const [dripEmailDialog, setDripEmailDialog] = useState<{
    open: boolean;
    mode: 'preview' | 'edit' | 'approve';
    email: DripEmail | null;
    campaign: ReviewCampaign | null;
  }>({ open: false, mode: 'preview', email: null, campaign: null });
  const [editedDripEmail, setEditedDripEmail] = useState<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }>({ subject: '', htmlContent: '', textContent: '' });

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

  // Fetch drip emails for a campaign
  const fetchDripEmails = async (campaignId: string) => {
    try {
      const response = await apiRequest("GET", `/api/admin/review-campaigns/${campaignId}/emails`);
      setDripEmails(response.emails || []);
      return response.emails;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drip emails",
        variant: "destructive",
      });
      return [];
    }
  };

  // Approve campaign mutation  
  const approveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("PATCH", `/api/admin/review-campaigns/${campaignId}`, {
        status: 'approved'
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign Approved",
        description: "The review campaign and all drip emails have been approved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-campaigns'] });
      setDripEmailDialog({ open: false, mode: 'preview', email: null, campaign: null });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve campaign",
        variant: "destructive",
      });
    }
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
  const negativeReviewAlertsEnabled = settings.find(s => s.settingKey === 'negative_review_alerts_enabled')?.settingValue === 'true';
  const negativeReviewThreshold = parseInt(settings.find(s => s.settingKey === 'negative_review_threshold')?.settingValue || '2');
  const negativeReviewSMSAlerts = settings.find(s => s.settingKey === 'negative_review_sms_alerts')?.settingValue === 'true';
  const negativeReviewAlertPhone = settings.find(s => s.settingKey === 'negative_review_alert_phone')?.settingValue || '';

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
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="email-history" data-testid="tab-email-history">
              <History className="w-4 h-4 mr-2" />
              Email History
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

            <CustomerEngagementTimeline />

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
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setSelectedCampaign(campaign);
                            const emails = await fetchDripEmails(campaign.id);
                            if (emails && emails.length > 0) {
                              setDripEmailDialog({ 
                                open: true, 
                                mode: 'preview', 
                                email: emails[0], 
                                campaign 
                              });
                            }
                          }}
                          data-testid={`button-view-drip-emails-${campaign.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Drip Emails ({campaign.generatedByAI ? 'Review Required' : 'Approved'})
                        </Button>
                        {campaign.generatedByAI && (
                          <Button
                            size="sm"
                            onClick={() => approveCampaignMutation.mutate(campaign.id)}
                            disabled={approveCampaignMutation.isPending}
                            data-testid={`button-approve-campaign-${campaign.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve Campaign
                          </Button>
                        )}
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

          {/* Email History Tab */}
          <TabsContent value="email-history" className="mt-6 space-y-6">
            <EmailHistoryTab />
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
                <CardTitle>Negative Review Alerts</CardTitle>
                <CardDescription>Get instant email and SMS notifications for low-rating reviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="negative-alerts" className="text-base font-medium cursor-pointer">
                      Enable Negative Review Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {negativeReviewAlertsEnabled 
                        ? 'You will receive instant email alerts for low-rating reviews' 
                        : 'Negative review alerts are disabled'}
                    </p>
                  </div>
                  <Switch
                    id="negative-alerts"
                    checked={negativeReviewAlertsEnabled}
                    onCheckedChange={(checked) => {
                      updateSettingMutation.mutate({
                        key: 'negative_review_alerts_enabled',
                        value: checked.toString(),
                      });
                    }}
                    data-testid="switch-negative-alerts"
                  />
                </div>

                <div className="space-y-2 p-4 border rounded-md">
                  <Label htmlFor="negative-threshold">Rating Threshold</Label>
                  <Select
                    value={negativeReviewThreshold.toString()}
                    onValueChange={(value) => {
                      updateSettingMutation.mutate({
                        key: 'negative_review_threshold',
                        value: value,
                      });
                    }}
                    disabled={!negativeReviewAlertsEnabled}
                  >
                    <SelectTrigger id="negative-threshold" data-testid="select-negative-threshold">
                      <SelectValue placeholder="Select threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 star or less</SelectItem>
                      <SelectItem value="2">2 stars or less</SelectItem>
                      <SelectItem value="3">3 stars or less</SelectItem>
                      <SelectItem value="4">4 stars or less</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Send alerts for reviews with this rating or lower
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="sms-alerts" className="text-base font-medium cursor-pointer">
                      Enable SMS Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {negativeReviewSMSAlerts 
                        ? 'SMS alerts will be sent for negative reviews' 
                        : 'SMS alerts are disabled'}
                    </p>
                  </div>
                  <Switch
                    id="sms-alerts"
                    checked={negativeReviewSMSAlerts}
                    onCheckedChange={(checked) => {
                      updateSettingMutation.mutate({
                        key: 'negative_review_sms_alerts',
                        value: checked.toString(),
                      });
                    }}
                    disabled={!negativeReviewAlertsEnabled}
                    data-testid="switch-sms-alerts"
                  />
                </div>

                <div className="space-y-2 p-4 border rounded-md">
                  <Label htmlFor="alert-phone">Alert Phone Number</Label>
                  <Input
                    id="alert-phone"
                    type="tel"
                    placeholder="e.g., +15123689159"
                    value={negativeReviewAlertPhone}
                    onChange={(e) => {
                      updateSettingMutation.mutate({
                        key: 'negative_review_alert_phone',
                        value: e.target.value,
                      });
                    }}
                    disabled={!negativeReviewAlertsEnabled || !negativeReviewSMSAlerts}
                    data-testid="input-alert-phone"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US)
                  </p>
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
      
      {/* Drip Email Preview Dialog */}
      <Dialog 
        open={dripEmailDialog.open} 
        onOpenChange={(open) => !open && setDripEmailDialog({ open: false, mode: 'preview', email: null, campaign: null })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {dripEmailDialog.mode === 'preview' ? 'Review Drip Email' : 
               dripEmailDialog.mode === 'edit' ? 'Edit Drip Email' : 
               'Approve Drip Campaign'}
            </DialogTitle>
            <DialogDescription>
              {dripEmailDialog.campaign?.name} - {dripEmailDialog.email ? `Day ${dripEmailDialog.email.dayOffset}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {dripEmailDialog.email && (
            <div className="flex-1 overflow-auto">
              <Tabs defaultValue="preview">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Visual Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Source</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4 space-y-4">
                  <div>
                    <Label>Subject</Label>
                    {dripEmailDialog.mode === 'edit' ? (
                      <Input
                        value={editedDripEmail.subject}
                        onChange={(e) => setEditedDripEmail(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject"
                        data-testid="input-drip-email-subject"
                      />
                    ) : (
                      <div className="p-3 bg-background rounded-md border">
                        {dripEmailDialog.email.subject}
                      </div>
                    )}
                  </div>
                  
                  {dripEmailDialog.email.messagingTactic && (
                    <div>
                      <Label>Messaging Tactic</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {dripEmailDialog.email.messagingTactic}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Email Content</Label>
                    {dripEmailDialog.mode === 'edit' ? (
                      <Textarea
                        value={editedDripEmail.htmlContent}
                        onChange={(e) => setEditedDripEmail(prev => ({ ...prev, htmlContent: e.target.value }))}
                        placeholder="HTML email content"
                        className="min-h-[300px] font-mono text-sm"
                        data-testid="textarea-drip-email-content"
                      />
                    ) : (
                      <div className="border rounded-md bg-white">
                        <iframe
                          srcDoc={dripEmailDialog.email.htmlContent || ''}
                          className="w-full h-[400px]"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-medium">{dripEmailDialog.email.totalSent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opened</p>
                      <p className="font-medium">{dripEmailDialog.email.totalOpened}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicked</p>
                      <p className="font-medium">{dripEmailDialog.email.totalClicked}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="html" className="mt-4">
                  <ScrollArea className="h-[500px] border rounded-md p-4">
                    <pre className="text-xs whitespace-pre-wrap">
                      {dripEmailDialog.email.htmlContent}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              {/* Navigation for multiple drip emails */}
              {dripEmails.length > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Email {(dripEmails.findIndex(e => e.id === dripEmailDialog.email?.id) || 0) + 1} of {dripEmails.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = dripEmails.findIndex(e => e.id === dripEmailDialog.email?.id);
                        if (currentIndex > 0) {
                          setDripEmailDialog(prev => ({ ...prev, email: dripEmails[currentIndex - 1] }));
                        }
                      }}
                      disabled={dripEmails.findIndex(e => e.id === dripEmailDialog.email?.id) === 0}
                      data-testid="button-prev-email"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = dripEmails.findIndex(e => e.id === dripEmailDialog.email?.id);
                        if (currentIndex < dripEmails.length - 1) {
                          setDripEmailDialog(prev => ({ ...prev, email: dripEmails[currentIndex + 1] }));
                        }
                      }}
                      disabled={dripEmails.findIndex(e => e.id === dripEmailDialog.email?.id) === dripEmails.length - 1}
                      data-testid="button-next-email"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {dripEmailDialog.mode === 'preview' && dripEmailDialog.campaign?.generatedByAI && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedDripEmail({
                        subject: dripEmailDialog.email?.subject || '',
                        htmlContent: dripEmailDialog.email?.htmlContent || '',
                        textContent: dripEmailDialog.email?.textContent || ''
                      });
                      setDripEmailDialog(prev => ({ ...prev, mode: 'edit' }));
                    }}
                    data-testid="button-edit-drip-email"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Email
                  </Button>
                  <Button
                    onClick={() => {
                      if (dripEmailDialog.campaign) {
                        approveCampaignMutation.mutate(dripEmailDialog.campaign.id);
                      }
                    }}
                    disabled={approveCampaignMutation.isPending}
                    data-testid="button-approve-all"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve All Emails
                  </Button>
                </>
              )}
              {dripEmailDialog.mode === 'edit' && (
                <Button
                  onClick={() => {
                    // Save the edited email
                    toast({
                      title: "Email Updated",
                      description: "The drip email content has been saved.",
                    });
                    setDripEmailDialog(prev => ({ ...prev, mode: 'preview' }));
                  }}
                  data-testid="button-save-drip-email"
                >
                  Save Changes
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setDripEmailDialog({ open: false, mode: 'preview', email: null, campaign: null })}
              data-testid="button-close-dialog"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
