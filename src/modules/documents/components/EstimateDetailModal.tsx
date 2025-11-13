'use client';

import { Download, Loader2, Calendar, DollarSign, FileText, CheckCircle } from 'lucide-react';
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
import { useEstimateDetail, type Estimate } from '../index';
import { format } from 'date-fns';

interface EstimateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: Estimate | null;
  onDownloadPDF: (estimate: Estimate) => void;
  onAcceptEstimate?: (estimate: Estimate) => void;
  onScheduleEstimate?: (estimateId: number, soldHours: number) => void;
  isDownloading?: boolean;
  isAccepting?: boolean;
}

export function EstimateDetailModal({
  open,
  onOpenChange,
  estimate,
  onDownloadPDF,
  onAcceptEstimate,
  onScheduleEstimate,
  isDownloading = false,
  isAccepting = false,
}: EstimateDetailModalProps) {
  const {
    data: estimateDetail,
    isLoading,
  } = useEstimateDetail(estimate?.id || null);

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
  const canSchedule = estimateDetail && estimateDetail.soldHours >= 2; // Minimum 2 hours for scheduling

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-estimate-detail">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {estimate?.estimateNumber || 'Estimate Details'}
              </DialogTitle>
              <DialogDescription>
                {estimate?.name || estimate?.summary || 'View itemized estimate breakdown'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => estimate && onDownloadPDF(estimate)}
              disabled={isDownloading}
              data-testid="button-download-estimate-pdf"
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

            {/* Line Items */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Line Items
              </h3>

              {estimateDetail.items && estimateDetail.items.length > 0 ? (
                <div className="space-y-2">
                  {estimateDetail.items.map((item, index) => (
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
                              {item.soldHours && (
                                <span>({item.soldHours}h per unit)</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.total)}</p>
                            {item.memberPrice && item.memberPrice < item.price && (
                              <p className="text-xs text-green-600 dark:text-green-500">
                                Member: {formatCurrency(item.memberPrice * item.quantity)}
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
  );
}
