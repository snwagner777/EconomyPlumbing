import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Send,
  Settings,
  Sparkles,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Plus,
  Save
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";

export default function SMSMarketingAdmin() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const { toast } = useToast();

  // Fetch dashboard analytics
  const { data: analytics, isLoading: loadingAnalytics, isError: errorAnalytics } = useQuery({
    queryKey: ['/api/sms/analytics/dashboard'],
    refetchInterval: 30000
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns, isError: errorCampaigns } = useQuery({
    queryKey: ['/api/sms/campaigns']
  });

  // Fetch subscribers
  const { data: subscribers, isLoading: loadingSubscribers, isError: errorSubscribers } = useQuery({
    queryKey: ['/api/sms/subscribers']
  });

  // Fetch AI campaign suggestions
  const { data: suggestions, isLoading: loadingSuggestions, isError: errorSuggestions } = useQuery({
    queryKey: ['/api/sms/campaigns/suggestions'],
    enabled: selectedTab === 'campaigns'
  });

  // Fetch keywords
  const { data: keywords, isLoading: loadingKeywords, isError: errorKeywords } = useQuery({
    queryKey: ['/api/sms/keywords']
  });

  // Show error toasts for failed queries (moved to useEffect to prevent infinite loop)
  useEffect(() => {
    if (errorAnalytics || errorCampaigns || errorSubscribers || errorSuggestions || errorKeywords) {
      toast({
        title: "Error loading data",
        description: "Some data failed to load. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [errorAnalytics, errorCampaigns, errorSubscribers, errorSuggestions, errorKeywords, toast]);

  return (
    <>
      <SEOHead
        title="SMS Marketing Admin - Economy Plumbing Services"
        description="Manage SMS marketing campaigns, subscribers, and automation settings"
      />
      
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              SMS Marketing & Automation
            </h1>
            <p className="text-muted-foreground">
              AI-powered SMS campaigns replacing ServiceTitan Marketing Pro
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                <TrendingUp className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">
                <Send className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="subscribers" data-testid="tab-subscribers">
                <Users className="w-4 h-4 mr-2" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Dashboard */}
            <TabsContent value="dashboard">
              <DashboardTab 
                analytics={analytics} 
                isLoading={loadingAnalytics}
              />
            </TabsContent>

            {/* Tab 2: Campaigns */}
            <TabsContent value="campaigns">
              <CampaignsTab 
                campaigns={campaigns}
                loadingCampaigns={loadingCampaigns}
                suggestions={suggestions}
                loadingSuggestions={loadingSuggestions}
              />
            </TabsContent>

            {/* Tab 3: Subscribers */}
            <TabsContent value="subscribers">
              <SubscribersTab 
                subscribers={subscribers}
                isLoading={loadingSubscribers}
              />
            </TabsContent>

            {/* Tab 4: Settings */}
            <TabsContent value="settings">
              <SettingsTab 
                keywords={keywords}
                isLoading={loadingKeywords}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

// ==========================================
// DASHBOARD TAB
// ==========================================

function DashboardTab({ analytics, isLoading }: { analytics: any; isLoading: boolean }) {
  if (isLoading || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Subscribers",
      value: analytics.totalSubscribers || 0,
      change: `+${analytics.newSubscribersThisPeriod || 0} this period`,
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Messages Sent",
      value: analytics.totalMessagesSent || 0,
      change: `${analytics.deliveryRate ? Math.round(analytics.deliveryRate) : 0}% delivery rate`,
      icon: Send,
      color: "text-green-500"
    },
    {
      title: "Active Campaigns",
      value: analytics.activeCampaigns || 0,
      change: `${analytics.totalCampaigns || 0} total campaigns`,
      icon: MessageSquare,
      color: "text-purple-500"
    },
    {
      title: "Engagement Rate",
      value: `${analytics.engagementRate ? Math.round(analytics.engagementRate) : 0}%`,
      change: "Clicks & conversions",
      icon: TrendingUp,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaign Performance</CardTitle>
          <CardDescription>
            Last 7 days of SMS campaign activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentCampaigns && analytics.recentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentCampaigns.map((campaign: any) => (
                <div key={campaign.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.messagesSent || 0} sent · {campaign.messagesDelivered || 0} delivered
                    </p>
                  </div>
                  <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No recent campaign activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// CAMPAIGNS TAB
// ==========================================

function CampaignsTab({ campaigns, loadingCampaigns, suggestions, loadingSuggestions }: any) {
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const { toast } = useToast();

  // Mutation for sending referral requests
  const sendReferralMutation = useMutation({
    mutationFn: async (data: { minRating: number; limit: number }) => {
      return await apiRequest('POST', '/api/sms/send-referral-requests', data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Referral requests sent!",
        description: `${data.details.sent} SMS messages sent to happy customers. ${data.details.eligible} eligible, ${data.details.subscribed} subscribed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sms/analytics/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send referral requests",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage automated SMS marketing campaigns
          </p>
        </div>
        <Button 
          onClick={() => setShowNewCampaign(true)}
          data-testid="button-create-campaign"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Quick Action: Send Referral Requests */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                SMS Referral Requests
              </CardTitle>
              <CardDescription>
                Send SMS asking happy customers (5-star reviews) to refer friends
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                if (confirm('Send referral request SMS to all customers who left 5-star reviews?')) {
                  sendReferralMutation.mutate({ minRating: 5, limit: 100 });
                }
              }}
              disabled={sendReferralMutation.isPending}
              data-testid="button-send-referral-sms"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendReferralMutation.isPending ? 'Sending...' : 'Send Referral SMS'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-background/80 rounded-lg p-4 border">
            <p className="text-sm mb-2"><strong>How it works:</strong></p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Finds customers who left 5-star reviews</li>
              <li>Only sends to subscribers (TCPA compliant)</li>
              <li>Personalizes message with customer name</li>
              <li>Includes link to refer-a-friend page with $25 incentive</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Campaign Suggestions
          </CardTitle>
          <CardDescription>
            Powered by GPT-4o · Optimized for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSuggestions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : suggestions?.suggestions ? (
            <div className="space-y-4">
              {suggestions.suggestions.map((suggestion: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover-elevate"
                  data-testid={`suggestion-${index}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{suggestion.name}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.goal}</p>
                    </div>
                    <Badge>{suggestion.recommendedTiming}</Badge>
                  </div>
                  <p className="text-sm mb-3">{suggestion.description}</p>
                  <div className="bg-muted/50 rounded p-3 mb-3">
                    <p className="text-sm font-mono">{suggestion.sampleMessage}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setShowNewCampaign(true);
                      }}
                      data-testid={`button-use-template-${index}`}
                    >
                      Use This Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        toast({
                          title: suggestion.name,
                          description: suggestion.description
                        });
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No AI suggestions available at this time
            </p>
          )}
        </CardContent>
      </Card>

      {/* Existing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>
            {loadingCampaigns ? 'Loading...' : `${campaigns?.campaigns?.length || 0} campaigns configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : campaigns?.campaigns && campaigns.campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.campaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                  data-testid={`campaign-${campaign.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'scheduled' ? 'secondary' :
                        'outline'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.campaignType} · Target: {campaign.targetSegment || 'All subscribers'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" data-testid={`button-edit-${campaign.id}`}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost">
                      View Stats
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first SMS campaign using AI suggestions
              </p>
              <Button onClick={() => setShowNewCampaign(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Campaign Dialog */}
      {showNewCampaign && (
        <NewCampaignDialog 
          onClose={() => {
            setShowNewCampaign(false);
            setSelectedSuggestion(null);
          }}
          initialData={selectedSuggestion}
        />
      )}
    </div>
  );
}

// ==========================================
// SUBSCRIBERS TAB
// ==========================================

function SubscribersTab({ subscribers, isLoading }: any) {
  const subscriberList = isLoading ? [] : (subscribers?.subscribers || []);
  const optedInCount = subscriberList.filter((s: any) => s.optedIn).length;
  const optedOutCount = subscriberList.filter((s: any) => !s.optedIn).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Opted In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="count-opted-in">
              {isLoading ? '...' : optedInCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Opted Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="count-opted-out">
              {isLoading ? '...' : optedOutCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="count-total">
              {isLoading ? '...' : subscriberList.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriber List</CardTitle>
          <CardDescription>
            All phone numbers with SMS marketing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : subscriberList.length > 0 ? (
            <div className="space-y-2">
              {subscriberList.map((subscriber: any) => (
                <div
                  key={subscriber.phoneNumber}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                  data-testid={`subscriber-${subscriber.phoneNumber}`}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{subscriber.phoneNumber}</p>
                      {subscriber.customerName && (
                        <p className="text-sm text-muted-foreground">
                          {subscriber.customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subscriber.optedIn ? 'default' : 'secondary'}>
                      {subscriber.optedIn ? 'Opted In' : 'Opted Out'}
                    </Badge>
                    {subscriber.optedInAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(subscriber.optedInAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No subscribers yet</h3>
              <p className="text-sm text-muted-foreground">
                Subscribers will appear here when they opt-in via your forms
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// SETTINGS TAB
// ==========================================

function SettingsTab({ keywords, isLoading }: any) {
  const { toast } = useToast();
  const [masterSwitchEnabled, setMasterSwitchEnabled] = useState(false);
  const [loadingSwitch, setLoadingSwitch] = useState(true);

  // Fetch master switch status on mount
  useEffect(() => {
    const fetchMasterSwitch = async () => {
      try {
        const response = await fetch('/api/sms/settings/master-switch');
        const data = await response.json();
        if (data.success) {
          setMasterSwitchEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch master switch status:', error);
      } finally {
        setLoadingSwitch(false);
      }
    };
    fetchMasterSwitch();
  }, []);

  const handleMasterSwitchToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/sms/settings/master-switch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMasterSwitchEnabled(enabled);
        toast({
          title: enabled ? "SMS Marketing Enabled" : "SMS Marketing Disabled",
          description: enabled 
            ? "Campaigns can now send messages to opted-in subscribers"
            : "All SMS campaigns are paused. No messages will be sent.",
          variant: enabled ? "default" : "destructive"
        });
      } else {
        throw new Error(data.error || 'Failed to update master switch');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update master switch",
        variant: "destructive"
      });
      // Revert the switch on error
      setMasterSwitchEnabled(!enabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Master SMS Marketing Switch
          </CardTitle>
          <CardDescription>
            Control all SMS marketing sends from this master switch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                SMS Marketing System
              </p>
              <p className="text-sm text-muted-foreground">
                {masterSwitchEnabled 
                  ? "✅ Active - Campaigns can send messages"
                  : "⛔ Disabled - All campaigns paused"
                }
              </p>
            </div>
            <Switch
              checked={masterSwitchEnabled}
              onCheckedChange={handleMasterSwitchToggle}
              data-testid="switch-master-sms"
            />
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Keywords</CardTitle>
          <CardDescription>
            Auto-responder keywords for SMS opt-in and opt-out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : keywords?.keywords && keywords.keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.keywords.map((keyword: any) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                  data-testid={`keyword-${keyword.keyword}`}
                >
                  <div>
                    <p className="font-medium uppercase">{keyword.keyword}</p>
                    <p className="text-sm text-muted-foreground">
                      {keyword.action} · {keyword.responseMessage}
                    </p>
                  </div>
                  <Badge variant={keyword.isActive ? 'default' : 'secondary'}>
                    {keyword.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium uppercase">STOP</p>
                  <p className="text-sm text-muted-foreground">
                    opt_out · You've been unsubscribed from SMS marketing
                  </p>
                </div>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium uppercase">START</p>
                  <p className="text-sm text-muted-foreground">
                    opt_in · You're subscribed to Economy Plumbing SMS updates
                  </p>
                </div>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium uppercase">HELP</p>
                  <p className="text-sm text-muted-foreground">
                    info · Text STOP to opt-out, START to opt-in
                  </p>
                </div>
                <Badge>Active</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TCPA Compliance Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            TCPA Compliance Enabled
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Your SMS system meets legal requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="text-blue-900 dark:text-blue-100">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Explicit opt-in required with clear disclosures</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>STOP keyword processing for instant opt-out</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>IP address + timestamp audit trail maintained</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>No messages sent to opted-out numbers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// NEW CAMPAIGN DIALOG
// ==========================================

function NewCampaignDialog({ onClose, initialData }: { onClose: () => void; initialData?: any }) {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState(initialData?.name || '');
  const [campaignType, setCampaignType] = useState(initialData?.campaignType || 'promotional');
  const [message, setMessage] = useState(initialData?.sampleMessage || '');
  const [trackingNumber, setTrackingNumber] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/sms/campaigns', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sms/analytics/dashboard'] });
      toast({
        title: "Campaign created",
        description: "Your SMS campaign has been created successfully"
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('[SMS Campaign Create] Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create campaign",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      name: campaignName,
      campaignType,
      status: 'draft',
      targetSegment: null,
      trackingNumber: trackingNumber.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create New SMS Campaign</CardTitle>
          <CardDescription>
            Set up a new automated SMS marketing campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Spring Maintenance Reminder"
                data-testid="input-campaign-name"
              />
            </div>

            <div>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger id="campaign-type" data-testid="select-campaign-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your SMS message here..."
                rows={4}
                data-testid="textarea-message"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length} / 160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="tracking-number">Campaign Phone Number (Optional)</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="(512) 555-1234"
                data-testid="input-sms-tracking-number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add a tracking phone number to automatically create attribution tracking with UTM parameters
              </p>
              {trackingNumber && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                  <div><span className="font-medium">Channel:</span> sms-{campaignName.toLowerCase().replace(/\s+/g, '-')}</div>
                  <div><span className="font-medium">UTM Source:</span> sms</div>
                  <div><span className="font-medium">UTM Campaign:</span> {campaignName.toLowerCase().replace(/\s+/g, '-')}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-create-campaign-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
