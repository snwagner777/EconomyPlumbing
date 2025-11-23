'use client';

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Share2, CheckCircle, Clock, XCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { ReferralModal } from "@/components/ReferralModal";

interface ReferralsData {
  referrals: Array<{
    id: string;
    status: string;
    creditAmount: number;
    referrerCustomerId: number | null;
    refereeCustomerId: number | null;
    creditedAt?: Date | null;
  }>;
}

interface ReferralLinkData {
  code: string;
  url: string;
  clicks: number;
  conversions: number;
}

interface ReferralsSectionProps {
  customerId: number;
  referralsData?: ReferralsData;
  referralLinkData?: ReferralLinkData;
  onOpenReferralModal?: () => void;
}

export function ReferralsSection({
  customerId,
  referralsData,
  referralLinkData,
  onOpenReferralModal,
}: ReferralsSectionProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const referrals = referralsData?.referrals || [];
  const successfulReferrals = referrals.filter((r) => r.status === 'credited');
  const pendingReferrals = referrals.filter((r) => r.status === 'pending');
  const totalRewardAmount = successfulReferrals.reduce((sum, r) => sum + (r.creditAmount || 0), 0);

  const handleCopyCode = async () => {
    if (referralLinkData?.code) {
      await navigator.clipboard.writeText(referralLinkData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    if (referralLinkData?.url) {
      await navigator.clipboard.writeText(referralLinkData.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'credited':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Successful
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Referral Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Referrals</div>
                <div className="text-3xl font-bold text-primary">
                  {successfulReferrals.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {successfulReferrals.length === 1 ? 'successful referral' : 'successful referrals'}
                  {pendingReferrals.length > 0 && ` · ${pendingReferrals.length} pending`}
                </div>
                {totalRewardAmount > 0 && (
                  <div className="text-sm font-semibold text-primary mt-2">
                    ${(totalRewardAmount / 100).toFixed(0)} in credits earned
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={onOpenReferralModal}
              className="gap-2"
              data-testid="button-share-referral"
            >
              <Share2 className="w-4 h-4" />
              Share Referral
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link Card */}
      {referralLinkData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share your unique code with friends to earn $25 vouchers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLinkData.code}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="input-referral-code"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="gap-2 whitespace-nowrap"
                  data-testid="button-copy-code"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLinkData.url}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 truncate"
                  data-testid="input-referral-url"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="gap-2 whitespace-nowrap"
                  data-testid="button-copy-url"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Link Clicks</div>
                <div className="text-2xl font-bold text-primary">{referralLinkData.clicks}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Conversions</div>
                <div className="text-2xl font-bold text-primary">{referralLinkData.conversions}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referrals List */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referral History
            </CardTitle>
            <CardDescription>
              Track your referrals and earned credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`referral-${referral.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          ${(referral.creditAmount / 100).toFixed(0)} Credit
                        </h3>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          {referral.status === 'credited'
                            ? `Credited on ${referral.creditedAt ? new Date(referral.creditedAt).toLocaleDateString() : 'N/A'}`
                            : 'Awaiting customer service completion'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {referrals.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium mb-2">No referrals yet</p>
              <p className="text-muted-foreground text-sm mb-6">
                Share your referral link with friends and earn $25 vouchers for each successful referral
              </p>
              <Button onClick={onOpenReferralModal} data-testid="button-start-referring">
                Start Referring
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
