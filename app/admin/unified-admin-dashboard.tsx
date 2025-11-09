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

type AdminSection = 'dashboard' | 'photos';

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

export default function UnifiedAdminDashboard() {
  // Load active section from localStorage, fallback to 'dashboard'
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const router = useRouter();

  // Load saved section from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-active-section');
      if (saved && ['dashboard', 'photos', 'review-requests', 'email-templates'].includes(saved)) {
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
      default:
        return <DashboardOverview stats={stats} photos={photos} />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<AdminSection, string> = {
      'dashboard': 'Dashboard',
      'photos': 'Photo Management',
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

// Chatbot Section Component
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
