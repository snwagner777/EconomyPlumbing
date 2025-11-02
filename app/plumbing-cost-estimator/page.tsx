'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Wrench, Clock, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertContactSubmissionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { trackEvent } from "@/lib/analytics";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  urgency?: "standard" | "urgent" | "emergency";
}

const serviceCategories: Record<string, ServiceOption[]> = {
  "Water Heaters": [
    { id: "wh-install-tank", name: "Tank Water Heater Installation", description: "Standard 40-50 gallon tank", priceRange: "$1,200 - $2,200", minPrice: 1200, maxPrice: 2200 },
    { id: "wh-install-tankless", name: "Tankless Water Heater Installation", description: "On-demand hot water system", priceRange: "$2,200 - $4,500", minPrice: 2200, maxPrice: 4500 },
    { id: "wh-repair", name: "Water Heater Repair", description: "Fix existing unit", priceRange: "$200 - $600", minPrice: 200, maxPrice: 600 },
    { id: "wh-flush", name: "Water Heater Maintenance/Flush", description: "Annual maintenance service", priceRange: "$150 - $250", minPrice: 150, maxPrice: 250 },
  ],
  "Drains & Sewers": [
    { id: "drain-basic", name: "Basic Drain Cleaning", description: "Single fixture clog", priceRange: "$150 - $300", minPrice: 150, maxPrice: 300 },
    { id: "drain-hydro", name: "Hydro Jetting", description: "High-pressure drain cleaning", priceRange: "$400 - $800", minPrice: 400, maxPrice: 800 },
    { id: "sewer-inspection", name: "Sewer Camera Inspection", description: "Video line inspection", priceRange: "$250 - $500", minPrice: 250, maxPrice: 500 },
    { id: "sewer-repair", name: "Sewer Line Repair", description: "Repair/replace sewer line", priceRange: "$3,000 - $10,000", minPrice: 3000, maxPrice: 10000 },
  ],
  "Leaks & Repairs": [
    { id: "leak-minor", name: "Minor Leak Repair", description: "Faucet, toilet, or pipe leak", priceRange: "$150 - $350", minPrice: 150, maxPrice: 350 },
    { id: "leak-slab", name: "Slab Leak Detection & Repair", description: "Under-slab pipe leak", priceRange: "$1,000 - $4,000", minPrice: 1000, maxPrice: 4000 },
    { id: "pipe-repair", name: "Pipe Repair/Replacement", description: "Replace damaged pipes", priceRange: "$300 - $1,500", minPrice: 300, maxPrice: 1500 },
    { id: "emergency-leak", name: "Emergency Leak Repair", description: "24/7 urgent service", priceRange: "$250 - $800", minPrice: 250, maxPrice: 800, urgency: "emergency" },
  ],
  "Fixtures & Installations": [
    { id: "fixture-toilet", name: "Toilet Installation", description: "Replace or install toilet", priceRange: "$200 - $500", minPrice: 200, maxPrice: 500 },
    { id: "fixture-faucet", name: "Faucet Installation", description: "Kitchen or bathroom faucet", priceRange: "$150 - $350", minPrice: 150, maxPrice: 350 },
    { id: "fixture-disposal", name: "Garbage Disposal Installation", description: "Install new disposal unit", priceRange: "$200 - $450", minPrice: 200, maxPrice: 450 },
    { id: "fixture-sink", name: "Sink Installation", description: "Kitchen or bathroom sink", priceRange: "$250 - $600", minPrice: 250, maxPrice: 600 },
  ],
  "Other Services": [
    { id: "gas-line", name: "Gas Line Work", description: "Install/repair gas lines", priceRange: "$300 - $1,500", minPrice: 300, maxPrice: 1500 },
    { id: "backflow", name: "Backflow Testing", description: "Annual certification", priceRange: "$75 - $150", minPrice: 75, maxPrice: 150 },
    { id: "repiping", name: "Whole House Repiping", description: "Replace all plumbing", priceRange: "$5,000 - $15,000", minPrice: 5000, maxPrice: 15000 },
    { id: "inspection", name: "Plumbing Inspection", description: "Pre-purchase inspection", priceRange: "$200 - $400", minPrice: 200, maxPrice: 400 },
  ],
};

const quoteFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().min(10, "Phone number is required"),
  message: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export default function PlumbingCostEstimator() {
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const phoneConfig = usePhoneConfig();
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      return apiRequest("POST", "/api/contact", {
        ...data,
        source: "plumbing-cost-estimator",
      });
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Sent!",
        description: "We'll contact you soon with a detailed estimate.",
      });
      trackEvent('Quote Request Submitted', 'Cost Estimator', `${selectedServices.length} services`);
      form.reset();
      setSelectedServices([]);
      setShowQuoteForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again or call us.",
        variant: "destructive",
      });
    },
  });

  const handleServiceToggle = (service: ServiceOption) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const calculateEstimate = () => {
    if (selectedServices.length === 0) return { min: 0, max: 0 };
    const min = selectedServices.reduce((sum, s) => sum + s.minPrice, 0);
    const max = selectedServices.reduce((sum, s) => sum + s.maxPrice, 0);
    return { min, max };
  };

  const estimate = calculateEstimate();
  const hasEmergency = selectedServices.some(s => s.urgency === "emergency");

  const onSubmit = (data: QuoteFormValues) => {
    const servicesList = selectedServices.map(s => s.name).join(", ");
    const estimateRange = `$${estimate.min.toLocaleString()} - $${estimate.max.toLocaleString()}`;
    
    contactMutation.mutate({
      ...data,
      message: `Cost Estimator Quote Request\n\nSelected Services:\n${servicesList}\n\nEstimated Range: ${estimateRange}\n\nAdditional Details:\n${data.message || "None"}`,
    });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calculator className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">Plumbing Cost Estimator</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get instant price estimates for plumbing services in Austin and Marble Falls. 
              Select your services below to see typical cost ranges.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All estimates are approximate. Request a free quote for exact pricing.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Service Selection */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(serviceCategories).map(([category, services]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        role="button"
                        tabIndex={0}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                          isServiceSelected(service.id)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        onClick={() => handleServiceToggle(service)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleServiceToggle(service);
                          }
                        }}
                        data-testid={`service-option-${service.id}`}
                        aria-pressed={isServiceSelected(service.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isServiceSelected(service.id)}
                            onCheckedChange={() => handleServiceToggle(service)}
                            className="mt-1"
                            data-testid={`checkbox-${service.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {service.description}
                                </p>
                              </div>
                              {service.urgency === "emergency" && (
                                <Badge variant="destructive" className="flex-shrink-0">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  24/7
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-medium text-primary">
                                {service.priceRange}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Estimate Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      Your Estimate
                    </CardTitle>
                    <CardDescription>
                      Based on {selectedServices.length} selected service{selectedServices.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedServices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Select services to see estimate</p>
                      </div>
                    ) : (
                      <>
                        {/* Selected Services */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Selected Services:</h4>
                          {selectedServices.map((service) => (
                            <div key={service.id} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="flex-1">{service.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Estimate Range */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Estimated Total</p>
                          <p className="text-3xl font-bold text-primary" data-testid="text-estimate-total">
                            ${estimate.min.toLocaleString()} - ${estimate.max.toLocaleString()}
                          </p>
                        </div>

                        {/* Emergency Notice */}
                        {hasEmergency && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold text-destructive">Emergency Service Selected</p>
                              <p className="text-muted-foreground">
                                Call us now for 24/7 emergency plumbing
                              </p>
                            </div>
                          </div>
                        )}

                        {/* CTA */}
                        <div className="space-y-2">
                          {!showQuoteForm ? (
                            <>
                              <Button
                                onClick={() => setShowQuoteForm(true)}
                                className="w-full"
                                size="lg"
                                data-testid="button-get-exact-quote"
                              >
                                Get Exact Quote
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                className="w-full"
                                data-testid="button-call-now"
                              >
                                <a href={`tel:${phoneConfig.tel}`}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call: {phoneConfig.display}
                                </a>
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => setShowQuoteForm(false)}
                              variant="outline"
                              className="w-full"
                              data-testid="button-hide-quote-form"
                            >
                              Hide Quote Form
                            </Button>
                          )}
                        </div>

                        {/* Disclaimer */}
                        <p className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Final pricing depends on specific conditions and complexity. 
                          Request a quote for accurate pricing.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quote Form */}
                {showQuoteForm && selectedServices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Request Exact Quote</CardTitle>
                      <CardDescription>
                        We'll contact you with detailed pricing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-quote-name" />
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} data-testid="input-quote-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input type="tel" {...field} data-testid="input-quote-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Details (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Any specific details about your project..."
                                    rows={3}
                                    data-testid="input-quote-message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={contactMutation.isPending}
                            data-testid="button-submit-quote"
                          >
                            {contactMutation.isPending ? "Sending..." : "Request Quote"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Upfront Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  No hidden fees or surprises
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">24/7 Emergency Service</h3>
                <p className="text-sm text-muted-foreground">
                  Available when you need us most
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Phone className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Free Estimates</h3>
                <p className="text-sm text-muted-foreground">
                  Call for exact pricing today
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
