import { SEOHead } from "@/components/SEO/SEOHead";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { trackMembershipPurchase } from "@/lib/conversionTracking";

export default function StoreSuccess() {
  const [, setLocation] = useLocation();
  const [hasTracked, setHasTracked] = useState(false);

  // Get payment_intent from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentId = urlParams.get('payment_intent');

  // Fetch purchase details from backend
  const { data: purchaseData, isLoading } = useQuery({
    queryKey: ['/api/purchase-success', paymentIntentId],
    enabled: !!paymentIntentId,
  });

  // Track purchase conversion when data is loaded
  useEffect(() => {
    if (purchaseData && !hasTracked) {
      const { product, customerInfo, transactionId } = purchaseData;
      
      // Track conversion across all platforms
      trackMembershipPurchase(
        product.name,
        product.price / 100, // Convert cents to dollars
        transactionId
      );

      setHasTracked(true);
      console.log('Purchase tracked:', {
        product: product.name,
        value: product.price / 100,
        transactionId
      });
    }
  }, [purchaseData, hasTracked]);

  if (isLoading) {
    return (
      <>
        <SEOHead
          title="Processing Order... | Economy Plumbing Store"
          description="Your order is being processed. Thank you for your purchase!"
        />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Processing your order...</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!purchaseData) {
    return (
      <>
        <SEOHead
          title="Order Not Found | Economy Plumbing Store"
          description="We couldn't find your order details. Please contact us for assistance."
        />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find your order details. Please contact us if you need assistance.
              </p>
              <Button 
                asChild 
                className="w-full bg-primary" 
                data-testid="button-contact-support"
              >
                <a href="/contact">Contact Support</a>
              </Button>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const { product, customerInfo } = purchaseData;

  return (
    <>
      <SEOHead
        title="Order Complete | Economy Plumbing Store"
        description="Thank you for your purchase! Your VIP membership has been activated. Check your email for confirmation details."
        noIndex={true}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8" data-testid="card-success-message">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground">
                  Thank you for your purchase. Your order has been confirmed.
                </p>
              </div>

              <div className="space-y-6 border-t pt-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium" data-testid="text-product-name">{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-medium text-lg" data-testid="text-amount-paid">
                        ${(product.price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>You'll receive a confirmation email at <strong>{customerInfo.email}</strong></span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Your membership details have been synced with ServiceTitan</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Our team will contact you within 24 hours to schedule your first service</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Keep an eye on your inbox for membership benefits and exclusive offers</span>
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <Button 
                    asChild 
                    className="flex-1 bg-primary" 
                    data-testid="button-back-home"
                  >
                    <a href="/">Back to Home</a>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1" 
                    data-testid="button-view-benefits"
                  >
                    <a href="/membership-benefits">View Benefits</a>
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
