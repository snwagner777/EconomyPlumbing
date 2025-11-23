'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar, DollarSign, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEstimateDetail, type Estimate } from '../index';
import { DocumentLineItem } from './DocumentLineItem';
import { format } from 'date-fns';

interface EstimateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: Estimate | null;
  onAcceptEstimate?: (estimate: Estimate) => void;
  onScheduleEstimate?: (estimateId: number, soldHours: number) => void;
  isAccepting?: boolean;
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

export function EstimateDetailModal({
  open,
  onOpenChange,
  estimate,
  onAcceptEstimate,
  onScheduleEstimate,
  isAccepting = false,
}: EstimateDetailModalProps) {
  const {
    data: estimateDetail,
    isLoading,
  } = useEstimateDetail(estimate?.id || null);

  const [pricebookData, setPricebookData] = useState<PricebookData>({});
  const [isLoadingPricebook, setIsLoadingPricebook] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [pricebookError, setPricebookError] = useState<string | null>(null);

  // Fetch pricebook data when estimate detail loads
  useEffect(() => {
    if (!estimateDetail?.items || estimateDetail.items.length === 0) {
      return;
    }

    const fetchPricebookData = async () => {
      setIsLoadingPricebook(true);
      setPricebookError(null);
      try {
        // Deduplicate items by type-skuId key
        const uniqueItems = new Map();
        estimateDetail.items.forEach(item => {
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
  }, [estimateDetail]);

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

  const canAccept = estimate?.status === 'Open';
  const canSchedule = estimateDetail && estimateDetail.soldHours >= 2;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-estimate-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {estimate?.estimateNumber || 'Estimate Details'}
            </DialogTitle>
            <DialogDescription>
              {estimate?.name || estimate?.summary || 'View itemized estimate breakdown'}
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {!isLoading && estimateDetail && (
            <div className="space-y-6 py-4">
              {/* Estimate Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimate Number</p>
                      <p className="font-semibold">{estimateDetail.estimateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge>{estimateDetail.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Created</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(estimateDetail.createdOn)}</span>
                      </div>
                    </div>
                    {estimateDetail.expiresOn && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Expires</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDate(estimateDetail.expiresOn)}</span>
                        </div>
                      </div>
                    )}
                    {estimateDetail.jobNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Job Number</p>
                        <p className="font-semibold">#{estimateDetail.jobNumber}</p>
                      </div>
                    )}
                    {estimateDetail.soldHours > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Estimated Hours</p>
                        <p className="font-semibold">{estimateDetail.soldHours} hours</p>
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

                {estimateDetail.items && estimateDetail.items.length > 0 ? (
                  <div className="space-y-2">
                    {estimateDetail.items.map((item, index) => (
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
                  <span>{formatCurrency(estimateDetail.subtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5" />
                    {formatCurrency(estimateDetail.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isLoading && estimateDetail && (
            <DialogFooter className="gap-2">
              {canSchedule && onScheduleEstimate && (
                <Button
                  onClick={() => onScheduleEstimate(estimateDetail.id, estimateDetail.soldHours)}
                  data-testid="button-schedule-estimate"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Work
                </Button>
              )}
              {canAccept && onAcceptEstimate && (
                <Button
                  onClick={() => onAcceptEstimate(estimate!)}
                  disabled={isAccepting}
                  data-testid="button-accept-estimate"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Estimate
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer - Estimate */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0" data-testid="dialog-estimate-image-viewer">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
              data-testid="button-close-estimate-image"
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
