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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Phone, Mail, Loader2, CheckCircle, AlertCircle, Home, Building2 } from 'lucide-react';

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

interface CustomerMatch {
  customerId: number;
  customerName: string;
  customerType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

export function PhoneLookupModal({
  open,
  onOpenChange,
  onSuccess,
  title = 'Find Your Account',
  description = 'We\'ll look up your account or create a new one for you.',
}: PhoneLookupModalProps) {
  const [step, setStep] = useState<'lookup' | 'accountSelection' | 'customerType' | 'complete'>('lookup');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('phone');
  const [customerType, setCustomerType] = useState<'residential' | 'commercial'>('residential');
  const [pendingLookupData, setPendingLookupData] = useState<LookupFormData | null>(null);
  const [customerData, setCustomerData] = useState<{ customerId: number; customerName: string; phone: string } | null>(null);
  const [accountMatches, setAccountMatches] = useState<CustomerMatch[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

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

      // Multiple accounts found - show selection
      if (result.multipleMatches) {
        setAccountMatches(result.matches);
        setPendingLookupData(data);
        setStep('accountSelection');
        setStatus('idle');
        return;
      }

      // If this is a new customer, ask for customer type
      if (result.isNewCustomer) {
        setPendingLookupData(data);
        setStep('customerType');
        setStatus('idle');
      } else {
        // Single existing customer - proceed directly to success
        setStatus('success');
        setCustomerData({
          customerId: result.customerId,
          customerName: result.customerName,
          phone: data.lookupType === 'phone' ? data.phone : result.phone || '',
        });
        
        setTimeout(() => {
          onSuccess({
            customerId: result.customerId,
            customerName: result.customerName,
            phone: data.lookupType === 'phone' ? data.phone : result.phone || '',
          });
        }, 500);
      }

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred');
    }
  }

  function handleAccountSelect() {
    if (!selectedAccountId || !pendingLookupData) return;

    const selectedAccount = accountMatches.find(a => a.customerId === selectedAccountId);
    if (!selectedAccount) return;

    setStatus('success');
    setCustomerData({
      customerId: selectedAccount.customerId,
      customerName: selectedAccount.customerName,
      phone: pendingLookupData.lookupType === 'phone' ? pendingLookupData.phone : '',
    });
    
    setTimeout(() => {
      onSuccess({
        customerId: selectedAccount.customerId,
        customerName: selectedAccount.customerName,
        phone: pendingLookupData.lookupType === 'phone' ? pendingLookupData.phone : '',
      });
    }, 500);
  }

  async function handleCustomerTypeSubmit() {
    if (!pendingLookupData) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const payload = pendingLookupData.lookupType === 'phone' 
        ? { phone: pendingLookupData.phone, customerType }
        : { email: pendingLookupData.email, customerType };

      const response = await fetch('/api/public/lookup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create customer');
      }

      setStatus('success');
      setCustomerData({
        customerId: result.customerId,
        customerName: result.customerName,
        phone: pendingLookupData.lookupType === 'phone' ? pendingLookupData.phone : result.phone || '',
      });
      
      setTimeout(() => {
        onSuccess({
          customerId: result.customerId,
          customerName: result.customerName,
          phone: pendingLookupData.lookupType === 'phone' ? pendingLookupData.phone : result.phone || '',
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
      setStep('lookup');
      setStatus('idle');
      setErrorMessage('');
      setCustomerType('residential');
      setPendingLookupData(null);
      setCustomerData(null);
      setAccountMatches([]);
      setSelectedAccountId(null);
      form.reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'lookup' && title}
            {step === 'accountSelection' && 'Select Your Account'}
            {step === 'customerType' && 'Select Customer Type'}
          </DialogTitle>
          <DialogDescription>
            {step === 'lookup' && description}
            {step === 'accountSelection' && 'We found multiple accounts. Please select the one you want to use.'}
            {step === 'customerType' && 'Are you a residential or commercial customer?'}
          </DialogDescription>
        </DialogHeader>

        {step === 'lookup' ? (
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
        ) : step === 'accountSelection' ? (
          <div className="space-y-6">
            <RadioGroup
              value={selectedAccountId?.toString() || ''}
              onValueChange={(value) => setSelectedAccountId(parseInt(value))}
              className="grid gap-4"
            >
              {accountMatches.map((account) => (
                <div 
                  key={account.customerId}
                  className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover-elevate"
                  onClick={() => setSelectedAccountId(account.customerId)}
                >
                  <RadioGroupItem 
                    value={account.customerId.toString()} 
                    id={`account-${account.customerId}`}
                    data-testid={`radio-account-${account.customerId}`}
                  />
                  <label 
                    htmlFor={`account-${account.customerId}`} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{account.customerName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.customerType === 'Residential' ? (
                            <span className="inline-flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              Residential
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Commercial
                            </span>
                          )}
                        </p>
                        {account.address && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {account.address.street}, {account.address.city}, {account.address.state} {account.address.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>

            {status === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  Account selected! Proceeding to checkout...
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('lookup')}
                disabled={status === 'loading' || status === 'success'}
                data-testid="button-back-from-account-select"
              >
                Back
              </Button>
              <Button
                onClick={handleAccountSelect}
                disabled={!selectedAccountId || status === 'loading' || status === 'success'}
                data-testid="button-submit-account-select"
              >
                {status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                {status === 'success' ? 'Success!' : 'Continue'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <RadioGroup
              value={customerType}
              onValueChange={(value) => setCustomerType(value as 'residential' | 'commercial')}
              className="grid gap-4"
            >
              <div 
                className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover-elevate"
                onClick={() => setCustomerType('residential')}
              >
                <RadioGroupItem value="residential" id="new-residential" data-testid="radio-new-residential" />
                <label htmlFor="new-residential" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Home className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">Residential</p>
                    <p className="text-sm text-muted-foreground">For your home or personal property</p>
                  </div>
                </label>
              </div>
              
              <div 
                className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover-elevate"
                onClick={() => setCustomerType('commercial')}
              >
                <RadioGroupItem value="commercial" id="new-commercial" data-testid="radio-new-commercial" />
                <label htmlFor="new-commercial" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Building2 className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">Commercial</p>
                    <p className="text-sm text-muted-foreground">For your business or commercial property</p>
                  </div>
                </label>
              </div>
            </RadioGroup>

            {status === 'error' && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Error Creating Account</p>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  Account created! Proceeding to checkout...
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('lookup')}
                disabled={status === 'loading' || status === 'success'}
                data-testid="button-back-to-lookup"
              >
                Back
              </Button>
              <Button
                onClick={handleCustomerTypeSubmit}
                disabled={status === 'loading' || status === 'success'}
                data-testid="button-submit-customer-type"
              >
                {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                {status === 'idle' || status === 'error' ? 'Continue' : status === 'loading' ? 'Creating Account...' : 'Success!'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
