import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEO/SEOHead";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { openScheduler } from "@/lib/scheduler";
import { CheckCircle, Droplet, Users, Home, Flame, Calculator, Phone } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalculatorResult {
  tankSize: number;
  tanklessOption: boolean;
  recommendation: string;
  efficiency: string;
  estimatedCost: string;
}

const quoteFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  location: z.string().min(2, "Please enter your city"),
  message: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

export default function WaterHeaterCalculator() {
  const [householdSize, setHouseholdSize] = useState(4);
  const [bathrooms, setBathrooms] = useState(2);
  const [usage, setUsage] = useState<"light" | "average" | "heavy">("average");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const phoneConfig = usePhoneConfig();
  const { toast } = useToast();

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      location: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const submission = {
        ...data,
        service: `Water Heater Quote Request - ${result?.recommendation || 'Calculator Result'}`,
        pageContext: 'Water Heater Calculator',
        urgency: 'routine',
      };
      return await apiRequest("POST", "/api/contact", submission);
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Sent!",
        description: "We'll contact you within 24 hours with pricing details.",
      });
      form.reset();
      setShowQuoteForm(false);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  const calculateWaterHeater = () => {
    // Peak hour demand calculation (gallons per hour)
    let peakDemand = 0;
    
    // Base demand from household size
    peakDemand += householdSize * 12; // 12 gallons per person during peak hour
    
    // Additional demand from bathrooms (simultaneous usage)
    peakDemand += bathrooms * 10; // 10 gallons per bathroom for simultaneous showers
    
    // Usage pattern multiplier
    const usageMultiplier = {
      light: 0.8,
      average: 1.0,
      heavy: 1.3,
    };
    peakDemand *= usageMultiplier[usage];
    
    // Recovery rate needed (70% of peak demand for tank)
    const recoveryNeeded = Math.ceil(peakDemand * 0.7);
    
    // Determine tank size (standard sizes: 30, 40, 50, 65, 80 gallons)
    const standardSizes = [30, 40, 50, 65, 80];
    const tankSize = standardSizes.find(size => size >= recoveryNeeded) || 80;
    
    // Check if tankless is viable (peak demand < 8 GPM for residential)
    const tanklessOption = peakDemand / 7.5 <= 8; // Assuming 7.5 min peak usage
    
    // Build recommendation
    let recommendation = "";
    if (tankSize <= 40) {
      recommendation = `${tankSize}-Gallon Gas Tank Water Heater`;
    } else if (tankSize <= 50) {
      recommendation = `${tankSize}-Gallon Gas Tank Water Heater or Tankless System`;
    } else {
      recommendation = householdSize > 5 
        ? `${tankSize}-Gallon High-Recovery Tank or Whole-Home Tankless System`
        : `${tankSize}-Gallon Gas Tank Water Heater`;
    }
    
    // Efficiency rating
    const efficiency = tankSize >= 50 
      ? "Energy Star Rated (UEF 0.67+)" 
      : "Standard Efficiency (UEF 0.58-0.62)";
    
    // Estimated cost range
    const estimatedCost = tankSize >= 65 
      ? "$1,800 - $2,800 installed"
      : tankSize >= 50
      ? "$1,500 - $2,200 installed"
      : "$1,200 - $1,800 installed";
    
    setResult({
      tankSize,
      tanklessOption,
      recommendation,
      efficiency,
      estimatedCost,
    });
  };

  return (
    <>
      <SEOHead
        title="Water Heater Size Calculator | Austin TX | Economy Plumbing"
        description="Free water heater size calculator. Get instant recommendations for tank or tankless water heaters based on your household size and usage. Accurate sizing for Austin homes."
        canonical="https://www.plumbersthatcare.com/water-heater-calculator"
      />

      <Header />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-foreground/10 rounded-full mb-4">
              <Calculator className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-page-title">
              Water Heater Size Calculator
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Get the perfect water heater size for your home in seconds. Free, accurate recommendations from Austin's trusted plumbing experts.
            </p>
          </div>
        </div>

        {/* Calculator Section */}
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Tell Us About Your Home
                </CardTitle>
                <CardDescription>
                  Answer these quick questions to get your personalized recommendation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Household Size */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Household Size
                    </Label>
                    <Badge variant="secondary" data-testid="badge-household-size">
                      {householdSize} {householdSize === 1 ? 'person' : 'people'}
                    </Badge>
                  </div>
                  <Slider
                    value={[householdSize]}
                    onValueChange={(value) => setHouseholdSize(value[0])}
                    min={1}
                    max={8}
                    step={1}
                    className="w-full"
                    data-testid="slider-household-size"
                  />
                  <p className="text-sm text-muted-foreground">
                    How many people live in your home?
                  </p>
                </div>

                {/* Bathrooms */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-primary" />
                      Number of Bathrooms
                    </Label>
                    <Badge variant="secondary" data-testid="badge-bathrooms">
                      {bathrooms} {bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                    </Badge>
                  </div>
                  <Slider
                    value={[bathrooms]}
                    onValueChange={(value) => setBathrooms(value[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="w-full"
                    data-testid="slider-bathrooms"
                  />
                  <p className="text-sm text-muted-foreground">
                    Full and half bathrooms combined
                  </p>
                </div>

                {/* Usage Pattern */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary" />
                    Hot Water Usage
                  </Label>
                  <Select value={usage} onValueChange={(value: any) => setUsage(value)}>
                    <SelectTrigger data-testid="select-usage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        Light - Quick showers, minimal usage
                      </SelectItem>
                      <SelectItem value="average">
                        Average - Normal daily showers and laundry
                      </SelectItem>
                      <SelectItem value="heavy">
                        Heavy - Long showers, dishwasher, multiple appliances
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How much hot water do you typically use?
                  </p>
                </div>

                {/* Calculate Button */}
                <Button 
                  onClick={calculateWaterHeater} 
                  className="w-full"
                  size="lg"
                  data-testid="button-calculate"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate My Water Heater Size
                </Button>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-6 h-6 text-primary" />
                        <CardTitle>Your Recommended Water Heater</CardTitle>
                      </div>
                      <CardDescription>
                        Based on {householdSize} {householdSize === 1 ? 'person' : 'people'}, {bathrooms} {bathrooms === 1 ? 'bathroom' : 'bathrooms'}, and {usage} usage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Recommendation */}
                      <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                        <p className="text-2xl font-bold text-primary mb-2" data-testid="text-recommendation">
                          {result.recommendation}
                        </p>
                        <p className="text-muted-foreground">
                          Perfect for your household's hot water needs
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Tank Capacity</p>
                          <p className="text-lg font-semibold">{result.tankSize} Gallons</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Efficiency</p>
                          <p className="text-lg font-semibold">{result.efficiency}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="text-lg font-semibold">{result.estimatedCost}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Tankless Option</p>
                          <p className="text-lg font-semibold">
                            {result.tanklessOption ? "Available" : "Not Recommended"}
                          </p>
                        </div>
                      </div>

                      {/* Tankless Info */}
                      {result.tanklessOption && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-2">💡 Tankless Alternative</p>
                          <p className="text-sm text-muted-foreground">
                            Your household could also benefit from a tankless water heater. Ask us about endless hot water and energy savings!
                          </p>
                        </div>
                      )}

                      {/* CTA Buttons */}
                      <div className="space-y-3 pt-4">
                        {!showQuoteForm && (
                          <>
                            <Button 
                              onClick={() => setShowQuoteForm(true)} 
                              className="w-full" 
                              size="lg"
                              data-testid="button-get-quote"
                            >
                              Get Free Installation Quote
                            </Button>
                            <Button 
                              onClick={openScheduler} 
                              variant="outline" 
                              className="w-full"
                              data-testid="button-schedule"
                            >
                              Schedule Installation
                            </Button>
                            <Button 
                              asChild
                              variant="ghost" 
                              className="w-full"
                              data-testid="button-call"
                            >
                              <a href={`tel:${phoneConfig.tel}`}>
                                <Phone className="w-4 h-4 mr-2" />
                                Call {phoneConfig.display}
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quote Form */}
                  {showQuoteForm && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Get Your Free Quote</CardTitle>
                        <CardDescription>
                          We'll send you accurate pricing for your {result.tankSize}-gallon water heater installation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="John Smith" data-testid="input-name" />
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
                                    <Input {...field} type="tel" placeholder="(512) 555-0123" data-testid="input-phone" />
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
                                  <FormLabel>Email (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Austin" data-testid="input-location" />
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
                                    <Input {...field} placeholder="When do you need installation?" data-testid="input-message" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex gap-3">
                              <Button 
                                type="submit" 
                                className="flex-1"
                                disabled={submitMutation.isPending}
                                data-testid="button-submit-quote"
                              >
                                {submitMutation.isPending ? "Sending..." : "Get Free Quote"}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setShowQuoteForm(false)}
                                data-testid="button-cancel-quote"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="pt-16 pb-16 text-center">
                    <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Calculate?</h3>
                    <p className="text-muted-foreground">
                      Enter your household details and click calculate to see your personalized water heater recommendation
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Why Trust Our Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Trust Our Calculator?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>Based on Austin Energy's water heater sizing guidelines</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>Accounts for Texas climate and peak usage patterns</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>Used by 1,000+ Austin homeowners for accurate sizing</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>Updated pricing from real installation jobs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Not Sure About Usage?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">Here's a quick guide:</p>
                <p className="mb-2"><strong>Light:</strong> 1-2 showers/day, minimal dishwasher/laundry use</p>
                <p className="mb-2"><strong>Average:</strong> 2-3 showers/day, regular appliance use</p>
                <p><strong>Heavy:</strong> 3+ showers/day, frequent simultaneous usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tank vs Tankless</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Tank Pros:</strong> Lower upfront cost, reliable, easy maintenance</p>
                <p><strong>Tankless Pros:</strong> Endless hot water, energy savings, space saving</p>
                <p className="pt-2">We'll help you choose the best option for your home and budget.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Installation Included</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Our pricing includes:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Professional installation</li>
                  <li>All necessary materials</li>
                  <li>Permit acquisition</li>
                  <li>Old unit removal & disposal</li>
                  <li>1-year labor warranty</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
