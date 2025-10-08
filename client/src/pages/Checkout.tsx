import { SEOHead } from "@/components/SEO/SEOHead";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const customerInfoSchema = z.object({
  customerType: z.enum(['residential', 'commercial']),
  // Residential fields
  customerName: z.string().min(1, "Name is required").optional(),
  // Commercial fields
  companyName: z.string().min(1, "Company name is required").optional(),
  contactPersonName: z.string().min(1, "Contact person name is required").optional(),
  // Common fields
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required").max(10, "Invalid ZIP code"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
}).refine((data) => {
  if (data.customerType === 'residential') {
    return !!data.customerName;
  }
  if (data.customerType === 'commercial') {
    return !!data.companyName && !!data.contactPersonName;
  }
  return true;
}, {
  message: "Please fill in all required fields for your customer type",
});

type CustomerInfo = z.infer<typeof customerInfoSchema>;

function CheckoutForm({ product, clientSecret, paymentIntentId }: { product: Product; clientSecret: string; paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      customerType: 'residential',
      customerName: '',
      companyName: '',
      contactPersonName: '',
      street: '',
      city: '',
      state: 'TX',
      zip: '',
      phone: '',
      email: '',
    },
  });

  const customerType = form.watch('customerType');

  const handleSubmit = async (data: CustomerInfo) => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Save customer info to database before confirming payment
      const saveResponse = await apiRequest("POST", "/api/pending-purchase", {
        paymentIntentId,
        productId: product.id,
        ...data,
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.message || "Failed to save customer information");
      }

      // Confirm payment with Stripe
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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Customer Type */}
      <div className="space-y-3">
        <Label>Customer Type</Label>
        <RadioGroup
          value={form.watch('customerType')}
          onValueChange={(value) => form.setValue('customerType', value as 'residential' | 'commercial')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="residential" id="residential" data-testid="radio-residential" />
            <Label htmlFor="residential" className="font-normal">Residential</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="commercial" id="commercial" data-testid="radio-commercial" />
            <Label htmlFor="commercial" className="font-normal">Commercial</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Residential Fields */}
      {customerType === 'residential' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">Full Name *</Label>
            <Input
              id="customerName"
              {...form.register('customerName')}
              placeholder="John Smith"
              data-testid="input-customer-name"
            />
            {form.formState.errors.customerName && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.customerName.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Commercial Fields */}
      {customerType === 'commercial' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...form.register('companyName')}
              placeholder="ABC Plumbing Inc"
              data-testid="input-company-name"
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.companyName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPersonName">Contact Person *</Label>
            <Input
              id="contactPersonName"
              {...form.register('contactPersonName')}
              placeholder="Jane Doe"
              data-testid="input-contact-person"
            />
            {form.formState.errors.contactPersonName && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.contactPersonName.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Common Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="street">Street Address *</Label>
          <Input
            id="street"
            {...form.register('street')}
            placeholder="123 Main St"
            data-testid="input-street"
          />
          {form.formState.errors.street && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.street.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              {...form.register('city')}
              placeholder="Austin"
              data-testid="input-city"
            />
            {form.formState.errors.city && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              {...form.register('state')}
              placeholder="TX"
              maxLength={2}
              data-testid="input-state"
            />
            {form.formState.errors.state && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.state.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="zip">ZIP Code *</Label>
          <Input
            id="zip"
            {...form.register('zip')}
            placeholder="78701"
            data-testid="input-zip"
          />
          {form.formState.errors.zip && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.zip.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            placeholder="(512) 555-1234"
            type="tel"
            data-testid="input-phone"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            {...form.register('email')}
            placeholder="you@example.com"
            type="email"
            data-testid="input-email"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Payment Element */}
      <div className="pt-4 border-t">
        <Label className="text-base mb-3 block">Payment Information</Label>
        <PaymentElement 
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

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
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

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
      setPaymentIntentId(data.paymentIntentId);
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
        <SEOHead
          title="Checkout | Economy Plumbing Store"
          description="Complete your plumbing membership or product purchase. Secure checkout with Stripe payment processing. Shop Economy Plumbing Services."
        />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Store Unavailable</h2>
              <p className="text-muted-foreground mb-6">
                Our online store is currently being set up. Please contact us directly to purchase memberships.
              </p>
              <Button asChild className="w-full bg-primary" data-testid="button-contact-us">
                <a href="tel:+15123689159">Call (512) 368-9159</a>
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
        <SEOHead
          title="Loading... | Economy Plumbing Store"
          description="Loading your checkout information. Please wait while we prepare your secure payment page."
        />
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
        <SEOHead
          title="Product Not Found | Economy Plumbing Store"
          description="The product you're looking for could not be found. Browse our VIP memberships and plumbing products."
        />
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
      <SEOHead
        title={`Checkout - ${product.name} | Economy Plumbing Store`}
        description={`Purchase ${product.name} - ${product.description}. Secure payment processing. VIP memberships & plumbing products.`}
      />

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
                <h2 className="text-xl font-semibold mb-4">Customer & Payment Details</h2>
                {clientSecret && paymentIntentId && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm product={product} clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
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
                <a href="tel:+15123689159" className="text-primary hover:underline">
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
