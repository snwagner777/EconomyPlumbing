'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';
import { useToast } from '@/hooks/use-toast';

interface CustomerInfoStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CustomerInfoStep({ data, updateData, onNext, onBack }: CustomerInfoStepProps) {
  const [phone, setPhone] = useState(data.customer?.phone || '');
  const [email, setEmail] = useState(data.customer?.email || '');
  const [name, setName] = useState(data.customer?.name || '');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!phone && !email) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a phone number or email to look up your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await fetch('/api/scheduler/lookup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined }),
      });

      const result = await response.json();

      if (result.success && result.customer) {
        setLookupResult(result);
        setName(result.customer.name);
        setEmail(result.customer.email || email);
        setPhone(result.customer.phoneNumber || phone);

        toast({
          title: 'Welcome Back!',
          description: `We found your account, ${result.customer.name}!`,
        });
      } else {
        setLookupResult({ isNew: true });
        toast({
          title: 'New Customer',
          description: "We'll create a new account for you. Please complete your information below.",
        });
      }
    } catch (error) {
      toast({
        title: 'Lookup Failed',
        description: 'Unable to check customer records. Please continue as a new customer.',
        variant: 'destructive',
      });
      setLookupResult({ isNew: true });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleContinue = () => {
    if (!name || !phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and phone number.',
        variant: 'destructive',
      });
      return;
    }

    updateData({
      customer: {
        id: lookupResult?.customer?.id,
        name,
        email,
        phone,
        isExisting: !!lookupResult?.customer?.id,
      },
    });
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-customer-title">
          Your Contact Information
        </h2>
        <p className="text-muted-foreground" data-testid="text-customer-subtitle">
          We'll check if you're an existing customer to make booking faster
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            Enter your phone or email to check for existing account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lookup Section */}
          {!lookupResult && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(512) 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
              </div>
              <Button
                onClick={handleLookup}
                disabled={isLookingUp || (!phone && !email)}
                className="w-full"
                size="lg"
                data-testid="button-lookup"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking Up Account...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Check for Existing Account
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Existing Customer */}
          {lookupResult?.customer && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <UserCheck className="w-5 h-5" />
                  <span className="font-semibold">Existing Customer Found</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Welcome back! We've pre-filled your information.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-existing">Full Name</Label>
                  <Input
                    id="name-existing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={phone} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={email} readOnly className="bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Customer */}
          {lookupResult?.isNew && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-accent-foreground mb-2">
                  <UserPlus className="w-5 h-5" />
                  <span className="font-semibold">New Customer</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please complete your information below to create your account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-new">Full Name *</Label>
                  <Input
                    id="name-new"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input value={phone} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      data-testid="input-email-editable"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {lookupResult && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
                data-testid="button-back"
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1"
                size="lg"
                data-testid="button-continue-customer"
              >
                Continue to Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
