'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Download, Eye, Calendar, DollarSign, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useInvoices,
  useEstimates,
  type Invoice,
  type Estimate,
} from '../index';

interface DocumentsSectionProps {
  onViewInvoice: (invoice: Invoice) => void;
  onViewEstimate: (estimate: Estimate) => void;
  onDownloadInvoicePDF: (invoice: Invoice) => void;
  onDownloadEstimatePDF: (estimate: Estimate) => void;
}

export function DocumentsSection({
  onViewInvoice,
  onViewEstimate,
  onDownloadInvoicePDF,
  onDownloadEstimatePDF,
}: DocumentsSectionProps) {
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [estimateStatusFilter, setEstimateStatusFilter] = useState<string>('all');

  // Fetch invoices
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
  } = useInvoices({
    status: invoiceStatusFilter === 'all' ? undefined : invoiceStatusFilter,
    pageSize: 50,
  });

  // Fetch estimates
  const {
    data: estimatesData,
    isLoading: estimatesLoading,
  } = useEstimates({
    status: estimateStatusFilter === 'all' ? undefined : estimateStatusFilter,
    includeInactive: estimateStatusFilter === 'Dismissed',
    pageSize: 50,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') return 'default';
    if (statusLower === 'unpaid' || statusLower === 'open') return 'secondary';
    if (statusLower === 'sold') return 'default';
    if (statusLower === 'dismissed') return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documents
          </CardTitle>
          <CardDescription>
            View and download your invoices and estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invoices" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoices" data-testid="tab-invoices">
                Invoices
                {invoicesData && (
                  <Badge variant="secondary" className="ml-2">
                    {invoicesData.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="estimates" data-testid="tab-estimates">
                Estimates
                {estimatesData && (
                  <Badge variant="secondary" className="ml-2">
                    {estimatesData.total}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* INVOICES TAB */}
            <TabsContent value="invoices" className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="filter-invoice-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Invoices</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partial">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading State */}
              {invoicesLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!invoicesLoading && (!invoicesData || invoicesData.data.length === 0) && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No invoices found</p>
                  </CardContent>
                </Card>
              )}

              {/* Invoice List */}
              {!invoicesLoading && invoicesData && invoicesData.data.length > 0 && (
                <div className="space-y-3">
                  {invoicesData.data.map(invoice => (
                    <Card key={invoice.id} className="hover-elevate" data-testid={`invoice-card-${invoice.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">
                                {invoice.number}
                              </h4>
                              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>

                            {invoice.summary && (
                              <p className="text-sm text-muted-foreground">
                                {invoice.summary}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(invoice.date)}
                              </div>
                              {invoice.jobNumber && (
                                <div>Job #{invoice.jobNumber}</div>
                              )}
                              <div className="flex items-center gap-1 font-semibold text-foreground">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(invoice.total)}
                              </div>
                              {invoice.balance > 0 && (
                                <div className="text-amber-600 dark:text-amber-500">
                                  Balance: {formatCurrency(invoice.balance)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewInvoice(invoice)}
                              data-testid={`button-view-invoice-${invoice.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadInvoicePDF(invoice)}
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ESTIMATES TAB */}
            <TabsContent value="estimates" className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={estimateStatusFilter} onValueChange={setEstimateStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="filter-estimate-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Estimates</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading State */}
              {estimatesLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!estimatesLoading && (!estimatesData || estimatesData.data.length === 0) && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No estimates found</p>
                  </CardContent>
                </Card>
              )}

              {/* Estimate List */}
              {!estimatesLoading && estimatesData && estimatesData.data.length > 0 && (
                <div className="space-y-3">
                  {estimatesData.data.map(estimate => (
                    <Card key={estimate.id} className="hover-elevate" data-testid={`estimate-card-${estimate.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">
                                {estimate.estimateNumber}
                              </h4>
                              <Badge variant={getStatusBadgeVariant(estimate.status)}>
                                {estimate.status}
                              </Badge>
                            </div>

                            {estimate.name && estimate.name !== estimate.estimateNumber && (
                              <p className="text-sm text-muted-foreground">
                                {estimate.name}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(estimate.createdOn)}
                              </div>
                              {estimate.jobNumber && (
                                <div>Job #{estimate.jobNumber}</div>
                              )}
                              <div className="flex items-center gap-1 font-semibold text-foreground">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(estimate.total)}
                              </div>
                              {estimate.expiresOn && (
                                <div className="text-amber-600 dark:text-amber-500">
                                  Expires: {formatDate(estimate.expiresOn)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewEstimate(estimate)}
                              data-testid={`button-view-estimate-${estimate.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadEstimatePDF(estimate)}
                              data-testid={`button-download-estimate-${estimate.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
