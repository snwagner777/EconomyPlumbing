/**
 * Compact Portal Layout
 * New sidebar-based design with dashboard overview
 */

'use client';

import { useState } from 'react';
import { DashboardOverview } from './DashboardOverview';
import { PortalSidebar, type PortalSection } from './PortalSidebar';
import { BottomNav } from './BottomNav';
import { MembershipsSection } from './MembershipsSection';
import { VouchersSection } from '../VouchersSection';
import { ServicesSection } from './sections/ServicesSection';
// TODO: Uncomment when billing section is ready
// import { BillingSection } from './sections/BillingSection';
import { SettingsSection } from './sections/SettingsSection';
import { ContactManagementDialog } from './sections/ContactManagementDialog';
import { AddLocationDialog } from './settings/AddLocationDialog';
import { AddAccountDialog } from './settings/AddAccountDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { transformCustomerData, mapMemberships, mapVouchers } from "../utils/dataMappers";

interface AccountSummary {
  id: number;
  name: string;
  type: string;
  email: string | null;
  phoneNumber: string | null;
  locationCount: number;
  primaryLocationId: number | null;
}

interface CompactPortalProps {
  customerId?: string | null;
  customerData?: any;
  upcomingAppointments?: any[];
  completedAppointments?: any[];
  isLoadingAppointments?: boolean;
  appointmentsError?: Error | null;
  usingFallbackData?: boolean;
  onRetryAppointments?: () => void;
  onSchedule?: () => void;
  onShareReferral?: () => void;
  onRescheduleAppointment?: (appointment: any) => void;
  onCancelAppointment?: (appointment: any) => void;
  onViewEstimate?: (estimate: any) => void;
  onAcceptEstimate?: (estimate: any) => void;
  onEditContacts?: () => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: any) => void;
  onLogout?: () => void;
  formatDate?: (date: string) => string;
  formatTime?: (time: string) => string;
  formatPhoneNumber?: (phone: string) => string;
  getStatusBadge?: (status: string) => React.ReactNode;
  accountSummaries?: AccountSummary[];
  onSwitchAccount?: (accountId: number) => void;
}

export function CompactPortal({
  customerId,
  customerData,
  upcomingAppointments = [],
  completedAppointments = [],
  isLoadingAppointments = false,
  appointmentsError,
  usingFallbackData = false,
  onRetryAppointments,
  onSchedule,
  onShareReferral,
  onRescheduleAppointment,
  onCancelAppointment,
  onViewEstimate,
  onAcceptEstimate,
  onEditContacts,
  onAddLocation,
  onEditLocation,
  onLogout,
  formatDate,
  formatTime,
  formatPhoneNumber,
  getStatusBadge,
  accountSummaries = [],
  onSwitchAccount,
}: CompactPortalProps) {
  // DEBUG: Log account summaries
  console.log('[CompactPortal] customerId:', customerId);
  console.log('[CompactPortal] accountSummaries:', accountSummaries);
  console.log('[CompactPortal] accountSummaries.length:', accountSummaries.length);
  
  const [currentSection, setCurrentSection] = useState<PortalSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);

  // Transform customer data using mappers
  const transformedData = transformCustomerData(customerData);

  // Normalize customer contacts to v2 API format {id, type, value, memo}
  const normalizeContacts = (contacts: any[] | undefined) => {
    if (!contacts || !Array.isArray(contacts)) return [];
    
    return contacts.map((contact: any) => ({
      id: contact.id || contact.contactMethodId,
      type: contact.type || contact.contactType,
      value: contact.value,
      memo: contact.memo,
    })).filter((c: any) => c.id && c.type && c.value);
  };

  // Use contacts from API response (handles both v1 'contacts' and v2 'contactMethods')
  const normalizedCustomerContacts = normalizeContacts(
    customerData?.customer?.contactMethods || customerData?.customer?.contacts
  );

  // Normalize location contacts as well
  const normalizedLocations = (transformedData?.locations || []).map((location: any) => ({
    ...location,
    contactMethods: normalizeContacts(location.contactMethods || location.contacts),
  }));

  // DEBUG: Log location data
  console.log('[CompactPortal DEBUG] transformedData?.locations:', transformedData?.locations);
  console.log('[CompactPortal DEBUG] normalizedLocations:', normalizedLocations);

  // Calculate dashboard data from transformed customerData
  const dashboardData = transformedData ? {
    memberships: mapMemberships(transformedData.memberships || []),
    vouchers: mapVouchers(transformedData.vouchers || []),
    referrals: {
      totalSent: 0, // TODO: Add referral data
      creditsEarned: 0,
      pending: 0,
    },
    quickActions: {
      onSchedule,
      onShareReferral,
    },
    alerts: [] as any[],
  } : undefined;

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return dashboardData ? (
          <DashboardOverview {...dashboardData} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your Customer Portal</CardTitle>
              <CardDescription>Loading your account information...</CardDescription>
            </CardHeader>
          </Card>
        );
        
      case 'rewards':
        return (
          <div className="space-y-6">
            <MembershipsSection />
            {customerId && <VouchersSection customerId={parseInt(customerId)} />}
          </div>
        );
        
      case 'services':
        return (
          <ServicesSection
            customerData={transformedData}
            upcomingAppointments={upcomingAppointments}
            completedAppointments={completedAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
            usingFallbackData={usingFallbackData}
            onRetryAppointments={onRetryAppointments}
            onReschedule={onRescheduleAppointment}
            onCancel={onCancelAppointment}
            onViewEstimate={onViewEstimate}
            onAcceptEstimate={onAcceptEstimate}
            onSchedule={onSchedule}
            formatDate={formatDate}
            formatTime={formatTime}
            getStatusBadge={getStatusBadge}
          />
        );
        
      // TODO: Uncomment when billing section is ready
      // case 'billing':
      //   return (
      //     <BillingSection
      //       customerData={transformedData}
      //       formatDate={formatDate}
      //     />
      //   );
        
      case 'settings':
        return (
          <SettingsSection
            customerId={customerId ? parseInt(customerId) : 0}
            onAddLocation={() => setAddLocationDialogOpen(true)}
            onAddAccount={() => setAddAccountDialogOpen(true)}
            formatPhoneNumber={formatPhoneNumber}
            accountSummaries={accountSummaries}
            onSwitchAccount={onSwitchAccount}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Portal Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <PortalSidebar
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            customerId={customerId ? parseInt(customerId) : 0}
            onAddAccount={() => setAddAccountDialogOpen(true)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container max-w-6xl py-6 md:py-8 pb-24 md:pb-8">
            {renderSection()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      {/* Contact Management Dialog */}
      <ContactManagementDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        customerId={customerId ? parseInt(customerId) : undefined}
        customerContacts={normalizedCustomerContacts}
        locations={normalizedLocations}
        formatPhoneNumber={formatPhoneNumber}
      />

      {/* Add Location Dialog */}
      {customerId && (
        <AddLocationDialog
          open={addLocationDialogOpen}
          onOpenChange={setAddLocationDialogOpen}
          customerId={parseInt(customerId)}
        />
      )}

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={addAccountDialogOpen}
        onOpenChange={setAddAccountDialogOpen}
      />
    </div>
  );
}
