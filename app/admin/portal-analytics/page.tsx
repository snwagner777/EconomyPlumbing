/**
 * Customer Portal Analytics Page
 * 
 * Displays comprehensive analytics for customer portal usage including:
 * - Search volume and success rates
 * - Search type breakdown (phone vs email)
 * - Recent search activity
 * - Failed searches for potential lead follow-up
 * - Usage trends over time
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface PortalStats {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  uniqueCustomers: number;
  successRate: number;
  phoneSearches: number;
  emailSearches: number;
  recentSearches: RecentSearch[];
  failedSearchesList: RecentSearch[];
  dailyTrends: DailyTrend[];
}

interface RecentSearch {
  id: string;
  searchType: 'phone' | 'email';
  searchValue: string;
  found: boolean;
  customerId?: number;
  timestamp: string;
}

interface DailyTrend {
  date: string;
  searches: number;
  successful: number;
  failed: number;
}

export default function PortalAnalyticsPage() {
  // Fetch portal analytics data
  const { data: stats, isLoading, error, refetch } = useQuery<PortalStats>({
    queryKey: ['/api/admin/portal-analytics'],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/admin/portal-analytics'] });
    refetch();
  };

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load portal analytics. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-portal-analytics">
            Customer Portal Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track portal usage, search activity, and customer engagement
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="default"
          disabled={isLoading}
          data-testid="button-refresh-analytics"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Searches */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold" data-testid="stat-total-searches">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                stats?.totalSearches?.toLocaleString() ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground">All-time portal searches</p>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold" data-testid="stat-success-rate">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                `${stats?.successRate?.toFixed(1) ?? 0}%`
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats?.successfulSearches?.toLocaleString() ?? 0} successful
            </p>
          </div>
        </Card>

        {/* Failed Searches */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Failed Searches</p>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold" data-testid="stat-failed-searches">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                stats?.failedSearches?.toLocaleString() ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Potential new leads</p>
          </div>
        </Card>

        {/* Unique Customers */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold" data-testid="stat-unique-customers">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                stats?.uniqueCustomers?.toLocaleString() ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Distinct customers found</p>
          </div>
        </Card>
      </div>

      {/* Search Type Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Phone Searches */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Phone Searches</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold" data-testid="stat-phone-searches">
                {stats?.phoneSearches?.toLocaleString() ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Percentage</span>
              <span className="font-semibold">
                {stats?.totalSearches
                  ? ((stats.phoneSearches / stats.totalSearches) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </Card>

        {/* Email Searches */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Email Searches</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold" data-testid="stat-email-searches">
                {stats?.emailSearches?.toLocaleString() ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Percentage</span>
              <span className="font-semibold">
                {stats?.totalSearches
                  ? ((stats.emailSearches / stats.totalSearches) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Searches Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Recent Search Activity</h3>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading searches...</div>
        ) : !stats?.recentSearches || stats.recentSearches.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No searches recorded yet</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="header-search-type">Type</TableHead>
                  <TableHead data-testid="header-search-value">Search Value</TableHead>
                  <TableHead data-testid="header-status">Status</TableHead>
                  <TableHead data-testid="header-customer-id">Customer ID</TableHead>
                  <TableHead data-testid="header-timestamp">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentSearches.map((search) => (
                  <TableRow key={search.id} data-testid={`row-search-${search.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {search.searchType === 'phone' ? (
                          <Phone className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span className="capitalize">{search.searchType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`search-value-${search.id}`}>
                      {search.searchValue}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={search.found ? 'default' : 'destructive'}
                        data-testid={`status-${search.id}`}
                      >
                        {search.found ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Found
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Found
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`customer-id-${search.id}`}>
                      {search.customerId ? (
                        <span className="font-mono">{search.customerId}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`timestamp-${search.id}`}>
                      {formatDistanceToNow(new Date(search.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Failed Searches for Lead Follow-up */}
      {stats?.failedSearchesList && stats.failedSearchesList.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Failed Searches - Potential Leads</h3>
          </div>
          <Alert className="mb-4">
            <AlertDescription>
              These contacts searched for their account but weren't found in the system. 
              Consider reaching out to convert them into customers.
            </AlertDescription>
          </Alert>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="header-failed-type">Type</TableHead>
                  <TableHead data-testid="header-failed-contact">Contact Info</TableHead>
                  <TableHead data-testid="header-failed-time">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.failedSearchesList.slice(0, 20).map((search) => (
                  <TableRow key={search.id} data-testid={`row-failed-${search.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {search.searchType === 'phone' ? (
                          <Phone className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span className="capitalize">{search.searchType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`failed-value-${search.id}`}>
                      {search.searchValue}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`failed-timestamp-${search.id}`}>
                      {formatDistanceToNow(new Date(search.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {stats.failedSearchesList.length > 20 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 20 of {stats.failedSearchesList.length} failed searches
            </p>
          )}
        </Card>
      )}

      {/* Usage Trends (if data available) */}
      {stats?.dailyTrends && stats.dailyTrends.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Daily Usage Trends (Last 7 Days)</h3>
          </div>
          <div className="space-y-3">
            {stats.dailyTrends.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${stats.totalSearches ? (day.searches / stats.totalSearches) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {day.searches}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      {day.successful} successful
                    </span>
                    <span>
                      <XCircle className="h-3 w-3 inline mr-1" />
                      {day.failed} failed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
