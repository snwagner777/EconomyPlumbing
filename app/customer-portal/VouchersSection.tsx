'use client';

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Calendar, CheckCircle, AlertCircle, XCircle, Ticket } from "lucide-react";
import { format } from "date-fns";

interface VoucherData {
  activeCount: number;
  totalValue: number;
  totalValueFormatted: string;
  vouchers: Array<{
    id: string;
    code: string;
    qrCode: string;
    discountAmount: number;
    minimumJobAmount: number;
    voucherType: string;
    customerName: string;
    status: string;
    expiresAt: Date;
    redeemedAt?: Date | null;
    redeemedJobNumber?: string | null;
    createdAt: Date;
  }>;
}

export function VouchersSection({ customerId }: { customerId: number }) {
  const { data: voucherData, isLoading } = useQuery<VoucherData>({
    queryKey: ['/api/vouchers/customer', customerId],
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!voucherData) {
    return null;
  }

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case 'referral_new_customer':
        return 'Referral Discount';
      case 'referral_reward':
        return 'Referral Reward';
      case 'promotional':
        return 'Promotional';
      default:
        return type;
    }
  };

  const getStatusBadge = (voucher: VoucherData['vouchers'][0]) => {
    if (voucher.status === 'redeemed') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Redeemed
        </Badge>
      );
    }
    if (voucher.status === 'expired') {
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    // Active
    const daysUntilExpiration = Math.floor((new Date(voucher.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 7) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expires in {daysUntilExpiration} days
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Voucher Summary Card */}
      {voucherData.activeCount > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Available Vouchers</div>
                  <div className="text-3xl font-bold text-primary">
                    {voucherData.totalValueFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {voucherData.activeCount} {voucherData.activeCount === 1 ? 'voucher' : 'vouchers'} ready to use
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 italic">
                    Vouchers have no cash value
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Ticket className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">Show QR code</div>
                <div className="text-xs text-muted-foreground">to technician</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            My Vouchers
          </CardTitle>
          <CardDescription>
            Show the QR code to your technician at time of service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {voucherData.vouchers.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium mb-2">No vouchers yet</p>
              <p className="text-muted-foreground text-sm">
                Refer a friend to get your first $25 voucher!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {voucherData.vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="border rounded-lg p-6 space-y-4"
                  data-testid={`voucher-${voucher.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          ${(voucher.discountAmount / 100).toFixed(0)} Off
                        </h3>
                        {getStatusBadge(voucher)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getVoucherTypeLabel(voucher.voucherType)}
                          </Badge>
                        </div>
                        <div>Code: <span className="font-mono font-semibold">{voucher.code}</span></div>
                        <div>Minimum service: ${(voucher.minimumJobAmount / 100).toFixed(0)}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {voucher.status === 'redeemed' ? (
                            <span>Redeemed {voucher.redeemedAt ? format(new Date(voucher.redeemedAt), 'MMM d, yyyy') : ''}</span>
                          ) : voucher.status === 'expired' ? (
                            <span>Expired {format(new Date(voucher.expiresAt), 'MMM d, yyyy')}</span>
                          ) : (
                            <span>Expires {format(new Date(voucher.expiresAt), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                        {voucher.redeemedJobNumber && (
                          <div className="text-xs">Job #{voucher.redeemedJobNumber}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* QR Code */}
                    {voucher.status === 'active' && (
                      <div className="flex-shrink-0">
                        <div className="bg-white p-2 rounded-lg border">
                          <img
                            src={voucher.qrCode}
                            alt={`QR code for voucher ${voucher.code}`}
                            className="w-32 h-32"
                            data-testid={`qr-code-${voucher.id}`}
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Scan to redeem
                        </p>
                      </div>
                    )}
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
