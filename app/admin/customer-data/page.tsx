'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  TrendingUp,
  BarChart3,
  Star,
  Activity,
  Calendar,
  RefreshCcw,
  Trophy,
  AlertCircle,
} from 'lucide-react';

export default function CustomerDataPage() {
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
      <div className="container mx-auto p-6 space-y-6">
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Customer Data</h1>
        <p className="text-muted-foreground mb-6">
          Import history, customer metrics, and top customers by lifetime value
        </p>
      </div>

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
