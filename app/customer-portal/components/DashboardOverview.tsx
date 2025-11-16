/**
 * Dashboard Overview
 * Account-level summary with quick stats and actions
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Gift, Users, Calendar, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface DashboardTile {
  title: string;
  icon: React.ElementType;
  value: string | number;
  subtitle?: string;
  badge?: string;
  alert?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DashboardOverviewProps {
  memberships?: {
    activeCount: number;
    nextRenewalDate?: string;
    totalValue?: number;
  };
  vouchers?: {
    activeCount: number;
    totalValue: number;
    nearestExpiry?: string;
  };
  referrals?: {
    totalSent: number;
    creditsEarned: number;
    pending: number;
  };
  quickActions?: {
    onSchedule?: () => void;
    onShareReferral?: () => void;
  };
  alerts?: Array<{
    type: 'warning' | 'info';
    message: string;
  }>;
}

export function DashboardOverview({
  memberships,
  vouchers,
  referrals,
  quickActions,
  alerts = [],
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                alert.type === 'warning'
                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}
              data-testid={`alert-${index}`}
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Memberships Tile */}
        {memberships && (
          <Card data-testid="dashboard-tile-memberships">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Crown className="w-5 h-5 text-primary" />
                {memberships.activeCount > 0 && (
                  <Badge variant="default" className="bg-primary">
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold">{memberships.activeCount}</CardTitle>
              <CardDescription>Active Membership{memberships.activeCount !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.nextRenewalDate && (
                <p className="text-sm text-muted-foreground">
                  Next renewal: {memberships.nextRenewalDate}
                </p>
              )}
              {memberships.totalValue && memberships.totalValue > 0 && (
                <p className="text-sm font-medium text-primary mt-1">
                  {formatCurrency(memberships.totalValue)}/mo value
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vouchers Tile */}
        {vouchers && (
          <Card data-testid="dashboard-tile-vouchers">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Gift className="w-5 h-5 text-primary" />
                {vouchers.activeCount > 0 && (
                  <Badge variant="default" className="bg-primary">
                    {vouchers.activeCount} Available
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold">{formatCurrency(vouchers.totalValue)}</CardTitle>
              <CardDescription>Voucher Value</CardDescription>
            </CardHeader>
            <CardContent>
              {vouchers.nearestExpiry && (
                <p className="text-sm text-muted-foreground">
                  Expires: {vouchers.nearestExpiry}
                </p>
              )}
              {vouchers.activeCount === 0 && (
                <p className="text-sm text-muted-foreground">No active vouchers</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Referrals Tile */}
        {referrals && (
          <Card data-testid="dashboard-tile-referrals">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-primary" />
                {referrals.pending > 0 && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {referrals.pending} Pending
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold">{referrals.totalSent}</CardTitle>
              <CardDescription>Referrals Sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">{formatCurrency(referrals.creditsEarned)} earned</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {quickActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.onSchedule && (
                <Button
                  variant="default"
                  onClick={quickActions.onSchedule}
                  data-testid="button-quick-schedule"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Service
                </Button>
              )}
              {quickActions.onShareReferral && (
                <Button
                  variant="outline"
                  onClick={quickActions.onShareReferral}
                  data-testid="button-quick-refer"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Refer a Friend
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
