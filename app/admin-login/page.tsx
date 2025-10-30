'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const handleOAuthLogin = () => {
    // Redirect to OAuth login endpoint
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>
            Sign in with your authorized account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleOAuthLogin}
            className="w-full"
            size="lg"
            data-testid="button-oauth-login"
          >
            <Lock className="mr-2 h-5 w-5" />
            Sign in with Replit Auth
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Supports Google, Apple, and more</p>
            <p className="mt-2 text-xs">
              Only whitelisted emails have access
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
