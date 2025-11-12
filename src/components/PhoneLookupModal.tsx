/**
 * Customer Lookup Modal - Public Pages
 * 
 * Reusable modal for phone/email-based customer lookup/creation
 * Used for: membership purchases, quote requests, scheduler (public)
 * Reuses same modules as scheduler and customer portal
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const phoneSchema = z.object({
  lookupType: z.literal('phone'),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\.]+$/, 'Phone number can only contain numbers and formatting characters')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, 'Phone number must be exactly 10 digits'),
});

const emailSchema = z.object({
  lookupType: z.literal('email'),
  email: z.string().email('Valid email is required'),
});

const lookupSchema = z.discriminatedUnion('lookupType', [phoneSchema, emailSchema]);

type LookupFormData = z.infer<typeof lookupSchema>;

interface PhoneLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: { customerId: number; customerName: string; phone: string }) => void;
  title?: string;
  description?: string;
}

export function PhoneLookupModal({
  open,
  onOpenChange,
  onSuccess,
  title = 'Find Your Account',
  description = 'We\'ll look up your account or create a new one for you.',
}: PhoneLookupModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('phone');

  const form = useForm<LookupFormData>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      lookupType: 'phone',
      phone: '',
    },
  });

  async function handleSubmit(data: LookupFormData) {
    setStatus('loading');
    setErrorMessage('');

    try {
      const payload = data.lookupType === 'phone' 
        ? { phone: data.phone }
        : { email: data.email };

      const response = await fetch('/api/public/lookup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to lookup customer');
      }

      setStatus('success');
      
      // Call success callback with customer data
      setTimeout(() => {
        onSuccess({
          customerId: result.customerId,
          customerName: result.customerName,
          phone: data.lookupType === 'phone' ? data.phone : result.phone || '',
        });
      }, 500);

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred');
    }
  }

  function handleLookupTypeChange(type: 'phone' | 'email') {
    setLookupType(type);
    form.setValue('lookupType', type);
    setStatus('idle');
    setErrorMessage('');
  }

  function handleClose() {
    if (status !== 'loading') {
      setStatus('idle');
      setErrorMessage('');
      form.reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={lookupType} onValueChange={(value) => handleLookupTypeChange(value as 'phone' | 'email')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone" data-testid="tab-phone">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {lookupType === 'phone' ? (
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="(512) 555-1234"
                          className="pl-10"
                          disabled={status === 'loading' || status === 'success'}
                          data-testid="input-phone-lookup"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          disabled={status === 'loading' || status === 'success'}
                          data-testid="input-email-lookup"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {status === 'error' && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Lookup Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  Account verified! Proceeding to checkout...
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={status === 'loading' || status === 'success'}
                data-testid="button-cancel-lookup"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                data-testid="button-submit-lookup"
              >
                {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                {status === 'idle' || status === 'error' ? 'Continue' : status === 'loading' ? 'Looking up...' : 'Success!'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
