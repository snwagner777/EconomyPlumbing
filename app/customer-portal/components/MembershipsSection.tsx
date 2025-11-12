/**
 * Memberships Section Component
 * 
 * Displays customer's active and expired memberships with benefits
 * Simple, lightweight component that plugs into existing AuthenticatedPortal
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Calendar, DollarSign, Gift, AlertCircle } from "lucide-react";
import { useCustomerMemberships } from "../hooks/useCustomerMemberships";
import type { CustomerMembership } from "../hooks/useCustomerMemberships";

export function MembershipsSection() {
  const { data, isLoading, error } = useCustomerMemberships();

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
            <Button data-testid="button-join-membership">
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
    </Card>
  );
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
