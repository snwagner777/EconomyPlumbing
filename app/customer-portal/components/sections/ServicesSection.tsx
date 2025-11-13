/**
 * Services Section - Appointments, Estimates, Job History
 * Three-panel layout for all service-related information
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Clock, CheckCircle, AlertCircle, Wrench, MapPin, User } from "lucide-react";
import { formatCurrency } from "../../utils/currency";

interface ServicesSectionProps {
  customerData?: any;
  upcomingAppointments?: any[];
  completedAppointments?: any[];
  onReschedule?: (appointment: any) => void;
  onCancel?: (appointment: any) => void;
  onViewEstimate?: (estimate: any) => void;
  onAcceptEstimate?: (estimate: any) => void;
  onSchedule?: () => void;
  formatDate?: (date: string) => string;
  formatTime?: (time: string) => string;
  getStatusBadge?: (status: string) => React.ReactNode;
}

export function ServicesSection({
  customerData,
  upcomingAppointments = [],
  completedAppointments = [],
  onReschedule,
  onCancel,
  onViewEstimate,
  onAcceptEstimate,
  onSchedule,
  formatDate,
  formatTime,
  getStatusBadge,
}: ServicesSectionProps) {
  const [activeTab, setActiveTab] = useState('appointments');

  // Extract estimates from customer data
  const estimates = customerData?.estimates || [];
  const openEstimates = estimates.filter((e: any) => e.status !== 'Sold');

  // Extract job history
  const recentJobs = customerData?.recentJobs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Services</h2>
          <p className="text-muted-foreground">
            Manage your appointments, estimates, and service history
          </p>
        </div>
        {onSchedule && (
          <Button onClick={onSchedule} data-testid="button-schedule-service">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Service
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments" data-testid="tab-appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Appointments
            {upcomingAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="estimates" data-testid="tab-estimates">
            <FileText className="w-4 h-4 mr-2" />
            Estimates
            {openEstimates.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {openEstimates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Upcoming Appointments</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any scheduled appointments at the moment.
                  </p>
                  {onSchedule && (
                    <Button onClick={onSchedule} data-testid="button-schedule-first-appointment">
                      Schedule Your First Service
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment, index) => (
              <Card key={appointment.id || index} data-testid={`card-appointment-${appointment.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{appointment.jobType || 'Service Call'}</CardTitle>
                      <CardDescription>
                        {formatDate && formatDate(appointment.start)} at {formatTime && formatTime(appointment.start)}
                      </CardDescription>
                    </div>
                    {getStatusBadge && getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointment.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {appointment.location}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="text-sm">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {onReschedule && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReschedule(appointment)}
                          data-testid={`button-reschedule-${appointment.id}`}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                      )}
                      {onCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel(appointment)}
                          data-testid={`button-cancel-${appointment.id}`}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Completed Appointments Section */}
          {completedAppointments.length > 0 && (
            <>
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-3">Recently Completed</h3>
              </div>
              {completedAppointments.slice(0, 3).map((appointment, index) => (
                <Card key={appointment.id || index} data-testid={`card-completed-${appointment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{appointment.jobType || 'Service Call'}</CardTitle>
                        <CardDescription>
                          {formatDate && formatDate(appointment.completedDate || appointment.start)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  {appointment.summary && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{appointment.summary}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Estimates Tab */}
        <TabsContent value="estimates" className="space-y-4">
          {openEstimates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Open Estimates</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending estimates at the moment.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            openEstimates.map((estimate: any, index: number) => (
              <Card key={estimate.id || index} data-testid={`card-estimate-${estimate.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Estimate #{estimate.id}</CardTitle>
                      <CardDescription>
                        {estimate.name || 'Service Estimate'}
                      </CardDescription>
                    </div>
                    <Badge variant={estimate.status === 'Open' ? 'default' : 'secondary'}>
                      {estimate.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {estimate.total && (
                      <p className="text-2xl font-bold">{formatCurrency(estimate.total)}</p>
                    )}
                    {estimate.summary && (
                      <p className="text-sm text-muted-foreground">{estimate.summary}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {onViewEstimate && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onViewEstimate(estimate)}
                          data-testid={`button-view-estimate-${estimate.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      {onAcceptEstimate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAcceptEstimate(estimate)}
                          data-testid={`button-accept-estimate-${estimate.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept & Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Job History Tab */}
        <TabsContent value="history" className="space-y-4">
          {recentJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Service History</h3>
                  <p className="text-muted-foreground">
                    Your completed services will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job: any, index: number) => (
                <Card key={job.id || index} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.jobType || 'Service Call'}</CardTitle>
                        <CardDescription>
                          {formatDate && formatDate(job.completedDate || job.createdDate)}
                        </CardDescription>
                      </div>
                      {job.invoice && (
                        <Badge variant="outline">
                          {formatCurrency(job.invoice.total || 0)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {job.summary && (
                        <p className="text-sm">{job.summary}</p>
                      )}
                      {job.technician && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          Technician: {job.technician}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
