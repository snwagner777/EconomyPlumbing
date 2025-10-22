import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MessageSquare,
  DollarSign,
  Target,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Eye,
  MousePointer,
  UserCheck,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

// Mock data for demonstration
const mockCampaignData = {
  overview: {
    totalCampaigns: 12,
    activeCampaigns: 5,
    totalSent: 45678,
    totalRevenue: 234567,
    avgOpenRate: 24.5,
    avgClickRate: 3.2,
    avgConversionRate: 1.8,
  },
  emailMetrics: {
    sent: 45678,
    delivered: 44890,
    opened: 11222,
    clicked: 1463,
    unsubscribed: 89,
    bounced: 788,
    complained: 12,
  },
  smsMetrics: {
    sent: 8934,
    delivered: 8756,
    clicked: 892,
    replied: 234,
    optedOut: 23,
    failed: 178,
  },
  campaigns: [
    {
      id: "1",
      name: "Spring HVAC Maintenance",
      type: "email",
      status: "active",
      sent: 5234,
      opened: 1823,
      clicked: 234,
      conversions: 45,
      revenue: 23456,
      openRate: 34.8,
      clickRate: 4.5,
      conversionRate: 1.9,
      lastSent: new Date("2024-03-15"),
    },
    {
      id: "2",
      name: "Water Heater Upgrade Offer",
      type: "email",
      status: "completed",
      sent: 3456,
      opened: 987,
      clicked: 123,
      conversions: 28,
      revenue: 18234,
      openRate: 28.6,
      clickRate: 3.6,
      conversionRate: 2.3,
      lastSent: new Date("2024-03-10"),
    },
    {
      id: "3",
      name: "Emergency Service Reminder",
      type: "sms",
      status: "active",
      sent: 2345,
      delivered: 2298,
      clicked: 234,
      conversions: 67,
      revenue: 8923,
      clickRate: 10.2,
      conversionRate: 2.9,
      lastSent: new Date("2024-03-18"),
    },
  ],
  timeSeriesData: [
    { date: "Mar 1", emails: 1234, sms: 234, revenue: 5678 },
    { date: "Mar 5", emails: 1456, sms: 312, revenue: 6234 },
    { date: "Mar 10", emails: 1823, sms: 298, revenue: 7892 },
    { date: "Mar 15", emails: 2134, sms: 423, revenue: 9234 },
    { date: "Mar 20", emails: 1987, sms: 387, revenue: 8567 },
  ],
  segmentPerformance: [
    { segment: "VIP Members", openRate: 42, clickRate: 6.2, conversion: 3.4 },
    { segment: "New Customers", openRate: 28, clickRate: 3.8, conversion: 2.1 },
    { segment: "Inactive", openRate: 18, clickRate: 2.1, conversion: 0.8 },
    { segment: "High Value", openRate: 38, clickRate: 5.6, conversion: 2.9 },
  ],
  revenueAttribution: [
    { source: "Email - Promotional", value: 45678, percentage: 35 },
    { source: "SMS - Service Reminders", value: 34567, percentage: 26 },
    { source: "Email - Win Back", value: 23456, percentage: 18 },
    { source: "SMS - Emergency", value: 19234, percentage: 15 },
    { source: "Email - Review Request", value: 8234, percentage: 6 },
  ],
};

const CHART_COLORS = ["#0066FF", "#00D4FF", "#FF6B6B", "#4ECDC4", "#FFD93D"];

export default function CampaignAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [campaignType, setCampaignType] = useState("all");
  
  // In a real implementation, this would fetch from the API
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/analytics/campaigns", dateRange, campaignType],
    queryFn: async () => {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCampaignData;
    },
  });

  const handleExportData = () => {
    // In production, this would trigger a CSV/Excel download
    console.log("Exporting analytics data...");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and ROI across all marketing campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} data-testid="button-export-data">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview.totalSent.toLocaleString()}
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              <span className="text-green-600">+12%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              <span className="text-green-600">+23%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview.avgOpenRate}%
            </div>
            <Progress 
              value={analytics?.overview.avgOpenRate} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Industry avg: 21.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview.avgConversionRate}%
            </div>
            <Progress 
              value={analytics?.overview.avgConversionRate * 10} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Goal: 2.5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Email Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Email Funnel</CardTitle>
                <CardDescription>
                  Email campaign performance funnel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sent</span>
                      <span className="font-medium">
                        {analytics?.emailMetrics.sent.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivered</span>
                      <span className="font-medium">
                        {analytics?.emailMetrics.delivered.toLocaleString()} (98.3%)
                      </span>
                    </div>
                    <Progress value={98.3} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Opened</span>
                      <span className="font-medium">
                        {analytics?.emailMetrics.opened.toLocaleString()} (24.5%)
                      </span>
                    </div>
                    <Progress value={24.5} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Clicked</span>
                      <span className="font-medium">
                        {analytics?.emailMetrics.clicked.toLocaleString()} (3.2%)
                      </span>
                    </div>
                    <Progress value={3.2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMS Performance */}
            <Card>
              <CardHeader>
                <CardTitle>SMS Performance</CardTitle>
                <CardDescription>
                  Text message campaign metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sent</span>
                      <span className="font-medium">
                        {analytics?.smsMetrics.sent.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivered</span>
                      <span className="font-medium">
                        {analytics?.smsMetrics.delivered.toLocaleString()} (98%)
                      </span>
                    </div>
                    <Progress value={98} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Clicked</span>
                      <span className="font-medium">
                        {analytics?.smsMetrics.clicked.toLocaleString()} (10%)
                      </span>
                    </div>
                    <Progress value={10} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Replied</span>
                      <span className="font-medium">
                        {analytics?.smsMetrics.replied.toLocaleString()} (2.6%)
                      </span>
                    </div>
                    <Progress value={2.6} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Activity Over Time</CardTitle>
              <CardDescription>
                Email and SMS volume trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="emails"
                    stackId="1"
                    stroke="#0066FF"
                    fill="#0066FF"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="sms"
                    stackId="1"
                    stroke="#00D4FF"
                    fill="#00D4FF"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>
                    Performance metrics for all campaigns
                  </CardDescription>
                </div>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger className="w-[140px]" data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">
                            {campaign.type === "email" ? (
                              <Mail className="w-3 h-3 mr-1" />
                            ) : (
                              <MessageSquare className="w-3 h-3 mr-1" />
                            )}
                            {campaign.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Last sent {formatDistanceToNow(campaign.lastSent, { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="text-lg font-semibold">
                          {campaign.sent.toLocaleString()}
                        </p>
                      </div>
                      {campaign.type === "email" && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Open Rate</p>
                            <p className="text-lg font-semibold">{campaign.openRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Click Rate</p>
                            <p className="text-lg font-semibold">{campaign.clickRate}%</p>
                          </div>
                        </>
                      )}
                      {campaign.type === "sms" && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Delivered</p>
                            <p className="text-lg font-semibold">{campaign.delivered?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Click Rate</p>
                            <p className="text-lg font-semibold">{campaign.clickRate}%</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-lg font-semibold">{campaign.conversions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${campaign.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Performance</CardTitle>
              <CardDescription>
                Engagement metrics by customer segment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.segmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" fill="#0066FF" name="Open Rate %" />
                  <Bar dataKey="clickRate" fill="#00D4FF" name="Click Rate %" />
                  <Bar dataKey="conversion" fill="#4ECDC4" name="Conversion %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {analytics?.segmentPerformance.map((segment) => (
              <Card key={segment.segment}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {segment.segment}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Open Rate</span>
                      <span className="font-medium">{segment.openRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Click Rate</span>
                      <span className="font-medium">{segment.clickRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium text-green-600">
                        {segment.conversion}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Attribution</CardTitle>
                <CardDescription>
                  Revenue breakdown by campaign source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.revenueAttribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics?.revenueAttribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Detailed revenue by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.revenueAttribution.map((source, index) => (
                    <div key={source.source}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-sm font-semibold">
                          ${source.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={source.percentage} 
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {source.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Daily revenue from marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4ECDC4"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* A/B Test Results Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>A/B Test Update:</strong> The "Water Heater Upgrade" campaign variant B is outperforming 
          variant A by 23% in click-through rate. Consider applying the winning template to future campaigns.
        </AlertDescription>
      </Alert>
    </div>
  );
}