'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, X, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInvoiceDetail, type Invoice } from '../index';
import { DocumentLineItem } from './DocumentLineItem';
import { format } from 'date-fns';

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

interface PricebookData {
  [key: string]: {
    id: number;
    type: 'Service' | 'Material' | 'Equipment';
    displayName: string;
    description: string;
    images: Array<{ url: string; description?: string }>;
  };
}

export function InvoiceDetailModal({
  open,
  onOpenChange,
  invoice,
}: InvoiceDetailModalProps) {
  const {
    data: invoiceDetail,
    isLoading,
  } = useInvoiceDetail(invoice?.id || null);

  const [pricebookData, setPricebookData] = useState<PricebookData>({});
  const [isLoadingPricebook, setIsLoadingPricebook] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pricebookError, setPricebookError] = useState<string | null>(null);

  // Fetch pricebook data when invoice detail loads
  useEffect(() => {
    if (!invoiceDetail?.items || invoiceDetail.items.length === 0) {
      return;
    }

    const fetchPricebookData = async () => {
      setIsLoadingPricebook(true);
      setPricebookError(null);
      try {
        // Deduplicate items by type-skuId key
        const uniqueItems = new Map();
        invoiceDetail.items.forEach(item => {
          const key = `${item.type}-${item.skuId}`;
          if (!uniqueItems.has(key)) {
            uniqueItems.set(key, { skuId: item.skuId, type: item.type });
          }
        });

        const response = await fetch('/api/pricebook/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: Array.from(uniqueItems.values()) }),
        });

        if (response.ok) {
          const result = await response.json();
          setPricebookData(result.data || {});
        } else {
          setPricebookError('Failed to load product images');
          console.error('Failed to fetch pricebook data');
        }
      } catch (error) {
        setPricebookError('Failed to load product images');
        console.error('Error fetching pricebook data:', error);
      } finally {
        setIsLoadingPricebook(false);
      }
    };

    fetchPricebookData();
  }, [invoiceDetail]);

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {invoice?.number || 'Invoice Details'}
            </DialogTitle>
            <DialogDescription>
              {invoice?.summary || 'View itemized invoice breakdown'}
            </DialogDescription>
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

              {/* Line Items with Images */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Line Items
                </h3>

                {pricebookError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Image Loading Error</AlertTitle>
                    <AlertDescription>{pricebookError}</AlertDescription>
                  </Alert>
                )}

                {invoiceDetail.items && invoiceDetail.items.length > 0 ? (
                  <div className="space-y-2">
                    {invoiceDetail.items.map((item, index) => (
                      <DocumentLineItem
                        key={item.id || index}
                        item={item}
                        pricebookData={pricebookData[`${item.type}-${item.skuId}`]}
                        isLoadingPricebook={isLoadingPricebook}
                        formatCurrency={formatCurrency}
                        onImageClick={setSelectedImage}
                      />
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

      {/* Image Viewer - Invoice */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0" data-testid="dialog-invoice-image-viewer">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
              data-testid="button-close-invoice-image"
            >
              <X className="w-4 h-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Product image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
