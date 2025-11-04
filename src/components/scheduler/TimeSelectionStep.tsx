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
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();

  // Fetch availability on mount for next 7 days
  useEffect(() => {
    fetchInitialAvailability();
  }, []);

  // Fetch more availability when calendar date is selected
  useEffect(() => {
    if (showCalendar && selectedDate) {
      fetchAvailabilityForDate(selectedDate);
    }
  }, [selectedDate, showCalendar]);

  const fetchInitialAvailability = async () => {
    if (!data.service?.jobTypeId) return;

    setIsLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch('/api/scheduler/smart-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTypeId: data.service.jobTypeId,
          customerZip: data.location?.zipCode,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAllSlots(result.slots || []);
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

  const fetchAvailabilityForDate = async (date: Date) => {
    if (!data.service?.jobTypeId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/smart-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTypeId: data.service.jobTypeId,
          customerZip: data.location?.zipCode,
          startDate: date.toISOString(),
          endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Merge with existing slots, avoiding duplicates
        const newSlots = result.slots || [];
        const merged = [...allSlots];
        newSlots.forEach((newSlot: TimeSlot) => {
          if (!merged.find(s => s.id === newSlot.id)) {
            merged.push(newSlot);
          }
        });
        setAllSlots(merged);
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

  // Get top 3 smart slots (highest proximity scores)
  const topSmartSlots = allSlots.slice(0, 3);
  
  // Get slots for selected calendar date
  const calendarSlots = selectedDate
    ? allSlots.filter(slot => {
        const slotDate = new Date(slot.start).toDateString();
        return slotDate === selectedDate.toDateString();
      })
    : [];

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-time-title">
          Choose Your Appointment Time
        </h2>
        <p className="text-muted-foreground text-sm" data-testid="text-time-subtitle">
          We've found the best times based on your location
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Finding available times...</p>
          </div>
        ) : topSmartSlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No available times found.</p>
            <p className="text-sm">Please contact us to schedule.</p>
          </div>
        ) : (
          <>
            {/* Top 3 Smart Slots */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Recommended Times</CardTitle>
                <CardDescription className="text-sm">
                  These times work best with our existing schedule in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {topSmartSlots.map((slot, index) => (
                  <SmartTimeSlotButton
                    key={slot.id}
                    slot={slot}
                    isSelected={selectedSlot?.id === slot.id}
                    onSelect={() => handleSelectSlot(slot)}
                    rank={index + 1}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Calendar Fallback */}
            {!showCalendar ? (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowCalendar(true)}
                  data-testid="button-show-calendar"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Browse Other Dates
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Browse All Available Times</CardTitle>
                  <CardDescription className="text-sm">
                    Select any date to see all available time slots
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Calendar */}
                    <div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                        data-testid="calendar-appointment"
                      />
                    </div>

                    {/* Time Slots for Selected Date */}
                    <div>
                      {selectedDate ? (
                        <>
                          <h4 className="font-semibold mb-3 text-sm">
                            {format(selectedDate, 'EEEE, MMMM d')}
                          </h4>
                          {calendarSlots.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No times available for this date.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {calendarSlots.map((slot) => (
                                <Button
                                  key={slot.id}
                                  variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                                  onClick={() => handleSelectSlot(slot)}
                                  className="w-full justify-start text-sm h-auto py-2"
                                  data-testid={`button-time-slot-${slot.id}`}
                                >
                                  {slot.timeLabel}
                                </Button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Select a date to see available times
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
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
            data-testid="button-continue-time"
          >
            Continue to Review
          </Button>
        </div>
      </div>
    </div>
  );
}

function SmartTimeSlotButton({
  slot,
  isSelected,
  onSelect,
  rank,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
  rank: number;
}) {
  const slotDate = new Date(slot.start);
  const dateLabel = format(slotDate, 'EEEE, MMM d');
  const isTopChoice = rank === 1 && (slot.proximityScore || 0) > 70;

  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      onClick={onSelect}
      className="w-full justify-between h-auto py-3 px-4"
      data-testid={`button-smart-slot-${rank}`}
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{slot.timeLabel}</span>
          {isTopChoice && (
            <Badge variant="secondary" className="text-xs">
              <TrendingDown className="w-3 h-3 mr-1" />
              Best Match
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
      </div>
      {slot.nearbyJobs && slot.nearbyJobs > 0 && (
        <span className="text-xs text-muted-foreground">
          {slot.nearbyJobs} nearby {slot.nearbyJobs === 1 ? 'job' : 'jobs'}
        </span>
      )}
    </Button>
  );
}

