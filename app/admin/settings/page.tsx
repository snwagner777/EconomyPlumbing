'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { LogOut, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push('/admin/login');
    }
  }, [authData, router]);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      return await apiRequest('PATCH', '/api/admin/settings', updates);
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'System settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleLogout = async () => {
    await apiRequest('POST', '/api/admin/logout');
    router.push('/admin/login');
  };

  if (!authData?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-settings">System Settings</h1>
            <p className="text-muted-foreground mt-1">Configure site-wide settings and preferences</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin')} data-testid="button-back">
              Back to Admin
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic company details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={settings.company_name || ''}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Economy Plumbing Services"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input
                  id="company_phone"
                  value={settings.company_phone || ''}
                  onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  data-testid="input-company-phone"
                />
              </div>
              <div>
                <Label htmlFor="company_email">Company Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={settings.company_email || ''}
                  onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                  placeholder="info@example.com"
                  data-testid="input-company-email"
                />
              </div>
              <div>
                <Label htmlFor="notification_email">Notification Email</Label>
                <Input
                  id="notification_email"
                  type="email"
                  value={settings.notification_email || ''}
                  onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                  placeholder="admin@example.com"
                  data-testid="input-notification-email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing Settings</CardTitle>
            <CardDescription>Email campaigns and tracking configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email_campaign_from_name">Email From Name</Label>
                <Input
                  id="email_campaign_from_name"
                  value={settings.email_campaign_from_name || ''}
                  onChange={(e) => setSettings({ ...settings, email_campaign_from_name: e.target.value })}
                  placeholder="Economy Plumbing"
                  data-testid="input-email-from-name"
                />
              </div>
              <div>
                <Label htmlFor="default_tracking_number">Default Tracking Number</Label>
                <Input
                  id="default_tracking_number"
                  value={settings.default_tracking_number || ''}
                  onChange={(e) => setSettings({ ...settings, default_tracking_number: e.target.value })}
                  placeholder="(555) 555-5555"
                  data-testid="input-default-tracking"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>Enable or disable automated features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="review_request_enabled">Review Request Campaign</Label>
                <p className="text-sm text-muted-foreground">Automatically send review requests to customers</p>
              </div>
              <Switch
                id="review_request_enabled"
                checked={settings.review_request_enabled ?? true}
                onCheckedChange={(checked) => setSettings({ ...settings, review_request_enabled: checked })}
                data-testid="switch-review-requests"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="referral_nurture_enabled">Referral Nurture Campaign</Label>
                <p className="text-sm text-muted-foreground">Send referral nurture emails to satisfied customers</p>
              </div>
              <Switch
                id="referral_nurture_enabled"
                checked={settings.referral_nurture_enabled ?? true}
                onCheckedChange={(checked) => setSettings({ ...settings, referral_nurture_enabled: checked })}
                data-testid="switch-referral-nurture"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ai_blog_generation_enabled">AI Blog Generation</Label>
                <p className="text-sm text-muted-foreground">Enable AI-powered blog post generation</p>
              </div>
              <Switch
                id="ai_blog_generation_enabled"
                checked={settings.ai_blog_generation_enabled ?? true}
                onCheckedChange={(checked) => setSettings({ ...settings, ai_blog_generation_enabled: checked })}
                data-testid="switch-ai-blog"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="google_drive_sync_enabled">Google Drive Sync</Label>
                <p className="text-sm text-muted-foreground">Sync photos from Google Drive</p>
              </div>
              <Switch
                id="google_drive_sync_enabled"
                checked={settings.google_drive_sync_enabled ?? false}
                onCheckedChange={(checked) => setSettings({ ...settings, google_drive_sync_enabled: checked })}
                data-testid="switch-google-drive"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Configuration</CardTitle>
            <CardDescription>Set prices for services and memberships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referral_credit_amount">Referral Credit Amount ($)</Label>
                <Input
                  id="referral_credit_amount"
                  type="number"
                  value={settings.referral_credit_amount || ''}
                  onChange={(e) => setSettings({ ...settings, referral_credit_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="50"
                  data-testid="input-referral-credit"
                />
              </div>
              <div>
                <Label htmlFor="membership_price">VIP Membership Price ($)</Label>
                <Input
                  id="membership_price"
                  type="number"
                  value={settings.membership_price || ''}
                  onChange={(e) => setSettings({ ...settings, membership_price: parseFloat(e.target.value) || 0 })}
                  placeholder="199"
                  data-testid="input-membership-price"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending || isLoading} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
