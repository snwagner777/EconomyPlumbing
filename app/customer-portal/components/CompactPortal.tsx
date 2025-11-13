/**
 * Compact Portal Layout
 * New sidebar-based design with dashboard overview
 */

'use client';

import { useState } from 'react';
import { DashboardOverview } from './DashboardOverview';
import { PortalSidebar, type PortalSection } from './PortalSidebar';
import { MembershipsSection } from './MembershipsSection';
import { VouchersSection } from '../VouchersSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface CompactPortalProps {
  customerId?: number;
  customerData?: any;
  onSchedule?: () => void;
  onPayInvoice?: () => void;
  onShareReferral?: () => void;
}

export function CompactPortal({
  customerId,
  customerData,
  onSchedule,
  onPayInvoice,
  onShareReferral,
}: CompactPortalProps) {
  const [currentSection, setCurrentSection] = useState<PortalSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calculate dashboard data from customerData
  const dashboardData = customerData ? {
    memberships: {
      activeCount: customerData.memberships?.filter((m: any) => m.status === 'Active').length || 0,
      nextRenewalDate: customerData.memberships?.[0]?.nextBillingDate 
        ? new Date(customerData.memberships[0].nextBillingDate).toLocaleDateString()
        : undefined,
    },
    vouchers: {
      activeCount: customerData.vouchers?.filter((v: any) => v.status === 'active').length || 0,
      totalValue: customerData.vouchers?.reduce((sum: number, v: any) => 
        v.status === 'active' ? sum + (v.discountAmount || 0) : sum, 0) || 0,
    },
    referrals: {
      totalSent: 0, // TODO: Add referral data
      creditsEarned: 0,
      pending: 0,
    },
    quickActions: {
      onSchedule,
      onPayInvoice,
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
            {customerId && <VouchersSection customerId={customerId} />}
          </div>
        );
        
      case 'services':
      case 'billing':
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{currentSection}</CardTitle>
              <CardDescription>This section is coming soon in the redesign</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The {currentSection} section will display your {
                  currentSection === 'services' ? 'appointments, estimates, and job history' :
                  currentSection === 'billing' ? 'invoices and payment methods' :
                  'account settings and preferences'
                }.
              </p>
              <Button
                variant="outline"
                onClick={() => setCurrentSection('overview')}
                className="mt-4"
              >
                Back to Overview
              </Button>
            </CardContent>
          </Card>
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
        <div className="container max-w-6xl py-6 md:py-8 mt-16 md:mt-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
