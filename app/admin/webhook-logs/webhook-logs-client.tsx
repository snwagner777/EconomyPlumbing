'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Database, FileText, Mail, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WebhookLogsClient() {
  const [activeTab, setActiveTab] = useState('customer-imports');

  // Fetch customer data imports
  const { data: imports, isLoading: importsLoading, refetch: refetchImports } = useQuery<{
    imports: any[];
    count: number;
  }>({
    queryKey: ['/api/admin/customer-imports'],
  });

  // Fetch invoice processing logs
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<{
    logs: any[];
    count: number;
  }>({
    queryKey: ['/api/admin/invoice-logs'],
  });

  // Fetch estimate processing logs
  const { data: estimates, isLoading: estimatesLoading, refetch: refetchEstimates} = useQuery<{
    logs: any[];
    count: number;
  }>({
    queryKey: ['/api/admin/estimate-logs'],
  });

  const handleRefresh = () => {
    refetchImports();
    refetchInvoices();
    refetchEstimates();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      completed: { variant: 'default', icon: CheckCircle2, label: 'Completed' },
      processing: { variant: 'secondary', icon: Clock, label: 'Processing' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Failed' },
      matched: { variant: 'outline', icon: CheckCircle2, label: 'Matched' },
      parsed: { variant: 'secondary', icon: FileText, label: 'Parsed' },
    };

    const config = statusConfig[status] || { variant: 'outline', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="heading-webhook-logs">
                Webhook Logs
              </h1>
              <p className="text-muted-foreground">
                Monitor ServiceTitan data imports and webhook processing status
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                Customer Imports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{imports?.count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total XLSX imports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Invoice Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices?.count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Invoices processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                Estimate Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimates?.count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimates processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer-imports" data-testid="tab-imports">
              Customer Imports
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              Invoice Processing
            </TabsTrigger>
            <TabsTrigger value="estimates" data-testid="tab-estimates">
              Estimate Processing
            </TabsTrigger>
          </TabsList>

          {/* Customer Imports Tab */}
          <TabsContent value="customer-imports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>XLSX Customer Data Imports</CardTitle>
                <CardDescription>
                  Mailgun webhook processing of hourly ServiceTitan customer exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" data-testid={`skeleton-import-${i}`} />
                    ))}
                  </div>
                ) : imports?.imports && imports.imports.length > 0 ? (
                  <div className="space-y-4">
                    {imports.imports.map((imp: any) => (
                      <div
                        key={imp.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition"
                        data-testid={`import-${imp.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{imp.fileName}</span>
                              {getStatusBadge(imp.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {imp.startedAt && formatDistanceToNow(new Date(imp.startedAt), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {imp.customersImported?.toLocaleString()} customers
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {imp.processingTime ? `${(imp.processingTime / 1000).toFixed(1)}s` : '—'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">Total Rows</div>
                            <div className="font-medium">{imp.totalRows?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Contacts</div>
                            <div className="font-medium">{imp.contactsImported?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Errors</div>
                            <div className="font-medium">{imp.errors || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Source</div>
                            <div className="font-medium capitalize">{imp.importSource}</div>
                          </div>
                        </div>

                        {imp.errorMessage && (
                          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                            {imp.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No customer imports found</p>
                    <p className="text-sm mt-1">Imports will appear here when Mailgun webhooks receive XLSX files</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Processing Tab */}
          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice PDF Processing</CardTitle>
                <CardDescription>
                  ServiceTitan invoice emails processed for review request campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" data-testid={`skeleton-invoice-${i}`} />
                    ))}
                  </div>
                ) : invoices?.logs && invoices.logs.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.logs.map((log: any) => (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition"
                        data-testid={`invoice-${log.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{log.emailSubject || 'Invoice Email'}</span>
                              {getStatusBadge(log.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              From: {log.emailFrom || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.receivedAt && formatDistanceToNow(new Date(log.receivedAt), { addSuffix: true })}
                            </div>
                          </div>
                          {log.totalAmount && (
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${(log.totalAmount / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">Invoice total</div>
                            </div>
                          )}
                        </div>

                        {log.customerName && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Customer:</span>{' '}
                            <span className="font-medium">{log.customerName}</span>
                          </div>
                        )}

                        {log.errorMessage && (
                          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No invoice processing logs found</p>
                    <p className="text-sm mt-1">Logs will appear when ServiceTitan invoice emails are received</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estimate Processing Tab */}
          <TabsContent value="estimates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estimate PDF Processing</CardTitle>
                <CardDescription>
                  ServiceTitan estimate emails processed for quote follow-up campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estimatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" data-testid={`skeleton-estimate-${i}`} />
                    ))}
                  </div>
                ) : estimates?.logs && estimates.logs.length > 0 ? (
                  <div className="space-y-4">
                    {estimates.logs.map((log: any) => (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition"
                        data-testid={`estimate-${log.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{log.emailSubject || 'Estimate Email'}</span>
                              {getStatusBadge(log.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              From: {log.emailFrom || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.receivedAt && formatDistanceToNow(new Date(log.receivedAt), { addSuffix: true })}
                            </div>
                          </div>
                          {log.totalAmount && (
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${(log.totalAmount / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">Estimate total</div>
                            </div>
                          )}
                        </div>

                        {log.customerName && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Customer:</span>{' '}
                            <span className="font-medium">{log.customerName}</span>
                          </div>
                        )}

                        {log.errorMessage && (
                          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No estimate processing logs found</p>
                    <p className="text-sm mt-1">Logs will appear when ServiceTitan estimate emails are received</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
