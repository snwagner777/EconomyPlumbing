/**
 * SMS Signup Form Client Component
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

const smsSignupSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type SMSSignupFormData = z.infer<typeof smsSignupSchema>;

export function SMSForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SMSSignupFormData>({
    resolver: zodResolver(smsSignupSchema),
    defaultValues: {
      phone: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: SMSSignupFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/sms/subscribe', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({
        title: 'Successfully Subscribed!',
        description: 'You\'ll start receiving text alerts from Economy Plumbing.',
      });

      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Subscription Failed',
        description: 'Please try again or call us at (512) 368-9159.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="tel"
                  data-testid="input-phone"
                  placeholder="(512) 555-1234"
                  className="text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  data-testid="input-first-name"
                  placeholder="John"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  data-testid="input-last-name"
                  placeholder="Doe"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/30 p-4 rounded-lg text-sm">
          <p className="mb-2">
            By signing up, you agree to receive text messages from Economy Plumbing Services. 
            Message and data rates may apply. Message frequency varies.
          </p>
          <p>
            Reply STOP to unsubscribe or HELP for help at any time.
          </p>
        </div>

        <Button 
          type="submit"
          data-testid="button-submit-sms-signup"
          className="w-full text-lg"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing Up...' : 'Sign Me Up'}
        </Button>
      </form>
    </Form>
  );
}
