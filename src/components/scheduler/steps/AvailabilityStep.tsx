/**
 * Availability Selection Step
 * 
 * Smart calendar + time slot picker that shows fuel-optimized appointment windows.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Clock, Zap, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  proximityScore?: number;
  nearbyJobs?: number;
  zone?: string;
}

interface AvailabilityStepProps {
  jobTypeId: number;
  customerZip: string;
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

const PERIOD_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const PERIOD_ICONS = {
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
};

export function AvailabilityStep({ jobTypeId, customerZip, onSelect, selectedSlot }: AvailabilityStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const startDate = format(selectedDate, 'yyyy-MM-dd');
  const endDate = format(addDays(selectedDate, 6), 'yyyy-MM-dd');

  // Fetch smart availability (fuel-optimized)
  const { data, isLoading } = useQuery<{ success: boolean; slots: TimeSlot[]; optimization: any }>({
    queryKey: ['/api/scheduler/smart-availability', jobTypeId, customerZip, startDate],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/smart-availability', {
        jobTypeId,
        customerZip,
        startDate,
        endDate,
      });
      return await response.json();
    },
  });

  const slots = data?.slots || [];
  
  // Filter slots for selected date
  const slotsForDate = slots.filter(slot => {
    const slotDate = format(new Date(slot.start), 'yyyy-MM-dd');
    return slotDate === format(selectedDate, 'yyyy-MM-dd');
  });

  // Group by period
  const slotsByPeriod = slotsForDate.reduce((acc: Record<string, TimeSlot[]>, slot: TimeSlot) => {
    if (!acc[slot.period]) {
      acc[slot.period] = [];
    }
    acc[slot.period].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="space-y-6">
      {/* Optimization Info */}
      {data?.optimization && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Smart Scheduling Active</h3>
              <p className="text-xs text-muted-foreground mt-1">
                We've optimized appointment times based on your location ({data.optimization.customerZone}) 
                to minimize driving and save fuel. 
                {data.optimization.optimizedSlots > 0 && (
                  <span className="text-primary font-medium">
                    {' '}{data.optimization.optimizedSlots} fuel-efficient slots available!
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Select a Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || date > addDays(today, 30);
              }}
              className="rounded-md border"
            />
          </Card>
        </div>

        {/* Time Slots */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              Available Times - {format(selectedDate, 'EEEE, MMMM d')}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : slotsForDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No availability on this date</p>
                <p className="text-xs mt-1">Try selecting a different day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                  const periodSlots = slotsByPeriod[period] || [];
                  if (periodSlots.length === 0) return null;

                  return (
                    <div key={period} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PERIOD_ICONS[period]}</span>
                        <h4 className="font-medium text-sm">{PERIOD_LABELS[period]}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {periodSlots.length}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {periodSlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          const isFuelEfficient = (slot.proximityScore || 0) > 70;
                          
                          return (
                            <Button
                              key={slot.id}
                              variant={isSelected ? 'default' : 'outline'}
                              className="justify-between h-auto py-3"
                              onClick={() => onSelect(slot)}
                              data-testid={`button-timeslot-${slot.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{slot.timeLabel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isFuelEfficient && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Zap className="w-3 h-3" />
                                    Efficient
                                  </Badge>
                                )}
                                {slot.nearbyJobs && slot.nearbyJobs > 0 && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {slot.nearbyJobs} nearby
                                  </Badge>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
