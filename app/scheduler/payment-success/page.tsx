/**
 * Backflow Payment Success Page
 * 
 * Handles the Stripe checkout return, completes the booking with payment info.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobNumber, setJobNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    completeBooking();
  }, [sessionId]);

  const completeBooking = async () => {
    try {
      // Complete the booking with payment info
      const response = await fetch('/api/scheduler/complete-backflow-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        setJobNumber(result.jobNumber);
      } else {
        throw new Error(result.error || 'Failed to complete booking');
      }
    } catch (err: any) {
      console.error('Error completing booking:', err);
      setError(err.message || 'Unable to complete your booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Processing Your Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment and schedule your appointment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card className="border-destructive/20">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/schedule-appointment')}
                variant="outline"
                className="w-full max-w-md"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/contact')}
                variant="default"
                className="w-full max-w-md"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <Card className="border-primary/20">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4" data-testid="text-success-title">
            Payment Confirmed!
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Your backflow testing has been scheduled and paid
          </p>
          {jobNumber && (
            <div className="inline-block bg-muted px-6 py-3 rounded-lg mb-8">
              <p className="text-sm text-muted-foreground mb-1">Job Number</p>
              <p className="text-2xl font-bold" data-testid="text-job-number">
                #{jobNumber}
              </p>
            </div>
          )}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/')}
              size="lg"
              className="w-full max-w-md"
              data-testid="button-return-home"
            >
              Return to Home
            </Button>
            <p className="text-sm text-muted-foreground">
              You'll receive a confirmation email shortly with appointment details
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
