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
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Calendar, Clock, MapPin, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { getJobTypeMeta } from '@/lib/schedulerJobCatalog';

interface JobType {
  id: number;
  name: string;
  code: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  serviceTitanId?: number;
  locationId?: number;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  timeLabel: string;
  proximityScore?: number;
  nearbyJobs?: number;
  technicianId?: number | null; // Pre-assigned technician for optimal routing
}

interface ReviewStepProps {
  jobType: JobType;
  customer: CustomerInfo;
  timeSlot: TimeSlot;
  onSuccess: () => void;
}

export function ReviewStep({ jobType, customer, timeSlot, onSuccess }: ReviewStepProps) {
  const [isBooked, setIsBooked] = useState(false);
  const { toast } = useToast();
  const meta = getJobTypeMeta(jobType.name);
  const Icon = meta.icon;

  const bookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/book', {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zip,
        requestedService: jobType.name,
        preferredDate: new Date(timeSlot.start),
        arrivalWindowStart: timeSlot.start,
        arrivalWindowEnd: timeSlot.end,
        specialInstructions: customer.notes,
        bookingSource: 'scheduler_wizard',
        utm_source: 'website',
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
                {customer.phone}
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

          {customer.notes && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Additional Notes</p>
                <p className="text-sm">{customer.notes}</p>
              </div>
            </>
          )}
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
