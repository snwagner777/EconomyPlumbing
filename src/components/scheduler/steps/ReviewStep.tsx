/**
 * Review & Confirm Step
 * 
 * Final confirmation before booking the appointment in ServiceTitan.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Calendar, Clock, MapPin, User, Mail, Phone, Key, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { getJobTypeMeta } from '@/lib/schedulerJobCatalog';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { LocationContactsSummary } from '../LocationContactsSummary';
import type { JobType, CustomerInfo, TimeSlot } from '@shared/types/scheduler';

interface SchedulerSession {
  token: string | null;
  verificationMethod: 'phone' | 'email' | null;
  verifiedAt: number | null;
  customerId: number | null;
  expiresAt: number | null;
}

interface ReviewStepProps {
  jobType: JobType;
  customer: CustomerInfo;
  timeSlot: TimeSlot;
  voucherCode?: string;
  problemDescription?: string;
  onProblemDescriptionChange?: (description: string) => void;
  onSuccess: () => void;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
  session?: SchedulerSession; // Session for contact management
}

export function ReviewStep({ jobType, customer, timeSlot, voucherCode, problemDescription, onProblemDescriptionChange, onSuccess, utmSource, utmMedium, utmCampaign, referralCode, session }: ReviewStepProps) {
  const [isBooked, setIsBooked] = useState(false);
  const [problem, setProblem] = useState(problemDescription || '');
  const [specialInstructions, setSpecialInstructions] = useState(customer.notes || '');
  const { toast} = useToast();
  const meta = getJobTypeMeta(jobType.name);
  const Icon = meta.icon;

  const handleProblemChange = (value: string) => {
    setProblem(value);
    onProblemDescriptionChange?.(value);
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/book', {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email || '', // Handle optional email - ServiceTitan may require empty string
        customerPhone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zip,
        requestedService: jobType.name,
        preferredDate: new Date(timeSlot.start),
        // Arrival window = 4-hour customer promise (e.g., 8am-12pm)
        arrivalWindowStart: timeSlot.arrivalWindowStart,
        arrivalWindowEnd: timeSlot.arrivalWindowEnd,
        // Appointment slot = actual 2-hour booking (e.g., 10am-12pm within 8am-12pm window)
        appointmentStart: timeSlot.start,
        appointmentEnd: timeSlot.end,
        specialInstructions: specialInstructions || undefined,
        problemDescription: problem || undefined, // Customer's description of the issue
        ...(voucherCode && { grouponVoucher: voucherCode }), // Groupon or promotional voucher code
        bookingSource: 'scheduler_wizard',
        utm_source: utmSource || 'website',
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
        ...(referralCode && { referralToken: referralCode }),
        ...(customer.serviceTitanId && { serviceTitanId: customer.serviceTitanId }),
        ...(customer.locationId && { locationId: customer.locationId }),
        ...(timeSlot.technicianId && { technicianId: timeSlot.technicianId }), // Pre-assigned technician from smart slot
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsBooked(true);
      toast({
        title: "Appointment Booked!",
        description: data.message || `Your ${jobType.name} appointment is confirmed. Job #${data.jobNumber || ''}`,
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  if (isBooked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Appointment Confirmed!</h3>
          <p className="text-muted-foreground">
            We'll send you a confirmation email shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-muted ${meta.color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold">{meta.displayName || jobType.name}</h3>
            {meta.marketingCopy && (
              <p className="text-sm text-muted-foreground mt-1">{meta.marketingCopy}</p>
            )}
            <Badge variant="secondary" className="mt-2">
              {meta.category}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Appointment Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Appointment Details
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{timeSlot.timeLabel}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(timeSlot.start), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          
          {timeSlot.proximityScore && timeSlot.proximityScore > 70 && (
            <div className="flex items-start gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Fuel-Efficient Appointment</p>
                <p className="text-xs">
                  This time is optimized to reduce driving and save fuel
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Your Information
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatPhoneNumber(customer.phone)}
              </p>
            </div>
          </div>
          
          <div className="text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {customer.email}
            </p>
          </div>

          <Separator />

          <div className="text-sm">
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Service Address
            </p>
            <p className="font-medium">
              {customer.address}<br />
              {customer.city}, {customer.state} {customer.zip}
            </p>
          </div>

        </div>
      </Card>

      {/* Location-Specific Contacts (with optional CRUD if authenticated) */}
      {customer.serviceTitanId && (
        <LocationContactsSummary
          customerId={customer.serviceTitanId}
          locationId={customer.locationId}
          sessionToken={session?.token}
        />
      )}

      {/* Problem Description */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label htmlFor="problemDescription" className="flex items-center gap-2 text-base font-semibold">
            <Wrench className="w-5 h-5" />
            What's going on? (Optional)
          </Label>
          <Textarea
            id="problemDescription"
            placeholder="Example: Water heater is leaking and making a loud banging noise..."
            value={problem}
            onChange={(e) => handleProblemChange(e.target.value)}
            rows={4}
            maxLength={500}
            className="resize-none"
            data-testid="textarea-problem-description"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Be specific: location, sounds, when it started, what you've tried, etc.</p>
            <p>{problem.length}/500</p>
          </div>
        </div>
      </Card>

      {/* Special Instructions / Access Codes */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label htmlFor="specialInstructions" className="flex items-center gap-2 text-base font-semibold">
            <Key className="w-5 h-5" />
            Gate Code / Access Instructions (Optional)
          </Label>
          <Textarea
            id="specialInstructions"
            placeholder="Gate code, parking instructions, where to find you, pet warnings, etc."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
            data-testid="textarea-special-instructions"
          />
          <p className="text-xs text-muted-foreground">
            Examples: "Gate code: #1234", "Park in driveway", "Use side entrance", "Dog in backyard"
          </p>
        </div>
      </Card>

      {/* Confirm Button */}
      <Button
        onClick={() => bookMutation.mutate()}
        disabled={bookMutation.isPending}
        size="lg"
        className="w-full"
        data-testid="button-confirm-booking"
      >
        {bookMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Booking Appointment...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Appointment
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By confirming, you agree to receive appointment reminders and updates via email and SMS.
      </p>
    </div>
  );
}
