'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useScheduler } from '@/contexts/SchedulerContext';

const SERVICES = [
  'Emergency Plumbing',
  'Drain Cleaning',
  'Water Heater Repair',
  'Gas Line Services',
  'Leak Detection',
  'Sewer Line Repair',
  'Repiping',
  'Fixture Installation',
  'Backflow Testing',
  'General Plumbing',
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'Evening (5 PM - 9 PM)' },
];

export function SchedulerModal() {
  const { isOpen, closeScheduler, prefilledService } = useScheduler();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: 'Austin',
    state: 'TX',
    zipCode: '',
    requestedService: '',
    preferredTimeSlot: '',
    specialInstructions: '',
  });

  useEffect(() => {
    if (prefilledService) {
      setFormData(prev => ({ ...prev, requestedService: prefilledService }));
    }
  }, [prefilledService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/scheduler/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          preferredDate: selectedDate?.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Appointment Scheduled!',
          description: `Your appointment has been confirmed. Job #${data.jobNumber}`,
        });
        closeScheduler();
        // Reset form
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          address: '',
          city: 'Austin',
          state: 'TX',
          zipCode: '',
          requestedService: '',
          preferredTimeSlot: '',
          specialInstructions: '',
        });
        setSelectedDate(undefined);
      } else {
        throw new Error(data.details || 'Booking failed');
      }
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeScheduler}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Your Service</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll create your appointment in our system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contact Information</h3>
            
            <div>
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                data-testid="input-customer-name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  data-testid="input-customer-phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="(512) 555-0123"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  data-testid="input-customer-email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>

          {/* Service Address */}
          <div className="space-y-3">
            <h3 className="font-semibold">Service Address</h3>
            
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                data-testid="input-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  data-testid="input-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  data-testid="input-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  data-testid="input-zip"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Service Details</h3>
            
            <div>
              <Label htmlFor="requestedService">Service Type *</Label>
              <Select
                value={formData.requestedService}
                onValueChange={(value) => setFormData({ ...formData, requestedService: value })}
                required
              >
                <SelectTrigger id="requestedService" data-testid="select-service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-date-picker"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="preferredTimeSlot">Preferred Time</Label>
                <Select
                  value={formData.preferredTimeSlot}
                  onValueChange={(value) => setFormData({ ...formData, preferredTimeSlot: value })}
                >
                  <SelectTrigger id="preferredTimeSlot" data-testid="select-time-slot">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                data-testid="input-special-instructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                placeholder="Gate code, pet information, specific concerns, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeScheduler}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Schedule Service'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
