import { SEOHead } from "@/components/SEO/SEOHead";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OAuthConfig() {
  const [accountId, setAccountId] = useState('');
  const [locationId, setLocationId] = useState('');
  const { toast } = useToast();

  const { data: status } = useQuery<{
    isAuthenticated: boolean;
    hasAccountId: boolean;
    hasLocationId: boolean;
  }>({
    queryKey: ['/api/oauth/status'],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/oauth/set-ids', {
        accountId: accountId.trim(),
        locationId: locationId.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oauth/status'] });
      toast({
        title: "Configuration Saved",
        description: "Your Account and Location IDs have been saved successfully. Reviews will be fetched automatically.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!accountId.trim() || !locationId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both Account ID and Location ID",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const isConfigured = status?.hasAccountId && status?.hasLocationId;

  return (
    <>
      <SEOHead
        title="Configure Google Business IDs | Admin"
        description="Set up Account and Location IDs for Google My Business API"
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Configure Business IDs</h1>
            <p className="text-muted-foreground mb-8">
              Enter your Google Business Account ID and Location ID to complete the setup
            </p>

            {!status?.isAuthenticated && (
              <Card className="p-6 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">Not Authenticated</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      You need to authenticate with Google first.{' '}
                      <a href="/admin/oauth-init" className="underline">Go to authentication</a>
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {isConfigured && (
              <Card className="p-6 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Setup Complete!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your IDs are configured. The system will automatically fetch all reviews every 24 hours.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-8 mb-6">
              <h2 className="text-xl font-semibold mb-6">Business Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="accountId" className="text-base font-medium">
                    Account ID
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Your Google My Business Account ID (format: accounts/123456789)
                  </p>
                  <Input
                    id="accountId"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="accounts/123456789"
                    className="max-w-md"
                    data-testid="input-account-id"
                  />
                </div>

                <div>
                  <Label htmlFor="locationId" className="text-base font-medium">
                    Location ID
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Your business location ID (format: locations/987654321)
                  </p>
                  <Input
                    id="locationId"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    placeholder="locations/987654321"
                    className="max-w-md"
                    data-testid="input-location-id"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !status?.isAuthenticated}
                  className="bg-primary"
                  data-testid="button-save-config"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">How to Find Your IDs</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Method 1: Use the My Business API</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Go to the <a href="https://developers.google.com/my-business/content/basic-setup#list-accounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      My Business API Explorer <ExternalLink className="h-3 w-3" />
                    </a></li>
                    <li>Click "Authorize APIs" and sign in with your business account</li>
                    <li>Use the "accounts.list" method to get your Account ID</li>
                    <li>Use the "accounts.locations.list" method with your Account ID to get Location ID</li>
                  </ol>
                </div>

                <div>
                  <p className="font-medium mb-2">Method 2: Google Business Profile Manager</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Sign in to <a href="https://business.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Google Business Profile <ExternalLink className="h-3 w-3" />
                    </a></li>
                    <li>Select your business location</li>
                    <li>Look in the URL bar - the IDs are in the URL format</li>
                    <li>Example URL: business.google.com/u/0/dashboard/l/12345678901234567890</li>
                    <li>Your Location ID is the number after "/l/"</li>
                  </ol>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">ID Format Examples:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><code className="text-xs bg-background px-2 py-1 rounded">accounts/123456789012345</code></li>
                    <li><code className="text-xs bg-background px-2 py-1 rounded">locations/9876543210987654321</code></li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
