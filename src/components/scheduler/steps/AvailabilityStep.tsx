/**
 * Availability Selection Step
 * 
 * Smart calendar + time slot picker with prominent fuel-optimized appointment windows.
 * Highlights best times based on proximity to other jobs in the customer's zone.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Clock, Zap, MapPin, TrendingUp } from 'lucide-react';
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

export function AvailabilityStep({ jobTypeId, customerZip, onSelect, selectedSlot }: AvailabilityStepProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Always fetch from today (or earliest future date if today is past)
  const fetchStartDate = today;
  const startDate = format(fetchStartDate, 'yyyy-MM-dd');
  const endDate = format(addDays(fetchStartDate, 44), 'yyyy-MM-dd'); // 45 days of availability

  // Fetch smart availability (fuel-optimized) - always fetch 45 days from today
  const { data, isLoading } = useQuery<{ success: boolean; slots: TimeSlot[]; optimization: any }>({
    queryKey: ['/api/scheduler/smart-availability', jobTypeId, customerZip],
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
  
  // Sort ALL slots by proximity score (best first) - for top recommendations
  const allSortedSlots = [...slots].sort((a, b) => {
    const scoreA = a.proximityScore || 0;
    const scoreB = b.proximityScore || 0;
    return scoreB - scoreA; // Higher scores first
  });

  // Get top 3 best appointments across ALL dates for prominent display
  const topSlots = allSortedSlots.slice(0, Math.min(3, allSortedSlots.length));
  const hasHighEfficiencySlots = topSlots.some(s => (s.proximityScore || 0) > 60);
  
  // Filter slots for selected date (for calendar view)
  const slotsForDate = slots.filter(slot => {
    const slotDate = format(new Date(slot.start), 'yyyy-MM-dd');
    return slotDate === format(selectedDate, 'yyyy-MM-dd');
  });

  // Sort slots for selected date by proximity score
  const sortedSlotsForDate = [...slotsForDate].sort((a, b) => {
    const scoreA = a.proximityScore || 0;
    const scoreB = b.proximityScore || 0;
    return scoreB - scoreA; // Higher scores first
  });

  // Group by period (for calendar view)
  const slotsByPeriod = sortedSlotsForDate.reduce((acc: Record<string, TimeSlot[]>, slot: TimeSlot) => {
    if (!acc[slot.period]) {
      acc[slot.period] = [];
    }
    acc[slot.period].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-600 dark:text-green-400' };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const, color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'Available', variant: 'outline' as const, color: 'text-muted-foreground' };
  };

  // Show loading state while analyzing schedule
  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Analyzing schedule, please wait...</h3>
            <p className="text-sm text-muted-foreground">
              Finding the most fuel-efficient appointment times for your area
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Appointments - Prominent Display */}
      {topSlots.length > 0 && (
        <Card className={`p-6 border-2 ${
          hasHighEfficiencySlots 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-4 mb-5">
            <div className={`p-3 rounded-full ${
              hasHighEfficiencySlots 
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                hasHighEfficiencySlots 
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold mb-1 ${
                hasHighEfficiencySlots 
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {hasHighEfficiencySlots ? 'Recommended Appointment Times' : 'Next Available Appointments'}
              </h3>
              <p className={`text-sm ${
                hasHighEfficiencySlots 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {hasHighEfficiencySlots 
                  ? 'We already have other jobs scheduled nearby during these times - great for reducing costs and wait times!'
                  : 'Select a time that works best for your schedule'
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {topSlots.map((slot, index) => {
              const isSelected = selectedSlot?.id === slot.id;
              const efficiency = getEfficiencyBadge(slot.proximityScore || 0);
              
              return (
                <Card
                  key={slot.id}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    isSelected 
                      ? 'bg-primary border-primary shadow-lg' 
                      : 'bg-white dark:bg-gray-950 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md'
                  }`}
                  onClick={() => onSelect(slot)}
                  data-testid={`card-top-timeslot-${index}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge 
                        variant={isSelected ? 'outline' : 'secondary'} 
                        className={`text-sm px-2.5 py-1 ${isSelected ? 'border-white/50 text-white' : ''}`}
                      >
                        #{index + 1}
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-foreground'}`}>
                          {slot.timeLabel}
                        </p>
                        <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>
                          {format(new Date(slot.start), 'EEEE, MMMM d')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* View More Times Button */}
      {!showCalendar && (
        <div className="flex flex-col items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCalendar(true)}
            className="gap-2"
            data-testid="button-view-more-times"
          >
            <Clock className="w-4 h-4" />
            View All Available Times
          </Button>
          
          {/* Text Us for Custom Scheduling */}
          <Card className="p-4 bg-muted/50 border-dashed max-w-md">
            <p className="text-sm text-center text-muted-foreground mb-3">
              Don't see the appointment time you're looking for?
            </p>
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={() => window.open('sms:5123689159', '_blank')}
              data-testid="button-text-us"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3.293 3.293 3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
              Text Us
            </Button>
          </Card>
        </div>
      )}

      {/* Calendar and All Time Slots (Hidden by Default) */}
      {showCalendar && (
        <>
          {/* Optimization Info */}
          {data?.optimization && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Smart Scheduling Enabled</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimized for your zone: <span className="font-semibold text-foreground">{data.optimization.customerZone}</span>
                    {data.optimization.optimizedSlots > 0 && (
                      <span className="text-primary font-medium">
                        {' '}• {data.optimization.optimizedSlots} efficient slots found
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
              All Available Times - {format(selectedDate, 'EEEE, MMMM d')}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Finding best times...</p>
                </div>
              </div>
            ) : slotsForDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No availability on this date</p>
                <p className="text-xs mt-1">Try selecting a different day</p>
              </div>
            ) : (
              <div className="space-y-5">
                {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                  const periodSlots = slotsByPeriod[period] || [];
                  if (periodSlots.length === 0) return null;

                  return (
                    <div key={period} className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-sm">{PERIOD_LABELS[period]}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {periodSlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          const score = slot.proximityScore || 0;
                          const efficiency = getEfficiencyBadge(score);
                          
                          return (
                            <Button
                              key={slot.id}
                              variant={isSelected ? 'default' : 'outline'}
                              className={`justify-between h-auto py-3 border-2 ${
                                score >= 70 && !isSelected 
                                  ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700' 
                                  : ''
                              }`}
                              onClick={() => onSelect(slot)}
                              data-testid={`button-timeslot-${slot.id}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4" />
                                <span className="font-semibold">{slot.timeLabel}</span>
                              </div>
                              {/* Badges removed - cleaner UI */}
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
        </>
      )}
    </div>
  );
}
