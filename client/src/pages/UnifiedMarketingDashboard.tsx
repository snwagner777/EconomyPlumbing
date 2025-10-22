import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, Users, Mail, MessageSquare, DollarSign, TrendingUp,
  Clock, CheckCircle, AlertCircle, PlayCircle, PauseCircle,
  Target, Zap, FileText, Calendar, BarChart, RefreshCw,
  Sparkles, Eye, Settings, Filter, Search, Plus
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MarketingMetrics {
  totalSegments: number;
  activeSegments: number;
  totalCustomers: number;
  emailCampaigns: {
    total: number;
    active: number;
    pendingApproval: number;
    sent: number;
    openRate: number;
    clickRate: number;
  };
  smsCampaigns: {
    total: number;
    active: number;
    pendingApproval: number;
    sent: number;
    deliveryRate: number;
    responseRate: number;
  };
  revenue: {
    attributed: number;
    potential: number;
    roi: number;
  };
  unsoldEstimates: {
    total: number;
    value: number;
    conversionRate: number;
  };
}

interface ActiveCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'review' | 'newsletter';
  status: 'active' | 'paused' | 'pending_approval' | 'scheduled';
  segmentName: string;
  recipientCount: number;
  sentCount: number;
  performance: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
  };
  nextSendDate?: string;
  createdAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  lastRun?: string;
  executionCount: number;
}

export default function UnifiedMarketingDashboard() {
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState<'overview' | 'campaigns' | 'segments' | 'automation'>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Fetch marketing metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<MarketingMetrics>({
    queryKey: ['/api/admin/marketing/metrics'],
  });

  // Fetch active campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<{ campaigns: ActiveCampaign[] }>({
    queryKey: ['/api/admin/marketing/active-campaigns'],
  });

  // Fetch automation rules
  const { data: automationRules } = useQuery<{ rules: AutomationRule[] }>({
    queryKey: ['/api/admin/marketing/automation-rules'],
  });

  // Mutation for scanning unsold estimates
  const scanEstimates = useMutation({
    mutationFn: async () => {
      setIsScanning(true);
      setScanProgress(25);
      
      const response = await apiRequest('POST', '/api/admin/remarketing/scan-estimates');
      const result = await response.json();
      
      setScanProgress(100);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Remarketing Scan Complete",
        description: `Created ${data.campaignsCreated} campaigns for ${data.totalEstimates} estimates worth $${(data.totalValue / 100).toLocaleString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/marketing'] });
      setIsScanning(false);
      setScanProgress(0);
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Failed to scan unsold estimates",
        variant: "destructive"
      });
      setIsScanning(false);
      setScanProgress(0);
    }
  });

  // Mutation for running AI analysis
  const runAIAnalysis = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/ai-segmentation/analyze');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Analysis Complete",
        description: `Identified ${data.analysis.opportunitiesFound} marketing opportunities`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/marketing'] });
    }
  });

  const activeCampaigns = campaigns?.campaigns.filter(c => c.status === 'active') || [];
  const pendingCampaigns = campaigns?.campaigns.filter(c => c.status === 'pending_approval') || [];
  const activeAutomations = automationRules?.rules.filter(r => r.status === 'active') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Command Center</h1>
          <p className="text-muted-foreground">
            AI-powered marketing automation and campaign management
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => runAIAnalysis.mutate()}
            disabled={runAIAnalysis.isPending}
            data-testid="button-run-ai-analysis"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Analysis
          </Button>
          <Button
            onClick={() => scanEstimates.mutate()}
            disabled={isScanning}
            data-testid="button-scan-estimates"
          >
            <Search className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan Unsold Estimates'}
          </Button>
        </div>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scanning for Remarketing Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={scanProgress} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Analyzing unsold estimates and generating targeted campaigns...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals Alert */}
      {pendingCampaigns.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{pendingCampaigns.length} campaigns</span> awaiting your approval
            <Button
              variant="ghost"
              size="sm"
              className="ml-3 h-auto p-0 text-primary hover:bg-transparent underline underline-offset-4"
              onClick={() => setSelectedView('campaigns')}
              data-testid="button-review-campaigns"
            >
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {!metricsLoading && metrics && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeSegments}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalCustomers.toLocaleString()} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.emailCampaigns.openRate}%</div>
              <p className="text-xs text-muted-foreground">
                Open rate ({metrics.emailCampaigns.sent} sent)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Performance</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.smsCampaigns.deliveryRate}%</div>
              <p className="text-xs text-muted-foreground">
                Delivery rate ({metrics.smsCampaigns.sent} sent)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics.revenue.attributed / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.revenue.roi}% ROI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsold Estimates</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.unsoldEstimates.total}</div>
              <p className="text-xs text-muted-foreground">
                ${(metrics.unsoldEstimates.value / 100).toLocaleString()} potential
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(v: any) => setSelectedView(v)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Users className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Currently running marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {activeCampaigns.map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {campaign.type === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                          {campaign.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-500" />}
                          {campaign.type === 'newsletter' && <FileText className="w-4 h-4 text-purple-500" />}
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.segmentName} • {campaign.recipientCount} recipients
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">
                          {campaign.performance.openRate || campaign.performance.conversionRate || 0}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setSelectedView('campaigns')}>
                  View All Campaigns
                </Button>
              </CardFooter>
            </Card>

            {/* Automation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>Active marketing automation</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {activeAutomations.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="font-medium text-sm">{rule.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {rule.trigger} → {rule.action}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{rule.executionCount} runs</Badge>
                          {rule.lastRun && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(rule.lastRun), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setSelectedView('automation')}>
                  Manage Automation
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common marketing tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-create-email">
                  <Mail className="w-5 h-5 mb-2" />
                  <span className="text-xs">Create Email</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-create-sms">
                  <MessageSquare className="w-5 h-5 mb-2" />
                  <span className="text-xs">Create SMS</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-new-segment">
                  <Users className="w-5 h-5 mb-2" />
                  <span className="text-xs">New Segment</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-view-reports">
                  <BarChart className="w-5 h-5 mb-2" />
                  <span className="text-xs">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Marketing Campaigns</CardTitle>
                  <CardDescription>Email, SMS, and newsletter campaigns</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns?.campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {campaign.type === 'email' && <Mail className="w-5 h-5 text-blue-500" />}
                          {campaign.type === 'sms' && <MessageSquare className="w-5 h-5 text-green-500" />}
                          {campaign.type === 'newsletter' && <FileText className="w-5 h-5 text-purple-500" />}
                          {campaign.type === 'review' && <Target className="w-5 h-5 text-orange-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium">{campaign.name}</h4>
                            <Badge
                              variant={
                                campaign.status === 'active' ? 'default' :
                                campaign.status === 'pending_approval' ? 'secondary' :
                                campaign.status === 'scheduled' ? 'outline' : 'secondary'
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {campaign.segmentName} • {campaign.recipientCount} recipients
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {campaign.sentCount} sent
                            </span>
                            {campaign.performance.openRate !== undefined && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {campaign.performance.openRate}% opened
                              </span>
                            )}
                            {campaign.performance.clickRate !== undefined && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {campaign.performance.clickRate}% clicked
                              </span>
                            )}
                            {campaign.nextSendDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {format(new Date(campaign.nextSendDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Toggle campaign status
                          }}
                        >
                          {campaign.status === 'active' ? 
                            <PauseCircle className="w-4 h-4" /> : 
                            <PlayCircle className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>AI-generated and manual segments</CardDescription>
                </div>
                <Button size="sm" onClick={() => runAIAnalysis.mutate()}>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Segments
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Segment management interface</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Marketing Automation</CardTitle>
                  <CardDescription>Automated campaigns and triggers</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Automation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Remarketing Settings */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-orange-500" />
                      <div>
                        <h4 className="font-medium">Unsold Estimate Remarketing</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically follow up on estimates that haven't converted
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Scan Frequency</p>
                      <p className="font-medium">Daily at 9 AM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Follow-up Delay</p>
                      <p className="font-medium">3 days after estimate</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Follow-ups</p>
                      <p className="font-medium">3 per estimate</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => scanEstimates.mutate()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Scan Now
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Other Automation Rules */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Active Automation Rules</h4>
                  <div className="space-y-2">
                    {automationRules?.rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium">{rule.name}</p>
                            <p className="text-xs text-muted-foreground">
                              When: {rule.trigger} • Then: {rule.action}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {rule.executionCount} runs
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Toggle automation status
                            }}
                          >
                            {rule.status === 'active' ? 
                              <PauseCircle className="w-4 h-4" /> : 
                              <PlayCircle className="w-4 h-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}