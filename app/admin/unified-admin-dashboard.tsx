'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  SidebarFooter
} from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  LayoutDashboard,
  ImageIcon, 
  FileText, 
  Phone, 
  Building2, 
  FileEdit,
  LogOut,
  TrendingUp,
  Users,
  Star,
  Settings,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Upload,
  Sparkles,
  Loader2,
  Package,
  Database,
  Search,
  Activity,
  BarChart3,
  Mail,
  Calendar,
  AlertCircle,
  MessageCircle,
  MessageSquare,
  CreditCard,
  Trophy,
  Archive,
  ThumbsDown,
  ThumbsUp,
  Clock,
  ChevronRight,
  Download,
  Bot,
  Code,
  Save,
  AlertTriangle,
  RefreshCcw
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrackingNumber, PageMetadata, CommercialCustomer } from "@shared/schema";
import { FocalPointEditor } from "@/components/FocalPointEditor";
import { DraggableCollageEditor } from "@/components/DraggableCollageEditor";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatPhoneNumber } from "@/lib/phoneUtils";

type AdminSection = 'dashboard' | 'photos' | 'products' | 'referrals' | 'review-platforms' | 'customer-data' | 'marketing-campaigns' | 'custom-campaigns' | 'chatbot' | 'email-processing';

interface EmailTemplate {
  id: string;
  campaignType: string;
  emailNumber: number;
  subject: string;
  preheader: string | null;
  htmlContent: string;
  plainTextContent: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemSettings {
  reviewMasterEmailSwitch: boolean;
  reviewDripEnabled: boolean;
  referralDripEnabled: boolean;
  autoSendReviewRequests: boolean;
  autoStartReferralCampaigns: boolean;
  // Review Request campaign phone
  reviewRequestPhoneNumber: string;
  reviewRequestPhoneFormatted: string;
  // Referral Nurture campaign phone
  referralNurturePhoneNumber: string;
  referralNurturePhoneFormatted: string;
  // Quote Follow-up campaign phone
  quoteFollowupPhoneNumber: string;
  quoteFollowupPhoneFormatted: string;
}

interface ReviewRequest {
  id: string;
  jobCompletionId: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;
  stopReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  reviewSubmitted: boolean;
  reviewSubmittedAt?: string;
  reviewRating?: number;
  reviewPlatform?: string;
  emailOpens: number;
  linkClicks: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralNurture {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;
  pauseReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  consecutiveUnopened: number;
  totalOpens: number;
  totalClicks: number;
  referralsSubmitted: number;
  lastReferralAt?: string;
  createdAt: string;
  pausedAt?: string;
  completedAt?: string;
}

interface ReviewRequestsDashboardStats {
  reviewRequests: {
    total: number;
    active: number;
    completed: number;
    reviewsSubmitted: number;
    averageRating: number;
    openRate: number;
    clickRate: number;
  };
  referralNurture: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    totalReferrals: number;
    averageEngagement: number;
  };
}

// Define all application pages
const ALL_PAGES = [
  { path: '/', title: 'Home' },
  { path: '/water-heater-services', title: 'Water Heater Services' },
  { path: '/drain-cleaning', title: 'Drain Cleaning' },
  { path: '/leak-repair', title: 'Leak Repair' },
  { path: '/toilet-faucet', title: 'Toilet & Faucet' },
  { path: '/gas-line-services', title: 'Gas Services' },
  { path: '/commercial-plumbing', title: 'Commercial Plumbing' },
  { path: '/backflow', title: 'Backflow Testing' },
  { path: '/emergency', title: 'Emergency Plumbing' },
  { path: '/plumber-near-me', title: 'Plumber Near Me' },
  { path: '/commercial-services', title: 'Commercial Services' },
  { path: '/drainage-solutions', title: 'Drainage Solutions' },
  { path: '/faucet-installation', title: 'Faucet Installation' },
  { path: '/garbage-disposal-repair', title: 'Garbage Disposal' },
  { path: '/gas-leak-detection', title: 'Gas Leak Detection' },
  { path: '/hydro-jetting-services', title: 'Hydro Jetting' },
  { path: '/permit-resolution-services', title: 'Permit Resolution' },
  { path: '/rooter-services', title: 'Rooter Services' },
  { path: '/sewage-pump-services', title: 'Sewage Pump' },
  { path: '/water-pressure-solutions', title: 'Water Pressure' },
  { path: '/water-heater-guide', title: 'Water Heater Guide' },
  { path: '/services', title: 'Services' },
  { path: '/service-areas', title: 'Service Areas' },
  { path: '/plumber-austin', title: 'Austin Plumber' },
  { path: '/plumber-in-cedar-park--tx', title: 'Cedar Park Plumber' },
  { path: '/plumber-leander', title: 'Leander Plumber' },
  { path: '/round-rock-plumber', title: 'Round Rock Plumber' },
  { path: '/plumber-georgetown', title: 'Georgetown Plumber' },
  { path: '/plumber-pflugerville', title: 'Pflugerville Plumber' },
  { path: '/plumber-liberty-hill', title: 'Liberty Hill Plumber' },
  { path: '/plumber-buda', title: 'Buda Plumber' },
  { path: '/plumber-kyle', title: 'Kyle Plumber' },
  { path: '/plumber-marble-falls', title: 'Marble Falls Plumber' },
  { path: '/plumber-burnet', title: 'Burnet Plumber' },
  { path: '/plumber-horseshoe-bay', title: 'Horseshoe Bay Plumber' },
  { path: '/plumber-kingsland', title: 'Kingsland Plumber' },
  { path: '/plumber-granite-shoals', title: 'Granite Shoals Plumber' },
  { path: '/plumber-bertram', title: 'Bertram Plumber' },
  { path: '/plumber-spicewood', title: 'Spicewood Plumber' },
  { path: '/contact', title: 'Contact' },
  { path: '/faq', title: 'FAQ' },
  { path: '/privacy-policy', title: 'Privacy Policy' },
  { path: '/refund_returns', title: 'Refund & Returns' },
  { path: '/membership-benefits', title: 'Membership Benefits' },
  { path: '/success-stories', title: 'Success Stories' },
  { path: '/store', title: 'Store' },
  { path: '/blog', title: 'Blog' },
  { path: '/about', title: 'About' },
];

function AdminSidebar({ activeSection, setActiveSection }: { activeSection: AdminSection; setActiveSection: (section: AdminSection) => void }) {
  const router = useRouter();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      section: 'dashboard' as AdminSection,
      description: "Overview & stats"
    },
    {
      title: "Photo Management",
      icon: ImageIcon,
      section: 'photos' as AdminSection,
      description: "Manage all photos"
    },
    {
      title: "Review Platforms",
      icon: Star,
      section: 'review-platforms' as AdminSection,
      description: "Manage review links"
    },
    {
      title: "Products & Memberships",
      icon: Package,
      section: 'products' as AdminSection,
      description: "SKUs & ServiceTitan setup"
    },
    {
      title: "Referral System",
      icon: Users,
      section: 'referrals' as AdminSection,
      description: "Tracking, emails & history"
    },
    {
      title: "Marketing Campaigns",
      icon: Mail,
      section: 'marketing-campaigns' as AdminSection,
      description: "Settings, templates & analytics"
    },
    {
      title: "Custom Campaigns",
      icon: Sparkles,
      section: 'custom-campaigns' as AdminSection,
      description: "Create AI-powered email campaigns"
    },
    {
      title: "Customer Data",
      icon: Database,
      section: 'customer-data' as AdminSection,
      description: "Import history & metrics"
    },
    {
      title: "AI Chatbot",
      icon: Bot,
      section: 'chatbot' as AdminSection,
      description: "Conversations & analytics"
    },
    {
      title: "Email Processing",
      icon: Mail,
      section: 'email-processing' as AdminSection,
      description: "Invoice & estimate webhooks"
    },
  ];

  const handleLogout = () => {
    // OAuth logout - redirects to Replit logout then back to homepage
    window.location.href = "/api/oauth/logout";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Admin Portal</h2>
            <p className="text-xs text-muted-foreground">Economy Plumbing</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.section)}
                    isActive={activeSection === item.section}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

interface SyncStatus {
  totalCustomers: number;
  totalContacts: number;
  lastSyncedAt: string | null;
  isRunning: boolean;
}

interface PortalStats {
  totalSearches: number;
  totalCustomers: number;
  recentSearches: {
    searchType: string;
    timestamp: string;
    found: boolean;
  }[];
}

function DashboardOverview({ stats, photos }: { stats: any; photos: any[] }) {
  const { toast } = useToast();
  const unusedPhotos = photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl);
  const goodQualityUnused = unusedPhotos.filter((p: any) => p.isGoodQuality);

  // Fetch ServiceTitan sync status
  const { data: syncStatus, isLoading: syncLoading, refetch: refetchSync } = useQuery<SyncStatus>({
    queryKey: ['/api/admin/sync-status'],
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch Customer Portal stats
  const { data: portalStats, isLoading: statsLoading } = useQuery<PortalStats>({
    queryKey: ['/api/admin/portal-stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch conversion stats
  const { data: conversionStats, isLoading: conversionLoading } = useQuery<{
    schedulerOpens: number;
    phoneClicks: number;
    formSubmissions: number;
  }>({
    queryKey: ['/api/admin/conversion-stats'],
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Manual sync trigger mutation - FIXED ENDPOINT
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/trigger-sync', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to start sync');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stats Refreshed",
        description: "Customer database stats updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh stats",
        variant: "destructive",
      });
    },
  });

  const syncProgress = syncStatus?.totalCustomers 
    ? Math.min((syncStatus.totalCustomers / 12000) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Customer Database Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Database</CardTitle>
                <CardDescription>XLSX-based customer data (hourly Mailgun imports)</CardDescription>
              </div>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || syncStatus?.isRunning}
                size="sm"
                data-testid="button-manual-sync"
              >
                {syncMutation.isPending || syncStatus?.isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">
                  {syncLoading ? <Skeleton className="h-8 w-20" /> : syncStatus?.totalCustomers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">
                  {syncLoading ? <Skeleton className="h-8 w-20" /> : syncStatus?.totalContacts.toLocaleString()}
                </p>
              </div>
            </div>
            
            {!syncLoading && syncStatus && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sync Progress</span>
                    <span className="font-medium">{Math.round(syncProgress)}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full bg-green-500`} />
                    <span className="text-sm text-muted-foreground">
                      XLSX Import Active
                    </span>
                  </div>
                  {syncStatus.lastSyncedAt && (
                    <span className="text-xs text-muted-foreground">
                      Last: {new Date(syncStatus.lastSyncedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Portal</CardTitle>
            <CardDescription>Portal usage analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Searches</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : portalStats?.totalSearches || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customers Found</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : portalStats?.recentSearches.filter(s => s.found).length || 0}
                </p>
              </div>
            </div>

            {!statsLoading && portalStats && portalStats.recentSearches.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Recent Searches</p>
                <div className="space-y-1">
                  {portalStats.recentSearches.slice(0, 3).map((search, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">
                        {search.searchType === 'phone' ? <Phone className="inline h-3 w-3 mr-1" /> : <Mail className="inline h-3 w-3 mr-1" />}
                        {search.searchType}
                      </span>
                      <Badge variant={search.found ? "default" : "secondary"} className="text-xs">
                        {search.found ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {search.found ? 'Found' : 'Not Found'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Photo Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>All sources</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unused Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.unused || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Ready for blogs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Good Quality</CardDescription>
            <CardTitle className="text-3xl">{goodQualityUnused.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>High quality unused</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Used Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.used || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>In blog posts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and background tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${syncStatus?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium">ServiceTitan Sync</p>
                  <p className="text-xs text-muted-foreground">Customer data synchronization</p>
                </div>
              </div>
              <Badge variant="outline" className={syncStatus?.isRunning ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                {syncStatus?.isRunning ? 'Syncing' : 'Idle'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Photo Import System</p>
                  <p className="text-xs text-muted-foreground">Monitoring Google Drive & CompanyCam</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Auto Blog Generator</p>
                  <p className="text-xs text-muted-foreground">Weekly content creation</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Review Sync</p>
                  <p className="text-xs text-muted-foreground">Google Places API integration</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Conversion Tracking Overview</CardTitle>
          </div>
          <CardDescription>
            Monitor key conversion events across the website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Scheduler Opens</p>
              </div>
              <p className="text-2xl font-bold">
                {conversionLoading ? <Skeleton className="h-8 w-16" /> : (conversionStats?.schedulerOpens || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ServiceTitan scheduler clicks
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Phone Clicks</p>
              </div>
              <p className="text-2xl font-bold">
                {conversionLoading ? <Skeleton className="h-8 w-16" /> : (conversionStats?.phoneClicks || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click-to-call conversions
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Form Submissions</p>
              </div>
              <p className="text-2xl font-bold">
                {conversionLoading ? <Skeleton className="h-8 w-16" /> : (conversionStats?.formSubmissions || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact form completions
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Portal Searches</p>
              </div>
              <p className="text-2xl font-bold">{portalStats?.totalSearches || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Customer portal lookups
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Full conversion tracking with Google Analytics, Meta Pixel, and Microsoft Clarity is active. 
              Advanced analytics available in your Google Analytics dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoManagement() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showSuccessStoryDialog, setShowSuccessStoryDialog] = useState(false);
  const [showBlogPostDialog, setShowBlogPostDialog] = useState(false);
  const { toast } = useToast();

  const [isFocalPointDialogOpen, setIsFocalPointDialogOpen] = useState(false);
  const [focalPointPhoto, setFocalPointPhoto] = useState<any | null>(null);
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number } | null>(null);

  // Fetch photos with filters
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['/api/admin/photos', categoryFilter, qualityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: categoryFilter,
        quality: qualityFilter,
        status: statusFilter,
      });
      return await fetch(`/api/admin/photos?${params}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
  });

  const photos = photosData?.photos || [];

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const clearSelection = () => setSelectedPhotos([]);

  const handleCreateSuccessStory = () => {
    if (selectedPhotos.length !== 2) {
      toast({
        title: "Selection Error",
        description: "Please select exactly 2 photos for a success story",
        variant: "destructive",
      });
      return;
    }
    setShowSuccessStoryDialog(true);
  };

  const handleCreateBlogPost = () => {
    if (selectedPhotos.length !== 1) {
      toast({
        title: "Selection Error",
        description: "Please select exactly 1 photo for a blog post",
        variant: "destructive",
      });
      return;
    }
    setShowBlogPostDialog(true);
  };

  const getSelectedPhotoObjects = () => {
    return photos.filter((p: any) => selectedPhotos.includes(p.id));
  };

  const updateFocalPointMutation = useMutation({
    mutationFn: async ({ id, focalPoint, photoSource }: { id: string; focalPoint: { x: number; y: number } | null; photoSource: string }) => {
      return await apiRequest("PUT", `/api/admin/photos/${id}/focal-point`, {
        focalPointX: focalPoint?.x,
        focalPointY: focalPoint?.y,
        photoSource,
      });
    },
    onSuccess: () => {
      toast({
        title: "Focal Point Updated",
        description: "The photo's focal point has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      setIsFocalPointDialogOpen(false);
      setFocalPointPhoto(null);
      setFocalPoint(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenFocalPointEditor = (photo: any) => {
    setFocalPointPhoto(photo);
    setFocalPoint(
      photo.focalPointX !== null && photo.focalPointY !== null
        ? { x: photo.focalPointX, y: photo.focalPointY }
        : { x: 50, y: 50 }
    );
    setIsFocalPointDialogOpen(true);
  };

  const handleSaveFocalPoint = () => {
    if (!focalPointPhoto) return;

    updateFocalPointMutation.mutate({
      id: focalPointPhoto.id,
      focalPoint,
      photoSource: focalPointPhoto.photoSource || 'companycam',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter photos by category, quality, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="companycam">CompanyCam</SelectItem>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="servicetitan">ServiceTitan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality-filter">Quality</Label>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger id="quality-filter" data-testid="select-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="good">Good Quality</SelectItem>
                  <SelectItem value="poor">Poor Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unused">Unused Only</SelectItem>
                  <SelectItem value="used">Used Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedPhotos.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">{selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected</p>
                <Button variant="outline" size="sm" onClick={clearSelection} data-testid="button-clear-selection">
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateBlogPost}
                  disabled={selectedPhotos.length !== 1}
                  data-testid="button-create-blog-post"
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Create Blog Post {selectedPhotos.length !== 1 && `(Select 1)`}
                </Button>
                <Button
                  onClick={handleCreateSuccessStory}
                  disabled={selectedPhotos.length !== 2}
                  data-testid="button-create-success-story"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Create Success Story {selectedPhotos.length !== 2 && `(Select 2)`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
          <CardDescription>Select photos to create content manually</CardDescription>
        </CardHeader>
        <CardContent>
          {photosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos found with current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div key={photo.id} className="group relative">
                  <div 
                    className={`aspect-square relative rounded-lg overflow-hidden bg-muted cursor-pointer ${
                      selectedPhotos.includes(photo.id) ? 'ring-4 ring-primary' : ''
                    }`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.aiDescription || 'Photo'}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <div
                        className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${
                          selectedPhotos.includes(photo.id) 
                            ? 'bg-primary border-primary' 
                            : 'bg-white/80 border-white'
                        }`}
                      >
                        {selectedPhotos.includes(photo.id) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(photo.photoUrl, '_blank');
                        }}
                        data-testid={`view-photo-${photo.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFocalPointEditor(photo);
                        }}
                        data-testid={`focal-point-photo-${photo.id}`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={photo.isGoodQuality ? 'default' : 'outline'}>
                        {photo.isGoodQuality ? 'Good' : 'Poor'}
                      </Badge>
                      {(photo.usedInBlogPostId || photo.usedInPageUrl) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Used
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {photo.aiDescription || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Story Creation Dialog */}
      {showSuccessStoryDialog && (
        <ManualSuccessStoryDialog
          photos={getSelectedPhotoObjects()}
          onClose={() => {
            setShowSuccessStoryDialog(false);
            clearSelection();
          }}
        />
      )}

      {/* Blog Post Creation Dialog */}
      {showBlogPostDialog && (
        <ManualBlogPostDialog
          photo={getSelectedPhotoObjects()[0]}
          onClose={() => {
            setShowBlogPostDialog(false);
            clearSelection();
          }}
        />
      )}

      {/* Focal Point Editor Dialog */}
      <Dialog open={isFocalPointDialogOpen} onOpenChange={setIsFocalPointDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Focal Point</DialogTitle>
            <DialogDescription>
              Click on the image to set where the main subject should be centered when this photo is used.
            </DialogDescription>
          </DialogHeader>
          {focalPointPhoto && (
            <div className="grid gap-6 py-4">
              <FocalPointEditor
                imageUrl={focalPointPhoto.photoUrl}
                initialFocalPoint={focalPoint || undefined}
                onFocalPointChange={setFocalPoint}
                label="Click to set focal point"
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFocalPointDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFocalPoint} 
                  disabled={updateFocalPointMutation.isPending}
                  data-testid="button-save-photo-focal-point"
                >
                  {updateFocalPointMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Save Focal Point
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



function ProductsSection() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<{ products: any[]; count: number }>({
    queryKey: ['/api/products'],
  });
  
  const products = data?.products || [];

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/products/${data.id}`, data.updates);
      const updatedProduct = await response.json();
      return updatedProduct;
    },
    onSuccess: async (updatedProduct) => {
      queryClient.setQueryData<any[]>(['/api/products'], (old) => {
        if (!old) return old;
        return old.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      });
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const updates: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string) * 100,
      sku: formData.get('sku') as string || null,
      durationBillingId: formData.get('durationBillingId') as string || null,
      serviceTitanMembershipTypeId: formData.get('serviceTitanMembershipTypeId') as string || null,
    };

    updateProductMutation.mutate({ id: editingProduct.id, updates });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const memberships = products?.filter(p => p.category === 'membership') || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">VIP Memberships</h2>
        <div className="grid gap-4">
          {memberships.map((product) => (
            <Card key={product.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <span className="text-2xl font-bold text-primary">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">SKU</span>
                      </div>
                      <span className="text-foreground">{product.sku || 'Not set'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Duration Billing ID</span>
                      </div>
                      <span className="text-foreground font-mono text-xs">{product.durationBillingId || 'Not set'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">ServiceTitan Type ID</span>
                      </div>
                      <span className="text-foreground font-mono text-xs">{product.serviceTitanMembershipTypeId || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleEdit(product)}
                  size="sm"
                  variant="outline"
                  data-testid={`button-edit-product-${product.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingProduct?.name}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingProduct?.description}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (in dollars)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingProduct ? (editingProduct.price / 100).toFixed(2) : ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={editingProduct?.sku || ''}
                placeholder="e.g., VIP-ANNUAL"
              />
            </div>
            <div>
              <Label htmlFor="durationBillingId">Duration Billing ID</Label>
              <Input
                id="durationBillingId"
                name="durationBillingId"
                defaultValue={editingProduct?.durationBillingId || ''}
                placeholder="ServiceTitan billing ID"
              />
            </div>
            <div>
              <Label htmlFor="serviceTitanMembershipTypeId">ServiceTitan Membership Type ID</Label>
              <Input
                id="serviceTitanMembershipTypeId"
                name="serviceTitanMembershipTypeId"
                defaultValue={editingProduct?.serviceTitanMembershipTypeId || ''}
                placeholder="ServiceTitan membership type ID"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SerpApiStatusCard() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: serpStats, isLoading } = useQuery({
    queryKey: ['/api/admin/reviews/serpapi/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleManualSync = async (clearFirst: boolean = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/reviews/serpapi/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearFirst }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();
      
      toast({
        title: "Success",
        description: clearFirst 
          ? `Cleared old reviews and synced ${data.newReviews.total} fresh reviews (Google: ${data.newReviews.google}, Yelp: ${data.newReviews.yelp}, Facebook: ${data.newReviews.facebook})`
          : `Synced ${data.newReviews.total} new reviews (Google: ${data.newReviews.google}, Yelp: ${data.newReviews.yelp}, Facebook: ${data.newReviews.facebook})`,
      });

      // Refresh stats
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews/serpapi/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google-reviews'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync reviews",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const configured = (serpStats as any)?.configured ?? false;
  const bySource = (serpStats as any)?.bySource || [];
  const googleStats = bySource.find((s: any) => s.source === 'google_serpapi');
  const yelpStats = bySource.find((s: any) => s.source === 'yelp');
  const facebookStats = bySource.find((s: any) => s.source === 'facebook');

  if (isLoading) {
    return (
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-sm text-blue-700 dark:text-blue-300">Loading review sync status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Multi-Platform Review Sync - Active</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Automatically fetching reviews from Google ({googleStats?.count || 0}), Yelp ({yelpStats?.count || 0}), and Facebook ({facebookStats?.count || 0}) daily via SerpAPI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleManualSync(false)}
              disabled={isSyncing}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              data-testid="button-sync-reviews"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              onClick={() => handleManualSync(true)}
              disabled={isSyncing}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              data-testid="button-clear-and-sync"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Clearing & Syncing...' : 'Clear & Sync'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function ReviewPlatformsSection() {
  const { data: platforms, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/review-platforms'],
  });

  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/admin/review-platforms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update platform');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-platforms'] });
      toast({ title: "Platform updated successfully" });
      setShowDialog(false);
      setEditingPlatform(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating platform", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingPlatform) return;
    updateMutation.mutate({
      id: editingPlatform.id,
      updates: {
        displayName: editingPlatform.displayName,
        url: editingPlatform.url,
        enabled: editingPlatform.enabled,
        description: editingPlatform.description,
        sortOrder: editingPlatform.sortOrder,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Platform Links</h2>
        <p className="text-muted-foreground">Manage where customers can leave reviews</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms?.map((platform) => (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                    <CardDescription className="text-xs mt-1">{platform.platform}</CardDescription>
                  </div>
                  <Badge variant={platform.enabled ? "default" : "secondary"}>
                    {platform.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Review URL</p>
                  <p className="text-sm font-mono truncate">{platform.url}</p>
                </div>
                {platform.description && (
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEdit(platform)}
                  data-testid={`button-edit-${platform.platform}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Platform
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingPlatform?.displayName}</DialogTitle>
            <DialogDescription>
              Update the review platform settings
            </DialogDescription>
          </DialogHeader>
          {editingPlatform && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editingPlatform.displayName}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, displayName: e.target.value })}
                  data-testid="input-displayName"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Review URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={editingPlatform.url}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, url: e.target.value })}
                  data-testid="input-url"
                />
                <p className="text-xs text-muted-foreground">
                  Direct link to your business review page on this platform
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingPlatform.description || ''}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, description: e.target.value })}
                  data-testid="input-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={editingPlatform.sortOrder}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, sortOrder: parseInt(e.target.value) })}
                  data-testid="input-sortOrder"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={editingPlatform.enabled}
                  onCheckedChange={(checked) => setEditingPlatform({ ...editingPlatform, enabled: checked })}
                  data-testid="switch-enabled"
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Customer Data Section - Import history and metrics
function CustomerDataSection() {
  const [timePeriod, setTimePeriod] = useState<'all' | '1year' | '2years' | '3years'>('all');

  const { data: customerMetrics, isLoading: metricsLoading } = useQuery<{
    totalCustomers: number;
    customersWithRevenue: number;
    totalLifetimeRevenue: number;
    avgLifetimeRevenue: number;
    maxLifetimeRevenue: number;
  }>({
    queryKey: ['/api/admin/customer-metrics'],
  });

  const { data: importHistory, isLoading: historyLoading, refetch: refetchImports, dataUpdatedAt: importsUpdatedAt } = useQuery({
    queryKey: ['/api/admin/customer-imports'],
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchIntervalInBackground: false, // Only poll when tab is active
  });

  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery({
    queryKey: ['/api/admin/top-customers', timePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/top-customers?period=${timePeriod}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch top customers');
      return response.json();
    },
  });

  if (metricsLoading || historyLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const metrics = customerMetrics || {
    totalCustomers: 0,
    customersWithRevenue: 0,
    totalLifetimeRevenue: 0,
    avgLifetimeRevenue: 0,
    maxLifetimeRevenue: 0,
  };
  const imports = (importHistory as any[]) || [];
  const latestImport = imports[0];
  const topCustomers = topCustomersData?.topCustomers || [];

  return (
    <div className="p-8 space-y-6">
      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.customersWithRevenue?.toLocaleString() || '0'} with revenue
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lifetime Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((metrics.totalLifetimeRevenue || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time customer value
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Customer Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((metrics.avgLifetimeRevenue || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-max-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customer Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((metrics.maxLifetimeRevenue || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest lifetime value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Import Status */}
      {latestImport && (
        <Card data-testid="card-latest-import">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Latest Import
            </CardTitle>
            <CardDescription>
              Most recent customer data update from ServiceTitan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-1">Import Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(latestImport.startedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">File</p>
                <p className="text-sm text-muted-foreground">{latestImport.fileName}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Badge variant={latestImport.status === 'completed' ? 'default' : 'secondary'}>
                  {latestImport.status}
                </Badge>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Customers Imported</p>
                <p className="text-2xl font-bold">{latestImport.customersImported?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Contacts Imported</p>
                <p className="text-2xl font-bold">{latestImport.contactsImported?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Processing Time</p>
                <p className="text-2xl font-bold">
                  {latestImport.processingTime ? `${(latestImport.processingTime / 1000).toFixed(1)}s` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold text-destructive">{latestImport.errors || 0}</p>
              </div>
            </div>

            {latestImport.newCustomers > 0 && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  {latestImport.newCustomers} new customers added since last import
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card data-testid="card-import-history">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                Recent customer data imports from ServiceTitan{importsUpdatedAt && !historyLoading && ` • Last updated: ${new Date(importsUpdatedAt).toLocaleTimeString()}`}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchImports()}
              data-testid="button-refresh-imports"
              disabled={historyLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No imports yet. Upload your first XLSX file to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {imports.map((imp: any) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                  data-testid={`import-${imp.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium">{imp.fileName}</p>
                      <Badge variant={imp.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {imp.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(imp.startedAt).toLocaleString()} • {imp.customersImported?.toLocaleString()} customers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${((imp.totalLifetimeRevenue || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card data-testid="card-top-customers">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Customers by Lifetime Value
              </CardTitle>
              <CardDescription>
                Highest revenue customers in selected time period
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timePeriod === '1year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('1year')}
                data-testid="button-filter-1year"
              >
                Last Year
              </Button>
              <Button
                variant={timePeriod === '2years' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('2years')}
                data-testid="button-filter-2years"
              >
                Last 2 Years
              </Button>
              <Button
                variant={timePeriod === '3years' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('3years')}
                data-testid="button-filter-3years"
              >
                Last 3 Years
              </Button>
              <Button
                variant={timePeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('all')}
                data-testid="button-filter-all"
              >
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {topCustomersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topCustomers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No customers found for this time period.
            </div>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer: any, index: number) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`top-customer-${customer.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {customer.jobCount} {customer.jobCount === 1 ? 'job' : 'jobs'}
                        </p>
                        {customer.lastServiceDate && (
                          <p className="text-sm text-muted-foreground">
                            Last service: {new Date(customer.lastServiceDate).toLocaleDateString()}
                          </p>
                        )}
                        {customer.lastServiceType && (
                          <Badge variant="secondary" className="text-xs">
                            {customer.lastServiceType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      ${(customer.lifetimeValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Lifetime value</p>
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

// Referral System Section (Combined: Tracking + Email Templates)
function ReferralSystemSection() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'emails'>('tracking');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="tracking" data-testid="tab-tracking">Referral Tracking</TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracking" className="mt-6">
          <ReferralTrackingSection />
        </TabsContent>
        
        <TabsContent value="emails" className="mt-6">
          <ReferralEmailTemplatesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Marketing Campaigns Section (Combined: Settings + Templates + Analytics)
function MarketingCampaignsSection() {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'analytics'>('settings');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-settings">Campaign Settings</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Email Templates</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <ReviewRequestsSection />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesSection />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <CampaignAnalyticsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom Campaigns Section
function CustomCampaignsSection() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'create'>('campaigns');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">Audience Segments</TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="mt-6">
          <CustomCampaignsListSection />
        </TabsContent>
        
        <TabsContent value="segments" className="mt-6">
          <CustomerSegmentsSection />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <CreateCustomCampaignSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom Campaigns List
function CustomCampaignsListSection() {
  const { data: campaigns, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/custom-campaigns'],
  });

  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/custom-campaigns/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns'] });
      toast({
        title: "Campaign deleted",
        description: "The campaign has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first AI-powered email campaign</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <CardDescription>{campaign.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'draft' ? 'secondary' : 'outline'}>
                  {campaign.status}
                </Badge>
                <Badge variant="outline">
                  {campaign.campaignType === 'one_time' ? 'One-Time' : 'Drip'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Audience</p>
                <p className="text-sm font-medium">{campaign.segmentId ? 'Targeted' : 'All Customers'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-sm font-medium">{campaign.totalSent || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opens</p>
                <p className="text-sm font-medium">{campaign.totalOpened || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="text-sm font-medium">{campaign.totalClicked || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setViewDialogOpen(true);
                }}
                data-testid={`button-view-campaign-${campaign.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this campaign?')) {
                    deleteCampaign.mutate(campaign.id);
                  }
                }}
                data-testid={`button-delete-campaign-${campaign.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* View Campaign Dialog with Email Editor */}
      {selectedCampaign && (
        <CampaignEmailEditorDialog
          campaign={selectedCampaign}
          isOpen={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
        />
      )}
    </div>
  );
}

// Campaign Email Editor Dialog
function CampaignEmailEditorDialog({ campaign, isOpen, onClose }: { campaign: any; isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'emails'>('details');
  
  // Email management state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateStrategy, setGenerateStrategy] = useState('');
  const [editEmailDialogOpen, setEditEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editPreheader, setEditPreheader] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editBodyPlain, setEditBodyPlain] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'plain'>('visual');

  // Fetch campaign emails
  const { data: campaignData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/custom-campaigns', campaign.id],
    enabled: isOpen,
  });

  const emails = campaignData?.emails || [];

  // Generate AI email mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/custom-campaigns/generate-email', data);
      return res.json();
    },
    onSuccess: (data) => {
      setEditSubject(data.subject);
      setEditPreheader(data.preheader || '');
      setEditBodyHtml(data.htmlContent);
      setEditBodyPlain(data.plainTextContent || '');
      setSelectedEmail(null);
      setGenerateDialogOpen(false);
      setEditEmailDialogOpen(true);
      toast({
        title: "Email generated",
        description: "AI has generated your email content. Review and save when ready.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate email with AI.",
        variant: "destructive",
      });
    },
  });

  // Save email mutation
  const saveEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedEmail) {
        const res = await apiRequest('PUT', `/api/admin/custom-campaigns/${campaign.id}/emails/${selectedEmail.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', `/api/admin/custom-campaigns/${campaign.id}/emails`, data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns', campaign.id] });
      setEditEmailDialogOpen(false);
      toast({
        title: "Email saved",
        description: "The email has been saved to the campaign.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateEmail = () => {
    generateMutation.mutate({
      campaignId: campaign.id,
      strategy: generateStrategy || undefined,
      campaignDescription: campaign.description,
    });
  };

  const handleSaveEmail = () => {
    const sequenceNumber = selectedEmail?.sequenceNumber || (emails.length + 1);
    saveEmailMutation.mutate({
      subject: editSubject,
      preheader: editPreheader || null,
      htmlContent: editBodyHtml,
      plainTextContent: editBodyPlain || null,
      sequenceNumber,
      daysAfterStart: selectedEmail?.daysAfterStart || 0,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{campaign.name}</DialogTitle>
            <DialogDescription>{campaign.description}</DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="emails">Email Sequence</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Type</Label>
                  <p className="text-sm">{campaign.campaignType === 'one_time' ? 'One-Time Blast' : 'Drip Sequence'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Tracking Phone Number</Label>
                <p className="text-sm">{campaign.trackingPhoneFormatted || 'Not set'}</p>
              </div>
              {campaign.scheduledFor && (
                <div>
                  <Label>Scheduled For</Label>
                  <p className="text-sm">{format(new Date(campaign.scheduledFor), 'PPp')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {emails.length} {emails.length === 1 ? 'email' : 'emails'} in sequence
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedEmail(null);
                    setGenerateDialogOpen(true);
                  }}
                  data-testid="button-add-email"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : emails.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No emails yet. Add your first email to the sequence.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {emails.map((email: any) => (
                      <Card key={email.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">Email #{email.sequenceNumber}</CardTitle>
                              <CardDescription className="text-xs">
                                {email.subject}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Day {email.daysAfterStart}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedEmail(email);
                                  setEditSubject(email.subject);
                                  setEditPreheader(email.preheader || '');
                                  setEditBodyHtml(email.htmlContent);
                                  setEditBodyPlain(email.plainTextContent || '');
                                  setEditEmailDialogOpen(true);
                                }}
                                data-testid={`button-edit-email-${email.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Generate AI Email Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Use AI to create personalized email content for this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="strategy">Email Strategy</Label>
              <Select value={generateStrategy} onValueChange={setGenerateStrategy}>
                <SelectTrigger id="strategy" data-testid="select-strategy">
                  <SelectValue placeholder="Auto (Recommended)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto (Recommended)</SelectItem>
                  <SelectItem value="value">Value-focused</SelectItem>
                  <SelectItem value="trust">Trust-building</SelectItem>
                  <SelectItem value="urgency">Urgency-driven</SelectItem>
                  <SelectItem value="social_proof">Social Proof</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateEmail}
                disabled={generateMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Preview Email Dialog */}
      <Dialog open={editEmailDialogOpen} onOpenChange={setEditEmailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmail ? `Edit Email #${selectedEmail.sequenceNumber}` : 'New Email'}
            </DialogTitle>
            <DialogDescription>
              Preview and edit email content
            </DialogDescription>
          </DialogHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visual">
                <Eye className="w-4 h-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html">
                <Code className="w-4 h-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="plain">
                <FileText className="w-4 h-4 mr-2" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-subject">Subject Line</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="edit-preheader">Preheader Text</Label>
                <Input
                  id="edit-preheader"
                  value={editPreheader}
                  onChange={(e) => setEditPreheader(e.target.value)}
                  placeholder="Enter preheader text..."
                  data-testid="input-preheader"
                />
              </div>

              <TabsContent value="visual">
                <div className="border rounded-lg p-4 bg-white min-h-[300px]">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                    <p className="font-semibold">{editSubject}</p>
                    {editPreheader && (
                      <>
                        <p className="text-sm text-muted-foreground mb-1 mt-2">Preheader:</p>
                        <p className="text-sm">{editPreheader}</p>
                      </>
                    )}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: editBodyHtml }}
                    className="prose max-w-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html">
                <div>
                  <Label htmlFor="edit-html">HTML Body</Label>
                  <Textarea
                    id="edit-html"
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    placeholder="Enter HTML content..."
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-html"
                  />
                </div>
              </TabsContent>

              <TabsContent value="plain">
                <div>
                  <Label htmlFor="edit-plain">Plain Text Body</Label>
                  <Textarea
                    id="edit-plain"
                    value={editBodyPlain}
                    onChange={(e) => setEditBodyPlain(e.target.value)}
                    placeholder="Enter plain text content..."
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-plain"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEmail}
              disabled={!editSubject || !editBodyHtml || saveEmailMutation.isPending}
              data-testid="button-save-email"
            >
              {saveEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Customer Segments Section
function CustomerSegmentsSection() {
  const { data: segments, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/customer-segments'],
  });

  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDescription, setNewSegmentDescription] = useState('');
  const [newSegmentType, setNewSegmentType] = useState<'static' | 'dynamic' | 'ai_generated'>('static');

  const createSegment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/customer-segments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customer-segments'] });
      setCreateDialogOpen(false);
      setNewSegmentName('');
      setNewSegmentDescription('');
      toast({
        title: "Segment created",
        description: "Your audience segment has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create segment.",
        variant: "destructive",
      });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/customer-segments/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customer-segments'] });
      toast({
        title: "Segment deleted",
        description: "The segment has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete segment.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSegment = () => {
    createSegment.mutate({
      name: newSegmentName,
      description: newSegmentDescription,
      segmentType: newSegmentType,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Audience Segments</h3>
          <p className="text-sm text-muted-foreground">Create targeted customer groups for campaigns</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-segment">
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {!segments || segments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No segments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first audience segment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {segment.segmentType === 'static' ? 'Static' : segment.segmentType === 'dynamic' ? 'Dynamic' : 'AI-Generated'}
                    </Badge>
                    <Badge>
                      {segment.memberCount || 0} members
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this segment?')) {
                      deleteSegment.mutate(segment.id);
                    }
                  }}
                  data-testid={`button-delete-segment-${segment.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Segment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Audience Segment</DialogTitle>
            <DialogDescription>Define a targeted customer group for your campaigns</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="segment-name">Segment Name</Label>
              <Input
                id="segment-name"
                placeholder="e.g., High-Value Customers"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                data-testid="input-segment-name"
              />
            </div>
            <div>
              <Label htmlFor="segment-description">Description</Label>
              <Textarea
                id="segment-description"
                placeholder="Describe this audience segment..."
                value={newSegmentDescription}
                onChange={(e) => setNewSegmentDescription(e.target.value)}
                data-testid="input-segment-description"
              />
            </div>
            <div>
              <Label htmlFor="segment-type">Segment Type</Label>
              <Select value={newSegmentType} onValueChange={(v: any) => setNewSegmentType(v)}>
                <SelectTrigger id="segment-type" data-testid="select-segment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static - Manually selected customers</SelectItem>
                  <SelectItem value="dynamic">Dynamic - Auto-updated based on criteria</SelectItem>
                  <SelectItem value="ai_generated">AI-Generated - AI selects best-fit customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSegment}
              disabled={!newSegmentName || createSegment.isPending}
              data-testid="button-save-segment"
            >
              {createSegment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Segment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Custom Campaign Section
function CreateCustomCampaignSection() {
  const { toast } = useToast();
  const { data: segments } = useQuery<any[]>({
    queryKey: ['/api/admin/customer-segments'],
  });

  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState<'one_time' | 'drip'>('one_time');
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackingPhoneFormatted, setTrackingPhoneFormatted] = useState('');

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/custom-campaigns', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns'] });
      setCampaignName('');
      setCampaignDescription('');
      setSelectedSegmentId(null);
      toast({
        title: "Campaign created",
        description: "Your campaign has been created in draft status.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    createCampaign.mutate({
      name: campaignName,
      description: campaignDescription,
      campaignType,
      segmentId: selectedSegmentId,
      trackingPhoneNumber: trackingPhone || null,
      trackingPhoneFormatted: trackingPhoneFormatted || null,
      status: 'draft',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
        <CardDescription>Set up an AI-powered email campaign for your customers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g., Spring Maintenance Reminder"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              data-testid="input-campaign-name"
            />
          </div>

          <div>
            <Label htmlFor="campaign-description">Description</Label>
            <Textarea
              id="campaign-description"
              placeholder="Describe the goal of this campaign..."
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              data-testid="input-campaign-description"
            />
          </div>

          <div>
            <Label htmlFor="campaign-type">Campaign Type</Label>
            <Select value={campaignType} onValueChange={(v: any) => setCampaignType(v)}>
              <SelectTrigger id="campaign-type" data-testid="select-campaign-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-Time Blast - Send immediately to all recipients</SelectItem>
                <SelectItem value="drip">Drip Sequence - Send series of emails over time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="segment-select">Target Audience</Label>
            <Select
              value={selectedSegmentId?.toString() || 'all'}
              onValueChange={(v) => setSelectedSegmentId(v === 'all' ? null : parseInt(v))}
            >
              <SelectTrigger id="segment-select" data-testid="select-segment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {segments?.map((seg) => (
                  <SelectItem key={seg.id} value={seg.id.toString()}>
                    {seg.name} ({seg.memberCount} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tracking-phone">Tracking Phone (digits only)</Label>
              <Input
                id="tracking-phone"
                placeholder="5125551234"
                value={trackingPhone}
                onChange={(e) => setTrackingPhone(e.target.value)}
                data-testid="input-tracking-phone"
              />
            </div>
            <div>
              <Label htmlFor="tracking-phone-formatted">Formatted Display</Label>
              <Input
                id="tracking-phone-formatted"
                placeholder="(512) 555-1234"
                value={trackingPhoneFormatted}
                onChange={(e) => setTrackingPhoneFormatted(e.target.value)}
                data-testid="input-tracking-phone-formatted"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCreate}
            disabled={!campaignName || createCampaign.isPending}
            data-testid="button-create-campaign"
          >
            {createCampaign.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Referral Tracking Section
function ReferralTrackingSection() {
  const { data, isLoading } = useQuery<{referrals: any[], stats: any}>({
    queryKey: ['/api/admin/referrals'],
  });

  if (isLoading) {
    return <div className="space-y-4">{Array(5).fill(0).map((_, i) => (
      <Skeleton key={i} className="h-24" />
    ))}</div>;
  }

  const stats = data?.stats || {};
  const referrals = data?.referrals || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{stats.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{stats.completed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">${((stats.totalRevenue || 0) / 100).toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Latest {referrals.length} referral submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No referrals yet</p>
          ) : (
            <div className="space-y-4">
              {referrals.slice(0, 10).map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{ref.refereeName}</p>
                    <p className="text-sm text-muted-foreground">Referred by: {ref.referrerName}</p>
                    <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {ref.status}
                    </Badge>
                  </div>
                  {ref.jobAmount && (
                    <p className="text-lg font-semibold">${(ref.jobAmount / 100).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Review Requests Section
function ReviewRequestsSection() {
  const { toast } = useToast();
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<'review_request' | 'referral_nurture' | 'quote_followup'>('review_request');
  
  // AI Email Generation State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCampaignType, setGenerateCampaignType] = useState<'review_request' | 'referral_nurture' | 'quote_followup'>('review_request');
  const [generateEmailNumber, setGenerateEmailNumber] = useState<1 | 2 | 3 | 4>(1);
  const [generateStrategy, setGenerateStrategy] = useState<string>('');
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'visual' | 'html' | 'plain'>('visual');

  // Fetch system settings
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/review-requests/settings'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<ReviewRequestsDashboardStats>({
    queryKey: ['/api/admin/review-requests/stats'],
  });

  // Fetch active review requests
  const { data: reviewRequests } = useQuery<ReviewRequest[]>({
    queryKey: ['/api/admin/review-requests/active'],
  });

  // Fetch active referral campaigns
  const { data: referralCampaigns } = useQuery<ReferralNurture[]>({
    queryKey: ['/api/admin/review-requests/referrals'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SystemSettings>) => {
      const response = await apiRequest("PUT", "/api/admin/review-requests/settings", updates);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-requests/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your review request settings have been saved.",
      });
    },
  });

  // Update phone number mutation (auto-creates tracking number with UTM params)
  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const endpointMap = {
        'review_request': '/api/admin/review-requests/phone',
        'referral_nurture': '/api/admin/referral-nurture/phone',
        'quote_followup': '/api/admin/quote-followup/phone'
      };
      const response = await apiRequest("POST", endpointMap[editingCampaign], { phoneNumber: phone });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-requests/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      setIsPhoneDialogOpen(false);
      setPhoneNumber("");
      const campaignNames = {
        'review_request': 'Review Request',
        'referral_nurture': 'Referral Nurture',
        'quote_followup': 'Quote Follow-up'
      };
      toast({
        title: "Phone Number Updated",
        description: `${campaignNames[editingCampaign]} campaign phone number updated with UTM tracking`,
      });
    },
  });

  // AI Email Generation Mutation
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/generate", params);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedEmail(data);
      toast({
        title: "Email Generated",
        description: "AI has created a personalized email. Review and save if you'd like to use it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email",
        variant: "destructive"
      });
    }
  });

  // Save generated email as template
  const saveGeneratedMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/save-template", params);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/emails/templates'] });
      setGenerateDialogOpen(false);
      setGeneratedEmail(null);
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  });

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      queued: { variant: "secondary", label: "Queued" },
      sending: { variant: "default", label: "Sending" },
      paused: { variant: "outline", label: "Paused" },
      completed: { variant: "default", label: "Completed" },
      stopped: { variant: "destructive", label: "Stopped" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleGenerateEmail = () => {
    const mockJobDetails = {
      customerId: 12345,
      customerName: "John Smith",
      serviceType: "Water Heater Installation",
      jobAmount: 185000,
      jobDate: new Date(),
      location: "Austin, TX"
    };

    if (!settings?.reviewRequestPhoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please configure the Review Request phone number in Campaign Settings before generating emails.",
        variant: "destructive"
      });
      return;
    }
    
    generateMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      jobDetails: mockJobDetails,
      phoneNumber: settings.reviewRequestPhoneNumber,
      strategy: generateStrategy || undefined
    });
  };

  const handleSaveGeneratedEmail = () => {
    if (!generatedEmail) return;

    saveGeneratedMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      subject: generatedEmail.subject,
      preheader: generatedEmail.preheader,
      htmlContent: generatedEmail.htmlContent,
      plainTextContent: generatedEmail.plainTextContent,
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="review-campaigns" data-testid="tab-review-campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Review Campaigns
          </TabsTrigger>
          <TabsTrigger value="referral-campaigns" data-testid="tab-referral-campaigns">
            <Users className="h-4 w-4 mr-2" />
            Referral Nurture
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Review Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-active-review-campaigns">
                  {stats?.reviewRequests.active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.reviewRequests.total || 0} total campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reviews Submitted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-reviews-submitted">
                  {stats?.reviewRequests.reviewsSubmitted || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.reviewRequests.averageRating.toFixed(1) || "N/A"} avg rating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Email Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-open-rate">
                  {((stats?.reviewRequests.openRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats?.reviewRequests.clickRate || 0) * 100).toFixed(1)}% click rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Referrals Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-referrals">
                  {stats?.referralNurture.totalReferrals || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.referralNurture.active || 0} active campaigns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current configuration and campaign health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review Drip Campaign</p>
                  <p className="text-sm text-muted-foreground">
                    4-email sequence over 21 days
                  </p>
                </div>
                <Badge variant={settings?.reviewDripEnabled ? "default" : "secondary"}>
                  {settings?.reviewDripEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Referral Nurture Campaign</p>
                  <p className="text-sm text-muted-foreground">
                    4-email sequence over 6 months
                  </p>
                </div>
                <Badge variant={settings?.referralDripEnabled ? "default" : "secondary"}>
                  {settings?.referralDripEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Contact Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    {settings?.reviewRequestPhoneFormatted || "Not configured"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPhoneDialogOpen(true)}
                  data-testid="button-edit-phone"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Campaigns Tab */}
        <TabsContent value="review-campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Review Campaigns</h2>
              <p className="text-muted-foreground">
                4-email drip sequence to request customer reviews
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
              <CardDescription>
                Email 1: Immediate | Email 2: Day 3 | Email 3: Day 7 | Email 4: Day 21
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewRequests && reviewRequests.length > 0 ? (
                  reviewRequests.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`campaign-review-${campaign.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.customerName}</p>
                          <p className="text-sm text-muted-foreground">{campaign.customerEmail}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email 1</p>
                          <p className="font-medium">
                            {campaign.email1SentAt ? format(new Date(campaign.email1SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 2</p>
                          <p className="font-medium">
                            {campaign.email2SentAt ? format(new Date(campaign.email2SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 3</p>
                          <p className="font-medium">
                            {campaign.email3SentAt ? format(new Date(campaign.email3SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 4</p>
                          <p className="font-medium">
                            {campaign.email4SentAt ? format(new Date(campaign.email4SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Opens:</span>{" "}
                          <span className="font-medium">{campaign.emailOpens}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clicks:</span>{" "}
                          <span className="font-medium">{campaign.linkClicks}</span>
                        </div>
                        {campaign.reviewSubmitted && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            {campaign.reviewRating}★ on {campaign.reviewPlatform}
                          </Badge>
                        )}
                      </div>

                      {campaign.stopReason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Stop reason: {campaign.stopReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active review campaigns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Nurture Tab */}
        <TabsContent value="referral-campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Referral Nurture Campaigns</h2>
              <p className="text-muted-foreground">
                6-month drip sequence for happy customers who left positive reviews
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
              <CardDescription>
                Email 1: Immediate | Email 2: 1 month | Email 3: 3 months | Email 4: 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralCampaigns && referralCampaigns.length > 0 ? (
                  referralCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`campaign-referral-${campaign.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.customerName}</p>
                          <p className="text-sm text-muted-foreground">{campaign.customerEmail}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email 1</p>
                          <p className="font-medium">
                            {campaign.email1SentAt ? format(new Date(campaign.email1SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 2</p>
                          <p className="font-medium">
                            {campaign.email2SentAt ? format(new Date(campaign.email2SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 3</p>
                          <p className="font-medium">
                            {campaign.email3SentAt ? format(new Date(campaign.email3SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email 4</p>
                          <p className="font-medium">
                            {campaign.email4SentAt ? format(new Date(campaign.email4SentAt), "MMM d") : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Opens:</span>{" "}
                          <span className="font-medium">{campaign.totalOpens}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Clicks:</span>{" "}
                          <span className="font-medium">{campaign.totalClicks}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Referrals:</span>{" "}
                          <span className="font-medium">{campaign.referralsSubmitted}</span>
                        </div>
                        {campaign.consecutiveUnopened > 0 && (
                          <Badge variant="outline">
                            {campaign.consecutiveUnopened} consecutive unopened
                          </Badge>
                        )}
                      </div>

                      {campaign.pauseReason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Pause reason: {campaign.pauseReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active referral campaigns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Configure automatic review and referral campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="master-email-switch" className="text-base font-semibold">Master Email Switch</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable ALL review/referral emails (requires phone number configured)
                  </p>
                  {!settings?.reviewRequestPhoneNumber && (
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive font-medium">
                        Configure phone number below before enabling
                      </p>
                    </div>
                  )}
                </div>
                <Switch
                  id="master-email-switch"
                  data-testid="switch-master-email"
                  checked={settings?.reviewMasterEmailSwitch || false}
                  disabled={!settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ reviewMasterEmailSwitch: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="review-drip-enabled">Enable Review Drip Campaign</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send 4-email review request sequence after job completion
                  </p>
                </div>
                <Switch
                  id="review-drip-enabled"
                  data-testid="switch-review-drip-enabled"
                  checked={settings?.reviewDripEnabled || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ reviewDripEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="referral-drip-enabled">Enable Referral Nurture Campaign</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send 6-month referral sequence to customers who left 4+ star reviews
                  </p>
                </div>
                <Switch
                  id="referral-drip-enabled"
                  data-testid="switch-referral-drip-enabled"
                  checked={settings?.referralDripEnabled || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ referralDripEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-send-reviews">Auto-Send Review Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Start sending immediately after job marked complete (no approval needed)
                  </p>
                </div>
                <Switch
                  id="auto-send-reviews"
                  data-testid="switch-auto-send-reviews"
                  checked={settings?.autoSendReviewRequests || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ autoSendReviewRequests: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-start-referrals">Auto-Start Referral Campaigns</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enroll customers in referral nurture after positive review
                  </p>
                </div>
                <Switch
                  id="auto-start-referrals"
                  data-testid="switch-auto-start-referrals"
                  checked={settings?.autoStartReferralCampaigns || false}
                  disabled={!settings?.reviewMasterEmailSwitch || !settings?.reviewRequestPhoneNumber}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ autoStartReferralCampaigns: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Phone Numbers</CardTitle>
              <CardDescription>
                Dedicated tracking phone numbers for each campaign type (auto-creates UTM tracking)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Review Request Campaign Phone */}
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1">
                  <Label>Review Request Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.reviewRequestPhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=review_request, utm_medium=email, utm_campaign=review_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('review_request');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-review-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Referral Nurture Campaign Phone */}
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1">
                  <Label>Referral Nurture Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.referralNurturePhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=referral_nurture, utm_medium=email, utm_campaign=referral_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('referral_nurture');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-referral-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Quote Follow-up Campaign Phone */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Quote Follow-up Campaign</Label>
                  <p className="text-lg font-medium mt-1">
                    {settings?.quoteFollowupPhoneFormatted || "Not configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    UTM: utm_source=quote_followup, utm_medium=email, utm_campaign=quote_followup_drip
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCampaign('quote_followup');
                    setIsPhoneDialogOpen(true);
                  }}
                  data-testid="button-update-quote-phone"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phone Number Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {editingCampaign === 'review_request' ? 'Review Request' : editingCampaign === 'referral_nurture' ? 'Referral Nurture' : 'Quote Follow-up'} Phone Number
            </DialogTitle>
            <DialogDescription>
              This will automatically create a tracking number entry with UTM parameters for the {editingCampaign === 'review_request' ? 'review request' : editingCampaign === 'referral_nurture' ? 'referral nurture' : 'quote follow-up'} campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                data-testid="input-phone-number"
                placeholder="(512) 555-1234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter in any format - will be auto-formatted
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPhoneDialogOpen(false);
                  setPhoneNumber("");
                }}
                data-testid="button-cancel-phone"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updatePhoneMutation.mutate(phoneNumber)}
                disabled={!phoneNumber || updatePhoneMutation.isPending}
                data-testid="button-save-phone"
              >
                {updatePhoneMutation.isPending ? "Saving..." : "Save & Create Tracking Number"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Email Generation Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Create a personalized email using job details and seasonal context
            </DialogDescription>
          </DialogHeader>

          {!generatedEmail ? (
            <div className="space-y-4">
              <div>
                <Label>Campaign Type</Label>
                <Select
                  value={generateCampaignType}
                  onValueChange={(value: 'review_request' | 'referral_nurture' | 'quote_followup') => setGenerateCampaignType(value)}
                >
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review_request">Review Request Drip</SelectItem>
                    <SelectItem value="quote_followup">Quote Follow-up</SelectItem>
                    <SelectItem value="referral_nurture">Referral Nurture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email Number (1-4)</Label>
                <Select
                  value={generateEmailNumber.toString()}
                  onValueChange={(value) => setGenerateEmailNumber(parseInt(value) as 1 | 2 | 3 | 4)}
                >
                  <SelectTrigger data-testid="select-email-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Email 1 - {generateCampaignType === 'referral_nurture' ? 'Day 14' : 'Day 1'}</SelectItem>
                    <SelectItem value="2">Email 2 - {generateCampaignType === 'referral_nurture' ? 'Day 60' : 'Day 7'}</SelectItem>
                    <SelectItem value="3">Email 3 - {generateCampaignType === 'referral_nurture' ? 'Day 150' : 'Day 14'}</SelectItem>
                    <SelectItem value="4">Email 4 - {generateCampaignType === 'referral_nurture' ? 'Day 210' : 'Day 21'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Strategy (Optional)</Label>
                <Select
                  value={generateStrategy}
                  onValueChange={setGenerateStrategy}
                >
                  <SelectTrigger data-testid="select-strategy">
                    <SelectValue placeholder="Auto-select based on email number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-select</SelectItem>
                    <SelectItem value="value">Value - Focus on service quality</SelectItem>
                    <SelectItem value="trust">Trust - Build credibility</SelectItem>
                    <SelectItem value="urgency">Urgency - Time-sensitive ask</SelectItem>
                    <SelectItem value="social_proof">Social Proof - Others sharing reviews</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank for automatic strategy selection
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                  data-testid="button-cancel-generate"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateEmail}
                  disabled={generateMutation.isPending}
                  data-testid="button-run-generation"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{generatedEmail.subject}</h3>
                  <p className="text-sm text-muted-foreground">{generatedEmail.preheader}</p>
                </div>
                <div className="flex gap-2">
                  <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'visual' | 'html' | 'plain')}>
                    <TabsList>
                      <TabsTrigger value="visual" data-testid="tab-preview-visual">Visual</TabsTrigger>
                      <TabsTrigger value="html" data-testid="tab-preview-html">HTML</TabsTrigger>
                      <TabsTrigger value="plain" data-testid="tab-preview-plain">Plain</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {previewMode === 'visual' && (
                  <div dangerouslySetInnerHTML={{ __html: generatedEmail.htmlContent }} />
                )}
                {previewMode === 'html' && (
                  <pre className="text-xs whitespace-pre-wrap">{generatedEmail.htmlContent}</pre>
                )}
                {previewMode === 'plain' && (
                  <pre className="whitespace-pre-wrap">{generatedEmail.plainTextContent}</pre>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedEmail(null)}
                  data-testid="button-regenerate"
                >
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerateDialogOpen(false);
                    setGeneratedEmail(null);
                  }}
                  data-testid="button-close-preview"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSaveGeneratedEmail}
                  disabled={saveGeneratedMutation.isPending}
                  data-testid="button-save-generated"
                >
                  {saveGeneratedMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Email Templates Section  
function EmailTemplatesSection() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'plain'>('visual');
  
  // Edit form state
  const [editSubject, setEditSubject] = useState("");
  const [editPreheader, setEditPreheader] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editBodyPlain, setEditBodyPlain] = useState("");

  // Generate form state
  const [generateCampaignType, setGenerateCampaignType] = useState<'review_request' | 'referral_nurture' | 'quote_followup'>('review_request');
  const [generateEmailNumber, setGenerateEmailNumber] = useState<1 | 2 | 3 | 4>(1);
  const [generateStrategy, setGenerateStrategy] = useState("");

  // Fetch system settings
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/review-requests/settings'],
  });

  // Fetch all templates
  const { data: templatesData, isLoading } = useQuery<{ templates: EmailTemplate [] }>({
    queryKey: ['/api/admin/emails/templates'],
  });

  const templates = templatesData?.templates || [];

  // Generate email mutation
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/generate", params);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Generated",
        description: "AI has created your email. Review and save if you like it."
      });
      setEditSubject(data.subject);
      setEditPreheader(data.preheader || "");
      setEditBodyHtml(data.htmlContent);
      setEditBodyPlain(data.plainTextContent || "");
      setGenerateDialogOpen(false);
      setEditDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email",
        variant: "destructive"
      });
    }
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/save-template", params);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/emails/templates'] });
      setEditDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  });

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditPreheader(template.preheader || "");
    setEditBodyHtml(template.htmlContent);
    setEditBodyPlain(template.plainTextContent || "");
    setEditDialogOpen(true);
  };

  const handleGenerateEmail = () => {
    // Get campaign-specific phone number
    const phoneNumber = generateCampaignType === 'review_request'
      ? settings?.reviewRequestPhoneFormatted
      : generateCampaignType === 'referral_nurture'
      ? settings?.referralNurturePhoneFormatted
      : settings?.quoteFollowupPhoneFormatted;

    if (!phoneNumber) {
      toast({
        title: "Missing Phone Number",
        description: `Please configure a tracking phone number for ${generateCampaignType.replace('_', ' ')} campaigns in Campaign Settings first.`,
        variant: "destructive"
      });
      return;
    }

    const mockJobDetails = {
      customerId: 12345,
      customerName: "John Smith",
      serviceType: "Water Heater Installation",
      jobAmount: 185000,
      jobDate: new Date(),
      location: "Austin, TX"
    };

    generateMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      jobDetails: mockJobDetails,
      phoneNumber,
      strategy: generateStrategy || undefined
    });
  };

  const handleSaveTemplate = () => {
    if (!editSubject.trim() || !editBodyHtml.trim()) {
      toast({
        title: "Missing Fields",
        description: "Subject and HTML body are required",
        variant: "destructive"
      });
      return;
    }

    const campaignType = selectedTemplate?.campaignType || generateCampaignType;
    const emailNumber = selectedTemplate?.emailNumber || generateEmailNumber;

    saveMutation.mutate({
      campaignType,
      emailNumber,
      subject: editSubject,
      preheader: editPreheader,
      htmlContent: editBodyHtml,
      plainTextContent: editBodyPlain,
      isActive: true
    });
  };

  const getTemplateTitle = (template: EmailTemplate) => {
    const type = template.campaignType === 'review_request' 
      ? 'Review Request' 
      : template.campaignType === 'quote_followup'
      ? 'Quote Follow-up'
      : 'Referral Nurture';
    return `${type} - Email ${template.emailNumber}`;
  };

  const getTemplateDescription = (template: EmailTemplate) => {
    if (template.campaignType === 'review_request' || template.campaignType === 'quote_followup') {
      const days = [1, 7, 14, 21][template.emailNumber - 1];
      const context = template.campaignType === 'quote_followup' ? 'quote/estimate' : 'job completion';
      return `Sent ${days} day${days > 1 ? 's' : ''} after ${context}`;
    } else {
      const days = [14, 60, 150, 210][template.emailNumber - 1];
      return `Sent ${days} days after positive review`;
    }
  };

  const reviewTemplates = templates.filter((t: EmailTemplate) => t.campaignType === 'review_request');
  const quoteTemplates = templates.filter((t: EmailTemplate) => t.campaignType === 'quote_followup');
  const referralTemplates = templates.filter((t: EmailTemplate) => t.campaignType === 'referral_nurture');

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Email Template Editor</h2>
            <p className="text-muted-foreground">
              Manage and customize review request and referral nurture email templates
            </p>
          </div>
          <Button
            onClick={() => setGenerateDialogOpen(true)}
            data-testid="button-generate-new"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Review Request Drip Campaign</CardTitle>
              <CardDescription>
                4-email sequence sent over 21 days after job completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(num => {
                const template = reviewTemplates.find((t: EmailTemplate) => t.emailNumber === num);
                return (
                  <div
                    key={num}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`template-review-${num}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">
                          Email {num} - {template ? template.subject : 'Not Created'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {template ? getTemplateDescription(template) : `Day ${[1, 7, 14, 21][num - 1]}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {template ? (
                          <>
                            <Badge variant={template.isActive ? "default" : "outline"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              data-testid={`button-edit-review-${num}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGenerateCampaignType('review_request');
                              setGenerateEmailNumber(num as 1 | 2 | 3 | 4);
                              setGenerateDialogOpen(true);
                            }}
                            data-testid={`button-create-review-${num}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>
                    </div>
                    {template && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Preview:</strong> {template.preheader || 'No preheader'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quote Follow-up Campaign</CardTitle>
              <CardDescription>
                4-email sequence sent over 21 days after quote/estimate ($0 jobs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(num => {
                const template = quoteTemplates.find((t: EmailTemplate) => t.emailNumber === num);
                return (
                  <div
                    key={num}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`template-quote-${num}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">
                          Email {num} - {template ? template.subject : 'Not Created'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {template ? getTemplateDescription(template) : `Day ${[1, 7, 14, 21][num - 1]}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {template ? (
                          <>
                            <Badge variant={template.isActive ? "default" : "outline"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              data-testid={`button-edit-quote-${num}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGenerateCampaignType('quote_followup');
                              setGenerateEmailNumber(num as 1 | 2 | 3 | 4);
                              setGenerateDialogOpen(true);
                            }}
                            data-testid={`button-create-quote-${num}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>
                    </div>
                    {template && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Preview:</strong> {template.preheader || 'No preheader'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referral Nurture Campaign</CardTitle>
              <CardDescription>
                4-email sequence sent over 6 months to happy reviewers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(num => {
                const template = referralTemplates.find((t: EmailTemplate) => t.emailNumber === num);
                return (
                  <div
                    key={num}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`template-referral-${num}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">
                          Email {num} - {template ? template.subject : 'Not Created'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {template ? getTemplateDescription(template) : `Day ${[14, 60, 150, 210][num - 1]}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {template ? (
                          <>
                            <Badge variant={template.isActive ? "default" : "outline"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              data-testid={`button-edit-referral-${num}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGenerateCampaignType('referral_nurture');
                              setGenerateEmailNumber(num as 1 | 2 | 3 | 4);
                              setGenerateDialogOpen(true);
                            }}
                            data-testid={`button-create-referral-${num}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>
                    </div>
                    {template && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Preview:</strong> {template.preheader || 'No preheader'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generate AI Email Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent data-testid="dialog-generate-email">
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Use AI to create a personalized email template based on best practices
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <select
                id="campaign-type"
                className="w-full border rounded-md p-2"
                value={generateCampaignType}
                onChange={(e) => setGenerateCampaignType(e.target.value as any)}
                data-testid="select-campaign-type"
              >
                <option value="review_request">Review Request</option>
                <option value="quote_followup">Quote Follow-up</option>
                <option value="referral_nurture">Referral Nurture</option>
              </select>
            </div>
            <div>
              <Label htmlFor="email-number">Email Number in Sequence</Label>
              <select
                id="email-number"
                className="w-full border rounded-md p-2"
                value={generateEmailNumber}
                onChange={(e) => setGenerateEmailNumber(parseInt(e.target.value) as any)}
                data-testid="select-email-number"
              >
                <option value="1">Email 1 (First contact)</option>
                <option value="2">Email 2 (Follow-up)</option>
                <option value="3">Email 3 (Social proof)</option>
                <option value="4">Email 4 (Final reminder)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="strategy">Strategy (Optional)</Label>
              <select
                id="strategy"
                className="w-full border rounded-md p-2"
                value={generateStrategy}
                onChange={(e) => setGenerateStrategy(e.target.value)}
                data-testid="select-strategy"
              >
                <option value="">Auto (Recommended)</option>
                <option value="value">Value-focused</option>
                <option value="trust">Trust-building</option>
                <option value="urgency">Urgency-driven</option>
                <option value="social_proof">Social Proof</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                data-testid="button-cancel-generate"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateEmail}
                disabled={generateMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Preview Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-template">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? getTemplateTitle(selectedTemplate) : 'New Email Template'}
            </DialogTitle>
            <DialogDescription>
              Preview and edit email content. Use AI to regenerate if needed.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visual" data-testid="tab-visual">
                <Eye className="w-4 h-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html" data-testid="tab-html">
                <Code className="w-4 h-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="plain" data-testid="tab-plain">
                <FileText className="w-4 h-4 mr-2" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-subject">Subject Line</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="edit-preheader">Preheader Text (Optional)</Label>
                <Input
                  id="edit-preheader"
                  value={editPreheader}
                  onChange={(e) => setEditPreheader(e.target.value)}
                  placeholder="Enter preheader text..."
                  data-testid="input-preheader"
                />
              </div>

              <TabsContent value="visual">
                <div className="border rounded-lg p-4 bg-white min-h-[300px]">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                    <p className="font-semibold">{editSubject}</p>
                    {editPreheader && (
                      <>
                        <p className="text-sm text-muted-foreground mb-1 mt-2">Preheader:</p>
                        <p className="text-sm">{editPreheader}</p>
                      </>
                    )}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: editBodyHtml }}
                    className="prose max-w-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html">
                <div>
                  <Label htmlFor="edit-html">HTML Body</Label>
                  <Textarea
                    id="edit-html"
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    placeholder="Enter HTML content..."
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-html"
                  />
                </div>
              </TabsContent>

              <TabsContent value="plain">
                <div>
                  <Label htmlFor="edit-plain">Plain Text Body</Label>
                  <Textarea
                    id="edit-plain"
                    value={editBodyPlain}
                    onChange={(e) => setEditBodyPlain(e.target.value)}
                    placeholder="Enter plain text content..."
                    className="min-h-[400px]"
                    data-testid="textarea-plain"
                  />
                </div>
              </TabsContent>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedTemplate(null);
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setGenerateDialogOpen(true);
                }}
                data-testid="button-regenerate"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate with AI
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={saveMutation.isPending}
                data-testid="button-save-template"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Referral Email Templates Section
function ReferralEmailTemplatesSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'history'>('settings');
  
  // Settings state
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [thankYouPrompt, setThankYouPrompt] = useState('');
  const [successPrompt, setSuccessPrompt] = useState('');
  
  // Preview state
  const [previewType, setPreviewType] = useState<'thank_you' | 'success'>('thank_you');
  const [previewEmail, setPreviewEmail] = useState<any>(null);
  
  // Load settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/referral-email-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/referral-email-settings', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load settings');
      return response.json();
    },
  });
  
  // Load email history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/admin/email-send-log'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-send-log?type=referral', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load history');
      return response.json();
    },
  });
  
  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setBrandGuidelines(settings.brandGuidelines || '');
      setThankYouPrompt(settings.thankYouCustomPrompt || '');
      setSuccessPrompt(settings.successCustomPrompt || '');
    }
  }, [settings]);
  
  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/api/admin/referral-email-settings', {
        brandGuidelines,
        thankYouCustomPrompt: thankYouPrompt,
        successCustomPrompt: successPrompt,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral-email-settings'] });
      toast({
        title: "Settings Saved",
        description: "Template customizations will apply to all future emails.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/referral-email-preview', {
        emailType: previewType,
        customPrompt: previewType === 'thank_you' ? thankYouPrompt : successPrompt,
        brandGuidelines,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewEmail(data);
      toast({
        title: "Preview Generated",
        description: "Review the AI-generated email below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Email Template Customization</CardTitle>
          <CardDescription>
            Customize how AI generates referral emails (thank-you & success notifications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">Email History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-guidelines">Brand Guidelines (applies to both email types)</Label>
                  <Textarea
                    id="brand-guidelines"
                    value={brandGuidelines}
                    onChange={(e) => setBrandGuidelines(e.target.value)}
                    placeholder="e.g., Always mention our 100% satisfaction guarantee, emphasize family-owned business, use friendly Austin-area references..."
                    rows={4}
                    data-testid="input-brand-guidelines"
                  />
                  <p className="text-sm text-muted-foreground">
                    These guidelines augment the default professional tone
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="thank-you-prompt">Thank You Email Custom Instructions</Label>
                  <Textarea
                    id="thank-you-prompt"
                    value={thankYouPrompt}
                    onChange={(e) => setThankYouPrompt(e.target.value)}
                    placeholder="e.g., Extra emphasis on how much we appreciate their trust, mention our referral program details..."
                    rows={4}
                    data-testid="input-thank-you-prompt"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sent when customer submits a referral
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="success-prompt">Success Notification Custom Instructions</Label>
                  <Textarea
                    id="success-prompt"
                    value={successPrompt}
                    onChange={(e) => setSuccessPrompt(e.target.value)}
                    placeholder="e.g., Celebrate their success, remind them they can refer more people, suggest seasonal services..."
                    rows={4}
                    data-testid="input-success-prompt"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sent when referral becomes a customer ($25 credit issued)
                  </p>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Email Type:</Label>
                  <Select value={previewType} onValueChange={(v: any) => setPreviewType(v)}>
                    <SelectTrigger className="w-[250px]" data-testid="select-preview-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thank_you">Thank You (Referral Submitted)</SelectItem>
                      <SelectItem value="success">Success (Referral Converted)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => previewMutation.mutate()}
                    disabled={previewMutation.isPending}
                    data-testid="button-generate-preview"
                  >
                    {previewMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Preview
                      </>
                    )}
                  </Button>
                </div>
                
                {previewEmail && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <div className="p-3 bg-muted rounded-md" data-testid="preview-subject">
                        {previewEmail.subject}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>HTML Preview</Label>
                      <div
                        className="border rounded-md p-4 bg-background max-h-[500px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: previewEmail.bodyHtml }}
                        data-testid="preview-html"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Plain Text Version</Label>
                      <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm max-h-[300px] overflow-y-auto" data-testid="preview-plain">
                        {previewEmail.bodyPlain}
                      </div>
                    </div>
                  </div>
                )}
                
                {!previewEmail && (
                  <div className="text-center p-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an email type and click Generate Preview</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4 mt-6">
              {historyLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {history?.emails?.length || 0} referral emails sent
                    </p>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history?.emails?.length > 0 ? (
                          history.emails.map((email: any) => (
                            <TableRow key={email.id} data-testid={`history-row-${email.id}`}>
                              <TableCell className="text-sm">
                                {format(new Date(email.sentAt), 'MMM d, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {email.emailType === 'referrer_thank_you' ? 'Thank You' : 'Success'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{email.recipientEmail}</TableCell>
                              <TableCell className="text-sm max-w-[300px] truncate">{email.subject}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">Sent</span>
                                  {email.openedAt && (
                                    <Badge variant="secondary" className="text-xs">Opened</Badge>
                                  )}
                                  {email.clickedAt && (
                                    <Badge variant="secondary" className="text-xs">Clicked</Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              No referral emails sent yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Campaign Analytics Section
function CampaignAnalyticsSection() {
  const [dateRange, setDateRange] = useState<string>('30');

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/overview', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/overview?days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: byTypeData, isLoading: byTypeLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/by-type', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/by-type?days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['/api/admin/campaign-analytics/recent', '50', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign-analytics/recent?limit=50&days=${dateRange}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  if (overviewLoading || byTypeLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const overview = overviewData || {};
  const byType = byTypeData?.stats || [];
  const recent = recentData?.emails || [];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaign Analytics</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="date-range-select" className="text-sm text-muted-foreground">Time Period:</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="date-range-select" className="w-[180px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Campaign Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Review Requests */}
          <Card data-testid="card-review-requests-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Review Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.reviewRequests?.total || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.reviewRequests?.completed || 0} completed · {overview.reviewRequests?.paused || 0} paused
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                    <div className="text-lg font-semibold">{overview.reviewRequests?.openRate || '0.0'}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                    <div className="text-lg font-semibold">{overview.reviewRequests?.clickRate || '0.0'}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Nurture */}
          <Card data-testid="card-referral-nurture-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Referral Nurture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.referralNurture?.total || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.referralNurture?.completed || 0} completed · {overview.referralNurture?.paused || 0} paused
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                    <div className="text-lg font-semibold">{overview.referralNurture?.openRate || '0.0'}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                    <div className="text-lg font-semibold">{overview.referralNurture?.clickRate || '0.0'}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Email Stats */}
          <Card data-testid="card-email-stats">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overall Email Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{overview.emailStats?.totalSent || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.emailStats?.totalOpened || 0} opened · {overview.emailStats?.totalClicked || 0} clicked
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Bounced</div>
                    <div className="text-lg font-semibold text-destructive">{overview.emailStats?.totalBounced || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Complaints</div>
                    <div className="text-lg font-semibold text-destructive">{overview.emailStats?.totalComplained || 0}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats by Campaign Type */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance by Campaign Type</h2>
        <Card data-testid="card-campaign-type-stats">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Type</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead className="text-right">Avg. Time to Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byType.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No campaign data in the last 30 days
                    </TableCell>
                  </TableRow>
                ) : (
                  byType.map((stat: any) => (
                    <TableRow key={stat.campaignType}>
                      <TableCell className="font-medium">
                        {stat.campaignType === 'review_request' && 'Review Request'}
                        {stat.campaignType === 'referral_nurture' && 'Referral Nurture'}
                        {stat.campaignType === 'quote_followup' && 'Quote Follow-up'}
                      </TableCell>
                      <TableCell className="text-right">{stat.totalSent}</TableCell>
                      <TableCell className="text-right">{stat.openRate}%</TableCell>
                      <TableCell className="text-right">{stat.clickRate}%</TableCell>
                      <TableCell className="text-right">
                        {stat.avgTimeToOpen ? `${stat.avgTimeToOpen}h` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Email Activity</h2>
        <Card data-testid="card-recent-activity">
          <CardContent className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Email #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No recent email activity
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((email: any) => (
                      <TableRow key={email.id}>
                        <TableCell>{email.recipientEmail}</TableCell>
                        <TableCell>
                          {email.campaignType === 'review_request' && 'Review Request'}
                          {email.campaignType === 'referral_nurture' && 'Referral Nurture'}
                          {email.campaignType === 'quote_followup' && 'Quote Follow-up'}
                        </TableCell>
                        <TableCell>Email {email.emailNumber}</TableCell>
                        <TableCell>
                          <Badge variant={
                            email.openedAt ? 'default' : 
                            email.bouncedAt ? 'destructive' : 
                            'secondary'
                          }>
                            {email.complainedAt ? 'Complaint' :
                             email.bouncedAt ? 'Bounced' :
                             email.clickedAt ? 'Clicked' :
                             email.openedAt ? 'Opened' :
                             'Sent'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UnifiedAdminDashboard() {
  // Load active section from localStorage, fallback to 'dashboard'
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const router = useRouter();

  // Load saved section from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-active-section');
      if (saved && ['dashboard', 'photos', 'products', 'referrals', 'review-platforms', 'customer-data', 'review-requests', 'email-templates', 'chatbot'].includes(saved)) {
        setActiveSection(saved as AdminSection);
      }
    }
  }, []);

  // Check auth status
  const { data: authData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
  });

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-active-section', activeSection);
    }
  }, [activeSection]);

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push("/admin/oauth-login");
    }
  }, [authData, router]);

  // Fetch stats
  const { data: statsData } = useQuery<{ stats: any }>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: photosData } = useQuery({
    queryKey: ['/api/admin/photos', 'all', 'all', 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'all',
        quality: 'all',
        status: 'all',
      });
      return await fetch(`/api/admin/photos?${params}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
    enabled: authData?.isAdmin === true, // Only fetch if authenticated
  });

  const stats = statsData?.stats || {};
  const photos = photosData?.photos || [];

  const sidebarStyle = {
    "--sidebar-width": "280px",
  };

  // Show nothing while checking auth or if not admin (redirect happens via useEffect above)
  // IMPORTANT: This check must come AFTER all hooks to avoid hooks rule violation
  if (!authData?.isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview stats={stats} photos={photos} />;
      case 'photos':
        return <PhotoManagement />;
      case 'products':
        return <ProductsSection />;
      case 'review-platforms':
        return <ReviewPlatformsSection />;
      case 'referrals':
        return <ReferralSystemSection />;
      case 'marketing-campaigns':
        return <MarketingCampaignsSection />;
      case 'custom-campaigns':
        return <CustomCampaignsSection />;
      case 'customer-data':
        return <CustomerDataSection />;
      case 'chatbot':
        return <ChatbotSection />;
      case 'email-processing':
        return <EmailProcessingSection />;
      default:
        return <DashboardOverview stats={stats} photos={photos} />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<AdminSection, string> = {
      'dashboard': 'Dashboard',
      'photos': 'Photo Management',
      'review-platforms': 'Review Platforms',
      'products': 'Products & Memberships',
      'referrals': 'Referral System',
      'marketing-campaigns': 'Marketing Campaigns',
      'custom-campaigns': 'Custom Campaigns',
      'customer-data': 'Customer Data',
      'chatbot': 'AI Chatbot',
      'email-processing': 'Email Processing',
    };
    return titles[activeSection] || 'Admin Dashboard';
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
                <h1 className="text-2xl font-bold">{getSectionTitle()}</h1>
                <p className="text-sm text-muted-foreground">
                  {activeSection === 'dashboard' ? 'Welcome to the admin portal' : `Manage ${getSectionTitle().toLowerCase()}`}
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Chatbot Section Interfaces
interface ChatbotConversation {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  rating: number | null;
  archived: boolean;
  notes: string | null;
  pageContext: string | null;
  messageCount?: number;
  lastMessage?: string;
  customerName?: string;
  customerEmail?: string;
}

interface ChatbotMessage {
  id: number;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  feedback: "positive" | "negative" | null;
  imageUrl: string | null;
}

interface ChatbotAnalytics {
  totalConversations: number;
  activeConversations: number;
  averageRating: number;
  totalFeedback: {
    positive: number;
    negative: number;
  };
  commonQuestions: Array<{
    question: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

interface QuickResponse {
  id: number;
  label: string;
  message: string;
  category: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

// Email Processing Section - Invoice & Estimate webhook logs
function EmailProcessingSection() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'estimates'>('invoices');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoice Logs</TabsTrigger>
          <TabsTrigger value="estimates" data-testid="tab-estimates">Estimate Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="mt-6">
          <InvoiceLogsTable />
        </TabsContent>
        
        <TabsContent value="estimates" className="mt-6">
          <EstimateLogsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Invoice Logs Table
function InvoiceLogsTable() {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['/api/admin/invoice-logs'],
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchIntervalInBackground: false, // Only poll when tab is active
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Invoice Logs</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {error instanceof Error ? error.message : 'An error occurred while fetching invoice logs'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const logs = data?.logs || [];
  
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Invoice Logs Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Invoice webhook logs will appear here when ServiceTitan emails are received
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const lastUpdated = new Date(dataUpdatedAt);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice Processing Logs</CardTitle>
            <CardDescription>
              Recent invoice PDF webhook attempts • Last updated: {lastUpdated.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            data-testid="button-refresh-invoices"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log: any) => (
            <Card key={log.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{log.pdfFilename || 'Unknown PDF'}</h4>
                      {log.status === 'pending' && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {log.status === 'parsed' && (
                        <Badge variant="default">Parsed</Badge>
                      )}
                      {log.status === 'completed' && (
                        <Badge className="bg-green-500">Completed</Badge>
                      )}
                      {log.status === 'failed' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>From:</strong> {log.emailFrom || 'Unknown'}</p>
                      <p><strong>Subject:</strong> {log.emailSubject || 'Unknown'}</p>
                      <p><strong>Received:</strong> {new Date(log.receivedAt).toLocaleString()}</p>
                      {log.attachmentSize && (
                        <p><strong>Size:</strong> {(log.attachmentSize / 1024).toFixed(2)} KB</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {log.errorMessage && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      <strong>Error:</strong> {log.errorMessage}
                    </p>
                  </div>
                )}
                
                {log.extractedData && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-2">Extracted Data:</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(log.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Estimate Logs Table
function EstimateLogsTable() {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['/api/admin/estimate-logs'],
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchIntervalInBackground: false, // Only poll when tab is active
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Estimate Logs</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {error instanceof Error ? error.message : 'An error occurred while fetching estimate logs'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const logs = data?.logs || [];
  const lastUpdated = new Date(dataUpdatedAt);
  
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Estimate Logs Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Estimate webhook logs will appear here when ServiceTitan emails are received
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estimate Processing Logs</CardTitle>
            <CardDescription>
              Recent estimate PDF webhook attempts • Last updated: {lastUpdated.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            data-testid="button-refresh-estimates"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log: any) => (
            <Card key={log.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{log.pdfFilename || 'Unknown PDF'}</h4>
                      {log.status === 'pending' && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {log.status === 'parsed' && (
                        <Badge variant="default">Parsed</Badge>
                      )}
                      {log.status === 'completed' && (
                        <Badge className="bg-green-500">Completed</Badge>
                      )}
                      {log.status === 'skipped' && (
                        <Badge variant="outline">Skipped</Badge>
                      )}
                      {log.status === 'failed' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>From:</strong> {log.emailFrom || 'Unknown'}</p>
                      <p><strong>Subject:</strong> {log.emailSubject || 'Unknown'}</p>
                      <p><strong>Received:</strong> {new Date(log.receivedAt).toLocaleString()}</p>
                      {log.attachmentSize && (
                        <p><strong>Size:</strong> {(log.attachmentSize / 1024).toFixed(2)} KB</p>
                      )}
                      {log.estimateAmount && (
                        <p><strong>Amount:</strong> ${(log.estimateAmount / 100).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {log.errorMessage && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      <strong>Error:</strong> {log.errorMessage}
                    </p>
                  </div>
                )}
                
                {log.skipReason && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Skip Reason:</strong> {log.skipReason}
                    </p>
                  </div>
                )}
                
                {log.extractedData && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-2">Extracted Data:</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(log.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Chatbot Section Component
function ChatbotSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatbotMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingQuickResponse, setEditingQuickResponse] = useState<QuickResponse | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Fetch conversations
  const { data: conversationsData, isLoading: loadingConversations, refetch: refetchConversations } = useQuery<{ conversations: ChatbotConversation[], pagination: any }>({
    queryKey: ["/api/admin/chatbot/conversations"],
  });
  
  const conversations = conversationsData?.conversations || [];

  // Fetch analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<ChatbotAnalytics>({
    queryKey: ["/api/admin/chatbot/analytics"],
  });

  // Fetch quick responses
  const { data: quickResponses = [], isLoading: loadingQuickResponses, refetch: refetchQuickResponses } = useQuery<QuickResponse[]>({
    queryKey: ["/api/admin/chatbot/quick-responses"],
  });

  // Archive conversation mutation
  const archiveConversation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return apiRequest("PATCH", `/api/admin/chatbot/conversation/${id}`, { archived });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Conversation updated successfully",
      });
      refetchConversations();
      if (selectedConversation) {
        setSelectedConversation(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    },
  });

  // Update conversation notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/chatbot/conversation/${id}`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
      refetchConversations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    },
  });

  // Create/Update quick response
  const saveQuickResponse = useMutation({
    mutationFn: async (data: Partial<QuickResponse>) => {
      if (data.id) {
        return apiRequest("PATCH", `/api/admin/chatbot/quick-responses/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/chatbot/quick-responses", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quick response saved successfully",
      });
      refetchQuickResponses();
      setEditingQuickResponse(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save quick response",
        variant: "destructive",
      });
    },
  });

  // Delete quick response
  const deleteQuickResponse = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chatbot/quick-responses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quick response deleted successfully",
      });
      refetchQuickResponses();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quick response",
        variant: "destructive",
      });
    },
  });

  // Load conversation details
  const loadConversationDetails = async (conversation: ChatbotConversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/chatbot/conversation/${conversation.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load conversation details:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Email conversation
  const emailConversation = async (conversationId: string) => {
    try {
      await apiRequest("POST", `/api/admin/chatbot/conversation/${conversationId}/email`);
      toast({
        title: "Success",
        description: "Conversation emailed to admin successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to email conversation",
        variant: "destructive",
      });
    }
  };

  // Export conversations
  const exportConversations = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/admin/chatbot/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chatbot-conversations-${new Date().toISOString().split("T")[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Success",
          description: `Conversations exported as ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export conversations",
        variant: "destructive",
      });
    }
    setShowExportDialog(false);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv: ChatbotConversation) => {
    if (filterStatus === "active" && conv.archived) return false;
    if (filterStatus === "archived" && !conv.archived) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.customerName?.toLowerCase().includes(query) ||
        conv.customerEmail?.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query) ||
        conv.pageContext?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Monitor conversations, analyze engagement, and manage responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetchConversations()} 
            variant="outline"
            data-testid="button-refresh-conversations"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowExportDialog(true)}
            data-testid="button-export-conversations"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations" data-testid="tab-conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="quick-responses" data-testid="tab-quick-responses">
            <Clock className="w-4 h-4 mr-2" />
            Quick Responses
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Archive className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Conversations</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-conversations"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="w-32" data-testid="select-filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConversations ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No conversations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConversations.map((conv: ChatbotConversation) => (
                        <TableRow key={conv.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{conv.customerName || "Anonymous"}</p>
                              {conv.customerEmail && (
                                <p className="text-sm text-muted-foreground">{conv.customerEmail}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{conv.messageCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {conv.pageContext || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {conv.rating ? (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                {conv.rating}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={conv.archived ? "secondary" : conv.endedAt ? "default" : "outline"}>
                              {conv.archived ? "Archived" : conv.endedAt ? "Ended" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => loadConversationDetails(conv)}
                                data-testid={`button-view-conversation-${conv.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => emailConversation(conv.id)}
                                data-testid={`button-email-conversation-${conv.id}`}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => archiveConversation.mutate({
                                  id: conv.id,
                                  archived: !conv.archived,
                                })}
                                data-testid={`button-archive-conversation-${conv.id}`}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? <Skeleton className="h-8 w-20" /> : analytics?.totalConversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? <Skeleton className="h-8 w-20" /> : analytics?.activeConversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently chatting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    analytics?.averageRating?.toFixed(1) || "N/A"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <ThumbsUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="font-bold">{analytics?.totalFeedback?.positive || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="font-bold">{analytics?.totalFeedback?.negative || 0}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">User feedback</p>
              </CardContent>
            </Card>
          </div>

          {analytics?.commonQuestions && analytics.commonQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Common Questions</CardTitle>
                <CardDescription>Most frequently asked questions by customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.commonQuestions.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                      <span className="flex-1">{q.question}</span>
                      <Badge variant="secondary">{q.count} times</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quick Responses Tab */}
        <TabsContent value="quick-responses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quick Response Templates</CardTitle>
                  <CardDescription>
                    Manage predefined responses for common questions
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setEditingQuickResponse({} as QuickResponse)}
                  data-testid="button-add-quick-response"
                >
                  Add Response
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingQuickResponses ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {quickResponses.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No quick responses configured
                    </p>
                  ) : (
                    quickResponses.map((response: QuickResponse) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{response.label}</h4>
                            <Badge variant="outline">{response.category}</Badge>
                            {!response.isActive && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {response.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingQuickResponse(response)}
                            data-testid={`button-edit-quick-response-${response.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteQuickResponse.mutate(response.id)}
                            data-testid={`button-delete-quick-response-${response.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Configuration</CardTitle>
              <CardDescription>
                Configure chatbot behavior and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea
                  placeholder="Hi! How can I help you today?"
                  className="min-h-20"
                  data-testid="textarea-greeting-message"
                />
              </div>
              <div className="space-y-2">
                <Label>Auto-Response Delay (seconds)</Label>
                <Input 
                  type="number" 
                  defaultValue="1" 
                  min="0" 
                  max="10"
                  data-testid="input-response-delay"
                />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number" 
                  defaultValue="30" 
                  min="5" 
                  max="120"
                  data-testid="input-session-timeout"
                />
              </div>
              <Button className="w-full" data-testid="button-save-settings">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <div className="flex items-center gap-4 mt-2">
                  <Badge>{selectedConversation.pageContext || "Unknown Page"}</Badge>
                  <span className="text-sm">
                    Started {formatDistanceToNow(new Date(selectedConversation.startedAt), { addSuffix: true })}
                  </span>
                  {selectedConversation.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {selectedConversation.rating}/5
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {loadingMessages ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Uploaded"
                                className="rounded-lg max-w-full"
                              />
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                            {message.role === "assistant" && message.feedback && (
                              <div className="flex items-center">
                                {message.feedback === "positive" ? (
                                  <ThumbsUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <ThumbsDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add notes about this conversation..."
                  value={selectedConversation?.notes || ""}
                  onChange={(e) => {
                    if (selectedConversation) {
                      setSelectedConversation({
                        ...selectedConversation,
                        notes: e.target.value,
                      });
                    }
                  }}
                  className="min-h-32 mt-2"
                  data-testid="textarea-conversation-notes"
                />
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    if (selectedConversation && selectedConversation.notes) {
                      updateNotes.mutate({
                        id: selectedConversation.id,
                        notes: selectedConversation.notes,
                      });
                    }
                  }}
                  data-testid="button-save-notes"
                >
                  Save Notes
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => selectedConversation && emailConversation(selectedConversation.id)}
                  data-testid="button-email-conversation-detail"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Conversation
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    if (selectedConversation) {
                      archiveConversation.mutate({
                        id: selectedConversation.id,
                        archived: !selectedConversation.archived,
                      });
                    }
                  }}
                  data-testid="button-archive-conversation-detail"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {selectedConversation?.archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Response Edit Dialog */}
      <Dialog open={!!editingQuickResponse} onOpenChange={() => setEditingQuickResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuickResponse?.id ? "Edit" : "Add"} Quick Response
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={editingQuickResponse?.label || ""}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  label: e.target.value,
                })}
                placeholder="e.g., Schedule Service"
                data-testid="input-quick-response-label"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={editingQuickResponse?.message || ""}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  message: e.target.value,
                })}
                placeholder="The message that will be sent..."
                className="min-h-24"
                data-testid="textarea-quick-response-message"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editingQuickResponse?.category || "general"}
                onValueChange={(v) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  category: v,
                })}
              >
                <SelectTrigger data-testid="select-quick-response-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={editingQuickResponse?.sortOrder || 0}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  sortOrder: parseInt(e.target.value) || 0,
                })}
                min="0"
                data-testid="input-quick-response-sort-order"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quick-response-active"
                checked={editingQuickResponse?.isActive !== false}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  isActive: e.target.checked,
                })}
                data-testid="checkbox-quick-response-active"
              />
              <Label htmlFor="quick-response-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingQuickResponse(null)}
                data-testid="button-cancel-quick-response"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveQuickResponse.mutate(editingQuickResponse!)}
                data-testid="button-save-quick-response"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Conversations</DialogTitle>
            <DialogDescription>
              Choose the format for exporting conversation data
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => exportConversations("csv")}
              data-testid="button-export-csv"
            >
              Export as CSV
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => exportConversations("json")}
              data-testid="button-export-json"
            >
              Export as JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Manual Success Story Dialog Component
function ManualSuccessStoryDialog({ photos, onClose }: { photos: any[], onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const response = await fetch('/api/admin/generate-story-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo1Url: photos[0].photoUrl,
          photo2Url: photos[1].photoUrl
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate caption');
      
      const data = await response.json();
      setTitle(data.title);
      setDescription(data.description);
      
      toast({
        title: "Caption Generated",
        description: "AI has generated a caption for your success story.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !description) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/admin/success-stories/manual", {
        photo1Id: photos[0].id,
        photo2Id: photos[1].id,
        title,
        description,
      });
      
      toast({
        title: "Success Story Created",
        description: "The success story has been created and is pending review.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-success-story">
        <DialogHeader>
          <DialogTitle>Create Success Story</DialogTitle>
          <DialogDescription>
            Create a before/after success story from 2 selected photos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Before Photo</p>
              <img 
                src={photos[0].photoUrl} 
                alt="Before" 
                className="w-full h-48 object-cover rounded-lg"
                data-testid="img-before-photo"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">After Photo</p>
              <img 
                src={photos[1].photoUrl} 
                alt="After" 
                className="w-full h-48 object-cover rounded-lg"
                data-testid="img-after-photo"
              />
            </div>
          </div>

          {/* Generate Caption Button */}
          <Button
            onClick={generateCaption}
            disabled={isGeneratingCaption}
            className="w-full"
            data-testid="button-generate-caption"
          >
            {isGeneratingCaption ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Caption with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Caption with AI
              </>
            )}
          </Button>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium" htmlFor="story-title">
              Title
            </label>
            <Input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Water Heater Replacement"
              data-testid="input-story-title"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label className="text-sm font-medium" htmlFor="story-description">
              Description
            </label>
            <Textarea
              id="story-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the before/after transformation..."
              rows={4}
              data-testid="textarea-story-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} data-testid="button-create-story">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Success Story'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Manual Blog Post Dialog Component
function ManualBlogPostDialog({ photo, onClose }: { photo: any, onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generateBlogPost = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/generate-blog-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: photo.photoUrl,
          aiDescription: photo.aiDescription
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate blog post');
      
      const data = await response.json();
      setTitle(data.title);
      setContent(data.content);
      
      toast({
        title: "Blog Post Generated",
        description: "AI has generated a blog post from your photo.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !content) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and content",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/admin/blog-posts/manual", {
        photoId: photo.id,
        title,
        content,
      });
      
      toast({
        title: "Blog Post Created",
        description: "The blog post has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-blog-post">
        <DialogHeader>
          <DialogTitle>Create Blog Post</DialogTitle>
          <DialogDescription>
            Create a blog post from selected photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Selected Photo</p>
            <img 
              src={photo.photoUrl} 
              alt="Blog photo" 
              className="w-full h-64 object-cover rounded-lg"
              data-testid="img-blog-photo"
            />
            {photo.aiDescription && (
              <p className="text-sm text-muted-foreground mt-2">
                AI Description: {photo.aiDescription}
              </p>
            )}
          </div>

          {/* Generate Blog Post Button */}
          <Button
            onClick={generateBlogPost}
            disabled={isGenerating}
            className="w-full"
            data-testid="button-generate-blog-post"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Blog Post with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Blog Post with AI
              </>
            )}
          </Button>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium" htmlFor="blog-title">
              Title
            </label>
            <Input
              id="blog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Expert Water Heater Repair in Austin"
              data-testid="input-blog-title"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-sm font-medium" htmlFor="blog-content">
              Content
            </label>
            <Textarea
              id="blog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post content (supports markdown)..."
              rows={12}
              data-testid="textarea-blog-content"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} data-testid="button-create-blog-post">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Blog Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
