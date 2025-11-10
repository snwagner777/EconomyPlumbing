'use client';

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Phone, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Comprehensive list of channel types for tracking
const CHANNEL_TYPES = [
  { category: "None/Custom", options: [
    { value: "_custom", label: "None (Custom Channel)" },
  ]},
  { category: "Default", options: [
    { value: "default", label: "Default/Organic Traffic" },
  ]},
  { category: "Paid Advertising", options: [
    { value: "googlebot", label: "Google Ads (+ Googlebot)" },
    { value: "bingbot", label: "Bing Ads (+ Bingbot)" },
    { value: "facebookbot", label: "Facebook/Instagram Ads (+ FB Crawler)" },
    { value: "youtube", label: "YouTube Ads" },
    { value: "tiktok", label: "TikTok Ads" },
    { value: "linkedin", label: "LinkedIn Ads" },
    { value: "pinterest", label: "Pinterest Ads" },
    { value: "twitter", label: "Twitter/X Ads" },
  ]},
  { category: "Local Directories & Review Sites", options: [
    { value: "yelp", label: "Yelp" },
    { value: "nextdoor", label: "Nextdoor" },
    { value: "thumbtack", label: "Thumbtack" },
    { value: "angi", label: "Angi (Angie's List)" },
    { value: "homeadvisor", label: "HomeAdvisor" },
    { value: "porch", label: "Porch" },
  ]},
  { category: "Search Engine Crawlers (SSR)", options: [
    { value: "googlebot", label: "🤖 Googlebot (Google Crawler)" },
    { value: "bingbot", label: "🤖 Bingbot (Bing Crawler)" },
    { value: "yahoo", label: "🤖 Yahoo Slurp (Yahoo Crawler)" },
    { value: "duckduckgo", label: "🤖 DuckDuckBot" },
    { value: "baidu", label: "🤖 Baiduspider (China)" },
    { value: "yandex", label: "🤖 Yandexbot (Russia)" },
  ]},
  { category: "Social Media Crawlers (SSR)", options: [
    { value: "facebookbot", label: "🤖 Facebook Crawler (Link Previews)" },
    { value: "twitterbot", label: "🤖 Twitterbot (Card Previews)" },
    { value: "linkedinbot", label: "🤖 LinkedInbot (Link Previews)" },
    { value: "pinterestbot", label: "🤖 Pinterestbot" },
    { value: "whatsapp", label: "🤖 WhatsApp Preview" },
    { value: "telegram", label: "🤖 Telegram Preview" },
    { value: "slack", label: "🤖 Slackbot (Link Previews)" },
    { value: "discord", label: "🤖 Discordbot (Link Previews)" },
  ]},
  { category: "SEO & Analytics Crawlers", options: [
    { value: "seranking", label: "🤖 SE Ranking Crawler" },
    { value: "ahrefsbot", label: "🤖 Ahrefsbot" },
    { value: "semrushbot", label: "🤖 SEMrushbot" },
    { value: "mj12bot", label: "🤖 MJ12bot (Majestic)" },
    { value: "dotbot", label: "🤖 DotBot (Moz)" },
  ]},
  { category: "Other Sources", options: [
    { value: "email", label: "Email Marketing" },
    { value: "sms", label: "SMS Marketing" },
    { value: "print", label: "Print Advertising" },
    { value: "radio", label: "Radio Advertising" },
    { value: "tv", label: "TV Advertising" },
    { value: "direct", label: "Direct Traffic" },
    { value: "referral", label: "Referral Traffic" },
    { value: "custom", label: "Custom Source" },
  ]},
];

interface TrackingNumber {
  id: string;
  channelKey: string;
  channelName: string;
  displayNumber: string;
  rawNumber: string;
  telLink: string;
  detectionRules: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  serviceTitanCampaignId: number | null;
  serviceTitanCampaignName: string | null;
}

interface ServiceTitanCampaign {
  id: number;
  name: string;
  number: string;
  status: string;
  channel?: string;
  source?: string;
}

export default function TrackingNumbersClient() {
  const [editingNumber, setEditingNumber] = useState<TrackingNumber | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomChannelKey, setIsCustomChannelKey] = useState(false);
  const { toast } = useToast();

  // Fetch ServiceTitan campaigns
  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<{ success: boolean; campaigns: ServiceTitanCampaign[] }>({
    queryKey: ['/api/admin/servicetitan/campaigns'],
  });

  // Fetch tracking numbers (admin - includes inactive)
  const { data: trackingData, isLoading } = useQuery<{ trackingNumbers: TrackingNumber[] }>({
    queryKey: ['/api/admin/tracking-numbers'],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TrackingNumber> }) => {
      return await apiRequest("PUT", `/api/admin/tracking-numbers/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Tracking Number Updated",
        description: "The tracking number has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-numbers'] });
      setIsDialogOpen(false);
      setEditingNumber(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/tracking-numbers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tracking Number Deleted",
        description: "The tracking number has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-numbers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (number: TrackingNumber) => {
    setEditingNumber(number);
    // Check if this is a custom channel key (not in predefined list)
    const allPredefinedKeys = CHANNEL_TYPES.flatMap(cat => cat.options.map(opt => opt.value));
    const isCustom = !allPredefinedKeys.includes(number.channelKey);
    setIsCustomChannelKey(isCustom);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tracking number?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (number: TrackingNumber) => {
    updateMutation.mutate({
      id: number.id,
      updates: { isActive: !number.isActive }
    });
  };

  const handleSave = () => {
    if (!editingNumber) return;

    updateMutation.mutate({
      id: editingNumber.id,
      updates: {
        channelKey: editingNumber.channelKey,
        channelName: editingNumber.channelName,
        displayNumber: editingNumber.displayNumber,
        rawNumber: editingNumber.rawNumber,
        telLink: editingNumber.telLink,
        detectionRules: editingNumber.detectionRules,
        isActive: editingNumber.isActive,
        isDefault: editingNumber.isDefault,
        sortOrder: editingNumber.sortOrder,
        serviceTitanCampaignId: editingNumber.serviceTitanCampaignId,
        serviceTitanCampaignName: editingNumber.serviceTitanCampaignName,
      }
    });
  };

  const handleSyncCampaigns = async () => {
    try {
      await apiRequest("POST", "/api/admin/servicetitan/campaigns");
      refetchCampaigns();
      toast({
        title: "Campaigns Synced",
        description: "ServiceTitan campaigns have been refreshed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync campaigns from ServiceTitan",
        variant: "destructive",
      });
    }
  };

  const trackingNumbers = trackingData?.trackingNumbers || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tracking Numbers Admin</h1>
            <p className="text-muted-foreground mt-2">
              Manage marketing channel phone numbers, detection rules, and ServiceTitan campaign mapping
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSyncCampaigns} disabled={campaignsLoading} data-testid="button-sync-campaigns">
              <RefreshCw className={`w-4 h-4 mr-2 ${campaignsLoading ? 'animate-spin' : ''}`} />
              Sync ST Campaigns
            </Button>
          </div>
        </div>

        {/* Tracking Numbers List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-center text-muted-foreground">Loading tracking numbers...</p>
              </CardContent>
            </Card>
          ) : (
            trackingNumbers.map((number) => (
              <Card key={number.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {number.channelName}
                          {number.channelKey.startsWith('email-') && (
                            <Badge variant="secondary" className="text-xs">
                              ✉️ Email Campaign
                            </Badge>
                          )}
                          {number.channelKey.startsWith('sms-') && (
                            <Badge variant="secondary" className="text-xs">
                              📱 SMS Campaign
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Channel Key: {number.channelKey}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {number.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                      {number.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Display Number</Label>
                      <p className="mt-1 text-lg font-semibold">{number.displayNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tel Link</Label>
                      <p className="mt-1 font-mono text-sm">{number.telLink}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Detection Rules</Label>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(JSON.parse(number.detectionRules), null, 2)}
                      </pre>
                    </div>
                    {number.serviceTitanCampaignId && (
                      <div className="sm:col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">ServiceTitan Campaign</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary">
                            ID: {number.serviceTitanCampaignId}
                          </Badge>
                          <span className="text-sm">{number.serviceTitanCampaignName || 'Unknown Campaign'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(number)}
                      data-testid={`button-edit-${number.channelKey}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={number.isActive ? "outline" : "default"}
                      onClick={() => handleToggleActive(number)}
                      data-testid={`button-toggle-${number.channelKey}`}
                    >
                      {number.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    {!number.isDefault && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(number.id)}
                        data-testid={`button-delete-${number.channelKey}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Tracking Number</DialogTitle>
              <DialogDescription>
                Update tracking number details and detection rules
              </DialogDescription>
            </DialogHeader>
            {editingNumber && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="channelType">Channel Type</Label>
                  <Select
                    value={isCustomChannelKey ? "_custom" : editingNumber.channelKey}
                    onValueChange={(value) => {
                      if (value === "_custom") {
                        // Selected "None (Custom)" - enable custom mode
                        setIsCustomChannelKey(true);
                      } else {
                        // Selected a predefined option - set it and lock
                        setEditingNumber({ ...editingNumber, channelKey: value });
                        setIsCustomChannelKey(false);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-channelType">
                      <SelectValue placeholder="Select channel type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_TYPES.map((category) => (
                        <optgroup key={category.category} label={category.category}>
                          {category.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </optgroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    🤖 = Bot/Crawler (will get this number when crawling your site for SEO)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channelKey">
                    Channel Key {isCustomChannelKey ? "(Custom - Enter Manually)" : "(Auto-filled)"}
                  </Label>
                  <Input
                    id="channelKey"
                    value={editingNumber.channelKey}
                    onChange={(e) => setEditingNumber({ ...editingNumber, channelKey: e.target.value })}
                    data-testid="input-channelKey"
                    placeholder="e.g., doorhanger, b2bcard, custom_source"
                    disabled={!isCustomChannelKey}
                    className={!isCustomChannelKey ? "bg-muted" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {!isCustomChannelKey
                      ? "Select 'None (Custom Channel)' from dropdown to edit manually" 
                      : "Enter any custom channel key (e.g., doorhanger, radio_ad, etc.)"}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channelName">Channel Display Name</Label>
                  <Input
                    id="channelName"
                    value={editingNumber.channelName}
                    onChange={(e) => setEditingNumber({ ...editingNumber, channelName: e.target.value })}
                    data-testid="input-channelName"
                    placeholder="e.g., Google Ads, Bingbot Crawler"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayNumber">Display Number</Label>
                  <Input
                    id="displayNumber"
                    value={editingNumber.displayNumber}
                    onChange={(e) => setEditingNumber({ ...editingNumber, displayNumber: e.target.value })}
                    data-testid="input-displayNumber"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telLink">Tel Link</Label>
                  <Input
                    id="telLink"
                    value={editingNumber.telLink}
                    onChange={(e) => setEditingNumber({ ...editingNumber, telLink: e.target.value })}
                    data-testid="input-telLink"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detectionRules">Detection Rules (JSON)</Label>
                  <Textarea
                    id="detectionRules"
                    value={editingNumber.detectionRules}
                    onChange={(e) => setEditingNumber({ ...editingNumber, detectionRules: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                    data-testid="input-detectionRules"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: {"{"}"urlParams":["gclid"],"utmSources":["google"],"referrerIncludes":["google.com"]{"}"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingNumber.isActive}
                    onCheckedChange={(checked) => setEditingNumber({ ...editingNumber, isActive: checked })}
                    data-testid="switch-isActive"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={editingNumber.isDefault}
                    onCheckedChange={(checked) => setEditingNumber({ ...editingNumber, isDefault: checked })}
                    data-testid="switch-isDefault"
                  />
                  <Label htmlFor="isDefault">Default</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={editingNumber.sortOrder}
                    onChange={(e) => setEditingNumber({ ...editingNumber, sortOrder: parseInt(e.target.value) })}
                    data-testid="input-sortOrder"
                  />
                </div>
                
                {/* ServiceTitan Campaign Mapping */}
                <div className="grid gap-2 pt-4 border-t">
                  <Label htmlFor="stCampaign">ServiceTitan Campaign (Optional)</Label>
                  <Select
                    value={editingNumber.serviceTitanCampaignId?.toString() || ""}
                    onValueChange={(value) => {
                      if (value === "") {
                        setEditingNumber({ 
                          ...editingNumber, 
                          serviceTitanCampaignId: null, 
                          serviceTitanCampaignName: null 
                        });
                      } else {
                        const campaign = campaignsData?.campaigns.find(c => c.id.toString() === value);
                        setEditingNumber({ 
                          ...editingNumber, 
                          serviceTitanCampaignId: parseInt(value),
                          serviceTitanCampaignName: campaign?.name || null
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-stCampaign">
                      <SelectValue placeholder="Select a ServiceTitan campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (No campaign mapping)</SelectItem>
                      {campaignsData?.campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name} (#{campaign.number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Map this utm_source to a ServiceTitan campaign for conversion tracking.
                    {!campaignsData?.campaigns.length && " Click 'Sync ST Campaigns' to load campaigns."}
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} data-testid="button-save">
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
