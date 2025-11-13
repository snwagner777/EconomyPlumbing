'use client';

import { Download, Loader2, X, Calendar, DollarSign, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoiceDetail, type Invoice } from '../index';
import { format } from 'date-fns';

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onDownloadPDF: (invoice: Invoice) => void;
  isDownloading?: boolean;
}

export function InvoiceDetailModal({
  open,
  onOpenChange,
  invoice,
  onDownloadPDF,
  isDownloading = false,
}: InvoiceDetailModalProps) {
  const {
    data: invoiceDetail,
    isLoading,
  } = useInvoiceDetail(invoice?.id || null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-detail">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {invoice?.number || 'Invoice Details'}
              </DialogTitle>
              <DialogDescription>
                {invoice?.summary || 'View itemized invoice breakdown'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => invoice && onDownloadPDF(invoice)}
              disabled={isDownloading}
              data-testid="button-download-invoice-pdf"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {!isLoading && invoiceDetail && (
          <div className="space-y-6 py-4">
            {/* Invoice Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                    <p className="font-semibold">{invoiceDetail.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge>{invoiceDetail.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(invoiceDetail.date)}</span>
                    </div>
                  </div>
                  {invoiceDetail.dueDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(invoiceDetail.dueDate)}</span>
                      </div>
                    </div>
                  )}
                  {invoiceDetail.jobNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Job Number</p>
                      <p className="font-semibold">#{invoiceDetail.jobNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Line Items
              </h3>

              {invoiceDetail.items && invoiceDetail.items.length > 0 ? (
                <div className="space-y-2">
                  {invoiceDetail.items.map((item, index) => (
                    <Card key={item.id || index}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{item.type}</Badge>
                              <p className="font-medium">{item.skuName}</p>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Qty: {item.quantity}</span>
                              <span>× {formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.total)}</p>
                            {item.memberPrice && item.memberPrice < item.price && (
                              <p className="text-xs text-green-600 dark:text-green-500">
                                Member Price: {formatCurrency(item.memberPrice * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No line items available
                </p>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoiceDetail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoiceDetail.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrency(invoiceDetail.total)}
                </span>
              </div>
              {invoiceDetail.balance > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-500 font-semibold">
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoiceDetail.balance)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
