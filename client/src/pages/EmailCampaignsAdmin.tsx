import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, CheckCircle, Clock, Phone, AlertCircle, Sparkles, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { EmailCampaign } from "@shared/schema";

type CampaignWithDetails = EmailCampaign & {
  segmentName?: string;
  memberCount?: number;
};

export default function EmailCampaignsAdmin() {
  const { toast } = useToast();
  const [trackingNumberDialog, setTrackingNumberDialog] = useState<{ open: boolean; campaign: CampaignWithDetails | null }>({
    open: false,
    campaign: null,
  });
  const [trackingNumber, setTrackingNumber] = useState("");

  // Fetch all campaigns
  const { data: campaignsData, isLoading } = useQuery<{ campaigns: CampaignWithDetails[] }>({
    queryKey: ['/api/admin/campaigns'],
  });

  // Approve campaign mutation
  const approveMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign approved",
        description: "Campaign created in ServiceTitan. Add a tracking number to launch.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add tracking number mutation
  const addTrackingNumberMutation = useMutation({
    mutationFn: async (data: { campaignId: string; trackingNumber: string }) => {
      return await apiRequest("POST", `/api/admin/campaigns/${data.campaignId}/tracking-number`, {
        trackingNumber: data.trackingNumber,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tracking number added",
        description: "Campaign is now ready to send emails.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setTrackingNumberDialog({ open: false, campaign: null });
      setTrackingNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add tracking number",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const campaigns = campaignsData?.campaigns || [];
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending_approval');
  const awaitingPhoneCampaigns = campaigns.filter(c => c.status === 'awaiting_phone_number');
  const readyCampaigns = campaigns.filter(c => c.status === 'ready_to_send');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'ready_to_send':
        return 'default';
      case 'pending_approval':
        return 'secondary';
      case 'awaiting_phone_number':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'ready_to_send':
        return <Sparkles className="w-4 h-4" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4" />;
      case 'awaiting_phone_number':
        return <Phone className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleAddTrackingNumber = (campaign: CampaignWithDetails) => {
    setTrackingNumberDialog({ open: true, campaign });
    setTrackingNumber("");
  };

  const handleSubmitTrackingNumber = () => {
    if (!trackingNumberDialog.campaign || !trackingNumber.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid tracking number.",
        variant: "destructive",
      });
      return;
    }

    addTrackingNumberMutation.mutate({
      campaignId: trackingNumberDialog.campaign.id,
      trackingNumber: trackingNumber.trim(),
    });
  };

  const renderCampaignCard = (campaign: CampaignWithDetails) => (
    <Card key={campaign.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg" data-testid={`text-campaign-name-${campaign.id}`}>
                {campaign.name}
              </CardTitle>
              <Badge
                variant={getStatusColor(campaign.status)}
                data-testid={`badge-status-${campaign.id}`}
                className="flex items-center gap-1"
              >
                {getStatusIcon(campaign.status)}
                {campaign.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {campaign.segmentName && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span data-testid={`text-segment-name-${campaign.id}`}>
                    {campaign.segmentName}
                  </span>
                  {campaign.memberCount !== undefined && (
                    <span className="text-muted-foreground">
                      ({campaign.memberCount} members)
                    </span>
                  )}
                </div>
              )}
              {campaign.serviceTitanCampaignId && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span data-testid={`text-st-campaign-id-${campaign.id}`}>
                    ST Campaign ID: {campaign.serviceTitanCampaignId}
                  </span>
                </div>
              )}
              {campaign.trackingPhoneNumber && (
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="w-4 h-4" />
                  <span data-testid={`text-tracking-number-${campaign.id}`}>
                    {campaign.trackingPhoneNumber}
                  </span>
                </div>
              )}
              {campaign.approvedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span data-testid={`text-approved-at-${campaign.id}`}>
                    Approved: {format(new Date(campaign.approvedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {campaign.status === 'pending_approval' && (
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(campaign.id)}
                disabled={approveMutation.isPending}
                data-testid={`button-approve-${campaign.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {campaign.status === 'awaiting_phone_number' && (
              <Button
                size="sm"
                onClick={() => handleAddTrackingNumber(campaign)}
                data-testid={`button-add-tracking-${campaign.id}`}
              >
                <Phone className="w-4 h-4 mr-1" />
                Add Tracking Number
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Email Campaigns</h2>
        <p className="text-muted-foreground">
          Manage email campaigns linked to ServiceTitan Marketing
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-campaigns-count">
              {pendingCampaigns.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need admin review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Phone #</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-awaiting-phone-count">
              {awaitingPhoneCampaigns.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need tracking number
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Send</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ready-campaigns-count">
              {readyCampaigns.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All set to launch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-campaigns-count">
              {activeCampaigns.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" data-testid="tab-pending-campaigns">
            Pending ({pendingCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="awaiting" data-testid="tab-awaiting-campaigns">
            Awaiting ({awaitingPhoneCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="ready" data-testid="tab-ready-campaigns">
            Ready ({readyCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active-campaigns">
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-campaigns">
            Completed ({completedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns pending approval</p>
              </CardContent>
            </Card>
          ) : (
            pendingCampaigns.map(renderCampaignCard)
          )}
        </TabsContent>

        <TabsContent value="awaiting" className="mt-6">
          {awaitingPhoneCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Phone className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns awaiting tracking numbers</p>
              </CardContent>
            </Card>
          ) : (
            awaitingPhoneCampaigns.map(renderCampaignCard)
          )}
        </TabsContent>

        <TabsContent value="ready" className="mt-6">
          {readyCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns ready to send</p>
              </CardContent>
            </Card>
          ) : (
            readyCampaigns.map(renderCampaignCard)
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active campaigns</p>
              </CardContent>
            </Card>
          ) : (
            activeCampaigns.map(renderCampaignCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed campaigns</p>
              </CardContent>
            </Card>
          ) : (
            completedCampaigns.map(renderCampaignCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Add Tracking Number Dialog */}
      <Dialog open={trackingNumberDialog.open} onOpenChange={(open) => setTrackingNumberDialog({ open, campaign: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Number</DialogTitle>
            <DialogDescription>
              Add a ServiceTitan tracking number to {trackingNumberDialog.campaign?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tracking-number">Tracking Number</Label>
              <Input
                id="tracking-number"
                placeholder="(512) 555-1234"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                data-testid="input-tracking-number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the FREE ServiceTitan tracking number for this campaign
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setTrackingNumberDialog({ open: false, campaign: null })}
                data-testid="button-cancel-tracking"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTrackingNumber}
                disabled={addTrackingNumberMutation.isPending || !trackingNumber.trim()}
                data-testid="button-submit-tracking"
              >
                {addTrackingNumberMutation.isPending ? "Adding..." : "Add Number"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
