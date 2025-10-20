import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailPreferences } from "@shared/schema";

export default function Unsubscribe() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Fetch email preferences
  const { data: preferences, isLoading } = useQuery<EmailPreferences>({
    queryKey: [`/api/email-preferences/${encodeURIComponent(email)}`],
    enabled: emailSubmitted && !!email,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<EmailPreferences>) => {
      const res = await apiRequest("PUT", "/api/email-preferences", { email, ...prefs });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your email preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email-preferences/${encodeURIComponent(email)}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unsubscribe from all mutation
  const unsubscribeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/unsubscribe-all", { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Unsubscribed Successfully",
        description: "You have been unsubscribed from all email communications.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email-preferences/${encodeURIComponent(email)}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message || "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setEmailSubmitted(true);
    }
  };

  const handleToggle = (category: keyof EmailPreferences, value: boolean) => {
    updatePreferencesMutation.mutate({ [category]: value });
  };

  const handleUnsubscribeAll = () => {
    if (window.confirm("Are you sure you want to unsubscribe from all emails? You will no longer receive any communications from us.")) {
      unsubscribeAllMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Email Preferences</h1>
          <p className="text-muted-foreground">
            Manage your email subscription preferences
          </p>
        </div>

        {!emailSubmitted ? (
          <Card data-testid="card-email-input">
            <CardHeader>
              <CardTitle>Enter Your Email</CardTitle>
              <CardDescription>
                Enter the email address where you receive our communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-continue">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {isLoading ? (
              <Card data-testid="card-loading">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    Loading preferences...
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card data-testid="card-preferences">
                  <CardHeader>
                    <CardTitle>Email Preferences for {email}</CardTitle>
                    <CardDescription>
                      Choose which emails you'd like to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="marketing" className="text-base font-medium">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Promotions, special offers, and seasonal deals
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={!preferences?.unsubscribedMarketing}
                        onCheckedChange={(checked) => handleToggle("unsubscribedMarketing", !checked)}
                        disabled={updatePreferencesMutation.isPending || preferences?.unsubscribedAll}
                        data-testid="switch-marketing"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="reviews" className="text-base font-medium">
                          Review Requests
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Invitations to share your service experience
                        </p>
                      </div>
                      <Switch
                        id="reviews"
                        checked={!preferences?.unsubscribedReviews}
                        onCheckedChange={(checked) => handleToggle("unsubscribedReviews", !checked)}
                        disabled={updatePreferencesMutation.isPending || preferences?.unsubscribedAll}
                        data-testid="switch-reviews"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="serviceReminders" className="text-base font-medium">
                          Service Reminders
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Annual maintenance and service recommendations
                        </p>
                      </div>
                      <Switch
                        id="serviceReminders"
                        checked={!preferences?.unsubscribedServiceReminders}
                        onCheckedChange={(checked) => handleToggle("unsubscribedServiceReminders", !checked)}
                        disabled={updatePreferencesMutation.isPending || preferences?.unsubscribedAll}
                        data-testid="switch-service-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="referrals" className="text-base font-medium">
                          Referral Program
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Earn rewards by referring friends and family
                        </p>
                      </div>
                      <Switch
                        id="referrals"
                        checked={!preferences?.unsubscribedReferrals}
                        onCheckedChange={(checked) => handleToggle("unsubscribedReferrals", !checked)}
                        disabled={updatePreferencesMutation.isPending || preferences?.unsubscribedAll}
                        data-testid="switch-referrals"
                      />
                    </div>

                    {preferences?.unsubscribedAll && (
                      <div className="flex items-center gap-2 p-4 bg-muted rounded-md" data-testid="alert-unsubscribed-all">
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          You are currently unsubscribed from all emails. Individual preferences are disabled.
                        </p>
                      </div>
                    )}

                    {!preferences?.unsubscribedAll && (
                      <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-md" data-testid="status-subscribed">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <p className="text-sm">
                          You're subscribed to the email types enabled above.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-unsubscribe-all">
                  <CardHeader>
                    <CardTitle className="text-destructive">Unsubscribe from All Emails</CardTitle>
                    <CardDescription>
                      If you no longer wish to receive any emails from us, you can unsubscribe completely
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      onClick={handleUnsubscribeAll}
                      disabled={unsubscribeAllMutation.isPending || preferences?.unsubscribedAll}
                      className="w-full"
                      data-testid="button-unsubscribe-all"
                    >
                      {preferences?.unsubscribedAll ? "Already Unsubscribed" : "Unsubscribe from All"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEmailSubmitted(false);
                      setEmail("");
                    }}
                    data-testid="button-change-email"
                  >
                    Change Email Address
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            If you need assistance, please contact us at{" "}
            <a href="mailto:support@economyplumbing.com" className="text-primary hover:underline">
              support@economyplumbing.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
