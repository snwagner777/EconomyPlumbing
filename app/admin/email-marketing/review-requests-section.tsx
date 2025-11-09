'use client';

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  Star,
  Settings,
  Mail,
  Phone,
  AlertTriangle,
  Sparkles,
  Loader2,
  Save
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type {
  SystemSettings,
  ReviewRequestsDashboardStats,
  ReviewRequest,
  ReferralNurture
} from "@shared/email-types";

export function ReviewRequestsSection() {
  const { toast } = useToast();
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<'review_request' | 'referral_nurture' | 'quote_followup'>('review_request');
  
  // AI Email Generation State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCampaignType, setGenerateCampaignType] = useState<'review_request' | 'referral_nurture' | 'quote_followup'>('review_request');
  const [generateEmailNumber, setGenerateEmailNumber] = useState<1 | 2 | 3 | 4>(1);
  const [generateStrategy, setGenerateStrategy] = useState<string>('');
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'visual' | 'html' | 'plain'>('visual');

  // Fetch system settings
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/review-requests/settings'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<ReviewRequestsDashboardStats>({
    queryKey: ['/api/admin/review-requests/stats'],
  });

  // Fetch active review requests
  const { data: reviewRequests } = useQuery<ReviewRequest[]>({
    queryKey: ['/api/admin/review-requests/active'],
  });

  // Fetch active referral campaigns
  const { data: referralCampaigns } = useQuery<ReferralNurture[]>({
    queryKey: ['/api/admin/review-requests/referrals'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SystemSettings>) => {
      const response = await apiRequest("PUT", "/api/admin/review-requests/settings", updates);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-requests/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your review request settings have been saved.",
      });
    },
  });

  // Update phone number mutation (auto-creates tracking number with UTM params)
  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const endpointMap = {
        'review_request': '/api/admin/review-requests/phone',
        'referral_nurture': '/api/admin/referral-nurture/phone',
        'quote_followup': '/api/admin/quote-followup/phone'
      };
      const response = await apiRequest("POST", endpointMap[editingCampaign], { phoneNumber: phone });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-requests/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      setIsPhoneDialogOpen(false);
      setPhoneNumber("");
      const campaignNames = {
        'review_request': 'Review Request',
        'referral_nurture': 'Referral Nurture',
        'quote_followup': 'Quote Follow-up'
      };
      toast({
        title: "Phone Number Updated",
        description: `${campaignNames[editingCampaign]} campaign phone number updated with UTM tracking`,
      });
    },
  });

  // AI Email Generation Mutation
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/generate", params);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedEmail(data);
      toast({
        title: "Email Generated",
        description: "AI has created a personalized email. Review and save if you'd like to use it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email",
        variant: "destructive"
      });
    }
  });

  // Save generated email as template
  const saveGeneratedMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/save-template", params);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/emails/templates'] });
      setGenerateDialogOpen(false);
      setGeneratedEmail(null);
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      queued: { variant: "secondary", label: "Queued" },
      sending: { variant: "default", label: "Sending" },
      paused: { variant: "outline", label: "Paused" },
      completed: { variant: "default", label: "Completed" },
      stopped: { variant: "destructive", label: "Stopped" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleGenerateEmail = () => {
    const mockJobDetails = {
      customerId: 12345,
      customerName: "John Smith",
      serviceType: "Water Heater Installation",
      jobAmount: 185000,
      jobDate: new Date(),
      location: "Austin, TX"
    };

    if (!settings?.reviewRequestPhoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please configure the Review Request phone number in Campaign Settings before generating emails.",
        variant: "destructive"
      });
      return;
    }
    
    generateMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      jobDetails: mockJobDetails,
      phoneNumber: settings.reviewRequestPhoneNumber,
      strategy: generateStrategy || undefined
    });
  };

  const handleSaveGeneratedEmail = () => {
    if (!generatedEmail) return;

    saveGeneratedMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      subject: generatedEmail.subject,
      preheader: generatedEmail.preheader,
      htmlContent: generatedEmail.htmlContent,
      plainTextContent: generatedEmail.plainTextContent,
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="review-campaigns" data-testid="tab-review-campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Review Campaigns
          </TabsTrigger>
          <TabsTrigger value="referral-campaigns" data-testid="tab-referral-campaigns">
            <Users className="h-4 w-4 mr-2" />
            Referral Nurture
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Review Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-active-review-campaigns">
                  {stats?.reviewRequests.active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.reviewRequests.total || 0} total campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reviews Submitted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-reviews-submitted">
                  {stats?.reviewRequests.reviewsSubmitted || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.reviewRequests.averageRating.toFixed(1) || "N/A"} avg rating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Email Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-open-rate">
                  {((stats?.reviewRequests.openRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats?.reviewRequests.clickRate || 0) * 100).toFixed(1)}% click rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Referrals Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-referrals">
                  {stats?.referralNurture.totalReferrals || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.referralNurture.active || 0} active campaigns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current configuration and campaign health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review Drip Campaign</p>
                  <p className="text-sm text-muted-foreground">
                    4-email sequence over 21 days
                  </p>
                </div>
                <Badge variant={settings?.reviewDripEnabled ? "default" : "secondary"}>
                  {settings?.reviewDripEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Referral Nurture Campaign</p>
                  <p className="text-sm text-muted-foreground">
                    4-email sequence over 6 months
                  </p>
                </div>
                <Badge variant={settings?.referralDripEnabled ? "default" : "secondary"}>
                  {settings?.referralDripEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Contact Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    {settings?.reviewRequestPhoneFormatted || "Not configured"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPhoneDialogOpen(true)}
                  data-testid="button-edit-phone"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Campaigns Tab */}
        <TabsContent value="review-campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Review Campaigns</h2>
              <p className="text-muted-foreground">
                4-email drip sequence to request customer reviews
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
              <CardDescription>
                Email 1: Immediate | Email 2: Day 3 | Email 3: Day 7 | Email 4: Day 21
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewRequests && reviewRequests.length > 0 ? (
                  reviewRequests.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`campaign-review-${campaign.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.customerName}</p>
                          <p className="text-sm text-muted-foreground">{campaign.customerEmail}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email 1</p>
                          <p className="font-medium">
                            {campaign.email1SentAt ? format(new Date(campaign.email1SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 2</p>
                          <p className="font-medium">
                            {campaign.email2SentAt ? format(new Date(campaign.email2SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 3</p>
                          <p className="font-medium">
                            {campaign.email3SentAt ? format(new Date(campaign.email3SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 4</p>
                          <p className="font-medium">
                            {campaign.email4SentAt ? format(new Date(campaign.email4SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Opens:</span>{" "}
                          <span className="font-medium">{campaign.emailOpens}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clicks:</span>{" "}
                          <span className="font-medium">{campaign.linkClicks}</span>
                        </div>
                        {campaign.reviewSubmitted && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            {campaign.reviewRating}★ on {campaign.reviewPlatform}
                          </Badge>
                        )}
                      </div>

                      {campaign.stopReason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Stop reason: {campaign.stopReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active review campaigns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Nurture Tab */}
        <TabsContent value="referral-campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Referral Nurture Campaigns</h2>
              <p className="text-muted-foreground">
                6-month drip sequence for happy customers who left positive reviews
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
              <CardDescription>
                Email 1: Immediate | Email 2: 1 month | Email 3: 3 months | Email 4: 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralCampaigns && referralCampaigns.length > 0 ? (
                  referralCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`campaign-referral-${campaign.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.customerName}</p>
                          <p className="text-sm text-muted-foreground">{campaign.customerEmail}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email 1</p>
                          <p className="font-medium">
                            {campaign.email1SentAt ? format(new Date(campaign.email1SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 2</p>
                          <p className="font-medium">
                            {campaign.email2SentAt ? format(new Date(campaign.email2SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 3</p>
                          <p className="font-medium">
                            {campaign.email3SentAt ? format(new Date(campaign.email3SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 4</p>
                          <p className="font-medium">
                            {campaign.email4SentAt ? format(new Date(campaign.email4SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Opens:</span>{" "}
                          <span className="font-medium">{campaign.totalOpens}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Clicks:</span>{" "}
                          <span className="font-medium">{campaign.totalClicks}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Referrals:</span>{" "}
                          <span className="font-medium">{campaign.referralsSubmitted}</span>
                        </div>
                        {campaign.consecutiveUnopened > 0 && (
                          <Badge variant="outline">
                            {campaign.consecutiveUnopened} consecutive unopened
                          </Badge>
                        )}
                      </div>

                      {campaign.pauseReason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Pause reason: {campaign.pauseReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active referral campaigns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Configure automatic review and referral campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="master-email-switch" className="text-base font-semibold">Master Email Switch</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable ALL review/referral emails (requires phone number configured)
                  </p>
                  {!settings?.reviewRequestPhoneNumber && (
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive font-medium">
                        Configure phone number below before enabling
                      </p>
                    </div>
                  )}
                </div>
                <Switch
                  id="master-email-switch"
                  data-testid="switch-master-email"
                  checked={settings?.reviewMasterEmailSwitch || false}
                  disabled={!settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ reviewMasterEmailSwitch: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="review-drip-enabled">Enable Review Drip Campaign</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send 4-email review request sequence after job completion
                  </p>
                </div>
                <Switch
                  id="review-drip-enabled"
                  data-testid="switch-review-drip-enabled"
                  checked={settings?.reviewDripEnabled || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ reviewDripEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="referral-drip-enabled">Enable Referral Nurture Campaign</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send 6-month referral sequence to customers who left 4+ star reviews
                  </p>
                </div>
                <Switch
                  id="referral-drip-enabled"
                  data-testid="switch-referral-drip-enabled"
                  checked={settings?.referralDripEnabled || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ referralDripEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-send-reviews">Auto-Send Review Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Start sending immediately after job marked complete (no approval needed)
                  </p>
                </div>
                <Switch
                  id="auto-send-reviews"
                  data-testid="switch-auto-send-reviews"
                  checked={settings?.autoSendReviewRequests || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ autoSendReviewRequests: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-start-referrals">Auto-Start Referral Campaigns</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enroll customers in referral nurture after positive review
                  </p>
                </div>
                <Switch
                  id="auto-start-referrals"
                  data-testid="switch-auto-start-referrals"
                  checked={settings?.autoStartReferralCampaigns || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ autoStartReferralCampaigns: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Phone Numbers</CardTitle>
              <CardDescription>
                Dedicated tracking phone numbers for each campaign type (auto-creates UTM tracking)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Review Request Campaign Phone */}
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1">
                  <Label>Review Request Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.reviewRequestPhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=review_request, utm_medium=email, utm_campaign=review_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('review_request');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-review-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Referral Nurture Campaign Phone */}
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1">
                  <Label>Referral Nurture Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.referralNurturePhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=referral_nurture, utm_medium=email, utm_campaign=referral_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('referral_nurture');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-referral-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Quote Follow-up Campaign Phone */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Quote Follow-up Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.quoteFollowupPhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=quote_followup, utm_medium=email, utm_campaign=quote_followup_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('quote_followup');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-quote-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phone Number Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {editingCampaign === 'review_request' ? 'Review Request' : editingCampaign === 'referral_nurture' ? 'Referral Nurture' : 'Quote Follow-up'} Phone Number
            </DialogTitle>
            <DialogDescription>
              This will automatically create a tracking number entry with UTM parameters for the {editingCampaign === 'review_request' ? 'review request' : editingCampaign === 'referral_nurture' ? 'referral nurture' : 'quote follow-up'} campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                data-testid="input-phone-number"
                placeholder="(512) 555-1234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter in any format - will be auto-formatted
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPhoneDialogOpen(false);
                  setPhoneNumber("");
                }}
                data-testid="button-cancel-phone"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updatePhoneMutation.mutate(phoneNumber)}
                disabled={!phoneNumber || updatePhoneMutation.isPending}
                data-testid="button-save-phone"
              >
                {updatePhoneMutation.isPending ? "Saving..." : "Save & Create Tracking Number"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Email Generation Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Create a personalized email using job details and seasonal context
            </DialogDescription>
          </DialogHeader>

          {!generatedEmail ? (
            <div className="space-y-4">
              <div>
                <Label>Campaign Type</Label>
                <Select
                  value={generateCampaignType}
                  onValueChange={(value: 'review_request' | 'referral_nurture' | 'quote_followup') => setGenerateCampaignType(value)}
                >
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review_request">Review Request Drip</SelectItem>
                    <SelectItem value="quote_followup">Quote Follow-up</SelectItem>
                    <SelectItem value="referral_nurture">Referral Nurture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email Number (1-4)</Label>
                <Select
                  value={generateEmailNumber.toString()}
                  onValueChange={(value) => setGenerateEmailNumber(parseInt(value) as 1 | 2 | 3 | 4)}
                >
                  <SelectTrigger data-testid="select-email-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Email 1 - {generateCampaignType === 'referral_nurture' ? 'Day 14' : 'Day 1'}</SelectItem>
                    <SelectItem value="2">Email 2 - {generateCampaignType === 'referral_nurture' ? 'Day 60' : 'Day 7'}</SelectItem>
                    <SelectItem value="3">Email 3 - {generateCampaignType === 'referral_nurture' ? 'Day 150' : 'Day 14'}</SelectItem>
                    <SelectItem value="4">Email 4 - {generateCampaignType === 'referral_nurture' ? 'Day 210' : 'Day 21'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Strategy (Optional)</Label>
                <Select
                  value={generateStrategy}
                  onValueChange={setGenerateStrategy}
                >
                  <SelectTrigger data-testid="select-strategy">
                    <SelectValue placeholder="Auto-select based on email number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-select</SelectItem>
                    <SelectItem value="value">Value - Focus on service quality</SelectItem>
                    <SelectItem value="trust">Trust - Build credibility</SelectItem>
                    <SelectItem value="urgency">Urgency - Time-sensitive ask</SelectItem>
                    <SelectItem value="social_proof">Social Proof - Others sharing reviews</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank for automatic strategy selection
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                  data-testid="button-cancel-generate"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateEmail}
                  disabled={generateMutation.isPending}
                  data-testid="button-run-generation"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{generatedEmail.subject}</h3>
                  <p className="text-sm text-muted-foreground">{generatedEmail.preheader}</p>
                </div>
                <div className="flex gap-2">
                  <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'visual' | 'html' | 'plain')}>
                    <TabsList>
                      <TabsTrigger value="visual" data-testid="tab-preview-visual">Visual</TabsTrigger>
                      <TabsTrigger value="html" data-testid="tab-preview-html">HTML</TabsTrigger>
                      <TabsTrigger value="plain" data-testid="tab-preview-plain">Plain</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {previewMode === 'visual' && (
                  <div dangerouslySetInnerHTML={{ __html: generatedEmail.htmlContent }} />
                )}
                {previewMode === 'html' && (
                  <pre className="text-xs whitespace-pre-wrap">{generatedEmail.htmlContent}</pre>
                )}
                {previewMode === 'plain' && (
                  <pre className="whitespace-pre-wrap">{generatedEmail.plainTextContent}</pre>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedEmail(null)}
                  data-testid="button-regenerate"
                >
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerateDialogOpen(false);
                    setGeneratedEmail(null);
                  }}
                  data-testid="button-close-preview"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSaveGeneratedEmail}
                  disabled={saveGeneratedMutation.isPending}
                  data-testid="button-save-generated"
                >
                  {saveGeneratedMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
