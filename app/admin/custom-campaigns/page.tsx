'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Eye, Trash2, Edit, Sparkles, Loader2, Mail, Users, Code, FileText, Save } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function CustomCampaignsListSection() {
  const { data: campaigns, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/custom-campaigns'],
  });

  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/custom-campaigns/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns'] });
      toast({
        title: "Campaign deleted",
        description: "The campaign has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first AI-powered email campaign</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <CardDescription>{campaign.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'draft' ? 'secondary' : 'outline'}>
                  {campaign.status}
                </Badge>
                <Badge variant="outline">
                  {campaign.campaignType === 'one_time' ? 'One-Time' : 'Drip'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Audience</p>
                <p className="text-sm font-medium">{campaign.segmentId ? 'Targeted' : 'All Customers'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-sm font-medium">{campaign.totalSent || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opens</p>
                <p className="text-sm font-medium">{campaign.totalOpened || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="text-sm font-medium">{campaign.totalClicked || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setViewDialogOpen(true);
                }}
                data-testid={`button-view-campaign-${campaign.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this campaign?')) {
                    deleteCampaign.mutate(campaign.id);
                  }
                }}
                data-testid={`button-delete-campaign-${campaign.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* View Campaign Dialog with Email Editor */}
      {selectedCampaign && (
        <CampaignEmailEditorDialog
          campaign={selectedCampaign}
          isOpen={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
        />
      )}
    </div>
  );
}

// Campaign Email Editor Dialog
function CampaignEmailEditorDialog({ campaign, isOpen, onClose }: { campaign: any; isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'emails'>('details');
  
  // Email management state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateStrategy, setGenerateStrategy] = useState('');
  const [editEmailDialogOpen, setEditEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editPreheader, setEditPreheader] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editBodyPlain, setEditBodyPlain] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'plain'>('visual');

  // Fetch campaign emails
  const { data: campaignData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/custom-campaigns', campaign.id],
    enabled: isOpen,
  });

  const emails = campaignData?.emails || [];

  // Generate AI email mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/custom-campaigns/generate-email', data);
      return res.json();
    },
    onSuccess: (data) => {
      setEditSubject(data.subject);
      setEditPreheader(data.preheader || '');
      setEditBodyHtml(data.htmlContent);
      setEditBodyPlain(data.plainTextContent || '');
      setSelectedEmail(null);
      setGenerateDialogOpen(false);
      setEditEmailDialogOpen(true);
      toast({
        title: "Email generated",
        description: "AI has generated your email content. Review and save when ready.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate email with AI.",
        variant: "destructive",
      });
    },
  });

  // Save email mutation
  const saveEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedEmail) {
        const res = await apiRequest('PUT', `/api/admin/custom-campaigns/${campaign.id}/emails/${selectedEmail.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', `/api/admin/custom-campaigns/${campaign.id}/emails`, data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns', campaign.id] });
      setEditEmailDialogOpen(false);
      toast({
        title: "Email saved",
        description: "The email has been saved to the campaign.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateEmail = () => {
    generateMutation.mutate({
      campaignId: campaign.id,
      strategy: generateStrategy || undefined,
      campaignDescription: campaign.description,
    });
  };

  const handleSaveEmail = () => {
    const sequenceNumber = selectedEmail?.sequenceNumber || (emails.length + 1);
    saveEmailMutation.mutate({
      subject: editSubject,
      preheader: editPreheader || null,
      htmlContent: editBodyHtml,
      plainTextContent: editBodyPlain || null,
      sequenceNumber,
      daysAfterStart: selectedEmail?.daysAfterStart || 0,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{campaign.name}</DialogTitle>
            <DialogDescription>{campaign.description}</DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="emails">Email Sequence</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Type</Label>
                  <p className="text-sm">{campaign.campaignType === 'one_time' ? 'One-Time Blast' : 'Drip Sequence'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Tracking Phone Number</Label>
                <p className="text-sm">{campaign.trackingPhoneFormatted || 'Not set'}</p>
              </div>
              {campaign.scheduledFor && (
                <div>
                  <Label>Scheduled For</Label>
                  <p className="text-sm">{format(new Date(campaign.scheduledFor), 'PPp')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {emails.length} {emails.length === 1 ? 'email' : 'emails'} in sequence
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedEmail(null);
                    setGenerateDialogOpen(true);
                  }}
                  data-testid="button-add-email"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : emails.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No emails yet. Add your first email to the sequence.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {emails.map((email: any) => (
                      <Card key={email.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">Email #{email.sequenceNumber}</CardTitle>
                              <CardDescription className="text-xs">
                                {email.subject}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Day {email.daysAfterStart}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedEmail(email);
                                  setEditSubject(email.subject);
                                  setEditPreheader(email.preheader || '');
                                  setEditBodyHtml(email.htmlContent);
                                  setEditBodyPlain(email.plainTextContent || '');
                                  setEditEmailDialogOpen(true);
                                }}
                                data-testid={`button-edit-email-${email.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Generate AI Email Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Use AI to create personalized email content for this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="strategy">Email Strategy</Label>
              <Select value={generateStrategy} onValueChange={setGenerateStrategy}>
                <SelectTrigger id="strategy" data-testid="select-strategy">
                  <SelectValue placeholder="Auto (Recommended)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto (Recommended)</SelectItem>
                  <SelectItem value="value">Value-focused</SelectItem>
                  <SelectItem value="trust">Trust-building</SelectItem>
                  <SelectItem value="urgency">Urgency-driven</SelectItem>
                  <SelectItem value="social_proof">Social Proof</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateEmail}
                disabled={generateMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Preview Email Dialog */}
      <Dialog open={editEmailDialogOpen} onOpenChange={setEditEmailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmail ? `Edit Email #${selectedEmail.sequenceNumber}` : 'New Email'}
            </DialogTitle>
            <DialogDescription>
              Preview and edit email content
            </DialogDescription>
          </DialogHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visual">
                <Eye className="w-4 h-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html">
                <Code className="w-4 h-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="plain">
                <FileText className="w-4 h-4 mr-2" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-subject">Subject Line</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="edit-preheader">Preheader Text</Label>
                <Input
                  id="edit-preheader"
                  value={editPreheader}
                  onChange={(e) => setEditPreheader(e.target.value)}
                  placeholder="Enter preheader text..."
                  data-testid="input-preheader"
                />
              </div>

              <TabsContent value="visual">
                <div className="border rounded-lg p-4 bg-white min-h-[300px]">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                    <p className="font-semibold">{editSubject}</p>
                    {editPreheader && (
                      <>
                        <p className="text-sm text-muted-foreground mb-1 mt-2">Preheader:</p>
                        <p className="text-sm">{editPreheader}</p>
                      </>
                    )}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: editBodyHtml }}
                    className="prose max-w-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html">
                <div>
                  <Label htmlFor="edit-html">HTML Body</Label>
                  <Textarea
                    id="edit-html"
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    placeholder="Enter HTML content..."
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-html"
                  />
                </div>
              </TabsContent>

              <TabsContent value="plain">
                <div>
                  <Label htmlFor="edit-plain">Plain Text Body</Label>
                  <Textarea
                    id="edit-plain"
                    value={editBodyPlain}
                    onChange={(e) => setEditBodyPlain(e.target.value)}
                    placeholder="Enter plain text content..."
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-plain"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEmail}
              disabled={!editSubject || !editBodyHtml || saveEmailMutation.isPending}
              data-testid="button-save-email"
            >
              {saveEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Customer Segments Section
function CustomerSegmentsSection() {
  const { data: segments, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/customer-segments'],
  });

  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDescription, setNewSegmentDescription] = useState('');
  const [newSegmentType, setNewSegmentType] = useState<'static' | 'dynamic' | 'ai_generated'>('static');

  const createSegment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/customer-segments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customer-segments'] });
      setCreateDialogOpen(false);
      setNewSegmentName('');
      setNewSegmentDescription('');
      toast({
        title: "Segment created",
        description: "Your audience segment has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create segment.",
        variant: "destructive",
      });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/customer-segments/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customer-segments'] });
      toast({
        title: "Segment deleted",
        description: "The segment has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete segment.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSegment = () => {
    createSegment.mutate({
      name: newSegmentName,
      description: newSegmentDescription,
      segmentType: newSegmentType,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Audience Segments</h3>
          <p className="text-sm text-muted-foreground">Create targeted customer groups for campaigns</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-segment">
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {!segments || segments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No segments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first audience segment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {segment.segmentType === 'static' ? 'Static' : segment.segmentType === 'dynamic' ? 'Dynamic' : 'AI-Generated'}
                    </Badge>
                    <Badge>
                      {segment.memberCount || 0} members
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this segment?')) {
                      deleteSegment.mutate(segment.id);
                    }
                  }}
                  data-testid={`button-delete-segment-${segment.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Segment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Audience Segment</DialogTitle>
            <DialogDescription>Define a targeted customer group for your campaigns</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="segment-name">Segment Name</Label>
              <Input
                id="segment-name"
                placeholder="e.g., High-Value Customers"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                data-testid="input-segment-name"
              />
            </div>
            <div>
              <Label htmlFor="segment-description">Description</Label>
              <Textarea
                id="segment-description"
                placeholder="Describe this audience segment..."
                value={newSegmentDescription}
                onChange={(e) => setNewSegmentDescription(e.target.value)}
                data-testid="input-segment-description"
              />
            </div>
            <div>
              <Label htmlFor="segment-type">Segment Type</Label>
              <Select value={newSegmentType} onValueChange={(v: any) => setNewSegmentType(v)}>
                <SelectTrigger id="segment-type" data-testid="select-segment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static - Manually selected customers</SelectItem>
                  <SelectItem value="dynamic">Dynamic - Auto-updated based on criteria</SelectItem>
                  <SelectItem value="ai_generated">AI-Generated - AI selects best-fit customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSegment}
              disabled={!newSegmentName || createSegment.isPending}
              data-testid="button-save-segment"
            >
              {createSegment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Segment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Custom Campaign Section
function CreateCustomCampaignSection() {
  const { toast } = useToast();
  const { data: segments } = useQuery<any[]>({
    queryKey: ['/api/admin/customer-segments'],
  });

  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState<'one_time' | 'drip'>('one_time');
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackingPhoneFormatted, setTrackingPhoneFormatted] = useState('');

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/custom-campaigns', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-campaigns'] });
      setCampaignName('');
      setCampaignDescription('');
      setSelectedSegmentId(null);
      toast({
        title: "Campaign created",
        description: "Your campaign has been created in draft status.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    createCampaign.mutate({
      name: campaignName,
      description: campaignDescription,
      campaignType,
      segmentId: selectedSegmentId,
      trackingPhoneNumber: trackingPhone || null,
      trackingPhoneFormatted: trackingPhoneFormatted || null,
      status: 'draft',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
        <CardDescription>Set up an AI-powered email campaign for your customers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g., Spring Maintenance Reminder"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              data-testid="input-campaign-name"
            />
          </div>

          <div>
            <Label htmlFor="campaign-description">Description</Label>
            <Textarea
              id="campaign-description"
              placeholder="Describe the goal of this campaign..."
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              data-testid="input-campaign-description"
            />
          </div>

          <div>
            <Label htmlFor="campaign-type">Campaign Type</Label>
            <Select value={campaignType} onValueChange={(v: any) => setCampaignType(v)}>
              <SelectTrigger id="campaign-type" data-testid="select-campaign-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-Time Blast - Send immediately to all recipients</SelectItem>
                <SelectItem value="drip">Drip Sequence - Send series of emails over time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="segment-select">Target Audience</Label>
            <Select
              value={selectedSegmentId?.toString() || 'all'}
              onValueChange={(v) => setSelectedSegmentId(v === 'all' ? null : parseInt(v))}
            >
              <SelectTrigger id="segment-select" data-testid="select-segment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {segments?.map((seg) => (
                  <SelectItem key={seg.id} value={seg.id.toString()}>
                    {seg.name} ({seg.memberCount} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tracking-phone">Tracking Phone (digits only)</Label>
              <Input
                id="tracking-phone"
                placeholder="5125551234"
                value={trackingPhone}
                onChange={(e) => setTrackingPhone(e.target.value)}
                data-testid="input-tracking-phone"
              />
            </div>
            <div>
              <Label htmlFor="tracking-phone-formatted">Formatted Display</Label>
              <Input
                id="tracking-phone-formatted"
                placeholder="(512) 555-1234"
                value={trackingPhoneFormatted}
                onChange={(e) => setTrackingPhoneFormatted(e.target.value)}
                data-testid="input-tracking-phone-formatted"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCreate}
            disabled={!campaignName || createCampaign.isPending}
            data-testid="button-create-campaign"
          >
            {createCampaign.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomCampaignsPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'create'>('campaigns');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Custom Campaigns</h1>
        <p className="text-muted-foreground mb-6">
          Create AI-powered email campaigns with audience segmentation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">Audience Segments</TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="mt-6">
          <CustomCampaignsListSection />
        </TabsContent>
        
        <TabsContent value="segments" className="mt-6">
          <CustomerSegmentsSection />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <CreateCustomCampaignSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
