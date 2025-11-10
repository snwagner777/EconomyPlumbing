/**
 * ServiceTitan Dashboard Client Component
 * 
 * Comprehensive sync monitoring: OAuth, customer data, jobs, zones, settings
 * Covers Tasks 35-40: Sync monitoring, OAuth, scheduler config, zone mapping
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  RefreshCw,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Building,
  Home,
  Briefcase,
  Globe,
  AlertTriangle,
  Clock,
  Activity,
  FileText,
  DollarSign,
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface Customer {
  id: number;
  serviceTitanId: number;
  name: string;
  type: 'Residential' | 'Commercial';
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  active: boolean;
  lastSyncedAt: string;
}

interface SyncStatus {
  totalCustomers: number;
  lastSyncTime?: string;
  isRunning: boolean;
  totalJobs?: number;
  lastJobSync?: string;
  oauthConnected?: boolean;
}


export function ServiceTitanDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Fetch sync status
  const {
    data: syncData,
    isLoading: syncLoading,
    isError: syncError,
    refetch: refetchSync,
  } = useQuery<SyncStatus>({
    queryKey: ['/api/admin/sync-status'],
  });

  // Fetch customers
  const {
    data: customersData,
    isLoading: customersLoading,
    isError: customersError,
  } = useQuery<{ customers?: Customer[]; total?: number }>({
    queryKey: ['/api/admin/customers'],
    enabled: activeTab === 'customers',
  });

  // Fetch invoice processing logs
  const {
    data: invoiceLogsData = [],
    isLoading: invoiceLogsLoading,
    refetch: refetchInvoiceLogs,
  } = useQuery<any[]>({
    queryKey: ['/api/admin/invoice-logs'],
    enabled: activeTab === 'webhooks',
    select: (data: any) => Array.isArray(data) ? data : (data?.logs ?? []),
  });

  // Fetch estimate processing logs
  const {
    data: estimateLogsData = [],
    isLoading: estimateLogsLoading,
    refetch: refetchEstimateLogs,
  } = useQuery<any[]>({
    queryKey: ['/api/admin/estimate-logs'],
    enabled: activeTab === 'webhooks',
    select: (data: any) => Array.isArray(data) ? data : (data?.logs ?? []),
  });

  // Filter customers based on search and filters
  const filteredCustomers = customersData?.customers?.filter((customer) => {
    const matchesSearch =
      searchQuery === '' ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone ?? '').includes(searchQuery);

    const matchesType =
      typeFilter === 'all' || customer.type === typeFilter;

    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && customer.active) ||
      (activeFilter === 'inactive' && !customer.active);

    return matchesSearch && matchesType && matchesActive;
  });

  const handleRefreshSync = () => {
    refetchSync();
    queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
    toast({
      title: 'Refreshing',
      description: 'Sync status updated',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-servicetitan">
            ServiceTitan Sync
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor customer data, jobs, OAuth, and scheduler configuration
          </p>
        </div>
        <Button
          onClick={handleRefreshSync}
          variant="outline"
          data-testid="button-refresh-sync"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList data-testid="tabs-servicetitan">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            <Mail className="h-4 w-4 mr-2" />
            Webhook Processing
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* OAuth Connection Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                OAuth Connection
              </h2>
              <Badge
                variant={syncData?.oauthConnected ? 'default' : 'destructive'}
                data-testid="badge-oauth-status"
              >
                {syncData?.oauthConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
            {!syncData?.oauthConnected && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ServiceTitan OAuth is not connected. Some features may not work. Configure OAuth in the Settings tab.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              OAuth credentials enable API access for customer data, jobs, scheduling, and form submissions.
            </p>
          </Card>

          {/* Sync Status Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6" data-testid="stat-total-customers">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  {syncLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" data-testid="skeleton-total-customers" />
                  ) : syncError ? (
                    <div className="text-2xl font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-total-customers">
                      {syncData?.totalCustomers?.toLocaleString() ?? 0}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="stat-total-jobs">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jobs</p>
                  {syncLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" data-testid="skeleton-total-jobs" />
                  ) : syncError ? (
                    <div className="text-2xl font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-total-jobs">
                      {syncData?.totalJobs?.toLocaleString() ?? 0}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="stat-last-customer-sync">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Customer Sync</p>
                  {syncLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" data-testid="skeleton-last-sync" />
                  ) : syncError ? (
                    <div className="text-lg font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-lg font-bold" data-testid="text-last-customer-sync">
                      {syncData?.lastSyncTime
                        ? new Date(syncData.lastSyncTime).toLocaleDateString()
                        : 'Never'}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="stat-sync-status">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${syncData?.isRunning ? 'bg-orange-500/10' : 'bg-gray-500/10'}`}>
                  <RefreshCw className={`h-6 w-6 ${syncData?.isRunning ? 'text-orange-600 animate-spin' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sync Status</p>
                  {syncLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" data-testid="skeleton-sync-status" />
                  ) : syncError ? (
                    <div className="text-2xl font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-sync-status">
                      {syncData?.isRunning ? 'Running' : 'Idle'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sync Activity
            </h2>
            <Alert data-testid="info-recent-activity">
              <Activity className="h-4 w-4" />
              <AlertDescription>
                Customer data synced via Mailgun XLSX webhooks. Jobs synced via ServiceTitan API. 
                Last customer sync: {syncData?.lastSyncTime ? new Date(syncData.lastSyncTime).toLocaleString() : 'Never'}
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        {/* CUSTOMERS TAB */}
        <TabsContent value="customers" className="space-y-6">
          {/* Customer Type Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6" data-testid="stat-residential">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Home className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Residential</p>
                  {customersLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-residential" />
                  ) : customersError ? (
                    <div className="text-2xl font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-residential-count">
                      {customersData?.customers?.filter((c) => c.type === 'Residential')?.length?.toLocaleString() ?? 0}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="stat-commercial">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Building className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commercial</p>
                  {customersLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-commercial" />
                  ) : customersError ? (
                    <div className="text-2xl font-bold text-destructive">—</div>
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-commercial-count">
                      {customersData?.customers?.filter((c) => c.type === 'Commercial')?.length?.toLocaleString() ?? 0}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-customers"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="filter-type-all">All Types</SelectItem>
                    <SelectItem value="Residential" data-testid="filter-type-residential">Residential</SelectItem>
                    <SelectItem value="Commercial" data-testid="filter-type-commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger data-testid="select-active-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="filter-status-all">All Status</SelectItem>
                    <SelectItem value="active" data-testid="filter-status-active">Active</SelectItem>
                    <SelectItem value="inactive" data-testid="filter-status-inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Customers List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4" data-testid="heading-customers">
              Customer Records ({filteredCustomers?.length?.toLocaleString() ?? 0})
            </h2>

            {customersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" data-testid={`skeleton-customer-${i}`} />
                ))}
              </div>
            ) : customersError ? (
              <Alert variant="destructive" data-testid="alert-error-customers">
                <AlertDescription>
                  Failed to load customers. Please try again.
                </AlertDescription>
              </Alert>
            ) : !filteredCustomers || filteredCustomers.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-customers">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery || typeFilter !== 'all' || activeFilter !== 'all'
                    ? 'No customers found'
                    : 'No customers synced yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter !== 'all' || activeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Customer data will appear here after the first XLSX import'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.slice(0, 50).map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition"
                    data-testid={`customer-${customer.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold" data-testid={`customer-name-${customer.id}`}>
                            {customer.name}
                          </h3>
                          <Badge
                            variant={customer.type === 'Residential' ? 'default' : 'secondary'}
                            data-testid={`customer-type-${customer.id}`}
                          >
                            {customer.type}
                          </Badge>
                          <Badge
                            variant={customer.active ? 'default' : 'outline'}
                            data-testid={`customer-status-${customer.id}`}
                          >
                            {customer.active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-2" data-testid={`customer-email-${customer.id}`}>
                              <Mail className="h-3 w-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2" data-testid={`customer-phone-${customer.id}`}>
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {(customer.city || customer.state) && (
                            <div className="flex items-center gap-2" data-testid={`customer-location-${customer.id}`}>
                              <MapPin className="h-3 w-3" />
                              <span>
                                {customer.city}
                                {customer.city && customer.state && ', '}
                                {customer.state}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2" data-testid={`customer-sync-${customer.id}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Synced: {new Date(customer.lastSyncedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCustomers.length > 50 && (
                  <Alert>
                    <AlertDescription>
                      Showing first 50 of {filteredCustomers.length.toLocaleString()} customers. Use search to narrow results.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* WEBHOOK PROCESSING TAB */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Invoice Processing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Invoice Processing
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ServiceTitan invoice PDFs processed for review requests
                </p>
              </div>
              <Button
                onClick={() => refetchInvoiceLogs()}
                variant="outline"
                size="sm"
                data-testid="button-refresh-invoices"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {invoiceLogsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !invoiceLogsData || invoiceLogsData.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoice processing logs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoiceLogsData.slice(0, 20).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg"
                    data-testid={`invoice-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{log.fileName}</h3>
                          <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.processedAt).toLocaleString()}
                          </div>
                          {log.customerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {log.customerEmail}
                            </div>
                          )}
                          {log.processingTimeMs && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {log.processingTimeMs}ms
                            </div>
                          )}
                        </div>
                        {log.errorMessage && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Estimate Processing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estimate Processing
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ServiceTitan estimate PDFs processed for quote follow-up
                </p>
              </div>
              <Button
                onClick={() => refetchEstimateLogs()}
                variant="outline"
                size="sm"
                data-testid="button-refresh-estimates"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {estimateLogsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !estimateLogsData || estimateLogsData.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No estimate processing logs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {estimateLogsData.slice(0, 20).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg"
                    data-testid={`estimate-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{log.fileName}</h3>
                          <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.processedAt).toLocaleString()}
                          </div>
                          {log.customerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {log.customerEmail}
                            </div>
                          )}
                          {log.processingTimeMs && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {log.processingTimeMs}ms
                            </div>
                          )}
                        </div>
                        {log.errorMessage && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
