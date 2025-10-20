import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Link } from "wouter";
import {
  TrendingUp,
  MessageSquare,
  Mail,
  Star,
  Users,
  Send,
  Eye,
  MousePointer,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";

export default function MarketingOverview() {
  // Fetch SMS analytics
  const { data: smsAnalytics, isLoading: loadingSMS } = useQuery<any>({
    queryKey: ['/api/sms/analytics/dashboard'],
  });

  // Fetch review campaigns
  const { data: reviewCampaignsData, isLoading: loadingReviews } = useQuery<any>({
    queryKey: ['/api/admin/review-campaigns'],
  });

  // Calculate totals
  const smsStats: any = smsAnalytics?.stats || {};
  
  // Aggregate review campaign stats
  const reviewCampaigns = reviewCampaignsData?.campaigns || [];
  const reviewStats = {
    totalSent: reviewCampaigns.reduce((sum: number, c: any) => sum + (c.totalSent || 0), 0),
    totalClicks: reviewCampaigns.reduce((sum: number, c: any) => sum + (c.totalClicks || 0), 0),
    totalReviewsCompleted: reviewCampaigns.reduce((sum: number, c: any) => sum + (c.totalReviewsCompleted || 0), 0),
  };

  const totalReachLast30Days = (smsStats.messagesSent || 0) + (reviewStats.totalSent || 0);
  const totalEngagement = (smsStats.clicks || 0) + (reviewStats.totalClicks || 0);
  const totalConversions = (smsStats.conversions || 0) + (reviewStats.totalReviewsCompleted || 0);

  // Calculate ROI savings (compared to ServiceTitan Marketing Pro + NiceJob)
  const annualSavings = 4980; // $3,240 + $1,740
  const monthlySavings = Math.round(annualSavings / 12);

  return (
    <>
      <SEOHead
        title="Marketing Overview - Admin Dashboard"
        description="Unified marketing automation dashboard for SMS, email, and review management"
      />

      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              Marketing Automation Overview
            </h1>
            <p className="text-muted-foreground">
              Complete view of SMS, email, and review marketing systems
            </p>
          </div>

          {/* ROI Banner */}
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    Cost Savings vs. Third-Party Solutions
                  </h3>
                  <p className="text-muted-foreground">
                    Replacing ServiceTitan Marketing Pro + NiceJob
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600" data-testid="text-monthly-savings">
                    ${monthlySavings}/mo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${annualSavings.toLocaleString()}/year saved
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Metrics */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  Total Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-reach">
                  {loadingSMS || loadingReviews ? '...' : totalReachLast30Days.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-blue-500" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-engagement">
                  {loadingSMS || loadingReviews ? '...' : totalEngagement.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalReachLast30Days > 0 
                    ? `${((totalEngagement / totalReachLast30Days) * 100).toFixed(1)}% rate`
                    : '0% rate'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-conversions">
                  {loadingSMS || loadingReviews ? '...' : totalConversions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalReachLast30Days > 0 
                    ? `${((totalConversions / totalReachLast30Days) * 100).toFixed(1)}% rate`
                    : '0% rate'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Active Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-subscribers">
                  {loadingSMS ? '...' : (smsStats.activeSubscribers || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">SMS opt-ins</p>
              </CardContent>
            </Card>
          </div>

          {/* System Breakdown */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {/* SMS Marketing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      SMS Marketing
                    </CardTitle>
                    <CardDescription>AI-powered campaigns</CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Messages Sent</span>
                  <span className="font-semibold" data-testid="text-sms-sent">
                    {loadingSMS ? '...' : (smsStats.messagesSent || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivery Rate</span>
                  <span className="font-semibold">
                    {loadingSMS ? '...' : `${(smsStats.deliveryRate || 0).toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Campaigns</span>
                  <span className="font-semibold">
                    {loadingSMS ? '...' : (smsStats.activeCampaigns || 0)}
                  </span>
                </div>
                <Link href="/admin/sms-marketing" data-testid="link-sms-marketing">
                  <Button variant="outline" className="w-full mt-2">
                    View SMS Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Review Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Review Management
                    </CardTitle>
                    <CardDescription>AI-powered reputation system</CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Requests Sent</span>
                  <span className="font-semibold" data-testid="text-review-requests-sent">
                    {loadingReviews ? '...' : reviewStats.totalSent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">
                    {loadingReviews 
                      ? '...' 
                      : `${reviewStats.totalSent > 0 
                          ? ((reviewStats.totalReviewsCompleted / reviewStats.totalSent) * 100).toFixed(1) 
                          : 0}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Campaigns</span>
                  <span className="font-semibold">
                    {loadingReviews ? '...' : reviewCampaigns.length}
                  </span>
                </div>
                <Link href="/admin/reviews" data-testid="link-reviews">
                  <Button variant="outline" className="w-full mt-2">
                    View Reviews Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Status
              </CardTitle>
              <CardDescription>Current operational status of all marketing systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">SMS Marketing System</p>
                      <p className="text-sm text-muted-foreground">4-tab admin, AI campaigns, TCPA compliance</p>
                    </div>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Email Review Requests</p>
                      <p className="text-sm text-muted-foreground">AI drip campaigns, multi-channel coordination</p>
                    </div>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Negative Review Alerts</p>
                      <p className="text-sm text-muted-foreground">Email + SMS notifications for low ratings</p>
                    </div>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">SMS Referral Requests</p>
                      <p className="text-sm text-muted-foreground">Automated referral campaigns to happy customers</p>
                    </div>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Customer Engagement Tracking</p>
                      <p className="text-sm text-muted-foreground">Multi-channel journey visualization</p>
                    </div>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
