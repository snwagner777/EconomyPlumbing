'use client';
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Loader2, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "Please provide either your email or phone number",
    path: ["email"],
  }
);

type ContactFormData = z.infer<typeof contactSchema>;

interface ReferrerInfo {
  name: string;
  customerId: number;
}

export default function ReferredBy() {
  const { referrerCustomerId } = useParams<{ referrerCustomerId: string }>();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Check if user has already submitted (via cookie)
  useEffect(() => {
    const hasSubmitted = localStorage.getItem(`referral_submitted_${referrerCustomerId}`);
    if (hasSubmitted) {
      // Already submitted, redirect to homepage after showing message
      setSubmitted(true);
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    }
  }, [referrerCustomerId, setLocation]);

  // Fetch referrer info
  const { data: referrerData, isLoading: loadingReferrer } = useQuery<ReferrerInfo>({
    queryKey: ['/api/referrals/referrer', referrerCustomerId],
    enabled: !!referrerCustomerId && !submitted,
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const res = await fetch('/api/referrals/capture-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerCustomerId: parseInt(referrerCustomerId!),
          refereeName: data.name,
          refereeEmail: data.email || null,
          refereePhone: data.phone || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit contact info');
      }

      return res.json();
    },
    onSuccess: () => {
      // Mark as submitted in localStorage
      localStorage.setItem(`referral_submitted_${referrerCustomerId}`, 'true');
      
      setSubmitted(true);
      toast({
        title: "Thank you!",
        description: "You're all set. Redirecting to our homepage...",
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (loadingReferrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!referrerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Referral Link</CardTitle>
            <CardDescription>
              This referral link appears to be invalid or expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-go-home">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-primary/5 to-background p-4">
        <SEOHead
          title="Welcome! | Economy Plumbing Austin"
          description="Thanks for visiting Economy Plumbing through a referral"
          canonical="/referred-by"
        />
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PartyPopper className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're All Set!</CardTitle>
            <CardDescription>
              Redirecting you to our homepage...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-primary/5 to-background p-4">
      <SEOHead
        title={`${referrerData.name} Referred You | Economy Plumbing Austin`}
        description="A friend referred you to Economy Plumbing! Get $25 off your first service."
        canonical="/referred-by"
      />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Gift className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-referrer-name">
            Your friend <span className="text-primary">{referrerData.name}</span> referred you!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            To help us track this referral and ensure {referrerData.name} gets credit, 
            please provide your contact information before browsing our site.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6">
            <Gift className="w-4 h-4" />
            <AlertDescription>
              <strong>You'll get $25 off your first service!</strong><br />
              Valid on jobs $200 or more. We'll apply the discount automatically.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} data-testid="input-name" />
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
                      <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      We'll only use this to track the referral
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(512) 555-1234" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      At least one contact method required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Continue to Website"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By continuing, you allow us to track this referral so {referrerData.name} can receive their $25 credit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
