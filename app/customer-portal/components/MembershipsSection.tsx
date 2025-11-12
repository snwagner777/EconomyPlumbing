/**
 * Memberships Section Component
 * 
 * Displays customer's active and expired memberships with benefits
 * Simple, lightweight component that plugs into existing AuthenticatedPortal
 */

'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Calendar, DollarSign, Gift, AlertCircle, ShoppingCart, Loader2 } from "lucide-react";
import { useCustomerMemberships } from "../hooks/useCustomerMemberships";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { CustomerMembership } from "../hooks/useCustomerMemberships";

interface MembershipType {
  id: number;
  name: string;
  description: string;
  discounts: any[];
  recurringServices: any[];
  billingOptions: Array<{
    id: number;
    name: string;
    billingFrequency: string;
    initialBillingDelay: number;
  }>;
}

export function MembershipsSection() {
  const { data, isLoading, error } = useCustomerMemberships();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipType | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  // Fetch available membership types from ServiceTitan
  const { data: membershipTypesData, isLoading: loadingTypes } = useQuery<{ success: boolean; membershipTypes: MembershipType[] }>({
    queryKey: ['/api/memberships/types', { includeDetails: true }],
    enabled: showPurchaseModal, // Only fetch when modal opens
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle>Memberships</CardTitle>
          </div>
          <CardDescription>Your VIP membership status and benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Unable to load membership information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { memberships } = data || { memberships: { active: [], expired: [], other: [] } };
  const hasAnyMemberships = memberships.active.length > 0 || memberships.expired.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>VIP Memberships</CardTitle>
              <CardDescription>
                {hasAnyMemberships 
                  ? 'Your membership status and exclusive benefits'
                  : 'Join our VIP membership program for exclusive benefits'
                }
              </CardDescription>
            </div>
          </div>
          {!hasAnyMemberships && (
            <Button 
              onClick={() => setShowPurchaseModal(true)}
              data-testid="button-join-membership"
            >
              <Crown className="w-4 h-4 mr-2" />
              Join Now
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Memberships */}
        {memberships.active.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-primary">Active Memberships</h3>
            {memberships.active.map((membership) => (
              <MembershipCard key={membership.id} membership={membership} />
            ))}
          </div>
        )}

        {/* Expired Memberships */}
        {memberships.expired.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Expired Memberships</h3>
            {memberships.expired.map((membership) => (
              <MembershipCard key={membership.id} membership={membership} isExpired />
            ))}
          </div>
        )}

        {/* No Memberships */}
        {!hasAnyMemberships && (
          <div className="text-center py-8 space-y-4">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <p className="font-medium mb-1">No Active Memberships</p>
              <p className="text-sm text-muted-foreground mb-4">
                Join our VIP program to enjoy priority scheduling, exclusive discounts, and peace of mind.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Purchase Membership Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase VIP Membership</DialogTitle>
            <DialogDescription>
              Choose a membership plan for your property. Your membership benefits will activate immediately after purchase.
            </DialogDescription>
          </DialogHeader>

          {loadingTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {membershipTypesData?.membershipTypes.map((membershipType) => (
                <Card key={membershipType.id} className="p-4 hover-elevate">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{membershipType.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{membershipType.description}</p>
                      
                      {/* Benefits Preview */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {membershipType.discounts.length > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{membershipType.discounts.length} Discount{membershipType.discounts.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {membershipType.recurringServices.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            <span>{membershipType.recurringServices.length} Service{membershipType.recurringServices.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setSelectedMembership(membershipType);
                        handlePurchase(membershipType);
                      }}
                      disabled={purchasing}
                      data-testid={`button-purchase-${membershipType.id}`}
                    >
                      {purchasing && selectedMembership?.id === membershipType.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );

  async function handlePurchase(membershipType: MembershipType) {
    setPurchasing(true);
    try {
      const response = await fetch('/api/customer-portal/membership-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTypeId: membershipType.id,
          membershipTypeName: membershipType.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setPurchasing(false);
    }
  }
}

function MembershipCard({ membership, isExpired = false }: { membership: CustomerMembership; isExpired?: boolean }) {
  const startDate = new Date(membership.from);
  const endDate = membership.to ? new Date(membership.to) : null;
  const daysUntilExpiry = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div 
      className={`p-4 rounded-lg border ${isExpired ? 'bg-muted/30 border-muted' : 'bg-primary/5 border-primary/20'}`}
      data-testid={`membership-${membership.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{membership.membershipTypeName}</h4>
            <Badge variant={isExpired ? 'outline' : 'default'} data-testid={`badge-status-${membership.id}`}>
              {membership.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Started {startDate.toLocaleDateString()}
            </span>
            {endDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {isExpired ? 'Expired' : 'Expires'} {endDate.toLocaleDateString()}
              </span>
            )}
            {!isExpired && !endDate && (
              <span className="text-primary font-medium">Ongoing</span>
            )}
          </div>
        </div>
        {!isExpired && (
          <Button variant="outline" size="sm" data-testid={`button-renew-${membership.id}`}>
            Renew
          </Button>
        )}
      </div>

      {/* Benefits Preview */}
      {membership.benefits && !isExpired && (
        <div className="flex gap-4 mt-3 pt-3 border-t text-xs">
          {membership.benefits.discounts.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-3 h-3 text-primary" />
              <span>{membership.benefits.discounts.length} Discount{membership.benefits.discounts.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {membership.benefits.recurringServices.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gift className="w-3 h-3 text-primary" />
              <span>{membership.benefits.recurringServices.length} Service{membership.benefits.recurringServices.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Expiry Warning */}
      {!isExpired && daysUntilExpiry && daysUntilExpiry < 30 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
