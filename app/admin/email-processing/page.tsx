'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, RefreshCcw, AlertCircle } from 'lucide-react';

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

export default function EmailProcessingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'estimates'>('invoices');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Email Processing</h1>
        <p className="text-muted-foreground mb-6">
          Monitor invoice and estimate PDF webhook logs from ServiceTitan
        </p>
      </div>

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
