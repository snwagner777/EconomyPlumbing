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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, FileText, Clock, CheckCircle, AlertCircle, Wrench, MapPin, User, AlertTriangle, RefreshCw } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { EstimateDetailModal } from "@/modules/documents/components/EstimateDetailModal";
import { InvoiceDetailModal } from "@/modules/documents/components/InvoiceDetailModal";
import { useToast } from "@/hooks/use-toast";
import type { Estimate, Invoice } from "@/modules/documents/types";

interface ServicesSectionProps {
  customerData?: any;
  upcomingAppointments?: any[];
  completedAppointments?: any[];
  isLoadingAppointments?: boolean;
  appointmentsError?: Error | null;
  usingFallbackData?: boolean;
  onRetryAppointments?: () => void;
  onReschedule?: (appointment: any) => void;
  onCancel?: (appointment: any) => void;
  onViewEstimate?: (estimate: any) => void;
  onAcceptEstimate?: (estimate: any) => void;
  onSchedule?: () => void;
  formatDate?: (date: string) => string;
  formatTime?: (time: string) => string;
  getStatusBadge?: (status: string) => React.ReactNode;
}

// Skeleton loader for appointment cards
const AppointmentSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
);

export function ServicesSection({
  customerData,
  upcomingAppointments = [],
  completedAppointments = [],
  isLoadingAppointments = false,
  appointmentsError,
  usingFallbackData = false,
  onRetryAppointments,
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
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAcceptingEstimate, setIsAcceptingEstimate] = useState(false);
  const { toast } = useToast();

  // Extract estimates from customer data with null safety
  const estimates = customerData?.estimates || [];
  const openEstimates = estimates.filter((e: any) => e && e.status !== 'Sold');

  // Extract job history with null safety
  const recentJobs = (customerData?.recentJobs || customerData?.jobs || []).filter((job: any) => job);

  // Handle estimate acceptance
  const handleAcceptEstimate = async (estimate: Estimate) => {
    setIsAcceptingEstimate(true);
    try {
      const response = await fetch('/api/portal/accept-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: estimate.id }),
      });

      if (response.ok) {
        toast({
          title: "Estimate Accepted",
          description: "Your estimate has been accepted. We'll contact you to schedule the work.",
        });
        setSelectedEstimate(null);
      } else {
        throw new Error('Failed to accept estimate');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept estimate. Please try again or contact us.",
        variant: "destructive",
      });
    } finally {
      setIsAcceptingEstimate(false);
    }
  };

  // Handle PDF download for estimates
  const handleDownloadEstimatePDF = async (estimate: Estimate) => {
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon!",
    });
  };

  // Handle PDF download for invoices
  const handleDownloadInvoicePDF = async (invoice: Invoice) => {
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon!",
    });
  };

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
          {/* Error Alert */}
          {appointmentsError && !usingFallbackData && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Appointments</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {appointmentsError.message || 'Failed to load appointments. Please try again.'}
                </span>
                {onRetryAppointments && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetryAppointments}
                    className="ml-4"
                    data-testid="button-retry-appointments"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Info Banner - Using Fallback Data */}
          {usingFallbackData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Displaying cached appointment data. Some information may be delayed.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Skeletons */}
          {isLoadingAppointments ? (
            <>
              <AppointmentSkeleton />
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </>
          ) : upcomingAppointments.length === 0 ? (
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
          {isLoadingAppointments ? (
            <>
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-3">Recently Completed</h3>
              </div>
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </>
          ) : completedAppointments.length > 0 && (
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
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedEstimate(estimate)}
                        data-testid={`button-view-estimate-${estimate.id}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {estimate.status === 'Open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEstimate(estimate);
                            // Accept action will be triggered from the modal
                          }}
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
                    <div className="space-y-3">
                      {job.summary && (
                        <p className="text-sm">{job.summary}</p>
                      )}
                      {job.technician && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          Technician: {job.technician}
                        </p>
                      )}
                      {job.invoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(job.invoice)}
                          data-testid={`button-view-invoice-${job.invoice.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Invoice
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Estimate Detail Modal */}
      <EstimateDetailModal
        open={!!selectedEstimate}
        onOpenChange={(open) => !open && setSelectedEstimate(null)}
        estimate={selectedEstimate}
        onDownloadPDF={handleDownloadEstimatePDF}
        onAcceptEstimate={handleAcceptEstimate}
        isAccepting={isAcceptingEstimate}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onDownloadPDF={handleDownloadInvoicePDF}
      />
    </div>
  );
}
