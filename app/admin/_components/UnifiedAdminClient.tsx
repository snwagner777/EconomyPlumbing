'use client';

/**
 * Unified Admin Dashboard - Client Component
 * 
 * Main admin interface with all functionality consolidated in one place.
 * Uses URL search params for section navigation (replacing wouter/localStorage).
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  Phone,
  Building2,
  LogOut,
  Users,
  Star,
  Settings,
  Mail,
  Bot
} from 'lucide-react';

type AdminSection = 
  | 'dashboard'
  | 'photos'
  | 'success-stories'
  | 'commercial-customers'
  | 'page-metadata'
  | 'tracking-numbers'
  | 'products'
  | 'referrals'
  | 'reviews'
  | 'review-platforms'
  | 'customer-data'
  | 'marketing-campaigns'
  | 'custom-campaigns'
  | 'chatbot';

export default function UnifiedAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize section from URL
  const urlSection = searchParams.get('section') || 'dashboard';
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    return isValidSection(urlSection) ? (urlSection as AdminSection) : 'dashboard';
  });

  // Check auth status
  const { data: authData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
  });

  // Fetch stats
  const { data: statsData } = useQuery<{ stats: any }>({
    queryKey: ['/api/admin/stats'],
  });

  // Sync activeSection when URL changes (back/forward navigation, external links)
  useEffect(() => {
    const currentSection = searchParams.get('section') || 'dashboard';
    if (isValidSection(currentSection) && currentSection !== activeSection) {
      setActiveSection(currentSection as AdminSection);
    }
  }, [searchParams]); // Only depend on searchParams

  // Update URL when section changes programmatically (use push for history)
  useEffect(() => {
    const urlParam = searchParams.get('section') || 'dashboard';
    if (activeSection !== urlParam) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeSection !== 'dashboard') {
        params.set('section', activeSection);
      } else {
        params.delete('section');
      }
      router.push(`/admin?${params.toString()}`, { scroll: false });
    }
  }, [activeSection]); // Only depend on activeSection

  // Redirect if not admin
  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push('/admin/oauth-login');
    }
  }, [authData, router]);

  // Show nothing while checking auth
  if (!authData?.isAdmin) {
    return null;
  }

  const stats = statsData?.stats || {};

  const sidebarStyle = {
    '--sidebar-width': '280px',
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPlaceholder stats={stats} />;
      case 'photos':
        return <SectionPlaceholder title="Photo Management" />;
      case 'success-stories':
        return <SectionPlaceholder title="Success Stories" />;
      case 'reviews':
        return <SectionPlaceholder title="Reviews" />;
      case 'commercial-customers':
        return <SectionPlaceholder title="Commercial Customers" />;
      case 'page-metadata':
        return <SectionPlaceholder title="Page Metadata" />;
      case 'tracking-numbers':
        return <SectionPlaceholder title="Tracking Numbers" />;
      case 'products':
        return <SectionPlaceholder title="Products & Memberships" />;
      case 'review-platforms':
        return <SectionPlaceholder title="Review Platforms" />;
      case 'referrals':
        return <SectionPlaceholder title="Referral System" />;
      case 'marketing-campaigns':
        return <SectionPlaceholder title="Marketing Campaigns" />;
      case 'custom-campaigns':
        return <SectionPlaceholder title="Custom Campaigns" />;
      case 'customer-data':
        return <SectionPlaceholder title="Customer Data" />;
      case 'chatbot':
        return <SectionPlaceholder title="AI Chatbot" />;
      default:
        return <DashboardPlaceholder stats={stats} />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<AdminSection, string> = {
      dashboard: 'Dashboard',
      photos: 'Photo Management',
      'success-stories': 'Success Stories',
      reviews: 'Reviews',
      'review-platforms': 'Review Platforms',
      'commercial-customers': 'Commercial Customers',
      'page-metadata': 'Page Metadata',
      'tracking-numbers': 'Tracking Numbers',
      products: 'Products & Memberships',
      referrals: 'Referral System',
      'marketing-campaigns': 'Marketing Campaigns',
      'custom-campaigns': 'Custom Campaigns',
      'customer-data': 'Customer Data',
      chatbot: 'AI Chatbot',
    };
    return titles[activeSection];
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="heading-section-title">
                  {getSectionTitle()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeSection === 'dashboard'
                    ? 'Welcome to the admin portal'
                    : `Manage ${getSectionTitle().toLowerCase()}`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/logout')}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Helper function
function isValidSection(section: string): boolean {
  const validSections: AdminSection[] = [
    'dashboard',
    'photos',
    'success-stories',
    'commercial-customers',
    'page-metadata',
    'tracking-numbers',
    'products',
    'referrals',
    'reviews',
    'review-platforms',
    'customer-data',
    'marketing-campaigns',
    'custom-campaigns',
    'chatbot',
  ];
  return validSections.includes(section as AdminSection);
}

// Sidebar Component
interface AdminSidebarProps {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
}

function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'photos' as const, label: 'Photos', icon: ImageIcon },
    { id: 'success-stories' as const, label: 'Success Stories', icon: Star },
    { id: 'reviews' as const, label: 'Reviews', icon: Star },
    { id: 'commercial-customers' as const, label: 'Commercial', icon: Building2 },
    { id: 'page-metadata' as const, label: 'SEO/Meta', icon: FileText },
    { id: 'tracking-numbers' as const, label: 'Tracking #s', icon: Phone },
    { id: 'products' as const, label: 'Products', icon: Building2 },
    { id: 'referrals' as const, label: 'Referrals', icon: Users },
    { id: 'marketing-campaigns' as const, label: 'Marketing', icon: Mail },
    { id: 'customer-data' as const, label: 'Customers', icon: Users },
    { id: 'chatbot' as const, label: 'Chatbot', icon: Bot },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-lg font-bold">Economy Plumbing</h2>
        <p className="text-xs text-muted-foreground">Admin Dashboard</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          Next.js Migration v2.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Placeholder Components
function DashboardPlaceholder({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard label="Total Photos" value={stats.totalPhotos || 0} />
        <StatsCard label="Blog Posts" value={stats.totalBlogPosts || 0} />
        <StatsCard label="Customers" value={stats.totalCustomers || 0} />
        <StatsCard label="Reviews" value={stats.totalReviews || 0} />
      </div>

      <div className="bg-card p-8 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
        <p className="text-muted-foreground">
          Select a section from the sidebar to manage different parts of the website.
          This is the migrated unified admin dashboard.
        </p>
      </div>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-card p-8 rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">
        This section is being migrated from the old admin dashboard.
        Full functionality will be restored soon.
      </p>
    </div>
  );
}
