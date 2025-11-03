'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, MapPin, Calendar, User, Wrench } from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface BookingSummaryStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onBack: () => void;
  initialReferralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function BookingSummaryStep({ 
  data, 
  updateData, 
  onBack,
  initialReferralCode,
  utmSource,
  utmMedium,
  utmCampaign
}: BookingSummaryStepProps) {
  const [specialInstructions, setSpecialInstructions] = useState(data.specialInstructions || '');
  const [promoCode, setPromoCode] = useState(initialReferralCode || '');
  const [promoCodeValidated, setPromoCodeValidated] = useState(false);
  const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [backflowDeviceCount, setBackflowDeviceCount] = useState(1);
  const [selectedMembership, setSelectedMembership] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [jobNumber, setJobNumber] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const isBackflowService = data.service?.category === 'backflow-testing';
  const backflowTotal = isBackflowService ? backflowDeviceCount * 125 : 0;

  const membershipOptions = [
    { id: 'silver-tankless', name: 'Silver VIP - Tankless', price: 212, duration: '1 year' },
    { id: 'commercial', name: 'Commercial VIP', price: 119, duration: '1 year' },
    { id: 'rental', name: 'Rental VIP', price: 109, duration: '1 year' },
    { id: 'platinum-tank', name: 'Platinum VIP - Tank Type', price: 319, duration: '3 years' },
    { id: 'platinum-tankless', name: 'Platinum VIP - Tankless', price: 599, duration: '3 years' },
  ];

  // Calculate estimated job total (for referral discount validation)
  const estimatedJobTotal = backflowTotal + (selectedMembership ? membershipOptions.find(m => m.id === selectedMembership)?.price || 0 : 0);

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code || !code.trim()) {
      setPromoCodeValidated(false);
      setPromoCodeDiscount(0);
      return;
    }

    setIsValidatingPromo(true);
    try {
      // Check if it's a valid referral code
      const response = await fetch(`/api/referrals/code/${encodeURIComponent(code)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Valid referral code - apply $25 discount if job is $200+
        if (estimatedJobTotal >= 200) {
          setPromoCodeValidated(true);
          setPromoCodeDiscount(25);
          toast({
            title: 'Referral Code Applied!',
            description: `$25 discount applied to your booking. Thank you for using a referral!`,
          });
        } else {
          setPromoCodeValidated(true);
          setPromoCodeDiscount(0);
          toast({
            title: 'Referral Code Valid',
            description: 'Discount will apply when your total reaches $200 or more.',
          });
        }
      } else {
        setPromoCodeValidated(false);
        setPromoCodeDiscount(0);
        toast({
          title: 'Invalid Code',
          description: 'The referral code you entered is not valid.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setPromoCodeValidated(false);
      setPromoCodeDiscount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Auto-validate referral code on mount if provided
  useEffect(() => {
    if (initialReferralCode && initialReferralCode.trim()) {
      validateReferralCode(initialReferralCode);
    }
  }, [initialReferralCode]);

  // Re-validate discount amount when totals change
  useEffect(() => {
    if (promoCodeValidated && promoCode) {
      // Recalculate discount based on new total
      if (estimatedJobTotal >= 200) {
        setPromoCodeDiscount(25);
      } else {
        setPromoCodeDiscount(0);
      }
    }
  }, [estimatedJobTotal, promoCodeValidated]);

  const handleBook = async () => {
    if (!data.service || !data.customer || !data.location || !data.timeSlot) {
      toast({
        title: 'Incomplete Information',
        description: 'Please go back and complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Handle Stripe payment for prepaid backflow before creating job
    if (isBackflowService && backflowTotal > 0) {
      // Will integrate Stripe checkout here in next task
      toast({
        title: 'Payment Required',
        description: 'Stripe payment integration coming soon. For now, payment will be collected at service time.',
      });
    }

    setIsBooking(true);
    try {
      const response = await fetch('/api/scheduler/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.customer.name,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          zipCode: data.location.zipCode,
          gateCode: data.location.gateCode,
          requestedService: data.service.name,
          preferredDate: data.timeSlot.start,
          preferredTimeSlot: data.timeSlot.timeLabel,
          arrivalWindowStart: data.timeSlot.start,
          arrivalWindowEnd: data.timeSlot.end,
          specialInstructions: specialInstructions || undefined,
          promoCode: promoCode || undefined,
          backflowDeviceCount: isBackflowService ? backflowDeviceCount : undefined,
          selectedMembershipId: selectedMembership || undefined,
          bookingSource: 'website',
          utm_source: data.utmSource || 'website',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBookingSuccess(true);
        setJobNumber(result.jobNumber);
        toast({
          title: 'Booking Confirmed!',
          description: `Your appointment has been scheduled. Job #${result.jobNumber}`,
        });
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Unable to complete your booking. Please try again or call us.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-success-title">
              Appointment Confirmed!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Your plumbing service has been scheduled
            </p>
            {jobNumber && (
              <div className="inline-block bg-muted px-6 py-3 rounded-lg mb-8">
                <p className="text-sm text-muted-foreground mb-1">Job Number</p>
                <p className="text-2xl font-bold" data-testid="text-job-number">
                  #{jobNumber}
                </p>
              </div>
            )}
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <Wrench className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{data.service?.name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{data.timeSlot?.timeLabel}</p>
                  <p className="text-sm text-muted-foreground">{data.timeSlot?.date}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{data.location?.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.location?.city}, {data.location?.state} {data.location?.zipCode}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                size="lg"
                className="w-full max-w-md"
                data-testid="button-return-home"
              >
                Return to Home
              </Button>
              <p className="text-sm text-muted-foreground">
                You'll receive a confirmation email shortly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-summary-title">
          Review & Confirm
        </h2>
        <p className="text-muted-foreground" data-testid="text-summary-subtitle">
          Please review your appointment details before confirming
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Wrench className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium" data-testid="text-summary-service">
                  {data.service?.name}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium" data-testid="text-summary-customer">
                  {data.customer?.name}
                </p>
                <p className="text-sm text-muted-foreground">{data.customer?.phone}</p>
                {data.customer?.email && (
                  <p className="text-sm text-muted-foreground">{data.customer.email}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Service Location</p>
                <p className="font-medium" data-testid="text-summary-location">
                  {data.location?.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.location?.city}, {data.location?.state} {data.location?.zipCode}
                </p>
                {data.location?.gateCode && (
                  <p className="text-sm text-muted-foreground">Gate Code: {data.location.gateCode}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium" data-testid="text-summary-time">
                  {data.timeSlot?.timeLabel}
                </p>
                <p className="text-sm text-muted-foreground">{data.timeSlot?.date}</p>
                {data.timeSlot?.proximityScore && data.timeSlot.proximityScore > 70 && (
                  <p className="text-sm text-primary">✓ Route-optimized time slot</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code / Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle>Promo or Referral Code</CardTitle>
            <CardDescription>
              {initialReferralCode 
                ? 'Referral code from your link has been applied!' 
                : 'Have a promo code, referral code, or Groupon? Enter it here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="promo-code" className="sr-only">
                  Promo Code
                </Label>
                <Input
                  id="promo-code"
                  placeholder="Enter code (e.g., GROUPON, ABC123)"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoCodeValidated(false);
                    setPromoCodeDiscount(0);
                  }}
                  data-testid="input-promo-code"
                />
              </div>
              <Button
                onClick={() => validateReferralCode(promoCode)}
                disabled={!promoCode || isValidatingPromo}
                variant="outline"
                data-testid="button-validate-promo"
              >
                {isValidatingPromo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            
            {/* Validation Status & Discount Display */}
            {promoCodeValidated && promoCodeDiscount > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Referral Discount Applied: -${promoCodeDiscount}</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  You'll save $25 on this booking!
                </p>
              </div>
            )}
            
            {promoCodeValidated && promoCodeDiscount === 0 && estimatedJobTotal < 200 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Referral Code Validated</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                  Add services or memberships to reach $200 minimum for the $25 referral discount
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backflow Device Counter */}
        {isBackflowService && (
          <Card>
            <CardHeader>
              <CardTitle>Backflow Device Count</CardTitle>
              <CardDescription>How many backflow devices need testing?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="device-count">Number of Devices:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBackflowDeviceCount(Math.max(1, backflowDeviceCount - 1))}
                    data-testid="button-decrease-devices"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center" data-testid="text-device-count">
                    {backflowDeviceCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBackflowDeviceCount(backflowDeviceCount + 1)}
                    data-testid="button-increase-devices"
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {backflowDeviceCount} device{backflowDeviceCount > 1 ? 's' : ''} × $125
                  </span>
                  <span className="text-xl font-bold" data-testid="text-backflow-total">
                    ${backflowTotal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prepaid testing - you'll pay now and we'll complete your certification
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP Membership */}
        <Card>
          <CardHeader>
            <CardTitle>Add VIP Membership (Optional)</CardTitle>
            <CardDescription>
              Priority scheduling, 10-15% savings, annual maintenance included
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Select Membership Tier</Label>
              <select
                value={selectedMembership || ''}
                onChange={(e) => setSelectedMembership(e.target.value || null)}
                className="w-full p-2 border rounded-md bg-background"
                data-testid="select-membership"
              >
                <option value="">No membership (just schedule service)</option>
                {membershipOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} - ${option.price}/{option.duration}
                  </option>
                ))}
              </select>
            </div>
            {selectedMembership && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-primary mb-1">
                  ✓ {membershipOptions.find(m => m.id === selectedMembership)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Includes priority scheduling, discounted rates, and annual maintenance visit
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
            <CardDescription>
              Any additional details our technician should know?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="instructions" className="sr-only">
              Special Instructions
            </Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Dog in backyard, park in driveway, call when arriving..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
              data-testid="textarea-instructions"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isBooking}
            className="flex-1"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button
            onClick={handleBook}
            disabled={isBooking}
            className="flex-1"
            size="lg"
            data-testid="button-confirm-booking"
          >
            {isBooking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
