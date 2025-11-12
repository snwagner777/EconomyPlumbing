'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, Crown } from 'lucide-react';

interface MembershipSuccessClientProps {
  sessionId?: string;
}

export function MembershipSuccessClient({ sessionId }: MembershipSuccessClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [membershipId, setMembershipId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const completePurchase = async () => {
      if (!sessionId) {
        setStatus('error');
        setErrorMessage('Invalid payment session');
        return;
      }

      try {
        const response = await fetch('/api/customer-portal/complete-membership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMembershipId(data.membershipId);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to complete purchase');
        }
      } catch (error) {
        console.error('Error completing membership purchase:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    completePurchase();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="max-w-lg w-full p-8">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Processing Your Membership Purchase...</h1>
            <p className="text-muted-foreground">
              Please wait while we activate your VIP membership.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Membership Purchase Complete!</h1>
              <p className="text-muted-foreground">
                Your VIP membership has been successfully activated.
              </p>
            </div>

            {membershipId && (
              <div className="bg-primary/10 rounded-lg p-4">
                <Crown className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Membership ID</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-membership-id">#{membershipId}</p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                You can now enjoy priority scheduling, exclusive discounts, and all VIP membership benefits.
                Your membership details are available in your customer portal.
              </p>
              
              <Button 
                onClick={() => router.push('/customer-portal')}
                className="w-full"
                data-testid="button-return-portal"
              >
                <Crown className="w-4 h-4 mr-2" />
                Go to Customer Portal
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Purchase Failed</h1>
              <p className="text-muted-foreground">
                {errorMessage || 'We encountered an issue processing your membership purchase.'}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => router.push('/customer-portal')}
                variant="outline"
                className="w-full"
                data-testid="button-return-portal-error"
              >
                Return to Customer Portal
              </Button>
              <p className="text-xs text-muted-foreground">
                If you were charged, please contact support and we'll resolve this immediately.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
