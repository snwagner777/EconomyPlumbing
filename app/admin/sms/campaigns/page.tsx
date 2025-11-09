'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Send, Plus, Trash2, Eye, PauseCircle, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SMSCampaign = {
  id: number;
  name: string;
  message: string;
  segmentType: 'provider_lists' | 'customer_segments' | 'all_opted_in';
  providerListIds: string[] | null;
  customerSegmentIds: string[] | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  sentCount: number | null;
  deliveredCount: number | null;
  failedCount: number | null;
  createdBy: string;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
};

type CustomerSegment = {
  id: string;
  name: string;
  description: string | null;
  count: number;
};

export default function SMSCampaignsPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<SMSCampaign | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<SMSCampaign[]>({
    queryKey: ['/api/admin/sms/campaigns'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/sms/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/campaigns'] });
      toast({ title: 'Campaign deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete campaign', variant: 'destructive' });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  const draftCount = campaigns.filter(c => c.status === 'draft').length;
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const completedCount = campaigns.filter(c => c.status === 'completed').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            SMS Campaigns
          </h1>
          <p className="text-muted-foreground">
            Create and manage broadcast SMS campaigns
          </p>
        </div>
        <CreateCampaignDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/campaigns'] });
            setShowCreateDialog(false);
          }}
        >
          <Button data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CreateCampaignDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-campaigns">
              {campaigns.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-drafts">
              {draftCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-active">
              {activeCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed">
              {completedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>{campaigns.length} total campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first SMS campaign to start messaging customers
              </p>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(campaign => (
                    <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        {campaign.status === 'draft' && (
                          <Badge variant="secondary" data-testid={`badge-draft-${campaign.id}`}>
                            Draft
                          </Badge>
                        )}
                        {campaign.status === 'active' && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400" data-testid={`badge-active-${campaign.id}`}>
                            Active
                          </Badge>
                        )}
                        {campaign.status === 'paused' && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" data-testid={`badge-paused-${campaign.id}`}>
                            Paused
                          </Badge>
                        )}
                        {campaign.status === 'completed' && (
                          <Badge variant="outline" data-testid={`badge-completed-${campaign.id}`}>
                            Completed
                          </Badge>
                        )}
                        {campaign.status === 'failed' && (
                          <Badge variant="destructive" data-testid={`badge-failed-${campaign.id}`}>
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {campaign.segmentType === 'all_opted_in' && 'All Opted-In'}
                        {campaign.segmentType === 'provider_lists' && 'Provider Lists'}
                        {campaign.segmentType === 'customer_segments' && 'Customer Segments'}
                      </TableCell>
                      <TableCell>{campaign.sentCount?.toLocaleString() ?? '-'}</TableCell>
                      <TableCell>
                        {campaign.deliveredCount !== null
                          ? `${campaign.deliveredCount} (${campaign.sentCount ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100) : 0}%)`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCampaign(campaign)}
                            data-testid={`button-view-${campaign.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(campaign.id)}
                            data-testid={`button-delete-${campaign.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Campaign Dialog */}
      {selectedCampaign && (
        <ViewCampaignDialog
          campaign={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={open => !open && setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

function CreateCampaignDialog({
  children,
  open,
  onOpenChange,
  onSuccess,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    segmentType: 'all_opted_in' as 'all_opted_in' | 'provider_lists' | 'customer_segments',
    providerListIds: [] as string[],
    customerSegmentIds: [] as string[],
    sendNow: false,
  });

  // Fetch segments
  const { data: segments = [] } = useQuery<CustomerSegment[]>({
    queryKey: ['/api/admin/segments'],
    enabled: formData.segmentType === 'customer_segments',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/admin/sms/campaigns', {
        name: data.name,
        message: data.message,
        segmentType: data.segmentType,
        providerListIds: data.segmentType === 'provider_lists' ? data.providerListIds : null,
        customerSegmentIds: data.segmentType === 'customer_segments' ? data.customerSegmentIds : null,
      });
      const campaign = await response.json();
      
      if (data.sendNow) {
        await apiRequest('POST', `/api/admin/sms/campaigns/${campaign.id}/send`, {});
      }
      
      return campaign;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.sendNow ? 'Campaign sent successfully' : 'Campaign created successfully',
      });
      onSuccess();
      setFormData({
        name: '',
        message: '',
        segmentType: 'all_opted_in',
        providerListIds: [],
        customerSegmentIds: [],
        sendNow: false,
      });
    },
    onError: () => {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast({ title: 'Name and message are required', variant: 'destructive' });
      return;
    }

    if (formData.segmentType === 'provider_lists' && formData.providerListIds.length === 0) {
      toast({ title: 'Please select at least one provider list', variant: 'destructive' });
      return;
    }

    if (formData.segmentType === 'customer_segments' && formData.customerSegmentIds.length === 0) {
      toast({ title: 'Please select at least one customer segment', variant: 'destructive' });
      return;
    }

    createMutation.mutate(formData);
  };

  const messageLength = formData.message.length;
  const smsSegments = Math.ceil(messageLength / 160);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-create-campaign">
        <DialogHeader>
          <DialogTitle>Create SMS Campaign</DialogTitle>
          <DialogDescription>
            Compose a broadcast message to send to your contacts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Spring Promotion 2024"
              data-testid="input-name"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your message here... (Include opt-out instructions like 'Reply STOP to opt out')"
              rows={5}
              className="resize-none"
              data-testid="textarea-message"
              required
            />
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <span data-testid="text-character-count">{messageLength} characters</span>
              <span data-testid="text-sms-segments">
                {smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="segmentType">Audience *</Label>
            <Select
              value={formData.segmentType}
              onValueChange={(v: any) =>
                setFormData({
                  ...formData,
                  segmentType: v,
                  providerListIds: [],
                  customerSegmentIds: [],
                })
              }
            >
              <SelectTrigger id="segmentType" data-testid="select-segment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_opted_in">All Opted-In Contacts</SelectItem>
                <SelectItem value="customer_segments">Customer Segments</SelectItem>
                <SelectItem value="provider_lists">Provider Lists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.segmentType === 'customer_segments' && (
            <div>
              <Label htmlFor="segments">Select Segments *</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                {segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No segments available</p>
                ) : (
                  segments.map(segment => (
                    <label
                      key={segment.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.customerSegmentIds.includes(segment.id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            customerSegmentIds: checked
                              ? [...formData.customerSegmentIds, segment.id]
                              : formData.customerSegmentIds.filter(id => id !== segment.id),
                          });
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{segment.name}</div>
                        {segment.description && (
                          <div className="text-sm text-muted-foreground">
                            {segment.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {segment.count.toLocaleString()} contacts
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {formData.segmentType === 'provider_lists' && (
            <div>
              <Label htmlFor="providerLists">Provider List IDs *</Label>
              <Input
                id="providerLists"
                value={formData.providerListIds.join(',')}
                onChange={e =>
                  setFormData({
                    ...formData,
                    providerListIds: e.target.value.split(',').filter(Boolean),
                  })
                }
                placeholder="Enter comma-separated list IDs (e.g., 12345,67890)"
                data-testid="input-provider-lists"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter SimpleTexting list IDs separated by commas
              </p>
            </div>
          )}

          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div>
                  <CardTitle className="text-sm">TCPA Compliance</CardTitle>
                  <CardDescription className="text-xs">
                    Messages will only be sent to opted-in contacts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p>✓ Only opted-in contacts will receive this message</p>
              <p>✓ Include opt-out instructions (e.g., "Reply STOP to opt out")</p>
              <p>✓ SimpleTexting automatically handles STOP/START keywords</p>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setFormData({ ...formData, sendNow: false })}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              onClick={() => setFormData({ ...formData, sendNow: true })}
              data-testid="button-send-now"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewCampaignDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: SMSCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const sendMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/admin/sms/campaigns/${campaign.id}/send`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/campaigns'] });
      toast({ title: 'Campaign sent successfully' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Failed to send campaign', variant: 'destructive' });
    },
  });

  const deliveryRate =
    campaign.sentCount && campaign.deliveredCount
      ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-view-campaign">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>Campaign details and statistics</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label>Message</Label>
              <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                {campaign.message}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Segment Type</Label>
                <p className="mt-1 text-sm">
                  {campaign.segmentType === 'all_opted_in' && 'All Opted-In Contacts'}
                  {campaign.segmentType === 'provider_lists' && 'Provider Lists'}
                  {campaign.segmentType === 'customer_segments' && 'Customer Segments'}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Created By</Label>
                <p className="mt-1 text-sm">{campaign.createdBy}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="mt-1 text-sm">
                  {new Date(campaign.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaign.sentCount?.toLocaleString() ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Delivered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {campaign.deliveredCount?.toLocaleString() ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">{deliveryRate}% rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {campaign.failedCount?.toLocaleString() ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {campaign.sentAt && (
              <div>
                <Label>Sent At</Label>
                <p className="mt-1 text-sm">{new Date(campaign.sentAt).toLocaleString()}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {campaign.status === 'draft' && (
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              data-testid="button-send-campaign"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMutation.isPending ? 'Sending...' : 'Send Now'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
