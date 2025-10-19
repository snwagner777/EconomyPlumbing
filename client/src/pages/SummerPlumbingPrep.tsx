import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sun,
  CheckCircle,
  Phone,
  Droplet,
  Wind,
  Wrench,
  Shield,
  Sprout,
  ThermometerSun,
  Waves
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { trackEvent } from "@/lib/analytics";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  critical: boolean;
}

const summerChecklist: ChecklistItem[] = [
  { id: "ac-drain", title: "Check AC Condensate Drain", description: "Ensure your air conditioner's drain line is clear to prevent overflow", critical: true },
  { id: "water-heater", title: "Service Water Heater", description: "Flush sediment and check for efficiency before high summer demand", critical: true },
  { id: "sprinkler-system", title: "Inspect Sprinkler System", description: "Check for leaks, adjust heads, and set timers for efficient watering", critical: true },
  { id: "outdoor-faucets", title: "Test Outdoor Faucets & Hoses", description: "Check for leaks after winter and replace damaged hoses", critical: true },
  { id: "sewer-line", title: "Inspect Sewer Line", description: "Tree roots grow aggressively in summer - prevent backups with an inspection", critical: true },
  { id: "washing-machine", title: "Check Washing Machine Hoses", description: "Inspect for cracks or bulges that could cause flooding", critical: false },
  { id: "toilet-leaks", title: "Test Toilets for Leaks", description: "Add food coloring to tank - if it appears in bowl without flushing, you have a leak", critical: false },
  { id: "garbage-disposal", title: "Clean Garbage Disposal", description: "Deep clean with ice cubes and citrus to prevent odors", critical: false },
  { id: "water-pressure", title: "Check Water Pressure", description: "Low pressure could indicate hidden leaks or mineral buildup", critical: false },
  { id: "sump-pump", title: "Test Sump Pump", description: "Pour water into pit to ensure it activates before storm season", critical: false },
];

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function SummerPlumbingPrep() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const phoneConfig = usePhoneConfig();
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiRequest("POST", "/api/contact", {
        ...data,
        source: "summer-plumbing-prep",
        message: `Summer Plumbing Prep Request\n\nChecklist Progress: ${checkedItems.length}/${summerChecklist.length} items completed\n\nAdditional Details:\n${data.message || "None"}`,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "We'll contact you soon to schedule your summer plumbing service.",
      });
      trackEvent('Summer Prep Request', 'Seasonal Landing', `${checkedItems.length} items checked`);
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again or call us.",
        variant: "destructive",
      });
    },
  });

  const handleCheckItem = (itemId: string) => {
    setCheckedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const completionPercentage = Math.round((checkedItems.length / summerChecklist.length) * 100);
  const criticalItems = summerChecklist.filter(item => item.critical);
  const criticalCompleted = checkedItems.filter(id => 
    summerChecklist.find(item => item.id === id && item.critical)
  ).length;

  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  return (
    <>
      <SEOHead
        title="Summer Plumbing Prep Austin TX | AC Drain, Sprinklers & More | Economy Plumbing"
        description="Prepare your Austin home for summer with our comprehensive plumbing checklist. AC condensate drains, sprinkler systems, water heater service, and more. Beat the heat!"
        canonical="/summer-plumbing-prep"
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sun className="w-12 h-12 text-orange-500" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Summer Plumbing Prep
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Beat the Texas heat! Prepare your Austin-area home's plumbing for summer with our comprehensive maintenance checklist and professional services.
            </p>
            
            <div className="bg-orange-100 dark:bg-orange-950/30 border-2 border-orange-300 dark:border-orange-800 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-lg font-semibold mb-3">
                Summer puts extra stress on your plumbing system. Get ahead of problems before they start!
              </p>
              <Button
                asChild
                size="lg"
                className="bg-orange-600 hover:bg-orange-700"
                data-testid="button-schedule-summer-service"
              >
                <a href="#contact-form">
                  Schedule Summer Service
                </a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <ThermometerSun className="w-10 h-10 mx-auto mb-3 text-orange-500" />
                <p className="text-3xl font-bold">100°F+</p>
                <p className="text-sm text-muted-foreground">Average Texas summer temps</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Droplet className="w-10 h-10 mx-auto mb-3 text-orange-500" />
                <p className="text-3xl font-bold">50%+</p>
                <p className="text-sm text-muted-foreground">Increase in water usage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Wind className="w-10 h-10 mx-auto mb-3 text-orange-500" />
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">AC & plumbing support</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checklist */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-primary" />
                        Summer Plumbing Checklist
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Complete these tasks to keep your plumbing running smoothly all summer
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-medium">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    
                    {/* Critical Items Counter */}
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold flex items-center gap-2">
                          <Sun className="w-4 h-4 text-primary" />
                          Critical Items
                        </span>
                        <span className="text-sm font-semibold">
                          {criticalCompleted}/{criticalItems.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summerChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 transition-all ${
                        checkedItems.includes(item.id)
                          ? "bg-primary/5 border-primary/30"
                          : "hover-elevate"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={checkedItems.includes(item.id)}
                          onCheckedChange={() => handleCheckItem(item.id)}
                          className="mt-1"
                          data-testid={`checkbox-${item.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold">{item.title}</h3>
                            {item.critical && (
                              <Badge className="flex-shrink-0 bg-orange-600">
                                Important
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Why Summer Prep Matters */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-orange-500" />
                    Why Summer Plumbing Prep Matters in Austin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Texas summers are brutal on your home's plumbing system. Here's why preparation is essential:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Increased AC demand:</strong> Your condensate drain works overtime and can overflow if clogged</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Heavy lawn watering:</strong> Sprinkler systems face constant use and hidden leaks waste thousands of gallons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Tree root intrusion:</strong> Roots seek water aggressively in summer, invading sewer lines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Higher water bills:</strong> Small leaks become expensive problems with increased summer usage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Vacation risks:</strong> Leaving for summer vacation? A hidden leak could flood your home</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1" id="contact-form">
              <div className="sticky top-6 space-y-6">
                {/* Professional Help CTA */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Professional Summer Service
                    </CardTitle>
                    <CardDescription>
                      Let us prepare your plumbing for summer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showForm ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>AC condensate drain cleaning</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Sprinkler system inspection & repair</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Water heater flush & service</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Leak detection & repair</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Sewer line camera inspection</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => setShowForm(true)}
                            className="w-full"
                            size="lg"
                            data-testid="button-schedule-summer-prep"
                          >
                            Schedule Service
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            data-testid="button-call-for-summer-service"
                          >
                            <a href={`tel:${phoneConfig.tel}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call: {phoneConfig.display}
                            </a>
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          Book now before the summer rush! Same-day service available.
                        </p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <Button
                          onClick={() => setShowForm(false)}
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          Hide Form
                        </Button>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-summer-name" />
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
                                    <Input type="email" {...field} data-testid="input-summer-email" />
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
                                    <Input type="tel" {...field} data-testid="input-summer-phone" />
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
                                      placeholder="Any specific concerns or services needed..."
                                      rows={3}
                                      data-testid="input-summer-message"
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
                              data-testid="button-submit-summer-request"
                            >
                              {contactMutation.isPending ? "Sending..." : "Request Service"}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Water Saving Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Water Saving Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Sprout className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Water lawn early morning or evening to reduce evaporation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Waves className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Fix dripping faucets - even small leaks waste gallons daily</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Droplet className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Install low-flow showerheads and faucet aerators</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Run full loads in dishwasher and washing machine</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
