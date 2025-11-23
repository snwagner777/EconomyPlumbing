'use client';

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCustomerContext } from "@/hooks/useCustomerContext";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAppointments } from "./hooks/useCustomerAppointments";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PhoneConfig } from "@/server/lib/phoneNumbers";
import { CustomerPortalAuth } from "./components/auth/CustomerPortalAuth";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Construction
} from "lucide-react";
import { SchedulerDialog } from "@/modules/scheduler";
import { CompactPortal } from "./components/CompactPortal";
import { transformCustomerAppointments } from "./utils/dataMappers";

interface ServiceTitanCustomer {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  contacts?: any[];
  contactMethods?: any[];
  customerTags?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface CustomerData {
  customer: ServiceTitanCustomer;
  locations: any[];
}

interface CustomerPortalClientProps {
  phoneConfig: PhoneConfig;
  marbleFallsPhoneConfig: PhoneConfig;
}

export default function CustomerPortalClient({ phoneConfig, marbleFallsPhoneConfig }: CustomerPortalClientProps) {
  // Auth state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [availableCustomerIds, setAvailableCustomerIds] = useState<number[]>([]);
  
  // Shared customer context for cross-flow pre-fill
  const { setContext, clearContext } = useCustomerContext();
  
  // Scheduler dialog state (managed by CustomerPortalClient, opened by CompactPortal)
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerMode, setSchedulerMode] = useState<'book' | 'reschedule'>('book');
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null);

  const { toast } = useToast();
  
  // Session hydration on mount - restore session from server
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch('/api/customer-portal/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          console.log('[Portal] Session check failed');
          return;
        }

        const data = await response.json();

        if (isMounted && data.authenticated && data.customerId) {
          console.log(`[Portal] Restored session for customer ${data.customerId}`);
          setCustomerId(data.customerId);
        }
      } catch (error) {
        console.error('[Portal] Session check error:', error);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const { data: customerData, isLoading, error } = useQuery<CustomerData>({
    queryKey: ['/api/portal/customer', customerId],
    enabled: !!customerId,
  });

  // Persist customer data to shared context when loaded (for pre-fill in checkout/scheduler)
  useEffect(() => {
    if (customerData?.customer && customerId) {
      setContext({
        source: 'portal',
        customerId: customerData.customer.id,
        customerName: customerData.customer.name,
        phone: customerData.customer.phoneNumber || undefined,
        email: customerData.customer.email || undefined,
        address: customerData.customer.address ? {
          street: customerData.customer.address.street || undefined,
          city: customerData.customer.address.city || undefined,
          state: customerData.customer.address.state || undefined,
          zip: customerData.customer.address.zip || undefined,
        } : undefined,
        serviceTitanId: customerData.customer.id,
      });
      console.log('[CustomerPortal] Persisted customer context for cross-flow pre-fill');
    }
  }, [customerId, customerData, setContext]);

  // Fetch referrals for this customer
  const { data: referralsData } = useQuery<{ referrals: any[] }>({
    queryKey: ['/api/referrals/customer', customerId],
    enabled: !!customerId,
  });

  // Fetch referral code and link for this customer
  const { data: referralLinkData } = useQuery<{
    code: string;
    url: string;
    clicks: number;
    conversions: number;
  }>({
    queryKey: ['/api/referrals/code', customerId],
    enabled: !!customerId,
  });

  // Fetch customer locations for scheduler
  const { data: locationsData } = useQuery<{ locations: any[] }>({
    queryKey: [`/api/portal/customer-locations/${customerId}`],
    enabled: !!customerId,
  });

  const customerLocations = locationsData?.locations || [];

  // Fetch appointments using new ServiceTitan API
  const { 
    data: appointmentsData,
    isLoading: isLoadingAppointments,
    error: appointmentsError 
  } = useCustomerAppointments(customerId ? parseInt(customerId) : null);

  // Transform and split appointments using new ServiceTitan API
  const { upcomingAppointments, completedAppointments, usingFallbackData } = useMemo(() => {
    let allAppointments: any[] = [];
    let usedFallback = false;

    // Use ServiceTitan appointments API
    if (appointmentsData?.success && appointmentsData?.data && Array.isArray(appointmentsData.data)) {
      const transformed = transformCustomerAppointments(appointmentsData.data);
      if (transformed.length > 0) {
        console.log(`[Portal] Using appointments API: ${transformed.length} appointments from ${appointmentsData.data.length} jobs`);
        allAppointments = transformed;
      }
    }

    const now = new Date();
    console.log(`[Portal] Current time: ${now.toISOString()}`);

    console.log(`[Portal] Filtered appointments: ${allAppointments.length}`);
    
    // Split into upcoming vs completed
    const upcoming = allAppointments.filter(apt => {
      if (!apt.start) return false;
      const isUpcoming = new Date(apt.start) > now;
      const isNotCompleted = !['Done', 'Completed', 'Cancelled', 'Canceled'].includes(apt.status);
      return isUpcoming && isNotCompleted;
    });

    const completed = allAppointments.filter(apt => {
      if (!apt.start) return false;
      const isInPast = new Date(apt.start) <= now;
      const isCompleted = ['Done', 'Completed', 'Cancelled', 'Canceled'].includes(apt.status);
      return isInPast || isCompleted;
    });

    console.log(`[Portal] Split appointments: ${upcoming.length} upcoming, ${completed.length} completed`);

    return {
      upcomingAppointments: upcoming,
      completedAppointments: completed,
      usingFallbackData: usedFallback 
    };
  }, [appointmentsData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/customer-portal/logout', { method: 'POST' });
      setCustomerId(null);
      setAvailableCustomerIds([]);
      clearContext();
      queryClient.clear();
      window.location.href = '/customer-portal';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('scheduled') || statusLower.includes('pending')) {
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    if (statusLower.includes('completed') || statusLower.includes('paid')) {
      return <Badge data-testid={`badge-status-${status}`}><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    if (statusLower.includes('cancelled') || statusLower.includes('overdue')) {
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  return (
    <>
      <Header 
        isPortalAuthenticated={!!customerId} 
        onPortalLogout={handleLogout}
        austinPhone={phoneConfig}
        marbleFallsPhone={marbleFallsPhoneConfig}
      />

      {/* Under Construction Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
        <div className="px-4 py-3">
          <Alert className="border-yellow-400 bg-transparent">
            <Construction className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">Under Construction</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              We're currently improving the customer portal to serve you better. Some features may be limited during this time.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <main className="min-h-screen py-12 px-4">
        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {customerId && customerData ? (() => {
                const hour = new Date().getHours();
                const firstName = customerData.customer.name?.split(' ')[0] || 'there';
                
                // Build a pool of possible greetings
                const greetings: string[] = [];
                
                // Time-based greetings
                if (hour < 12) {
                  greetings.push(`Good morning, ${firstName}!`);
                  greetings.push(`Rise and shine, ${firstName}!`);
                } else if (hour < 18) {
                  greetings.push(`Good afternoon, ${firstName}!`);
                  greetings.push(`Hello, ${firstName}!`);
                } else {
                  greetings.push(`Good evening, ${firstName}!`);
                  greetings.push(`Welcome back, ${firstName}!`);
                }
                
                // General encouraging greetings
                greetings.push(`Hey ${firstName}! How can we help today?`);
                greetings.push(`${firstName}, great to have you here!`);
                greetings.push(`Welcome, ${firstName}!`);
                greetings.push(`Hello ${firstName}! What brings you here today?`);
                greetings.push(`${firstName}, we're here to help!`);
                
                // Pick a random greeting from the pool
                const randomIndex = Math.floor(Math.random() * greetings.length);
                return greetings[randomIndex];
              })() : 'Customer Portal'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {customerId ? 
                'Your service history, appointments, and account details' :
                'Access your service history, appointments, and invoices'
              }
            </p>
          </div>

          {!customerId ? (
            <CustomerPortalAuth
              onAuthenticated={(id, ids) => {
                setCustomerId(id);
                setAvailableCustomerIds(ids);
              }}
              onError={(message) =>
                toast({ title: "Authentication failed", description: message, variant: "destructive" })
              }
            />
          ) : (
            <CompactPortal
              customerId={customerId}
              customerData={customerData}
              upcomingAppointments={upcomingAppointments}
              completedAppointments={completedAppointments}
              isLoadingAppointments={isLoadingAppointments}
              appointmentsError={appointmentsError}
              usingFallbackData={usingFallbackData}
              referralsData={referralsData}
              referralLinkData={referralLinkData}
              onRetryAppointments={() => {
                const numericId = customerId ? parseInt(customerId) : null;
                queryClient.invalidateQueries({ queryKey: ['/api/customer-portal/appointments', numericId] });
              }}
              onSchedule={() => {
                setSchedulerMode('book');
                setReschedulingAppointment(null);
                setSchedulerOpen(true);
              }}
              onReschedule={(appointment: any) => {
                console.log('[Portal] Rescheduling appointment:', {
                  jobTypeId: appointment.jobTypeId,
                  jobNumber: appointment.jobNumber,
                  start: appointment.start,
                });
                setSchedulerMode('reschedule');
                setReschedulingAppointment(appointment);
                setSchedulerOpen(true);
              }}
              onLogout={handleLogout}
              formatDate={formatDate}
              formatTime={formatTime}
              formatPhoneNumber={formatPhoneNumber}
              getStatusBadge={getStatusBadge}
            />
          )}
        </div>
      </main>

      {/* Scheduler Dialog */}
      {customerId && customerData?.customer && (
        <SchedulerDialog
          open={schedulerOpen}
          onOpenChange={(open) => {
            setSchedulerOpen(open);
            if (!open) {
              setSchedulerMode('book');
              setReschedulingAppointment(null);
            }
          }}
          mode={schedulerMode}
          jobType={
            schedulerMode === 'reschedule' && reschedulingAppointment?.jobTypeId
              ? {
                  id: reschedulingAppointment.jobTypeId,
                  name: reschedulingAppointment.jobType || `Service for Job #${reschedulingAppointment.jobNumber}`,
                  code: `RESCHEDULE_${reschedulingAppointment.jobTypeId}`,
                }
              : undefined
          }
          customerInfo={{
            firstName: customerData.customer.name?.split(' ')[0] || '',
            lastName: customerData.customer.name?.split(' ').slice(1).join(' ') || '',
            phone: customerData.customer.phoneNumber || '',
            email: customerData.customer.email || '',
            address: customerData.customer.address?.street || '',
            city: customerData.customer.address?.city || '',
            state: customerData.customer.address?.state || '',
            zip: customerData.customer.address?.zip || '',
          }}
          locations={customerLocations}
          utmSource="customer-portal"
          onComplete={() => {
            setSchedulerOpen(false);
            setSchedulerMode('book');
            setReschedulingAppointment(null);
            // Refresh appointments after booking
            const numericId = customerId ? parseInt(customerId) : null;
            queryClient.invalidateQueries({ queryKey: ['/api/customer-portal/appointments', numericId] });
          }}
        />
      )}
      
      <Footer />
    </>
  );
}
