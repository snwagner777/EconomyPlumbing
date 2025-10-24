import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, Star, Mail, Users, TrendingUp, Phone, Plus, Settings, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SystemSettings {
  masterEmailSwitch: boolean;
  reviewDripEnabled: boolean;
  referralDripEnabled: boolean;
  autoSendReviewRequests: boolean;
  autoStartReferralCampaigns: boolean;
  reviewRequestPhoneNumber: string;
  reviewRequestPhoneFormatted: string;
}

interface ReviewRequest {
  id: string;
  jobCompletionId: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;
  stopReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  reviewSubmitted: boolean;
  reviewSubmittedAt?: string;
  reviewRating?: number;
  reviewPlatform?: string;
  emailOpens: number;
  linkClicks: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralNurture {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;
  pauseReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  consecutiveUnopened: number;
  totalOpens: number;
  totalClicks: number;
  referralsSubmitted: number;
  lastReferralAt?: string;
  createdAt: string;
  pausedAt?: string;
  completedAt?: string;
}

interface DashboardStats {
  reviewRequests: {
    total: number;
    active: number;
    completed: number;
    reviewsSubmitted: number;
    averageRating: number;
    openRate: number;
    clickRate: number;
  };
  referralNurture: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    totalReferrals: number;
    averageEngagement: number;
  };
}

export default function ReviewRequestsAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      setLocation("/admin/login");
    }
  }, [authData, setLocation]);

  // Fetch system settings
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/review-requests/settings'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
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
      return await apiRequest("PUT", "/api/admin/review-requests/settings", updates);
    },
    onSuccess: () => {
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
      return await apiRequest("POST", "/api/admin/review-requests/phone", { phoneNumber: phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-requests/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      setIsPhoneDialogOpen(false);
      setPhoneNumber("");
      toast({
        title: "Phone Number Updated",
        description: "Tracking number created with UTM parameters: utm_source=review_request, utm_medium=email, utm_campaign=review_drip",
      });
    },
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout", {});
    setLocation("/admin/login");
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

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

  if (!authData?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Review Request Management</h1>
              <p className="text-sm text-muted-foreground">
                Automated review drip campaigns & referral nurturing
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                    checked={settings?.masterEmailSwitch || false}
                    disabled={!settings?.reviewRequestPhoneNumber}
                    onCheckedChange={(checked) =>
                      updateSettingsMutation.mutate({ masterEmailSwitch: checked })
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
                    disabled={!settings?.masterEmailSwitch || !settings?.reviewRequestPhoneNumber}
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
                    disabled={!settings?.masterEmailSwitch || !settings?.reviewRequestPhoneNumber}
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
                    disabled={!settings?.masterEmailSwitch || !settings?.reviewRequestPhoneNumber}
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
                    disabled={!settings?.masterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                    onCheckedChange={(checked) =>
                      updateSettingsMutation.mutate({ autoStartReferralCampaigns: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Phone number shown in review request emails (with UTM tracking)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Current Phone Number</Label>
                    <p className="text-lg font-medium mt-1">
                      {settings?.reviewRequestPhoneFormatted || "Not configured"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      UTM tracking: utm_source=review_request, utm_medium=email, utm_campaign=review_drip
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsPhoneDialogOpen(true)}
                    data-testid="button-update-phone"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Update Phone Number
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Phone Number Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Phone Number</DialogTitle>
            <DialogDescription>
              This will automatically create a tracking number entry with UTM parameters:
              utm_source=review_request, utm_medium=email, utm_campaign=review_drip
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
    </div>
  );
}
