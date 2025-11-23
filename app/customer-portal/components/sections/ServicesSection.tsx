/**
 * Services Section - Appointments, Estimates, Job History
 * Accordion-based layout with location grouping and invoice viewing
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, FileText, Clock, CheckCircle, AlertCircle, Wrench, MapPin, AlertTriangle, RefreshCw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from "../../utils/currency";
import { EstimateDetailModal } from "@/modules/documents/components/EstimateDetailModal";
import { InvoiceViewerModal } from "@/modules/documents/components/InvoiceViewerModal";
import { useToast } from "@/hooks/use-toast";
import { useJobTypeName } from "../../hooks/useJobTypeName";
import type { Estimate } from "@/modules/documents/types";

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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isAcceptingEstimate, setIsAcceptingEstimate] = useState(false);
  const { toast } = useToast();

  // Extract estimates from customer data with null safety
  const estimates = customerData?.estimates || [];
  const openEstimates = estimates.filter((e: any) => e && e.status !== 'Sold');

  // Extract job history with null safety
  const recentJobs = (customerData?.recentJobs || customerData?.jobs || []).filter((job: any) => job);

  // Helper function to get location address from location ID
  const getLocationAddress = (locationId: string | number) => {
    const location = customerData?.locations?.find((loc: any) => 
      (loc.id?.toString() === locationId?.toString()) || 
      (loc.locationId?.toString() === locationId?.toString())
    );
    
    if (!location) return null;
    
    // Build address from location data
    const addr = location.address || location.serviceLocation?.address;
    if (!addr) return location.name || location.locationName;
    
    if (typeof addr === 'string') {
      return addr;
    }
    
    const addressParts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zip
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : location.name;
  };

  // Group completed appointments by location
  const completedByLocation = completedAppointments.reduce((acc: any, apt: any) => {
    const locationId = apt.locationId || 'unknown';
    const locationAddress = getLocationAddress(locationId);
    const locationName = locationAddress || `Location ${locationId}`;
    if (!acc[locationId]) acc[locationId] = { name: locationName, appointments: [] };
    acc[locationId].appointments.push(apt);
    return acc;
  }, {});

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
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <AppointmentCard
                  key={appointment.id || index}
                  appointment={appointment}
                  locationAddress={getLocationAddress(appointment.locationId)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusBadge={getStatusBadge}
                  onReschedule={onReschedule ? () => onReschedule(appointment) : undefined}
                  onCancel={onCancel}
                  data-testid={`card-appointment-${appointment.id}`}
                />
              ))}
            </div>
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
            <div className="space-y-3">
              {openEstimates.map((estimate: any, index: number) => (
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
                      <div className="flex gap-2 pt-2 flex-wrap">
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
              ))}
            </div>
          )}
        </TabsContent>

        {/* Job History Tab */}
        <TabsContent value="history" className="space-y-4">
          {isLoadingAppointments ? (
            <>
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </>
          ) : completedAppointments.length === 0 && recentJobs.length === 0 ? (
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
            <Accordion type="single" collapsible className="w-full space-y-3">
              {/* Show completed appointments from appointments API, grouped by location */}
              {Object.entries(completedByLocation).map(([locationId, locationData]: [string, any]) => (
                <AccordionItem key={locationId} value={locationId} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4" />
                      <div className="text-left">
                        <h3 className="font-semibold">{locationData.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {locationData.appointments.length} completed service(s)
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 space-y-3">
                    {locationData.appointments.map((appointment: any, index: number) => (
                      <JobHistoryCard 
                        key={appointment.id || `completed-${index}`}
                        appointment={appointment}
                        formatDate={formatDate}
                        onViewInvoice={() => setSelectedInvoiceId(appointment.invoiceId)}
                        data-testid={`card-history-${appointment.id}`}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      {/* Estimate Detail Modal */}
      <EstimateDetailModal
        open={!!selectedEstimate}
        onOpenChange={(open) => !open && setSelectedEstimate(null)}
        estimate={selectedEstimate}
        onAcceptEstimate={handleAcceptEstimate}
        isAccepting={isAcceptingEstimate}
      />

      {/* Invoice Viewer Modal */}
      <InvoiceViewerModal
        open={!!selectedInvoiceId}
        onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />

    </div>
  );
}

/**
 * Upcoming appointment card with job type name and location address
 */
function AppointmentCard({ 
  appointment, 
  locationAddress,
  formatDate, 
  formatTime,
  getStatusBadge,
  onReschedule,
  onCancel,
  ...props 
}: any) {
  const { data: jobTypeData } = useJobTypeName(appointment.jobTypeId);
  const jobTypeName = jobTypeData?.name || appointment.jobType || 'Service Call';

  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {appointment.jobNumber ? `Job #${appointment.jobNumber}` : 'Appointment'}
            </CardTitle>
            <CardDescription>
              <div className="space-y-1 mt-2">
                <p><strong>Job Type:</strong> {jobTypeName}</p>
                <p>{formatDate && formatDate(appointment.start)} at {formatTime && formatTime(appointment.start)}</p>
                {locationAddress && (
                  <p className="flex items-center gap-2 mt-2">
                    <MapPin className="w-3 h-3" />
                    {locationAddress}
                  </p>
                )}
              </div>
            </CardDescription>
          </div>
          {getStatusBadge && getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointment.specialInstructions && (
            <p className="text-sm">
              <strong>Notes:</strong> {appointment.specialInstructions}
            </p>
          )}
          <div className="flex gap-2 pt-2 flex-wrap">
            {onReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReschedule}
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
  );
}

/**
 * Completed job history card with invoice viewer
 */
function JobHistoryCard({ 
  appointment, 
  formatDate, 
  onViewInvoice,
  ...props 
}: any) {
  return (
    <Card {...props} className="bg-muted/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Job #: {appointment.jobNumber || appointment.id}</CardTitle>
            <CardDescription>
              Completed on: {formatDate && formatDate(appointment.completedDate || appointment.start)}
            </CardDescription>
          </div>
          {appointment.total && (
            <Badge variant="outline">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(appointment.total)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointment.invoiceId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewInvoice}
              data-testid={`button-view-invoice-history-${appointment.invoiceId}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
