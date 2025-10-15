import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, TestTube } from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

if (!import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe test key: TESTING_VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ product }: { product: Product }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/success?product=${product.slug}&test=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-complete-test-purchase"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Test Payment...
          </>
        ) : (
          <>
            <TestTube className="w-4 h-4 mr-2" />
            Test Purchase ${product.name}
          </>
        )}
      </Button>
    </form>
  );
}

export default function TestMembershipCheckout() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', slug],
  });

  useEffect(() => {
    if (product) {
      // Server validates pricing for security - never trust client-side amounts
      apiRequest("POST", "/api/create-payment-intent/test", { 
        productId: product.id
      })
        .then(async (res) => {
          const data = await res.json();
          setClientSecret(data.clientSecret);
        })
        .catch(async (error) => {
          // Handle specific error cases
          let errorMessage = 'Failed to initialize test checkout. Please try again.';
          
          // Try to parse error response if it's a Response object
          if (error instanceof Response) {
            try {
              const errorData = await error.json();
              if (errorData.error === 'NOT_A_MEMBERSHIP') {
                errorMessage = 'This product must be purchased through our store.';
              } else if (errorData.error === 'PRODUCT_NOT_FOUND') {
                errorMessage = 'This membership is no longer available.';
              } else if (errorData.error === 'PRODUCT_UNAVAILABLE') {
                errorMessage = 'This membership is currently unavailable.';
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch {
              // Couldn't parse error, use default message
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        });
    }
  }, [product, toast]);

  if (isLoading || !product) {
    return (
      <>
        <SEOHead
          title="Test Checkout | Economy Plumbing Services"
          description="Test mode checkout for VIP membership development."
          canonical={`https://www.plumbersthatcare.com/test/checkout/${slug}`}
        />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const features = product.features || [];
  const priceDisplay = `$${(product.price / 100).toFixed(2)}`;

  return (
    <>
      <SEOHead
        title={`TEST: ${product.name} Checkout | Economy Plumbing`}
        description={`Test mode checkout for ${product.name}. No real charges will be made.`}
        canonical={`https://www.plumbersthatcare.com/test/checkout/${slug}`}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* TEST MODE BANNER */}
        <div className="bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <TestTube className="w-5 h-5" />
            <p className="font-semibold text-center">
              TEST MODE - Use card 4242 4242 4242 4242 - No real charges will be made
            </p>
          </div>
        </div>
        
        <main className="flex-1 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-4 py-2 rounded-full mb-4">
                <TestTube className="w-4 h-4" />
                <span className="text-sm font-semibold">Test Mode</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Complete Your Test Purchase</h1>
              <p className="text-lg text-muted-foreground">
                Test the checkout flow with Stripe test cards
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Order Summary */}
              <Card className="p-6 h-fit">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                {product.image && (
                  <div className="mb-6 flex justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-32 h-32 object-contain"
                      loading="eager"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
                  </div>
                  
                  {features.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">What's Included:</h4>
                      <ul className="space-y-2">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-2xl text-primary">{priceDisplay}</span>
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      This is a test transaction - no real charge
                    </p>
                  </div>
                </div>
              </Card>

              {/* Payment Form */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Test Payment Details</h2>
                
                {/* Test Card Instructions */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Use these test cards:</p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li><strong>Success:</strong> 4242 4242 4242 4242</li>
                    <li><strong>3D Secure:</strong> 4000 0025 0000 3155</li>
                    <li><strong>Declined:</strong> 4000 0000 0000 9995</li>
                  </ul>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Use any future expiry date, any CVC, any ZIP
                  </p>
                </div>

                {!clientSecret ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm product={product} />
                  </Elements>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Test mode - Powered by Stripe Test Environment
                </p>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
