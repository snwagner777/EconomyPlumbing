import { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { storage } from '@/server/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ExternalLink, Key, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Google My Business Setup | Admin',
  robots: 'noindex, nofollow',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GMBSetupPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    redirect('/admin/login');
  }

  const params = await searchParams;
  const success = params.success === 'true';
  const error = params.error;

  // Check if OAuth token exists
  const tokenData = await storage.getGoogleOAuthToken('google_my_business');
  const isConnected = !!tokenData?.accessToken;
  const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Google My Business Setup</h1>
        <p className="text-muted-foreground">
          Connect your Google Business Profile to automatically fetch and respond to reviews
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Successfully Connected!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your Google Business Profile is now connected. Reviews will be fetched automatically every 6 hours.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Connection Failed</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Current state of your Google Business Profile integration</CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && tokenData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {tokenData.accountId || 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Location ID</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {tokenData.locationId || 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Token Expiry</p>
                  <p className="text-xs text-muted-foreground">
                    {tokenData.expiryDate ? new Date(tokenData.expiryDate).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Not Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Business Profile to start fetching reviews
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to connect your Google Business Profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Check Credentials */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Configure Google OAuth Credentials</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Status: {hasCredentials ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Configured</span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">⚠ Missing</span>
                )}</p>
                
                {!hasCredentials && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                    <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">Required Secrets:</p>
                    <ul className="space-y-1 text-orange-800 dark:text-orange-200">
                      <li className="font-mono text-xs">GOOGLE_CLIENT_ID</li>
                      <li className="font-mono text-xs">GOOGLE_CLIENT_SECRET</li>
                    </ul>
                    <div className="mt-3">
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 hover:underline"
                      >
                        Get credentials from Google Cloud Console
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {hasCredentials && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-green-800 dark:text-green-200">
                      ✓ Google OAuth credentials are configured in Replit Secrets
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Authorize */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Authorize Google Account</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Click the button below to connect your Google Business Profile account. You'll be redirected to Google to grant permissions.
              </p>
              
              <form action="/api/google/oauth/init" method="GET">
                <Button 
                  type="submit"
                  disabled={!hasCredentials}
                  data-testid="button-authorize-google"
                >
                  {isConnected ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconnect Google Account
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Authorize with Google
                    </>
                  )}
                </Button>
              </form>

              {!hasCredentials && (
                <p className="text-xs text-muted-foreground mt-2">
                  Add Google OAuth credentials to Replit Secrets first
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Verify */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Verify Connection</h3>
              <p className="text-sm text-muted-foreground mb-3">
                After authorizing, your account and location IDs will appear above. The system will automatically fetch reviews every 6 hours and generate AI responses every 15 minutes.
              </p>
              
              {isConnected && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-view-reviews"
                  >
                    <a href="/admin/reputation">
                      View Reviews Dashboard
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-admin-dashboard"
                  >
                    <a href="/admin">
                      Back to Admin
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-1">How to get Google OAuth credentials:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable "Google Business Profile API" and "Business Account Management API"</li>
              <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
              <li>Add authorized redirect URI: <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.replit.app'}/api/google/oauth/callback
              </code></li>
              <li>Copy the Client ID and Client Secret to Replit Secrets</li>
            </ol>
          </div>
          
          <div className="pt-3 border-t">
            <p className="text-muted-foreground">
              <strong>Note:</strong> Google may take 2-3 business days to approve API access for new projects.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
