'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface MembershipPaymentSuccessClientProps {
  sessionId?: string;
}

export function MembershipPaymentSuccessClient({ sessionId }: MembershipPaymentSuccessClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [jobNumber, setJobNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const completeBooking = async () => {
      if (!sessionId) {
        setStatus('error');
        setErrorMessage('Invalid payment session');
        return;
      }

      try {
        const response = await fetch('/api/scheduler/complete-membership-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setJobNumber(data.jobNumber);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to complete booking');
        }
      } catch (error) {
        console.error('Error completing membership booking:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    completeBooking();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="max-w-lg w-full p-8">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Processing Your Membership Purchase...</h1>
            <p className="text-muted-foreground">
              Please wait while we complete your VIP membership booking and create your service request.
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
                Your VIP membership has been successfully purchased and your service request has been created.
              </p>
            </div>

            {jobNumber && jobNumber !== 'Processing' && (
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Your Job Number</p>
                <p className="text-3xl font-bold text-primary" data-testid="text-job-number">{jobNumber}</p>
              </div>
            )}

            {jobNumber === 'Processing' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your membership is being processed. You'll receive confirmation via email shortly.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent with your membership details and job information.
                Our team will contact you shortly to schedule your first service visit.
              </p>
              
              <Button 
                onClick={() => router.push('/')}
                className="w-full"
                data-testid="button-return-home"
              >
                Return to Home
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
              <h1 className="text-2xl font-bold">Booking Error</h1>
              <p className="text-muted-foreground">
                {errorMessage || 'There was an error completing your membership booking.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Your payment was successful, but we encountered an issue creating your service request.
                Please contact us and reference this error.
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/')}
                className="w-full"
                data-testid="button-return-home"
              >
                Return to Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/contact')}
                className="w-full"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
