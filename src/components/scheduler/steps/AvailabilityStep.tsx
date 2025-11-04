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

  // Sort by proximity score (best first)
  const sortedSlots = [...slotsForDate].sort((a, b) => {
    const scoreA = a.proximityScore || 0;
    const scoreB = b.proximityScore || 0;
    return scoreB - scoreA; // Higher scores first
  });

  // Group by period (already sorted by proximity)
  const slotsByPeriod = sortedSlots.reduce((acc: Record<string, TimeSlot[]>, slot: TimeSlot) => {
    if (!acc[slot.period]) {
      acc[slot.period] = [];
    }
    acc[slot.period].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Get top 3 best appointments across all periods
  const top3Slots = sortedSlots.slice(0, 3).filter(s => (s.proximityScore || 0) > 50);

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-600 dark:text-green-400' };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const, color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'Available', variant: 'outline' as const, color: 'text-muted-foreground' };
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Best Appointments - Prominent Display */}
      {top3Slots.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/40">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-1">
                Recommended Appointment Times
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                These times are fuel-efficient because we already have technicians nearby in your area
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {top3Slots.map((slot, index) => {
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
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge 
                        variant={isSelected ? 'outline' : efficiency.variant}
                        className={`gap-1.5 ${isSelected ? 'border-white/50 text-white' : efficiency.color}`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span className="font-semibold">{Math.round(slot.proximityScore || 0)}%</span>
                      </Badge>
                      
                      {slot.nearbyJobs && slot.nearbyJobs > 0 && (
                        <Badge 
                          variant={isSelected ? 'outline' : 'outline'}
                          className={`gap-1.5 ${isSelected ? 'border-white/50 text-white' : ''}`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {slot.nearbyJobs} nearby
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

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
                        <Badge variant="secondary" className="text-xs">
                          {periodSlots.length} slots
                        </Badge>
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
                              <div className="flex items-center gap-2">
                                {score >= 60 && (
                                  <Badge 
                                    variant={isSelected ? 'outline' : efficiency.variant}
                                    className={`text-xs gap-1 ${isSelected ? 'border-white/50' : ''}`}
                                  >
                                    <Zap className="w-3 h-3" />
                                    {efficiency.label}
                                  </Badge>
                                )}
                                {slot.nearbyJobs && slot.nearbyJobs > 0 && (
                                  <Badge 
                                    variant={isSelected ? 'outline' : 'outline'}
                                    className={`text-xs gap-1 ${isSelected ? 'border-white/50' : ''}`}
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {slot.nearbyJobs}
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
