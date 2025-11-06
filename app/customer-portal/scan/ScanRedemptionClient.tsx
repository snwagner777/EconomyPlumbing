'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  DollarSign, 
  User, 
  Calendar,
  Gift,
  AlertCircle
} from 'lucide-react';

interface VoucherDetails {
  id: string;
  code: string;
  voucherType: string;
  customerName: string;
  discountAmount: number;
  minimumJobAmount: number;
  status: string;
  expiresAt: string;
  redeemedAt?: string | null;
}

export function ScanRedemptionClient() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [code, setCode] = useState(codeFromUrl || '');
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [jobAmount, setJobAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Auto-load voucher if code is in URL
  useEffect(() => {
    if (codeFromUrl) {
      loadVoucher(codeFromUrl);
    }
  }, [codeFromUrl]);

  const loadVoucher = async (voucherCode: string) => {
    if (!voucherCode.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    setLoading(true);
    setError('');
    setVoucher(null);

    try {
      const response = await fetch(`/api/vouchers/lookup?code=${encodeURIComponent(voucherCode)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load voucher');
      }

      setVoucher(data.voucher);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = () => {
    if (!voucher) return;

    const amount = parseFloat(jobAmount);
    if (isNaN(amount) || amount < voucher.minimumJobAmount / 100) {
      setError(`Job amount must be at least $${(voucher.minimumJobAmount / 100).toFixed(2)}`);
      return;
    }

    setError('');
    setShowConfirmation(true);
  };

  const handleConfirmRedeem = async () => {
    if (!voucher) return;

    const amount = parseFloat(jobAmount);
    setRedeeming(true);
    setError('');
    setShowConfirmation(false);

    try {
      const response = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucher.code,
          jobAmount: Math.round(amount * 100), // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem voucher');
      }

      setRedeemed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  if (redeemed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">Voucher Redeemed!</CardTitle>
            <CardDescription>
              The voucher has been successfully applied. Customer has been notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm text-muted-foreground mb-1">Discount Applied</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                ${(voucher!.discountAmount / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Customer: {voucher!.customerName}</p>
              <p>Code: {voucher!.code}</p>
              <p className="text-xs italic mt-2">Voucher has no cash value</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Redeem Voucher</CardTitle>
          <CardDescription>
            Scan the QR code or enter the voucher code manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!voucher && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="REF-XXXXXXXX"
                    className="font-mono"
                    data-testid="input-voucher-code"
                  />
                  <Button
                    onClick={() => loadVoucher(code)}
                    disabled={loading || !code.trim()}
                    data-testid="button-lookup-voucher"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {voucher && voucher.status === 'active' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="font-medium">{voucher.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-xl font-bold text-primary">
                    ${(voucher.discountAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Minimum Job</span>
                  <span className="font-medium">${(voucher.minimumJobAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm">
                    {new Date(voucher.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobAmount">Job Amount ($)</Label>
                <Input
                  id="jobAmount"
                  type="number"
                  step="0.01"
                  min={voucher.minimumJobAmount / 100}
                  value={jobAmount}
                  onChange={(e) => setJobAmount(e.target.value)}
                  placeholder={(voucher.minimumJobAmount / 100).toFixed(2)}
                  data-testid="input-job-amount"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least ${(voucher.minimumJobAmount / 100).toFixed(2)}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground italic">
                Voucher has no cash value and cannot be exchanged for cash
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVoucher(null);
                    setCode('');
                    setJobAmount('');
                    setError('');
                  }}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeemClick}
                  disabled={redeeming || !jobAmount}
                  className="flex-1"
                  data-testid="button-redeem"
                >
                  {redeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Redeem Voucher
                    </>
                  )}
                </Button>
              </div>

              {/* Confirmation Dialog */}
              {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <Card className="max-w-sm w-full">
                    <CardHeader>
                      <CardTitle className="text-lg">Confirm Redemption</CardTitle>
                      <CardDescription>
                        Are you sure you want to redeem this voucher?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium">{voucher.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-bold text-primary">
                            ${(voucher.discountAmount / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Job Amount:</span>
                          <span className="font-medium">${jobAmount}</span>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Customer will receive an email confirmation
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowConfirmation(false)}
                          className="flex-1"
                          disabled={redeeming}
                          data-testid="button-confirm-cancel"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmRedeem}
                          disabled={redeeming}
                          className="flex-1"
                          data-testid="button-confirm-redeem"
                        >
                          {redeeming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {voucher && voucher.status === 'redeemed' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center space-y-3">
                <XCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">Already Redeemed</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This voucher was already redeemed on {voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleDateString() : 'a previous date'}.
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{voucher.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Value:</span>
                  <span className="font-medium">${(voucher.discountAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono text-xs">{voucher.code}</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setVoucher(null);
                  setCode('');
                  setError('');
                }}
                className="w-full"
                data-testid="button-try-another"
              >
                Scan Another Voucher
              </Button>
            </div>
          )}

          {voucher && voucher.status === 'expired' && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-3">
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <div>
                  <p className="font-semibold">Voucher Expired</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This voucher expired on {new Date(voucher.expiresAt).toLocaleDateString()}.
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{voucher.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Value:</span>
                  <span className="font-medium">${(voucher.discountAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono text-xs">{voucher.code}</span>
                </div>
              </div>
              
              <p className="text-xs text-center text-muted-foreground italic">
                Contact customer service for assistance
              </p>
              
              <Button
                variant="outline"
                onClick={() => {
                  setVoucher(null);
                  setCode('');
                  setError('');
                }}
                className="w-full"
                data-testid="button-try-another"
              >
                Scan Another Voucher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
