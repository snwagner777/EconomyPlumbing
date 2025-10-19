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
  Snowflake, 
  AlertTriangle, 
  CheckCircle, 
  Phone, 
  Clock, 
  Droplet,
  ThermometerSnowflake,
  Wrench,
  Shield,
  Home
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

const winterChecklist: ChecklistItem[] = [
  { id: "disconnect-hoses", title: "Disconnect Garden Hoses", description: "Remove and drain all outdoor hoses to prevent pipe damage", critical: true },
  { id: "insulate-pipes", title: "Insulate Exposed Pipes", description: "Wrap pipes in unheated areas (garage, crawl space, attic) with foam insulation", critical: true },
  { id: "drain-sprinklers", title: "Drain Sprinkler System", description: "Winterize your irrigation system to prevent freeze damage", critical: true },
  { id: "outdoor-faucets", title: "Cover Outdoor Faucets", description: "Install insulated faucet covers on all exterior spigots", critical: true },
  { id: "drip-faucets", title: "Know How to Drip Faucets", description: "During freezes, let faucets drip slightly to prevent pipe bursts", critical: true },
  { id: "locate-shutoff", title: "Locate Main Water Shutoff", description: "Know where your main water shutoff valve is in case of emergency", critical: true },
  { id: "water-heater", title: "Service Water Heater", description: "Flush and inspect water heater for winter efficiency", critical: false },
  { id: "cabinet-doors", title: "Open Cabinet Doors During Freezes", description: "Allow warm air to circulate around pipes under sinks", critical: false },
  { id: "emergency-plan", title: "Have Emergency Contact Info", description: "Save our 24/7 emergency number for quick response", critical: false },
  { id: "check-insulation", title: "Check Attic Insulation", description: "Proper insulation helps prevent pipes from freezing", critical: false },
];

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function WinterFreezeProtection() {
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
        source: "winter-freeze-protection",
        message: `Winter Freeze Protection Request\n\nChecklist Progress: ${checkedItems.length}/${winterChecklist.length} items completed\n\nAdditional Details:\n${data.message || "None"}`,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "We'll contact you soon to schedule your winter preparation service.",
      });
      trackEvent('Winter Protection Request', 'Seasonal Landing', `${checkedItems.length} items checked`);
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

  const completionPercentage = Math.round((checkedItems.length / winterChecklist.length) * 100);
  const criticalItems = winterChecklist.filter(item => item.critical);
  const criticalCompleted = checkedItems.filter(id => 
    winterChecklist.find(item => item.id === id && item.critical)
  ).length;

  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  return (
    <>
      <SEOHead
        title="Winter Freeze Protection Austin TX | Prevent Frozen Pipes | Economy Plumbing"
        description="Protect your Austin home from winter freeze damage. Expert pipe insulation, winterization services, and 24/7 emergency frozen pipe repair. Don't wait until it's too late!"
        canonical="/winter-freeze-protection"
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-background dark:from-blue-950/20 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Snowflake className="w-12 h-12 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Winter Freeze Protection
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Don't let a Texas cold snap burst your pipes! Protect your Austin-area home with our comprehensive winterization checklist and professional services.
            </p>
            
            {/* Emergency Banner */}
            <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <p className="text-lg font-semibold">
                  Already have frozen pipes? Call us now for 24/7 emergency service!
                </p>
              </div>
              <Button
                asChild
                size="lg"
                variant="destructive"
                className="mt-3"
                data-testid="button-emergency-call"
              >
                <a href={`tel:${phoneConfig.tel}`}>
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency: {phoneConfig.display}
                </a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <ThermometerSnowflake className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="text-3xl font-bold">32°F</p>
                <p className="text-sm text-muted-foreground">Pipes can freeze</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Droplet className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="text-3xl font-bold">$5,000+</p>
                <p className="text-sm text-muted-foreground">Average burst pipe damage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Emergency response</p>
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
                        Winter Preparation Checklist
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Complete these steps before the next freeze to protect your plumbing
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
                          <AlertTriangle className="w-4 h-4 text-primary" />
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
                  {winterChecklist.map((item) => (
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
                              <Badge variant="destructive" className="flex-shrink-0">
                                Critical
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

              {/* Why It Matters */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Why Winter Preparation Matters in Austin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    While Austin doesn't face harsh winters like northern states, sudden freezes can be devastating because:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Homes aren't built for it:</strong> Many Austin homes lack the insulation common in colder climates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Sudden temperature drops:</strong> Pipes can freeze before you realize it's happening</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Costly damage:</strong> A single burst pipe can cause thousands in water damage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>High demand:</strong> Everyone calls at once during freezes - preparation prevents emergencies</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Professional Help CTA */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Need Professional Help?
                    </CardTitle>
                    <CardDescription>
                      Let us winterize your plumbing system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showForm ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Complete pipe insulation</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Outdoor faucet protection</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Water heater inspection</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>Emergency preparedness review</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => setShowForm(true)}
                            className="w-full"
                            size="lg"
                            data-testid="button-schedule-winterization"
                          >
                            Schedule Winterization
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            data-testid="button-call-for-service"
                          >
                            <a href={`tel:${phoneConfig.tel}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call: {phoneConfig.display}
                            </a>
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          Don't wait for the forecast! Book your winterization service today.
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
                                    <Input {...field} data-testid="input-winter-name" />
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
                                    <Input type="email" {...field} data-testid="input-winter-email" />
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
                                    <Input type="tel" {...field} data-testid="input-winter-phone" />
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
                                      placeholder="Any specific concerns or areas needing attention..."
                                      rows={3}
                                      data-testid="input-winter-message"
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
                              data-testid="button-submit-winter-request"
                            >
                              {contactMutation.isPending ? "Sending..." : "Request Service"}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      During a Freeze
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Droplet className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Let faucets drip when temps drop below 32°F</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Keep garage doors closed to protect water heaters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ThermometerSnowflake className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Open cabinet doors under sinks to allow warm air circulation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Call us immediately if you suspect frozen pipes</span>
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
