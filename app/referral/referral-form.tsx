/**
 * Referral Form Client Component
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const referralSchema = z.object({
  referrerName: z.string().min(2, 'Name must be at least 2 characters'),
  referrerPhone: z.string().min(10, 'Please enter a valid phone number'),
  referrerEmail: z.string().email('Please enter a valid email'),
  refereeName: z.string().min(2, 'Name must be at least 2 characters'),
  refereePhone: z.string().min(10, 'Please enter a valid phone number'),
  refereeEmail: z.string().email('Please enter a valid email'),
});

type ReferralFormData = z.infer<typeof referralSchema>;

export function ReferralForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referrerName: '',
      referrerPhone: '',
      referrerEmail: '',
      refereeName: '',
      refereePhone: '',
      refereeEmail: '',
    },
  });

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/referrals/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({
        title: 'Referral Submitted!',
        description: 'Thank you for referring a friend. We\'ll be in touch soon.',
      });

      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Please try again or call us at (512) 368-9159.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="referrerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    data-testid="input-referrer-name"
                    placeholder="John Doe"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referrerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Phone</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="tel"
                    data-testid="input-referrer-phone"
                    placeholder="(512) 368-9159"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="referrerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  data-testid="input-referrer-email"
                  placeholder="john@example.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Friend's Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="refereeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-referee-name"
                      placeholder="Jane Smith"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refereePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Phone</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="tel"
                      data-testid="input-referee-phone"
                      placeholder="(512) 123-4567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="refereeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      data-testid="input-referee-email"
                      placeholder="jane@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button 
          type="submit"
          data-testid="button-submit-referral"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Referral'}
        </Button>
      </form>
    </Form>
  );
}
