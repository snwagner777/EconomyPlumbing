'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Gift, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const refereeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  serviceInterest: z.string().optional(),
});

type RefereeFormData = z.infer<typeof refereeFormSchema>;

interface ReferralLandingClientProps {
  referralCode: string;
  referrerName: string | null;
}

export default function ReferralLandingClient({ referralCode, referrerName }: ReferralLandingClientProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RefereeFormData>({
    resolver: zodResolver(refereeFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      serviceInterest: '',
    },
  });

  const onSubmit = async (data: RefereeFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/referrals/capture-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      const result = await response.json();

      toast({
        title: 'Information Received!',
        description: 'Redirecting you to schedule your appointment...',
      });

      // Redirect to scheduler with referral token
      setTimeout(() => {
        window.location.href = result.schedulerUrl;
      }, 1500);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Please try again or call us at (512) 877-8234.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary" data-testid="badge-special-offer">
            <Gift className="w-4 h-4 mr-2" />
            Special Referral Offer
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="heading-main">
            {referrerName ? (
              <>
                <span className="text-primary">{referrerName}</span> Thinks You'll Love Us!
              </>
            ) : (
              "Welcome! You've Been Referred"
            )}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            Get $25 off your first service of $200 or more
          </p>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">$25 Instant Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Applied automatically on services $200 or more
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Trusted by Neighbors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Referred by someone who knows quality work
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Austin's Best</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Top-rated plumbing services since day one
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Claim Your $25 Discount</CardTitle>
            <CardDescription>
              Enter your information below to schedule your appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Smith"
                          data-testid="input-referee-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="(512) 555-1234"
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
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@example.com"
                            data-testid="input-referee-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What plumbing service do you need? (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., leaky faucet, water heater repair, drain cleaning..."
                          rows={3}
                          data-testid="input-service-interest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground text-center">
                    After submitting, you'll be taken to our scheduler to book your appointment.
                    Your $25 discount will be applied automatically!
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                  data-testid="button-continue-to-schedule"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Scheduling →'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions? Call us at{' '}
            <a href="tel:512-877-8234" className="text-primary hover:underline">
              (512) 877-8234
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
