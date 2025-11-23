'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoiceDetail } from '../hooks/useDocuments';
import type { Invoice } from '../types';

interface InvoiceViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number | null;
}

export function InvoiceViewerModal({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceViewerModalProps) {
  const { data: invoice, isLoading, error } = useInvoiceDetail(invoiceId);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setDisplayError(error instanceof Error ? error.message : 'Failed to load invoice');
    }
  }, [error]);

  if (!invoiceId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-viewer">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Invoice #{invoice?.number || invoiceId}
          </DialogTitle>
          <DialogDescription>
            {invoice?.date ? new Date(invoice.date).toLocaleDateString() : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {!isLoading && invoice && !displayError && (
          <div className="space-y-6 py-4">
            {/* Invoice Header Info */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-semibold">{invoice.number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{invoice.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div>
              <h3 className="font-semibold mb-3">Line Items</h3>
              <div className="space-y-4">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 border-b pb-4">
                      {/* Item Image */}
                      {item.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.skuName || 'Item'}
                            className="w-20 h-20 object-cover rounded border"
                            data-testid={`img-invoice-item-${idx}`}
                          />
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.skuName || 'Item'}</p>
                        
                        {/* Render HTML description using ReactMarkdown */}
                        {item.description && (
                          <div className="text-sm text-muted-foreground prose prose-sm max-w-none mt-1">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                              {item.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {Number(item.quantity || 1).toFixed(0)}
                          {item.price > 0 && ` × $${Number(item.price).toFixed(2)}`}
                        </p>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${Number(item.total || item.amount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No line items</p>
                )}
              </div>
            </div>

            {/* Invoice Totals */}
            <div className="space-y-2 border-t pt-4 bg-muted/50 p-4 rounded">
              {invoice.subtotal && (
                <div className="flex justify-between">
                  <p>Subtotal:</p>
                  <p>${Number(invoice.subtotal).toFixed(2)}</p>
                </div>
              )}
              {invoice.tax && (
                <div className="flex justify-between">
                  <p>Tax:</p>
                  <p>${Number(invoice.tax).toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <p>Total:</p>
                <p>${Number(invoice.total || 0).toFixed(2)}</p>
              </div>
              {invoice.balance && invoice.balance !== 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <p>Balance Due:</p>
                  <p>${Number(invoice.balance).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
