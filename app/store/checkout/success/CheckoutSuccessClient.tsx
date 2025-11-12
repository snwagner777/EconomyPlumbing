'use client';

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Phone, Loader2, XCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { PhoneConfig } from "@/server/lib/phoneNumbers";

interface CheckoutSuccessClientProps {
  phoneConfig: PhoneConfig;
  marbleFallsPhoneConfig: PhoneConfig;
}

function MembershipSuccessContent({ phoneConfig }: { phoneConfig: PhoneConfig }) {
  const searchParams = useSearchParams();
  const productSlug = searchParams?.get('product');
  const paymentIntentId = searchParams?.get('payment_intent');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [membershipId, setMembershipId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const completePurchase = async () => {
      if (!paymentIntentId || !productSlug) {
        setStatus('error');
        setErrorMessage('Missing payment information');
        return;
      }

      try {
        const response = await fetch('/api/public/complete-membership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMembershipId(data.membershipId);
          setStatus('success');
          trackEvent('membership_purchase', 'membership', productSlug);
          
          // Clean up session storage
          sessionStorage.removeItem('membership_checkout_customer');
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
  }, [paymentIntentId, productSlug]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 md:p-12 text-center max-w-md">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary mb-6" />
            <h1 className="text-2xl font-bold mb-4">Processing Your Membership...</h1>
            <p className="text-muted-foreground">
              Please wait while we activate your VIP membership.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 md:p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Purchase Failed</h1>
            <p className="text-muted-foreground mb-8">
              {errorMessage || 'We encountered an issue processing your membership.'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Return to Home
              </Button>
              <p className="text-xs text-muted-foreground">
                If you were charged, please contact us and we'll resolve this immediately.
              </p>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome to the VIP Program!
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Your membership purchase was successful. You'll receive a confirmation email shortly with all the details.
              </p>

              {membershipId && (
                <div className="bg-primary/10 rounded-lg p-4 mb-8">
                  <p className="text-sm text-muted-foreground mb-1">Membership ID</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-membership-id">#{membershipId}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
                <ol className="space-y-3 list-decimal list-inside">
                  <li className="text-muted-foreground">
                    Check your email for membership confirmation and receipt
                  </li>
                  <li className="text-muted-foreground">
                    Our team will contact you within 24 hours to schedule your first maintenance visit
                  </li>
                  <li className="text-muted-foreground">
                    You can now enjoy priority scheduling and VIP member benefits
                  </li>
                  <li className="text-muted-foreground">
                    Save our VIP support line: <a href={phoneConfig.tel} className="text-primary hover:underline">{phoneConfig.display}</a>
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <a href="/">Return to Home</a>
                </Button>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Have questions about your membership?
                  </p>
                  <Button 
                    variant="outline"
                    size="lg"
                    asChild
                    data-testid="button-call-support"
                  >
                    <a href={phoneConfig.tel} className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Call {phoneConfig.display}
                    </a>
                  </Button>
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

export default function CheckoutSuccessClient({ phoneConfig, marbleFallsPhoneConfig }: CheckoutSuccessClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <MembershipSuccessContent phoneConfig={phoneConfig} />
    </Suspense>
  );
}
