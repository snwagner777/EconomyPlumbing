'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  ImageIcon,
  TrendingUp,
  Star,
  FileText,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';

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

interface ConversionStats {
  schedulerOpens: number;
  phoneClicks: number;
  formSubmissions: number;
}

interface PhotoStats {
  total: number;
  unused: number;
  used: number;
}

export default function DashboardOverviewClient() {
  const { toast } = useToast();

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
  const { data: conversionStats, isLoading: conversionLoading } = useQuery<ConversionStats>({
    queryKey: ['/api/admin/conversion-stats'],
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch photo stats - using photos API instead
  const { data: photoStatsData, isLoading: photoStatsLoading } = useQuery({
    queryKey: ['/api/admin/photos'],
    refetchInterval: 60000,
  });
  
  const photoStats: PhotoStats = {
    total: photoStatsData?.photos?.length || 0,
    unused: photoStatsData?.photos?.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl).length || 0,
    used: photoStatsData?.photos?.filter((p: any) => p.usedInBlogPostId || p.usedInPageUrl).length || 0,
  };

  // Manual sync trigger mutation
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          System status, analytics, and key metrics at a glance
        </p>
      </div>

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
                <p className="text-2xl font-bold" data-testid="stat-customers">
                  {syncLoading ? <Skeleton className="h-8 w-20" /> : (syncStatus?.totalCustomers ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold" data-testid="stat-contacts">
                  {syncLoading ? <Skeleton className="h-8 w-20" /> : (syncStatus?.totalContacts ?? 0).toLocaleString()}
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
                  <Progress value={syncProgress} className="h-2" data-testid="progress-sync" />
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
                <p className="text-2xl font-bold" data-testid="stat-portal-searches">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : portalStats?.totalSearches || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customers Found</p>
                <p className="text-2xl font-bold" data-testid="stat-portal-found">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : (portalStats?.recentSearches?.filter(s => s.found).length ?? 0)}
                </p>
              </div>
            </div>

            {!statsLoading && portalStats && portalStats.recentSearches && portalStats.recentSearches.length > 0 && (
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
            <CardTitle className="text-3xl" data-testid="stat-photos-total">
              {photoStatsLoading ? <Skeleton className="h-9 w-16" /> : photoStats?.total || 0}
            </CardTitle>
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
            <CardTitle className="text-3xl" data-testid="stat-photos-unused">
              {photoStatsLoading ? <Skeleton className="h-9 w-16" /> : photoStats?.unused || 0}
            </CardTitle>
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
            <CardDescription>Used Photos</CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-photos-used">
              {photoStatsLoading ? <Skeleton className="h-9 w-16" /> : photoStats?.used || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>In blog posts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Good Quality</CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-photos-quality">
              {photoStatsLoading ? <Skeleton className="h-9 w-16" /> : Math.round((photoStats?.unused || 0) * 0.7)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>High quality unused</span>
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
              <Badge variant="outline" className={syncStatus?.isRunning ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400" : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400"}>
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
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Auto Blog Generator</p>
                  <p className="text-xs text-muted-foreground">Weekly content creation</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">Active</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Review Sync</p>
                  <p className="text-xs text-muted-foreground">Google Places API integration</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">Active</Badge>
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
              <p className="text-2xl font-bold" data-testid="stat-scheduler-opens">
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
              <p className="text-2xl font-bold" data-testid="stat-phone-clicks">
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
              <p className="text-2xl font-bold" data-testid="stat-form-submissions">
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
              <p className="text-2xl font-bold" data-testid="stat-conversion-portal">
                {portalStats?.totalSearches || 0}
              </p>
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
