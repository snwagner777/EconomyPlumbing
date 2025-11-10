'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Send, Inbox, TrendingUp, AlertCircle } from 'lucide-react';

type SMSStats = {
  period: { days: number; startDate: string };
  contacts: { total: number; optedIn: number };
  campaigns: { total: number; active: number };
  messages: { sent: number; delivered: number; failed: number; replies: number };
  rates: { delivery: number; reply: number };
  inbox: { unreadConversations: number };
};

export default function SMSMarketingPage() {
  const [timeRange, setTimeRange] = useState(30);

  // Fetch stats
  const { data: stats, isLoading } = useQuery<SMSStats>({
    queryKey: ['/api/admin/sms/stats', timeRange],
    enabled: true,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            SMS Marketing
          </h1>
          <p className="text-muted-foreground">
            Manage SMS campaigns, contacts, and 2-way conversations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/sms/inbox">
              <MessageSquare className="w-4 h-4 mr-2" />
              Inbox ({stats?.inbox?.unreadConversations ?? 0})
            </a>
          </Button>
          <Button data-testid="button-new-campaign" asChild>
            <a href="/admin/sms/campaigns">
              <Send className="w-4 h-4 mr-2" />
              New Campaign
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted-In Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-opted-in-contacts">
              {isLoading ? '...' : (stats?.contacts?.optedIn?.toLocaleString() ?? '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.contacts?.total?.toLocaleString() ?? '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-campaigns">
              {isLoading ? '...' : (stats?.campaigns?.active ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.campaigns?.total ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-messages-sent">
              {isLoading ? '...' : (stats?.messages?.sent?.toLocaleString() ?? '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-delivery-rate">
              {isLoading ? '...' : `${stats?.rates?.delivery ?? 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Reply rate: {stats?.rates?.reply ?? 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Delivery and engagement stats for the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Delivered</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  {stats?.messages?.delivered?.toLocaleString() ?? '0'}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: stats
                      ? `${((stats.messages?.delivered ?? 0) / (stats.messages?.sent ?? 1)) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Replies</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  {stats?.messages?.replies?.toLocaleString() ?? '0'}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: stats
                      ? `${((stats.messages?.replies ?? 0) / (stats.messages?.sent ?? 1)) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Failed</span>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                  {stats?.messages?.failed?.toLocaleString() ?? '0'}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: stats
                      ? `${((stats.messages?.failed ?? 0) / (stats.messages?.sent ?? 1)) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            Contacts
          </TabsTrigger>
          <TabsTrigger value="inbox" data-testid="tab-inbox">
            Inbox
            {stats && stats.inbox.unreadConversations > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.inbox.unreadConversations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Campaigns</CardTitle>
              <CardDescription>
                Create and manage broadcast and drip SMS campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Create your first SMS campaign to send messages to your contacts
                </p>
                <Button data-testid="button-create-first-campaign">
                  <Send className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Contacts</CardTitle>
              <CardDescription>
                Manage your SMS contact list and opt-in status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {stats?.contacts?.total ?? 0} total contacts
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {stats?.contacts?.optedIn ?? 0} opted-in and ready to receive messages
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-import-contacts">
                    Import Contacts
                  </Button>
                  <Button data-testid="button-add-contact">
                    <Users className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>2-Way SMS Inbox</CardTitle>
              <CardDescription>
                View and respond to incoming text messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {stats?.inbox?.unreadConversations ?? 0} unread conversations
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Manage customer conversations and respond to text messages
                </p>
                <Button data-testid="button-view-inbox">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Inbox
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Opt-In Migration */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-start gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-base">Transactional SMS Enrollment</CardTitle>
              <CardDescription>
                Enroll existing customers for service updates and transactional messaging
              </CardDescription>
            </div>
            <Button
              data-testid="button-bulk-opt-in"
              onClick={async () => {
                if (!confirm('This will enroll all active ServiceTitan customers for transactional SMS (appointment reminders, service updates, portal invitations). Existing opt-outs preserved. Continue?')) {
                  return;
                }
                
                try {
                  const response = await fetch('/api/admin/sms/bulk-opt-in', {
                    method: 'POST',
                  });
                  const data = await response.json();
                  
                  if (response.ok) {
                    alert(`Success! Enrolled ${data.stats.optedIn} contacts for transactional messaging. ${data.stats.optedOut} opt-outs preserved.`);
                    window.location.reload();
                  } else {
                    alert(`Error: ${data.error}`);
                  }
                } catch (error) {
                  alert('Failed to execute migration');
                }
              }}
            >
              Enroll Customers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Transactional Messages:</strong> Appointment reminders, service updates, customer portal invitations, referral program announcements
          </p>
          <p>
            ✓ Uses existing customer relationship (TCPA-compliant for transactional messaging)
          </p>
          <p>
            ✓ All messages include "Reply STOP to opt-out" footer
          </p>
          <p>
            ✓ Automatic opt-out sync via webhook
          </p>
          <p>
            ✓ Preserves existing opt-outs (will NOT re-enroll)
          </p>
          <p className="text-muted-foreground text-xs">
            Run once to sync ServiceTitan customers to SMS contacts
          </p>
        </CardContent>
      </Card>

      {/* TCPA Compliance Notice */}
      <Card className="border-yellow-200 dark:border-yellow-900">
        <CardHeader>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <CardTitle className="text-base">TCPA Compliance</CardTitle>
              <CardDescription>
                All SMS campaigns must comply with TCPA regulations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            ✓ Only send to opted-in contacts
          </p>
          <p>
            ✓ Honor opt-out requests immediately
          </p>
          <p>
            ✓ Include opt-out instructions in campaigns
          </p>
          <p className="text-muted-foreground text-xs">
            SimpleTexting automatically handles STOP/START keywords
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
