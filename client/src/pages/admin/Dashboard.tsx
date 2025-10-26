import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Database,
  Users,
  Search,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Phone,
  Mail,
  Calendar,
  FileText
} from "lucide-react";

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

export default function AdminDashboard() {
  const { toast } = useToast();

  // Fetch ServiceTitan sync status
  const { data: syncStatus, isLoading: syncLoading } = useQuery<SyncStatus>({
    queryKey: ['/api/admin/sync-status'],
    refetchInterval: 5000, // Refresh every 5 seconds
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

  // Manual sync trigger mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/servicetitan/sync-customers', {
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
        title: "Sync Started",
        description: "Customer sync is running in the background. Check the progress below.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start customer sync",
        variant: "destructive",
      });
    },
  });

  const syncProgress = syncStatus?.totalCustomers 
    ? Math.min((syncStatus.totalCustomers / 12000) * 100, 100) 
    : 0;

  return (
    <>
      <SEOHead
        title="Admin Dashboard | Economy Plumbing"
        description="Admin dashboard for Economy Plumbing Services"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor ServiceTitan sync, customer portal analytics, and conversion tracking
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {syncLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {syncStatus?.totalCustomers.toLocaleString()}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Synced from ServiceTitan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contact Methods
                </CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {syncLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {syncStatus?.totalContacts.toLocaleString()}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Phone numbers & emails
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Portal Searches
                </CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {portalStats?.totalSearches || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Customer lookups (all time)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sync Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {syncLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <Badge variant={syncStatus?.isRunning ? "default" : "outline"}>
                    {syncStatus?.isRunning ? "Running" : "Idle"}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  {syncStatus?.lastSyncedAt 
                    ? `Last: ${new Date(syncStatus.lastSyncedAt).toLocaleDateString()}`
                    : "Never synced"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* ServiceTitan Sync Monitor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <CardTitle>ServiceTitan Sync</CardTitle>
                  </div>
                  <Button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending || syncStatus?.isRunning}
                    size="sm"
                    data-testid="button-manual-sync"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    Manual Sync
                  </Button>
                </div>
                <CardDescription>
                  Automatic sync runs daily at 3am CT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(syncProgress)}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customers Synced</p>
                    <p className="text-2xl font-bold" data-testid="text-customers-synced">
                      {syncStatus?.totalCustomers.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contacts Synced</p>
                    <p className="text-2xl font-bold" data-testid="text-contacts-synced">
                      {syncStatus?.totalContacts.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                {syncStatus?.isRunning && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <p className="text-sm font-medium">Sync in progress...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Portal Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle>Customer Portal Analytics</CardTitle>
                </div>
                <CardDescription>
                  Real-time portal usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Searches</p>
                        <p className="text-2xl font-bold">{portalStats?.totalSearches || 0}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-2xl font-bold">
                          {portalStats?.recentSearches?.length 
                            ? Math.round((portalStats.recentSearches.filter(s => s.found).length / portalStats.recentSearches.length) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Recent Activity</p>
                      <div className="space-y-2">
                        {portalStats?.recentSearches?.slice(0, 5).map((search, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm">
                            <div className="flex items-center gap-2">
                              {search.found ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className="capitalize">{search.searchType}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(search.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        )) || (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No recent searches
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SEO & Conversion Tracking */}
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
        </main>
        <Footer />
      </div>
    </>
  );
}
