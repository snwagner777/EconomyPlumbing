import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Shield, Bell, CheckCircle } from "lucide-react";
import { Link } from "wouter";

const smsOptInSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Please enter a valid phone number")
    .regex(/^\+?1?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/, "Please enter a valid US phone number"),
  customerName: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to receive SMS messages"
  }),
  agreeToDataRate: z.boolean().refine(val => val === true, {
    message: "You must acknowledge message and data rates"
  })
});

type SMSOptInForm = z.infer<typeof smsOptInSchema>;

export default function SMSSignup() {
  const { toast } = useToast();
  const [optInComplete, setOptInComplete] = useState(false);

  const form = useForm<SMSOptInForm>({
    resolver: zodResolver(smsOptInSchema),
    defaultValues: {
      phoneNumber: "",
      customerName: "",
      email: "",
      agreeToTerms: false,
      agreeToDataRate: false
    }
  });

  const optInMutation = useMutation({
    mutationFn: async (data: SMSOptInForm) => {
      // Normalize phone number
      const normalizedPhone = data.phoneNumber.replace(/\D/g, '');
      const formattedPhone = normalizedPhone.length === 10
        ? `+1${normalizedPhone}`
        : normalizedPhone.length === 11 && normalizedPhone.startsWith('1')
          ? `+${normalizedPhone}`
          : `+1${normalizedPhone}`;

      const response = await fetch("/api/sms/opt-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          customerName: data.customerName,
          email: data.email || undefined,
          source: 'web_form'
          // IP address is captured server-side for TCPA compliance
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to opt-in');
      }

      return response.json();
    },
    onSuccess: () => {
      setOptInComplete(true);
      toast({
        title: "Success!",
        description: "You're now subscribed to SMS updates from Economy Plumbing Services",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to opt-in. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SMSOptInForm) => {
    optInMutation.mutate(data);
  };

  if (optInComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're All Set!</CardTitle>
            <CardDescription>
              You'll now receive exclusive SMS offers and updates from Economy Plumbing Services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <p className="font-medium">What to expect:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <Bell className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Special offers and seasonal promotions</span>
                </li>
                <li className="flex gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Service reminders and maintenance tips</span>
                </li>
                <li className="flex gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Emergency service availability alerts</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
              <p className="font-medium mb-1">Manage your preferences:</p>
              <p>Reply STOP to any message to unsubscribe at any time.</p>
              <p>Reply HELP for assistance.</p>
            </div>

            <Button
              asChild
              className="w-full"
              data-testid="button-return-home"
            >
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Stay Connected via Text</h1>
          <p className="text-xl text-muted-foreground">
            Get exclusive offers, service reminders, and plumbing tips sent directly to your phone
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Exclusive Offers</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Be the first to know about seasonal promotions and special discounts
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Service Reminders</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Never miss important maintenance with timely SMS reminders
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Easy Opt-Out</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Reply STOP anytime to unsubscribe - no questions asked
            </CardContent>
          </Card>
        </div>

        {/* Opt-In Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Sign Up for SMS Updates</CardTitle>
            <CardDescription>
              Join hundreds of Austin homeowners staying informed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Smith"
                          {...field}
                          data-testid="input-customer-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(512) 555-0100"
                          {...field}
                          data-testid="input-phone-number"
                        />
                      </FormControl>
                      <FormDescription>
                        US mobile number required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        For account management and receipts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TCPA Compliance Disclosures */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agree-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            I agree to receive promotional and informational SMS messages from Economy Plumbing Services.
                            I understand that I can opt-out at any time by replying STOP. {' '}
                            <span className="font-medium">Consent is not a condition of purchase.</span>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreeToDataRate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agree-data-rate"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            I acknowledge that message and data rates may apply, and message frequency varies.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    By signing up, you agree to our{' '}
                    <Link href="/privacy-policy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/terms-of-service" className="underline hover:text-foreground">
                      Terms of Service
                    </Link>.
                  </p>
                  <p>
                    Reply HELP for help. Message frequency varies. Message and data rates may apply.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={optInMutation.isPending}
                  data-testid="button-submit-opt-in"
                >
                  {optInMutation.isPending ? "Subscribing..." : "Subscribe to SMS Updates"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <p className="mb-2">
            Economy Plumbing Services respects your privacy. We will never sell your information to third parties.
          </p>
          <p>
            For questions about our SMS program, email us at{' '}
            <a href="mailto:info@plumbersthatcare.com" className="underline hover:text-foreground">
              info@plumbersthatcare.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
