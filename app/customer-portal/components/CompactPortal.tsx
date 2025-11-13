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
import { BillingSection } from './sections/BillingSection';
import { SettingsSection } from './sections/SettingsSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { transformCustomerData, mapMemberships, mapVouchers } from "../utils/dataMappers";

interface CompactPortalProps {
  customerId?: string | null;
  customerData?: any;
  upcomingAppointments?: any[];
  completedAppointments?: any[];
  onSchedule?: () => void;
  onPayInvoice?: (invoice?: any) => void;
  onShareReferral?: () => void;
  onRescheduleAppointment?: (appointment: any) => void;
  onCancelAppointment?: (appointment: any) => void;
  onViewEstimate?: (estimate: any) => void;
  onAcceptEstimate?: (estimate: any) => void;
  onEditContacts?: () => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: any) => void;
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
  onSchedule,
  onPayInvoice,
  onShareReferral,
  onRescheduleAppointment,
  onCancelAppointment,
  onViewEstimate,
  onAcceptEstimate,
  onEditContacts,
  onAddLocation,
  onEditLocation,
  formatDate,
  formatTime,
  formatPhoneNumber,
  getStatusBadge,
}: CompactPortalProps) {
  const [currentSection, setCurrentSection] = useState<PortalSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Transform customer data using mappers
  const transformedData = transformCustomerData(customerData);

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
      onPayInvoice: () => {
        // Find the first open invoice to pass to the payment handler
        const openInvoices = transformedData.invoices?.filter((inv: any) => 
          inv.status !== 'Paid' && inv.balance > 0
        ) || [];
        if (openInvoices.length > 0 && onPayInvoice) {
          onPayInvoice(openInvoices[0]);
        } else {
          setCurrentSection('billing');
        }
      },
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
        
      case 'billing':
        return (
          <BillingSection
            customerData={transformedData}
            onPayInvoice={onPayInvoice}
            formatDate={formatDate}
          />
        );
        
      case 'settings':
        return (
          <SettingsSection
            customerData={transformedData}
            onEditContacts={onEditContacts}
            onAddLocation={onAddLocation}
            onEditLocation={onEditLocation}
            formatPhoneNumber={formatPhoneNumber}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <PortalSidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />
      </div>

      {/* Mobile Header + Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b p-4 flex items-center justify-between">
        <h1 className="font-semibold">Customer Portal</h1>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <PortalSidebar
              currentSection={currentSection}
              onSectionChange={(section) => {
                setCurrentSection(section);
                setMobileMenuOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-6xl py-6 md:py-8 mt-16 md:mt-0 pb-24 md:pb-8">
          {renderSection()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
    </div>
  );
}
