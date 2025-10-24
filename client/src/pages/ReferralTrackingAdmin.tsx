import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, Users, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Search, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

interface Referral {
  id: string;
  referrerCustomerId: number;
  referrerName: string | null;
  referrerEmail: string | null;
  referralCode: string | null;
  refereeName: string;
  refereePhone: string;
  refereeEmail: string | null;
  refereeCustomerId: number | null;
  status: string;
  jobId: number | null;
  jobAmount: number | null;
  creditStatus: string | null;
  creditAmount: number | null;
  creditIssuedAt: string | null;
  creditNotes: string | null;
  submittedAt: string;
  contactedAt: string | null;
  jobCompletedAt: string | null;
}

interface ReferralStats {
  total: number;
  pending: number;
  contacted: number;
  completed: number;
  credited: number;
  ineligible: number;
  totalRevenue: number;
  totalCredits: number;
}

interface ReferralData {
  referrals: Referral[];
  stats: ReferralStats;
}

export default function ReferralTrackingAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [ineligibleDialogOpen, setIneligibleDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("25.00");
  const [creditNotes, setCreditNotes] = useState("");
  const [ineligibleReason, setIneligibleReason] = useState("");

  // Fetch all referrals
  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ['/api/admin/referrals'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Credit referral mutation
  const creditMutation = useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes: string }) => {
      return await apiRequest("POST", `/api/admin/referrals/${id}/credit`, { amount, notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral credited successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      setCreditDialogOpen(false);
      setSelectedReferral(null);
      setCreditAmount("25.00");
      setCreditNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to credit referral",
        variant: "destructive"
      });
    }
  });

  // Mark ineligible mutation
  const ineligibleMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/admin/referrals/${id}/ineligible`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral marked as ineligible"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      setIneligibleDialogOpen(false);
      setSelectedReferral(null);
      setIneligibleReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark referral as ineligible",
        variant: "destructive"
      });
    }
  });

  const handleCredit = () => {
    if (!selectedReferral) return;
    const amountInCents = Math.round(parseFloat(creditAmount) * 100);
    creditMutation.mutate({
      id: selectedReferral.id,
      amount: amountInCents,
      notes: creditNotes
    });
  };

  const handleMarkIneligible = () => {
    if (!selectedReferral || !ineligibleReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason",
        variant: "destructive"
      });
      return;
    }
    ineligibleMutation.mutate({
      id: selectedReferral.id,
      reason: ineligibleReason
    });
  };

  // Filter referrals based on search term
  const filteredReferrals = data?.referrals.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.refereeName.toLowerCase().includes(term) ||
      r.refereePhone.includes(term) ||
      r.refereeEmail?.toLowerCase().includes(term) ||
      r.referrerName?.toLowerCase().includes(term) ||
      r.referralCode?.toLowerCase().includes(term)
    );
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "outline" | "secondary"> = {
      pending: "outline",
      contacted: "secondary",
      completed: "default",
      ineligible: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getCreditStatusBadge = (creditStatus: string | null) => {
    if (!creditStatus) return <Badge variant="outline">No Credit</Badge>;
    const variants: Record<string, "default" | "outline" | "secondary"> = {
      credited: "default",
      pending: "outline",
      ineligible: "outline"
    };
    return <Badge variant={variants[creditStatus] || "outline"}>{creditStatus}</Badge>;
  };

  return (
    <>
      <SEOHead
        title="Referral Tracking Admin | Economy Plumbing"
        description="Manage customer referrals and credits"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Referral Tracking</h1>
              <p className="text-muted-foreground">
                Manage customer referrals, track status, and issue credits
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/admin"}
              data-testid="button-back-to-admin"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Referrals
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="stat-total-referrals">
                    {data?.stats.total || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  All time submissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Credited
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="stat-credited">
                    {data?.stats.credited || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Referrers paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue Generated
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="stat-revenue">
                    ${((data?.stats.totalRevenue || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  From completed referral jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Credits
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="stat-credits">
                    ${((data?.stats.totalCredits || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Paid to referrers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>Breakdown by referral status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">{data?.stats.pending || 0}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Contacted</p>
                  <p className="text-2xl font-bold">{data?.stats.contacted || 0}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-2xl font-bold">{data?.stats.completed || 0}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Ineligible</p>
                  <p className="text-2xl font-bold">{data?.stats.ineligible || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Referrals</CardTitle>
                  <CardDescription>View and manage all customer referrals</CardDescription>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search referrals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-referrals"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No referrals found matching your search" : "No referrals submitted yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`referral-${referral.id}`}
                    >
                      <div className="grid gap-4 md:grid-cols-4">
                        {/* Referrer Info */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Referrer</p>
                          <p className="font-semibold">{referral.referrerName || `Customer #${referral.referrerCustomerId}`}</p>
                          {referral.referralCode && (
                            <p className="text-xs text-muted-foreground">Code: {referral.referralCode}</p>
                          )}
                        </div>

                        {/* Referee Info */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Referee</p>
                          <p className="font-semibold">{referral.refereeName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{referral.refereePhone}</p>
                          </div>
                          {referral.refereeEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{referral.refereeEmail}</p>
                            </div>
                          )}
                        </div>

                        {/* Status & Dates */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {getStatusBadge(referral.status)}
                            {getCreditStatusBadge(referral.creditStatus)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted {format(new Date(referral.submittedAt), 'MMM d, yyyy')}
                          </p>
                          {referral.jobCompletedAt && (
                            <p className="text-xs text-muted-foreground">
                              Job completed {format(new Date(referral.jobCompletedAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>

                        {/* Actions & Amount */}
                        <div className="flex flex-col justify-between">
                          {referral.jobAmount && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Job Amount</p>
                              <p className="text-lg font-bold">${(referral.jobAmount / 100).toFixed(2)}</p>
                            </div>
                          )}
                          {referral.creditAmount && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Credit</p>
                              <p className="text-lg font-bold text-green-600">${(referral.creditAmount / 100).toFixed(2)}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {referral.creditStatus !== 'credited' && referral.status !== 'ineligible' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReferral(referral);
                                    setCreditDialogOpen(true);
                                  }}
                                  data-testid={`button-credit-${referral.id}`}
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Credit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReferral(referral);
                                    setIneligibleDialogOpen(true);
                                  }}
                                  data-testid={`button-ineligible-${referral.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Ineligible
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {referral.creditNotes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {referral.creditNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>

      {/* Credit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent data-testid="dialog-credit-referral">
          <DialogHeader>
            <DialogTitle>Credit Referral</DialogTitle>
            <DialogDescription>
              Issue credit to {selectedReferral?.referrerName || 'referrer'} for successful referral
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="credit-amount">Credit Amount ($)</Label>
              <Input
                id="credit-amount"
                type="number"
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                data-testid="input-credit-amount"
              />
            </div>
            <div>
              <Label htmlFor="credit-notes">Notes (Optional)</Label>
              <Textarea
                id="credit-notes"
                placeholder="Add any notes about this credit..."
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                data-testid="input-credit-notes"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreditDialogOpen(false)} data-testid="button-cancel-credit">
                Cancel
              </Button>
              <Button
                onClick={handleCredit}
                disabled={creditMutation.isPending}
                data-testid="button-confirm-credit"
              >
                {creditMutation.isPending ? "Processing..." : "Issue Credit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ineligible Dialog */}
      <Dialog open={ineligibleDialogOpen} onOpenChange={setIneligibleDialogOpen}>
        <DialogContent data-testid="dialog-ineligible-referral">
          <DialogHeader>
            <DialogTitle>Mark as Ineligible</DialogTitle>
            <DialogDescription>
              Mark this referral as ineligible and provide a reason
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ineligible-reason">Reason *</Label>
              <Textarea
                id="ineligible-reason"
                placeholder="e.g., Referee was already a customer, job amount too low, etc."
                value={ineligibleReason}
                onChange={(e) => setIneligibleReason(e.target.value)}
                data-testid="input-ineligible-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIneligibleDialogOpen(false)} data-testid="button-cancel-ineligible">
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleMarkIneligible}
                disabled={ineligibleMutation.isPending}
                data-testid="button-confirm-ineligible"
              >
                {ineligibleMutation.isPending ? "Processing..." : "Mark Ineligible"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
