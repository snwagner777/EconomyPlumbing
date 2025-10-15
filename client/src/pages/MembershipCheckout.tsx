import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, TestTube, Building2, Home } from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { Product } from "@shared/schema";

// Load Stripe with appropriate keys based on test mode
function getStripePromise(isTestMode: boolean) {
  if (isTestMode) {
    if (!import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY) {
      throw new Error('Missing required Stripe test key: VITE_TESTING_STRIPE_PUBLIC_KEY');
    }
    return loadStripe(import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY);
  } else {
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
    }
    return loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
}

// Form schemas
const residentialSchema = z.object({
  customerType: z.literal('residential'),
  locationName: z.string().min(2, 'Name is required'),
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  billingName: z.string().min(2, 'Billing name is required'),
  billingStreet: z.string().min(3, 'Billing street is required'),
  billingCity: z.string().min(2, 'Billing city is required'),
  billingState: z.string().min(2, 'Billing state is required'),
  billingZip: z.string().min(5, 'Billing ZIP is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  sameAsBilling: z.boolean().optional(),
});

const commercialSchema = z.object({
  customerType: z.literal('commercial'),
  companyName: z.string().min(2, 'Company name is required'),
  locationName: z.string().min(2, 'Location name is required'),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  locationPhone: z.string().min(10, 'Location phone is required'),
  extension: z.string().optional(),
  street: z.string().min(3, 'Location street is required'),
  city: z.string().min(2, 'Location city is required'),
  state: z.string().min(2, 'Location state is required'),
  zip: z.string().min(5, 'Location ZIP is required'),
  billingName: z.string().min(2, 'Billing contact name is required'),
  billingStreet: z.string().min(3, 'Billing street is required'),
  billingCity: z.string().min(2, 'Billing city is required'),
  billingState: z.string().min(2, 'Billing state is required'),
  billingZip: z.string().min(5, 'Billing ZIP is required'),
  phone: z.string().min(10, 'Billing phone is required'),
  email: z.string().email('Email is required'),
});

const customerInfoSchema = z.discriminatedUnion('customerType', [
  residentialSchema,
  commercialSchema,
]);

type CustomerInfo = z.infer<typeof customerInfoSchema>;

function CheckoutForm({ product, isTestMode, customerInfo }: { product: Product; isTestMode: boolean; customerInfo: CustomerInfo }) {
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

    // Build billing details from customer info
    const billingDetails: any = {
      name: customerInfo.customerType === 'residential' 
        ? customerInfo.locationName 
        : customerInfo.companyName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: {
        line1: customerInfo.billingStreet || customerInfo.street,
        city: customerInfo.billingCity || customerInfo.city,
        state: customerInfo.billingState || customerInfo.state,
        postal_code: customerInfo.billingZip || customerInfo.zip,
        country: 'US',
      },
    };

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/success?product=${product.slug}${isTestMode ? '&test=true' : ''}`,
        payment_method_data: {
          billing_details: billingDetails,
        },
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
        data-testid="button-complete-purchase"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isTestMode ? 'Processing Test Payment...' : 'Processing...'}
          </>
        ) : (
          <>
            {isTestMode && <TestTube className="w-4 h-4 mr-2" />}
            {isTestMode ? `Test Purchase ${product.name}` : `Purchase ${product.name}`}
          </>
        )}
      </Button>
    </form>
  );
}

export default function MembershipCheckout() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [clientSecret, setClientSecret] = useState("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Check for test mode via query parameter
  const isTestMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('testmode');
  }, []);

  // Load Stripe with appropriate keys
  const stripePromise = useMemo(() => getStripePromise(isTestMode), [isTestMode]);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', slug],
  });

  // Determine if this is a commercial product
  const isCommercialProduct = product?.slug === 'commercial-vip';

  const form = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      customerType: isCommercialProduct ? 'commercial' : 'residential',
      sameAsBilling: false,
    },
  });

  const customerType = form.watch('customerType');
  const sameAsBilling = form.watch('sameAsBilling');

  // Auto-copy location to billing if checkbox is checked (residential only)
  useEffect(() => {
    if (customerType === 'residential' && sameAsBilling) {
      const locationName = form.getValues('locationName');
      const street = form.getValues('street');
      const city = form.getValues('city');
      const state = form.getValues('state');
      const zip = form.getValues('zip');
      
      form.setValue('billingName', locationName);
      form.setValue('billingStreet', street);
      form.setValue('billingCity', city);
      form.setValue('billingState', state);
      form.setValue('billingZip', zip);
    }
  }, [sameAsBilling, customerType, form]);

  const onSubmit = async (data: CustomerInfo) => {
    setCustomerInfo(data);
    
    // Create payment intent with customer data
    try {
      const endpoint = isTestMode ? "/api/create-payment-intent/test" : "/api/create-payment-intent";
      const res = await apiRequest("POST", endpoint, { 
        productId: product!.id,
        customerInfo: data,
      });
      
      const responseData = await res.json();
      setClientSecret(responseData.clientSecret);
      setStep('payment');
    } catch (error: any) {
      let errorMessage = 'Failed to initialize checkout. Please try again.';
      
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading || !product) {
    return (
      <>
        <SEOHead
          title="Checkout | Economy Plumbing Services"
          description="Complete your VIP membership purchase for Economy Plumbing Services in Austin & Marble Falls, Texas."
          canonical={`https://www.plumbersthatcare.com/store/checkout/${slug}`}
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
        title={`${product.name} Checkout | Economy Plumbing`}
        description={`Purchase ${product.name} for ${priceDisplay}. Priority service, discounts & peace of mind. Austin & Marble Falls. Call (512) 368-9159!`}
        canonical={`https://www.plumbersthatcare.com/store/checkout/${slug}`}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* TEST MODE BANNER */}
        {isTestMode && (
          <div className="bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
              <TestTube className="w-5 h-5" />
              <p className="font-semibold text-center">
                TEST MODE - Use card 4242 4242 4242 4242 - No real charges will be made
              </p>
            </div>
          </div>
        )}
        
        <main className="flex-1 py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Complete Your Purchase</h1>
              <p className="text-lg text-muted-foreground">
                {step === 'info' ? 'Step 1: Your Information' : 'Step 2: Payment'}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Order Summary - Sidebar */}
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
                  </div>
                </div>
              </Card>

              {/* Main Content Area */}
              <div className="lg:col-span-2">
                {step === 'info' ? (
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Customer Information</h2>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Customer Type Selection */}
                        {!isCommercialProduct && (
                          <FormField
                            control={form.control}
                            name="customerType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer Type</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex gap-4"
                                  >
                                    <div className="flex items-center space-x-2 flex-1 border rounded-lg p-4 cursor-pointer hover-elevate">
                                      <RadioGroupItem value="residential" id="residential" data-testid="radio-residential" />
                                      <label htmlFor="residential" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <Home className="w-5 h-5" />
                                        <span>Residential</span>
                                      </label>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-1 border rounded-lg p-4 cursor-pointer hover-elevate">
                                      <RadioGroupItem value="commercial" id="commercial" data-testid="radio-commercial" />
                                      <label htmlFor="commercial" className="flex items-center gap-2 cursor-pointer flex-1">
                                        <Building2 className="w-5 h-5" />
                                        <span>Commercial</span>
                                      </label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Residential Form */}
                        {customerType === 'residential' && (
                          <>
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Location Information</h3>
                              
                              <FormField
                                control={form.control}
                                name="locationName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="John Doe" data-testid="input-location-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="123 Main St" data-testid="input-street" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Austin" data-testid="input-city" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="state"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="TX" data-testid="input-state" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ZIP Code</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="78701" data-testid="input-zip" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="sameAsBilling"
                                checked={sameAsBilling}
                                onCheckedChange={(checked) => form.setValue('sameAsBilling', checked as boolean)}
                                data-testid="checkbox-same-as-billing"
                              />
                              <label
                                htmlFor="sameAsBilling"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                Billing address same as location
                              </label>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Billing Information</h3>
                              
                              <FormField
                                control={form.control}
                                name="billingName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="John Doe" data-testid="input-billing-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="billingStreet"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing Street</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="123 Main St" data-testid="input-billing-street" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="billingCity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing City</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Austin" data-testid="input-billing-city" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="billingState"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing State</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="TX" data-testid="input-billing-state" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="billingZip"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing ZIP</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="78701" data-testid="input-billing-zip" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Contact Information</h3>
                              
                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="tel" placeholder="(512) 555-1234" data-testid="input-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}

                        {/* Commercial Form */}
                        {customerType === 'commercial' && (
                          <>
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Company Information</h3>
                              
                              <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="ABC Company Inc" data-testid="input-company-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="locationName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Downtown Office" data-testid="input-location-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="contactPersonName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Person Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Jane Smith" data-testid="input-contact-person" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="locationPhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Location Phone</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="tel" placeholder="(512) 555-1234" data-testid="input-location-phone" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="extension"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Extension (optional)</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="123" data-testid="input-extension" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Location Address</h3>
                              
                              <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="123 Business Blvd" data-testid="input-street" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Austin" data-testid="input-city" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="state"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="TX" data-testid="input-state" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="zip"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>ZIP</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="78701" data-testid="input-zip" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Billing Information</h3>
                              
                              <FormField
                                control={form.control}
                                name="billingName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing Contact Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="John Doe" data-testid="input-billing-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="billingStreet"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing Street</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="456 Payment Ave" data-testid="input-billing-street" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="billingCity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing City</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Austin" data-testid="input-billing-city" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="billingState"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing State</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="TX" data-testid="input-billing-state" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="billingZip"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Billing ZIP</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="78701" data-testid="input-billing-zip" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Billing Phone</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="tel" placeholder="(512) 555-5678" data-testid="input-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="email" placeholder="billing@company.com" data-testid="input-email" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}

                        <Button type="submit" className="w-full" size="lg" data-testid="button-continue-to-payment">
                          Continue to Payment
                        </Button>
                      </form>
                    </Form>
                  </Card>
                ) : (
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{isTestMode ? 'Test Payment Details' : 'Payment Details'}</h2>
                    
                    {/* Test Card Instructions */}
                    {isTestMode && (
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
                    )}

                    {!clientSecret ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm product={product} isTestMode={isTestMode} customerInfo={customerInfo!} />
                      </Elements>
                    )}
                    
                    <div className="mt-4 flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setStep('info')}
                        data-testid="button-back-to-info"
                      >
                        ← Back to Information
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {isTestMode ? 'Test mode - Powered by Stripe Test Environment' : 'Your payment is secure and encrypted with Stripe'}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
