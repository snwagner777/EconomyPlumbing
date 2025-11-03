'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, Clock } from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TimeSelectionStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  date: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  proximityScore?: number;
  nearbyJobs?: number;
}

export function TimeSelectionStep({ data, updateData, onNext, onBack }: TimeSelectionStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate && data.service?.jobTypeId && data.location?.zipCode) {
      fetchAvailability();
    }
  }, [selectedDate]);

  const fetchAvailability = async () => {
    if (!selectedDate || !data.service?.jobTypeId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/smart-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTypeId: data.service.jobTypeId,
          customerZip: data.location?.zipCode,
          startDate: selectedDate.toISOString(),
          endDate: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTimeSlots(result.slots || []);
      }
    } catch (error) {
      toast({
        title: 'Error Loading Times',
        description: 'Unable to fetch available time slots. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    updateData({
      timeSlot: {
        id: slot.id,
        start: slot.start,
        end: slot.end,
        date: slot.date,
        timeLabel: slot.timeLabel,
        proximityScore: slot.proximityScore,
      },
    });
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      toast({
        title: 'No Time Selected',
        description: 'Please select a time slot for your appointment.',
        variant: 'destructive',
      });
      return;
    }
    onNext();
  };

  const groupedSlots = {
    morning: timeSlots.filter((s) => s.period === 'morning'),
    afternoon: timeSlots.filter((s) => s.period === 'afternoon'),
    evening: timeSlots.filter((s) => s.period === 'evening'),
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-time-title">
          Choose Your Appointment Time
        </h2>
        <p className="text-muted-foreground" data-testid="text-time-subtitle">
          Select a date and time that works best for you
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose your preferred appointment date</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
                data-testid="calendar-appointment"
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Available Times</CardTitle>
              <CardDescription>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date first'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No available times for this date.</p>
                  <p className="text-sm">Please select another date.</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {/* Morning */}
                  {groupedSlots.morning.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Morning</h4>
                      <div className="space-y-2">
                        {groupedSlots.morning.map((slot) => (
                          <TimeSlotButton
                            key={slot.id}
                            slot={slot}
                            isSelected={selectedSlot?.id === slot.id}
                            onSelect={() => handleSelectSlot(slot)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Afternoon */}
                  {groupedSlots.afternoon.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Afternoon</h4>
                      <div className="space-y-2">
                        {groupedSlots.afternoon.map((slot) => (
                          <TimeSlotButton
                            key={slot.id}
                            slot={slot}
                            isSelected={selectedSlot?.id === slot.id}
                            onSelect={() => handleSelectSlot(slot)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evening */}
                  {groupedSlots.evening.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Evening</h4>
                      <div className="space-y-2">
                        {groupedSlots.evening.map((slot) => (
                          <TimeSlotButton
                            key={slot.id}
                            slot={slot}
                            isSelected={selectedSlot?.id === slot.id}
                            onSelect={() => handleSelectSlot(slot)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
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
            disabled={!selectedSlot}
            className="flex-1"
            size="lg"
            data-testid="button-continue-time"
          >
            Continue to Review
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isOptimized = (slot.proximityScore || 0) > 70;

  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      onClick={onSelect}
      className="w-full justify-between h-auto py-3"
      data-testid={`button-time-slot-${slot.id}`}
    >
      <span className="font-medium">{slot.timeLabel}</span>
      {isOptimized && (
        <Badge variant="secondary" className="ml-2">
          <TrendingDown className="w-3 h-3 mr-1" />
          Optimized
        </Badge>
      )}
    </Button>
  );
}
