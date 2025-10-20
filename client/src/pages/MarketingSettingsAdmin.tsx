import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, Power } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

type MarketingSettings = {
  masterSendEnabled: boolean;
  dailyEmailLimit: number;
  testModeEnabled: boolean;
};

export default function MarketingSettingsAdmin() {
  const { toast } = useToast();
  const [masterSendEnabled, setMasterSendEnabled] = useState(false);
  const [dailyEmailLimit, setDailyEmailLimit] = useState(500);
  const [testModeEnabled, setTestModeEnabled] = useState(true);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<MarketingSettings>({
    queryKey: ['/api/admin/marketing-settings'],
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setMasterSendEnabled(settings.masterSendEnabled);
      setDailyEmailLimit(settings.dailyEmailLimit);
      setTestModeEnabled(settings.testModeEnabled);
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (newSettings: Partial<MarketingSettings>) => {
      return apiRequest('PUT', '/api/admin/marketing-settings', newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Marketing automation settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/marketing-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      masterSendEnabled,
      dailyEmailLimit,
      testModeEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Marketing System Settings</h2>
        <p className="text-muted-foreground">
          Configure email campaign automation and safety controls
        </p>
      </div>

      {/* Master Email Send Switch */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Power className="w-5 h-5" />
                Master Email Send Switch
              </CardTitle>
              <CardDescription>
                Global control for all automated email campaigns. When OFF, no emails will be sent.
              </CardDescription>
            </div>
            <Switch
              checked={masterSendEnabled}
              onCheckedChange={setMasterSendEnabled}
              data-testid="switch-master-send"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!masterSendEnabled ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Sending Disabled</AlertTitle>
              <AlertDescription>
                All automated email campaigns are currently disabled. No emails will be sent until this switch is enabled.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default">
              <Power className="h-4 w-4" />
              <AlertTitle>Email Sending Active</AlertTitle>
              <AlertDescription>
                Automated email campaigns are ACTIVE. Approved campaigns will send emails to customers.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Daily Email Limit */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Email Limit</CardTitle>
          <CardDescription>
            Maximum number of emails that can be sent per day across all campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daily-limit">Daily Limit</Label>
            <Input
              id="daily-limit"
              type="number"
              value={dailyEmailLimit}
              onChange={(e) => setDailyEmailLimit(parseInt(e.target.value) || 0)}
              min={0}
              max={10000}
              data-testid="input-daily-limit"
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 500-1000 emails/day for small businesses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Test Mode</CardTitle>
              <CardDescription>
                When enabled, emails will only be sent to test addresses (not real customers)
              </CardDescription>
            </div>
            <Switch
              checked={testModeEnabled}
              onCheckedChange={setTestModeEnabled}
              data-testid="switch-test-mode"
            />
          </div>
        </CardHeader>
        <CardContent>
          {testModeEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Test Mode Active</AlertTitle>
              <AlertDescription>
                Emails will only be sent to configured test addresses. Real customers will not receive emails.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current marketing automation configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Master Send Switch:</span>
              <span className={`font-medium ${masterSendEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {masterSendEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Daily Email Limit:</span>
              <span className="font-medium">{dailyEmailLimit.toLocaleString()} emails/day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Test Mode:</span>
              <span className={`font-medium ${testModeEnabled ? 'text-yellow-600' : 'text-green-600'}`}>
                {testModeEnabled ? 'ON (Testing)' : 'OFF (Production)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
