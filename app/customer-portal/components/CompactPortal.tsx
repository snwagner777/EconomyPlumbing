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
import { ReferralsSection } from '../ReferralsSection';
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
import { ReferralModal } from "@/components/ReferralModal";

interface ReferralData {
  referrals: Array<{
    id: string;
    status: string;
    creditAmount: number;
    referrerCustomerId: number | null;
    refereeCustomerId: number | null;
    creditedAt?: Date | null;
  }>;
}

interface ReferralLinkData {
  code: string;
  url: string;
  clicks: number;
  conversions: number;
}

interface CompactPortalProps {
  customerId?: string | null;
  customerData?: any;
  upcomingAppointments?: any[];
  completedAppointments?: any[];
  isLoadingAppointments?: boolean;
  appointmentsError?: Error | null;
  usingFallbackData?: boolean;
  referralsData?: ReferralData;
  referralLinkData?: ReferralLinkData;
  onRetryAppointments?: () => void;
  onSchedule?: () => void;
  onReschedule?: (appointment: any) => void;
  onLogout?: () => void;
  formatDate?: (date: string) => string;
  formatTime?: (time: string) => string;
  formatPhoneNumber?: (phone: string) => string;
  getStatusBadge?: (status: string) => React.ReactNode;
}

export function CompactPortal({
  customerId,
  customerData,
  upcomingAppointments = [],
  completedAppointments = [],
  isLoadingAppointments = false,
  appointmentsError,
  usingFallbackData = false,
  referralsData,
  referralLinkData,
  onRetryAppointments,
  onSchedule,
  onReschedule,
  onLogout,
  formatDate,
  formatTime,
  formatPhoneNumber,
  getStatusBadge,
}: CompactPortalProps) {
  const [currentSection, setCurrentSection] = useState<PortalSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

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

  // Calculate referral stats
  const calculateReferralStats = () => {
    if (!referralsData?.referrals || !customerId) {
      return { totalSent: 0, creditsEarned: 0, pending: 0 };
    }

    const customerIdNum = parseInt(customerId);
    const referralsList = referralsData.referrals as Array<{
      id: string;
      status: string;
      creditAmount: number;
      referrerCustomerId: number | null;
      refereeCustomerId: number | null;
      creditedAt?: Date | null;
    }>;

    // Filter referrals where current customer is the referrer
    const asReferrer = referralsList.filter(r => r.referrerCustomerId === customerIdNum);

    // Total referrals sent by this customer
    const totalSent = asReferrer.length;

    // Credits earned (check creditedAt field, not status)
    const creditsEarned = asReferrer
      .filter(r => r.creditedAt != null)
      .reduce((sum, r) => sum + (r.creditAmount || 0), 0) / 100; // Convert cents to dollars

    // Pending referrals (not yet credited - creditedAt is null)
    const pending = asReferrer.filter(r => r.creditedAt == null).length;

    return { totalSent, creditsEarned, pending };
  };

  // Calculate dashboard data from transformed customerData
  const dashboardData = transformedData ? {
    memberships: mapMemberships(transformedData.memberships || []),
    vouchers: mapVouchers(transformedData.vouchers || []),
    referrals: calculateReferralStats(),
    quickActions: {
      onSchedule,
      onShareReferral: () => {
        setReferralModalOpen(true);
      },
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
            {customerId && (
              <ReferralsSection
                customerId={parseInt(customerId)}
                referralsData={referralsData}
                referralLinkData={referralLinkData}
                onOpenReferralModal={() => setReferralModalOpen(true)}
              />
            )}
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
            onSchedule={onSchedule}
            onReschedule={onReschedule}
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

      {/* Referral Modal */}
      {customerId && referralLinkData && (
        <ReferralModal
          open={referralModalOpen}
          onOpenChange={setReferralModalOpen}
          customerName={customerData?.customer?.name || ''}
          customerPhone={customerData?.customer?.phoneSettings?.phoneNumber || customerData?.customer?.phone || ''}
          customerId={customerId}
          referralCode={referralLinkData.code}
        />
      )}
    </div>
  );
}
