'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, FileText, TrendingUp } from 'lucide-react';
import { ReviewRequestsSection } from './review-requests-section';
import { EmailTemplatesSection } from './email-templates-section';
import { CampaignAnalyticsSection } from './campaign-analytics-section';

export default function EmailMarketingClient() {
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-email-marketing">
          <Mail className="h-8 w-8" />
          Email Marketing Command Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage campaigns, templates, and analytics for Review Requests, Referral Nurture, and Quote Follow-up
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="campaigns" className="gap-2" data-testid="tab-campaigns">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2" data-testid="tab-templates">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Configure and track Review Request, Referral Nurture, and Quote Follow-up email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewRequestsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Create, edit, and manage AI-generated email templates for all campaign types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailTemplatesSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                Track email performance metrics, delivery rates, and engagement across all campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignAnalyticsSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Future Work Notice */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Feature Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Upcoming Features:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Email Scheduling:</strong> Schedule campaigns for future send dates (Task 58)</li>
            <li><strong>Email Preference Center:</strong> Customer subscription management interface (Task 60)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
