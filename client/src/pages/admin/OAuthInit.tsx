import { SEOHead } from "@/components/SEO/SEOHead";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OAuthInit() {
  const [isInitializing, setIsInitializing] = useState(false);

  const { data: status } = useQuery<{
    isAuthenticated: boolean;
    hasAccountId: boolean;
    hasLocationId: boolean;
  }>({
    queryKey: ['/api/oauth/status'],
  });

  const handleConnect = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/oauth/init');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('OAuth init error:', error);
      setIsInitializing(false);
    }
  };

  const isFullyConfigured = status?.isAuthenticated && status?.hasAccountId && status?.hasLocationId;

  return (
    <>
      <SEOHead
        title="Google My Business Setup | Admin"
        description="Configure Google My Business API integration to access all reviews"
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Google My Business Setup</h1>
            <p className="text-muted-foreground mb-8">
              Connect your Google Business Profile to access all 550+ reviews
            </p>

            <Card className="p-8 mb-6">
              <h2 className="text-xl font-semibold mb-4">Setup Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {status?.isAuthenticated ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={status?.isAuthenticated ? "text-green-600 font-medium" : ""}>
                    OAuth Authentication
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {status?.hasAccountId ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={status?.hasAccountId ? "text-green-600 font-medium" : ""}>
                    Account ID Configured
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {status?.hasLocationId ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={status?.hasLocationId ? "text-green-600 font-medium" : ""}>
                    Location ID Configured
                  </span>
                </div>
              </div>

              {isFullyConfigured && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Setup Complete!</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your system will automatically fetch all reviews every 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {!status?.isAuthenticated && (
              <Card className="p-8 mb-6">
                <h2 className="text-xl font-semibold mb-4">Step 1: Connect Google Account</h2>
                <p className="text-muted-foreground mb-6">
                  Sign in with the Google account that owns your business profile. You'll be asked to grant permission for this app to read your business reviews.
                </p>
                
                <Button 
                  onClick={handleConnect}
                  disabled={isInitializing}
                  className="bg-primary"
                  data-testid="button-connect-google"
                >
                  {isInitializing ? 'Redirecting to Google...' : 'Connect Google Business'}
                </Button>
              </Card>
            )}

            {status?.isAuthenticated && (!status?.hasAccountId || !status?.hasLocationId) && (
              <Card className="p-8">
                <h2 className="text-xl font-semibold mb-4">Step 2: Configure IDs</h2>
                <p className="text-muted-foreground mb-6">
                  You're authenticated! Now you need to provide your Google Business Account ID and Location ID.
                </p>
                
                <Button 
                  asChild
                  className="bg-primary"
                  data-testid="button-configure-ids"
                >
                  <a href="/admin/oauth-config">Configure Account & Location IDs</a>
                </Button>
              </Card>
            )}

            <Card className="p-6 bg-muted/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Need Help Finding Your IDs?</p>
                  <p className="text-muted-foreground">
                    Your Account ID and Location ID can be found in your Google Business Profile settings. 
                    Visit the <a href="/admin/oauth-config" className="text-primary hover:underline">configuration page</a> for detailed instructions.
                  </p>
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
