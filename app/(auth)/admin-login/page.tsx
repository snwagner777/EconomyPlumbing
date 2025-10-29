/**
 * Admin OAuth Login Page
 * 
 * Landing page for admin authentication via Replit OAuth
 */

import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Login | Economy Plumbing Services',
  robots: 'noindex',
};

export default async function AdminOAuthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    failed: 'Failed to initiate login. Please try again.',
    no_email: 'No email found in your account. Please contact support.',
    unauthorized: 'Your email is not authorized for admin access. Please contact an administrator.',
    callback_failed: 'OAuth callback failed. Please try again.',
    csrf_failed: 'Security verification failed. Please try logging in again.',
    verifier_missing: 'Session expired. Please start the login process again.',
    invalid_claims: 'Invalid authentication data received. Please try again.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-login">
            Admin Login
          </h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Economy Plumbing Services
          </p>
        </div>

        <Card data-testid="card-login">
          <CardHeader>
            <CardTitle data-testid="heading-card-title">
              Sign in with Replit
            </CardTitle>
            <CardDescription data-testid="text-card-description">
              Use your authorized Replit account to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div 
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3"
                data-testid="alert-error"
              >
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Authentication Error
                  </p>
                  <p className="text-sm text-destructive/90" data-testid="text-error-message">
                    {errorMessages[error] || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
            )}

            <Button
              asChild
              className="w-full"
              size="lg"
              data-testid="button-login"
            >
              <a href="/api/auth/login">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in with Replit OAuth
              </a>
            </Button>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p data-testid="text-security-note">
                Only authorized administrators can access this area.
              </p>
              <p data-testid="text-contact">
                Need access? Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
            data-testid="link-back-home"
          >
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
