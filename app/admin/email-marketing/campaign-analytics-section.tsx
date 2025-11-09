'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function CampaignAnalyticsSection() {
  const [dateRange, setDateRange] = useState<string>('30');

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/overview', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/overview?days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: byTypeData, isLoading: byTypeLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/by-type', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/by-type?days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/recent', '50', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/recent?limit=50&days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  if (overviewLoading || byTypeLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const overview = overviewData || {};
  const byType = byTypeData?.stats || [];
  const recent = recentData?.emails || [];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaign Analytics</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="date-range-select" className="text-sm text-muted-foreground">Time Period:</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="date-range-select" className="w-[180px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Campaign Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Review Requests */}
          <Card data-testid="card-review-requests-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Review Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.reviewRequests?.total || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.reviewRequests?.completed || 0} completed · {overview.reviewRequests?.paused || 0} paused
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                    <div className="text-lg font-semibold">{overview.reviewRequests?.openRate || '0.0'}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                    <div className="text-lg font-semibold">{overview.reviewRequests?.clickRate || '0.0'}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Nurture */}
          <Card data-testid="card-referral-nurture-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Referral Nurture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.referralNurture?.total || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.referralNurture?.completed || 0} completed · {overview.referralNurture?.paused || 0} paused
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                    <div className="text-lg font-semibold">{overview.referralNurture?.openRate || '0.0'}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                    <div className="text-lg font-semibold">{overview.referralNurture?.clickRate || '0.0'}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Email Stats */}
          <Card data-testid="card-email-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overall Email Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.emailStats?.totalSent || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.emailStats?.totalOpened || 0} opened · {overview.emailStats?.totalClicked || 0} clicked
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Bounced</div>
                    <div className="text-lg font-semibold text-destructive">{overview.emailStats?.totalBounced || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Complaints</div>
                    <div className="text-lg font-semibold text-destructive">{overview.emailStats?.totalComplained || 0}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats by Campaign Type */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance by Campaign Type</h2>
        <Card data-testid="card-campaign-type-stats">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Type</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead className="text-right">Avg. Time to Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byType.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No campaign data in the last 30 days
                    </TableCell>
                  </TableRow>
                ) : (
                  byType.map((stat: any) => (
                    <TableRow key={stat.campaignType}>
                      <TableCell className="font-medium">
                        {stat.campaignType === 'review_request' && 'Review Request'}
                        {stat.campaignType === 'referral_nurture' && 'Referral Nurture'}
                        {stat.campaignType === 'quote_followup' && 'Quote Follow-up'}
                      </TableCell>
                      <TableCell className="text-right">{stat.totalSent}</TableCell>
                      <TableCell className="text-right">{stat.openRate}%</TableCell>
                      <TableCell className="text-right">{stat.clickRate}%</TableCell>
                      <TableCell className="text-right">
                        {stat.avgTimeToOpen ? `${stat.avgTimeToOpen}h` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Email Activity</h2>
        <Card data-testid="card-recent-activity">
          <CardContent className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Email #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No recent email activity
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((email: any) => (
                      <TableRow key={email.id}>
                        <TableCell>{email.recipientEmail}</TableCell>
                        <TableCell>
                          {email.campaignType === 'review_request' && 'Review Request'}
                          {email.campaignType === 'referral_nurture' && 'Referral Nurture'}
                          {email.campaignType === 'quote_followup' && 'Quote Follow-up'}
                        </TableCell>
                        <TableCell>Email {email.emailNumber}</TableCell>
                        <TableCell>
                          <Badge variant={
                            email.openedAt ? 'default' : 
                            email.bouncedAt ? 'destructive' : 
                            'secondary'
                          }>
                            {email.complainedAt ? 'Complaint' :
                             email.bouncedAt ? 'Bounced' :
                             email.clickedAt ? 'Clicked' :
                             email.openedAt ? 'Opened' :
                             'Sent'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
