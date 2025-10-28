import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Mail, Settings } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function EmailPreferences() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch current preferences
  const { data, isLoading, error } = useQuery({
    queryKey: ['emailPreferences', token],
    queryFn: async () => {
      const res = await fetch(`/api/email-preferences/${token}`);
      if (!res.ok) {
        throw new Error('Preferences not found');
      }
      return res.json();
    },
    enabled: !!token,
  });

  const preferences = data?.preferences;

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/email-preferences/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailPreferences', token] });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 5000);
    },
  });

  // Unsubscribe all mutation
  const unsubscribeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email-preferences/${token}/unsubscribe-all`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Unsubscribe failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailPreferences', token] });
      setUpdateSuccess(true);
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    const updates = { [field]: value };
    updateMutation.mutate(updates);
  };

  const handleUnsubscribeAll = () => {
    if (confirm('Are you sure you want to unsubscribe from all emails? You will only receive transactional emails (receipts, confirmations).')) {
      unsubscribeAllMutation.mutate();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>The email preferences link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your preferences...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Preferences Not Found</CardTitle>
            <CardDescription>
              We couldn't find your email preferences. The link may have expired or been used already.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Email Preferences</h1>
          <p className="text-muted-foreground">
            Manage your email subscriptions for {preferences.email}
          </p>
        </div>

        {updateSuccess && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Your preferences have been updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Types
            </CardTitle>
            <CardDescription>
              Choose which emails you'd like to receive from Economy Plumbing Services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Marketing Emails */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="marketing" className="text-base font-medium">
                  Marketing & Promotions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Special offers, newsletters, and seasonal tips
                </p>
              </div>
              <Switch
                id="marketing"
                data-testid="switch-marketing"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => handleToggle('marketingEmails', checked)}
                disabled={updateMutation.isPending}
              />
            </div>

            <Separator />

            {/* Review Requests */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="reviews" className="text-base font-medium">
                  Review Requests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Invitations to share feedback about our service
                </p>
              </div>
              <Switch
                id="reviews"
                data-testid="switch-reviews"
                checked={preferences.reviewRequests}
                onCheckedChange={(checked) => handleToggle('reviewRequests', checked)}
                disabled={updateMutation.isPending}
              />
            </div>

            <Separator />

            {/* Referral Emails */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="referrals" className="text-base font-medium">
                  Referral Program
                </Label>
                <p className="text-sm text-muted-foreground">
                  Earn rewards by referring friends and family
                </p>
              </div>
              <Switch
                id="referrals"
                data-testid="switch-referrals"
                checked={preferences.referralEmails}
                onCheckedChange={(checked) => handleToggle('referralEmails', checked)}
                disabled={updateMutation.isPending}
              />
            </div>

            <Separator />

            {/* Service Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="reminders" className="text-base font-medium">
                  Service Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Maintenance reminders and follow-ups
                </p>
              </div>
              <Switch
                id="reminders"
                data-testid="switch-reminders"
                checked={preferences.serviceReminders}
                onCheckedChange={(checked) => handleToggle('serviceReminders', checked)}
                disabled={updateMutation.isPending}
              />
            </div>

            <Separator />

            {/* Unsubscribe All */}
            <div className="pt-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Unsubscribe from All Emails</h3>
                  <p className="text-sm text-muted-foreground">
                    Stop receiving all marketing, review, referral, and service reminder emails.
                    You'll only receive transactional emails (receipts, confirmations).
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleUnsubscribeAll}
                  disabled={unsubscribeAllMutation.isPending || preferences.transactionalOnly}
                  data-testid="button-unsubscribe-all"
                >
                  {preferences.transactionalOnly ? 'Already Unsubscribed' : 'Unsubscribe from All'}
                </Button>
              </div>
            </div>

            {preferences.transactionalOnly && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  You're currently unsubscribed from all marketing emails. You'll only receive transactional emails like receipts and confirmations.
                  You can re-enable specific email types above at any time.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Questions? Contact us at info@plumbersthatcare.com</p>
          <p className="mt-2">Economy Plumbing Services - Serving Austin & Central Texas</p>
        </div>
      </div>
    </div>
  );
}
