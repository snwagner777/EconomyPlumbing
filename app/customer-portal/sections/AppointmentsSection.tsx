/**
 * Appointments Section
 * Displays upcoming appointments with reschedule/cancel actions
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarClock, AlertCircle } from "lucide-react";

interface Appointment {
  id: string;
  jobType: string;
  summary?: string;
  status: string;
  start: string;
  arrivalWindowStart?: string;
  arrivalWindowEnd?: string;
  jobNumber?: string;
}

interface AppointmentsSectionProps {
  appointments: Appointment[];
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function AppointmentsSection({
  appointments,
  onReschedule,
  onCancel,
  formatDate,
  formatTime,
  getStatusBadge,
}: AppointmentsSectionProps) {
  return (
    <div id="appointments-section">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <CardTitle>Upcoming Appointments</CardTitle>
          </div>
          <CardDescription>
            Your scheduled service appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground" data-testid="text-no-appointments">
              No upcoming appointments
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                  data-testid={`appointment-${appointment.id}`}
                >
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">Job Type: {appointment.jobType}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReschedule(appointment)}
                          data-testid={`button-reschedule-${appointment.id}`}
                        >
                          <CalendarClock className="w-4 h-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel(appointment)}
                          data-testid={`button-cancel-${appointment.id}`}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Date:</strong> {formatDate(appointment.start)}
                      </p>
                      {appointment.arrivalWindowStart && appointment.arrivalWindowEnd && (
                        <p>
                          <strong>Arrival Window:</strong> {formatTime(appointment.arrivalWindowStart)} - {formatTime(appointment.arrivalWindowEnd)}
                        </p>
                      )}
                      {appointment.jobNumber && (
                        <p className="text-muted-foreground">
                          Job #{appointment.jobNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
