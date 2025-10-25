import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface OAuthStatus {
  isAuthenticated: boolean;
  hasAccountId: boolean;
  hasLocationId: boolean;
}

export default function GoogleMyBusinessSetup() {
  const [, navigate] = useLocation();
  const [successMessage, setSuccessMessage] = useState("");

  // Check for success parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMessage("Google My Business connected successfully!");
      // Clean URL
      window.history.replaceState({}, '', '/admin/gmb-setup');
    }
  }, []);

  const { data: status, isLoading } = useQuery<OAuthStatus>({
    queryKey: ["/api/oauth/status"],
  });

  const handleConnect = () => {
    window.location.href = "/api/google/oauth/init";
  };

  const isFullySetup = status?.isAuthenticated && status?.hasAccountId && status?.hasLocationId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-p-6 mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/admin")}
          className="mb-6"
          data-testid="button-back-admin"
        >
          ← Back to Admin
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Google My Business Setup</CardTitle>
            <CardDescription>
              Connect your Google Business Profile to fetch and respond to reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {successMessage && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">Loading status...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {status?.isAuthenticated ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-medium">OAuth Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      {status?.isAuthenticated
                        ? "Connected to Google"
                        : "Not connected"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {status?.hasAccountId ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-medium">Account ID</div>
                    <div className="text-sm text-muted-foreground">
                      {status?.hasAccountId
                        ? "Auto-detected from Google"
                        : "Not set"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {status?.hasLocationId ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-medium">Location ID</div>
                    <div className="text-sm text-muted-foreground">
                      {status?.hasLocationId
                        ? "Auto-detected from Google"
                        : "Not set"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isFullySetup ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Setup complete!</strong> You can now fetch unlimited reviews and respond to them.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Click the button below to connect your Google Business Profile. You'll be redirected to Google to grant access.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {!isFullySetup && (
                <Button
                  onClick={handleConnect}
                  data-testid="button-connect-google"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {status?.isAuthenticated ? "Reconnect Google Account" : "Connect Google Account"}
                </Button>
              )}

              {isFullySetup && (
                <Button
                  onClick={() => navigate("/admin")}
                  data-testid="button-continue-admin"
                >
                  Continue to Admin Dashboard
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p><strong>What happens when you connect:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google will ask you to grant access to your Business Profile</li>
                <li>Your Account ID and Location ID will be automatically detected</li>
                <li>You'll be able to fetch all reviews (not just the latest 5)</li>
                <li>You'll be able to respond to reviews directly from the admin panel</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
