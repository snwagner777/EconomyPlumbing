import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

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

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/store/success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-primary" 
        disabled={!stripe || isProcessing}
        data-testid="button-complete-purchase"
      >
        {isProcessing ? "Processing..." : `Pay $${(product.price / 100).toFixed(0)}`}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not found");
      
      const res = await apiRequest("POST", "/api/create-payment-intent", {
        productId: product.id,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (product && !clientSecret && !createPaymentIntent.isPending) {
      createPaymentIntent.mutate();
    }
  }, [product]);

  if (!stripePublicKey) {
    return (
      <>
        <Helmet>
          <title>Checkout | Economy Plumbing Store</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Store Unavailable</h2>
              <p className="text-muted-foreground mb-6">
                Our online store is currently being set up. Please contact us directly to purchase memberships.
              </p>
              <Button asChild className="w-full bg-primary" data-testid="button-contact-us">
                <a href="tel:5123689159">Call (512) 368-9159</a>
              </Button>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (productLoading) {
    return (
      <>
        <Helmet>
          <title>Loading... | Economy Plumbing Store</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Helmet>
          <title>Product Not Found | Economy Plumbing Store</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The product you're looking for doesn't exist.
              </p>
              <Button asChild className="w-full bg-primary" data-testid="button-back-to-store">
                <a href="/store">Back to Store</a>
              </Button>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - {product.name} | Economy Plumbing Store</title>
        <meta name="description" content={`Purchase ${product.name} - ${product.description}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase securely with Stripe</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Product Summary */}
              <Card className="p-6" data-testid="card-product-summary">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>

                  {product.features && product.features.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Includes:</p>
                      <ul className="text-sm space-y-1">
                        {product.features.map((feature, idx) => (
                          <li key={idx} className="text-muted-foreground">• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-primary">${(product.price / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Form */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm product={product} />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Initializing secure payment...</p>
                  </div>
                )}
              </Card>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Secure payment processing powered by Stripe</p>
              <p className="mt-2">
                Questions? Call us at{" "}
                <a href="tel:5123689159" className="text-primary hover:underline">
                  (512) 368-9159
                </a>
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
