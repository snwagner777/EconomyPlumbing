'use client';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Phone, Calendar, CheckCircle } from "lucide-react";

const refereeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits (no spaces or dashes)"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type RefereeForm = z.infer<typeof refereeFormSchema>;

export default function ReferralOffer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  
  const referralCode = searchParams?.get("code") || "";
  
  // Convert code to readable name (JOHN-SMITH → John Smith)
  const referrerName = referralCode
    .split('-')
    .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

  // Redirect if no referral code
  useEffect(() => {
    if (!referralCode) {
      router.push("/");
    }
  }, [referralCode, router]);

  const form = useForm<RefereeForm>({
    resolver: zodResolver(refereeFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: RefereeForm) => {
      return apiRequest("POST", "/api/referrals/capture-referee", {
        referralCode,
        refereeName: data.name,
        refereePhone: data.phone,
        refereeEmail: data.email || null,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Information Received!",
        description: "Choose how you'd like to schedule your service below.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save information. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleSubmit = (data: RefereeForm) => {
    submitMutation.mutate(data);
  };

  // Show loading state while redirecting
  if (!referralCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const schedulerUrl = "https://go.servicetitan.com/";
  const phoneNumber = "(512) 649-2811";
  const phoneLink = "tel:+15126492811";

  return (
    <>
      <SEOHead
        title={`Special Referral Offer - $25 Off Your Service | Economy Plumbing`}
        description={`You've been referred to Economy Plumbing! Get $25 off your first service. Professional plumbing services in Austin and Marble Falls, TX.`}
        canonical="/referral-offer"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              You've Been Referred!
            </h1>
            <p className="text-xl text-muted-foreground">
              {referrerName ? `${referrerName} recommended our service` : 'A friend recommended our service'}
            </p>
          </div>

          {/* Offer Details */}
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Special Referral Offer</CardTitle>
              <CardDescription className="text-base">
                You and your friend each get $25 off!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">How It Works:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Provide your contact information below</li>
                      <li>Schedule your plumbing service</li>
                      <li>After your service is complete, you both get $25 credit</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!submitted ? (
            /* Info Capture Form */
            <Card>
              <CardHeader>
                <CardTitle>Get Started - Claim Your Discount</CardTitle>
                <CardDescription>
                  Tell us who you are so we can apply your $25 discount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              data-testid="input-referee-name"
                            />
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
                          <FormLabel>Your Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="5125551234"
                              data-testid="input-referee-phone"
                            />
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
                          <FormLabel>Your Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="you@example.com"
                              data-testid="input-referee-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-referee-info"
                    >
                      {submitMutation.isPending ? "Saving..." : "Continue to Schedule Service"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            /* Scheduling Options */
            <div className="space-y-4">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Ready to Schedule?</CardTitle>
                  <CardDescription>
                    Choose how you'd like to book your service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    size="lg"
                    className="w-full h-auto py-4"
                    onClick={() => window.open(schedulerUrl, "_blank")}
                    data-testid="button-schedule-online"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Schedule Online</div>
                      <div className="text-xs opacity-90">Pick your time instantly</div>
                    </div>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-auto py-4"
                    onClick={() => window.location.href = phoneLink}
                    data-testid="button-call-us"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Call Us: {phoneNumber}</div>
                      <div className="text-xs opacity-90">Speak with our team directly</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground">
                Your $25 discount will be automatically applied after your service is complete
              </p>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-xs text-muted-foreground">Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9/5</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">$25</div>
              <div className="text-xs text-muted-foreground">Your Discount</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
