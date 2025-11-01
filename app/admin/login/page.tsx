'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        
        // Use window.location for full page reload to ensure cookie propagates
        // Validate redirect to prevent open redirect vulnerability
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get('from');
        
        // Only allow relative paths starting with /
        let redirectTo = '/admin';
        if (fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//')) {
          // Ensure it's a relative path and not a protocol-relative URL
          redirectTo = fromParam;
        }
        
        window.location.href = redirectTo;
      } else {
        toast({
          title: 'Error',
          description: 'Invalid username or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                data-testid="input-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
