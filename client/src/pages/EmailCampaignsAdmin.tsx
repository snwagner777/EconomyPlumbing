import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, CheckCircle, Clock, Phone, AlertCircle, Sparkles, Calendar, Users, ChevronDown, ChevronUp, FileText, Eye, Send, X, Plus, Edit, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { EmailCampaign, EmailTemplate } from "@shared/schema";

type CampaignEmail = {
  id: string;
  campaignId: string;
  sequenceNumber: number;
  dayOffset: number;
  subject: string;
  preheader: string | null;
  htmlContent: string;
  textContent: string;
  generatedByAI: boolean;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
};

type CampaignWithDetails = EmailCampaign & {
  segmentName?: string;
  memberCount?: number;
};

// Email Preview Dialog Component
function EmailPreviewDialog({ 
  open, 
  onOpenChange, 
  email, 
  campaign,
  onApprove,
  onReject 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  email: CampaignEmail | null;
  campaign: CampaignWithDetails | null;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState({ subject: '', htmlContent: '' });

  useEffect(() => {
    if (email) {
      setEditedContent({ subject: email.subject, htmlContent: email.htmlContent });
    }
  }, [email]);

  useEffect(() => {
    // Safely render HTML in iframe
    if (iframeRef.current && email && open) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(isEditMode ? editedContent.htmlContent : email.htmlContent);
        iframeDoc.close();
      }
    }
  }, [email, open, isEditMode, editedContent.htmlContent]);

  if (!email || !campaign) return null;

  const needsApproval = campaign.status === 'pending_approval' && email.generatedByAI;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Email Preview
              {email.generatedByAI && (
                <Badge className="bg-purple-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </span>
            {!isEditMode && needsApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                data-testid="button-edit-email"
              >
                Edit Content
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Review the email content before approval
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="preview" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" data-testid="tab-email-preview">Visual Preview</TabsTrigger>
              <TabsTrigger value="html" data-testid="tab-email-html">HTML Source</TabsTrigger>
              <TabsTrigger value="text" data-testid="tab-email-text">Plain Text</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4 h-full">
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  {isEditMode ? (
                    <Input
                      value={editedContent.subject}
                      onChange={(e) => setEditedContent({ ...editedContent, subject: e.target.value })}
                      className="mt-1"
                      data-testid="input-email-subject"
                    />
                  ) : (
                    <p className="mt-1 font-medium" data-testid={`text-preview-subject-${email.id}`}>
                      {email.subject}
                    </p>
                  )}
                </div>
                
                {email.preheader && (
                  <div>
                    <Label>Preview Text</Label>
                    <p className="mt-1 text-sm text-muted-foreground" data-testid={`text-preview-preheader-${email.id}`}>
                      {email.preheader}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Email Content</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden bg-white">
                    {isEditMode ? (
                      <Textarea
                        value={editedContent.htmlContent}
                        onChange={(e) => setEditedContent({ ...editedContent, htmlContent: e.target.value })}
                        className="min-h-[400px] font-mono text-xs"
                        data-testid="textarea-email-html"
                      />
                    ) : (
                      <iframe
                        ref={iframeRef}
                        title="Email Preview"
                        className="w-full h-[400px]"
                        sandbox="allow-same-origin"
                        data-testid="iframe-email-preview"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Email #{email.sequenceNumber}</span>
                  <span>Day {email.dayOffset}</span>
                  {email.totalSent > 0 && (
                    <>
                      <span>Sent: {email.totalSent}</span>
                      <span>Opened: {email.totalOpened}</span>
                      <span>Clicked: {email.totalClicked}</span>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="html" className="mt-4">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <pre className="text-xs font-mono" data-testid={`text-html-source-${email.id}`}>
                  <code>{isEditMode ? editedContent.htmlContent : email.htmlContent}</code>
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap text-sm" data-testid={`text-plain-content-${email.id}`}>
                  {email.textContent}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {needsApproval && (
          <DialogFooter className="gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel Edit
                </Button>
                <Button
                  onClick={() => {
                    // Save edited content and approve
                    if (onApprove) {
                      onApprove();
                      setIsEditMode(false);
                    }
                  }}
                  data-testid="button-save-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onReject) onReject();
                    onOpenChange(false);
                  }}
                  data-testid="button-reject-email"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (onApprove) onApprove();
                    onOpenChange(false);
                  }}
                  data-testid="button-approve-email"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Send
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Manual Email Blast Dialog Component
function ManualEmailBlastDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "segment" | "test">("test");
  const [scheduledFor, setScheduledFor] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Preview HTML content in iframe
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
    }
  }, [htmlContent]);

  const sendCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/email/send-campaign", data);
    },
    onSuccess: () => {
      toast({
        title: recipientType === "test" ? "Test email sent" : "Campaign sent",
        description: recipientType === "test" 
          ? "Test email has been sent to admin@plumbersthatcare.com"
          : `Email campaign has been sent to ${recipientType === "all" ? "all customers" : "selected segment"}`,
      });
      onOpenChange(false);
      // Reset form
      setSubject("");
      setHtmlContent("");
      setTextContent("");
      setRecipientType("test");
      setScheduledFor("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!subject || !htmlContent) {
      toast({
        title: "Missing required fields",
        description: "Please provide a subject and email content",
        variant: "destructive",
      });
      return;
    }

    sendCampaignMutation.mutate({
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      recipientType,
      segmentId: null, // Could add segment selection later
      individualEmails: null,
      scheduledFor: scheduledFor || null,
      testMode: recipientType === "test",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Manual Email Campaign
          </DialogTitle>
          <DialogDescription>
            Create and send a one-time email blast to your customers
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Special offer from Economy Plumbing"
                  className="mt-1"
                  data-testid="input-manual-subject"
                />
              </div>

              <div>
                <Label htmlFor="recipients">Recipients *</Label>
                <Select 
                  value={recipientType} 
                  onValueChange={(value: "all" | "segment" | "test") => setRecipientType(value)}
                >
                  <SelectTrigger className="mt-1" data-testid="select-recipient-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test (admin@plumbersthatcare.com)</SelectItem>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="segment" disabled>Customer Segments (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
                {recipientType === "all" && (
                  <p className="text-xs text-amber-600 mt-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    This will send to ALL customers with email addresses
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="mt-1"
                  data-testid="input-schedule"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to send immediately
                </p>
              </div>

              <div>
                <Label htmlFor="html">HTML Content *</Label>
                <Textarea
                  id="html"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<html><body><h1>Your HTML email content here</h1></body></html>"
                  className="mt-1 min-h-[200px] font-mono text-xs"
                  data-testid="textarea-manual-html"
                />
              </div>

              <div>
                <Label htmlFor="text">Plain Text Content (Optional)</Label>
                <Textarea
                  id="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text version of your email (auto-generated if left empty)"
                  className="mt-1 min-h-[100px]"
                  data-testid="textarea-manual-text"
                />
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <div>
                <Label>Live Preview</Label>
                <div className="mt-1 border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 border-b">
                    <p className="text-sm font-medium">Subject: {subject || "(No subject)"}</p>
                    <p className="text-xs text-muted-foreground">
                      To: {recipientType === "test" ? "admin@plumbersthatcare.com" : 
                           recipientType === "all" ? "All Customers" : "Selected Segment"}
                    </p>
                  </div>
                  <iframe
                    ref={iframeRef}
                    title="Email Preview"
                    className="w-full h-[400px] bg-white"
                    sandbox="allow-same-origin"
                    data-testid="iframe-manual-preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-manual"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendCampaignMutation.isPending || !subject || !htmlContent}
            data-testid="button-send-manual"
          >
            {sendCampaignMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {recipientType === "test" ? "Send Test" : 
                 scheduledFor ? "Schedule Campaign" : "Send Campaign"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmailCampaignsAdmin() {
  const { toast } = useToast();
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [trackingNumberDialog, setTrackingNumberDialog] = useState<{ open: boolean; campaign: CampaignWithDetails | null }>({
    open: false,
    campaign: null,
  });
  const [trackingNumber, setTrackingNumber] = useState("");
  const [previewDialog, setPreviewDialog] = useState<{ 
    open: boolean; 
    email: CampaignEmail | null; 
    campaign: CampaignWithDetails | null;
  }>({
    open: false,
    email: null,
    campaign: null,
  });
  const [manualBlastDialog, setManualBlastDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'preview';
    template: EmailTemplate | null;
  }>({ open: false, mode: 'create', template: null });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: '',
    subject: '',
    preheader: '',
    htmlContent: '',
    textContent: '',
    mergeVariables: [] as string[],
    isActive: true,
  });

  // Fetch all campaigns
  const { data: campaignsData, isLoading } = useQuery<{ campaigns: CampaignWithDetails[] }>({
    queryKey: ['/api/admin/campaigns'],
  });

  // Fetch all templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email-templates'],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof templateForm) => {
      return await apiRequest("POST", "/api/admin/email-templates", template);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      setTemplateDialog({ open: false, mode: 'create', template: null });
      setTemplateForm({
        name: '',
        category: '',
        subject: '',
        preheader: '',
        htmlContent: '',
        textContent: '',
        mergeVariables: [],
        isActive: true,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: { id: string } & typeof templateForm) => {
      return await apiRequest("PUT", `/api/admin/email-templates/${id}`, template);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      setTemplateDialog({ open: false, mode: 'create', template: null });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
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

  // Fetch campaign emails when expanded
  const { data: campaignEmailsData } = useQuery<{ emails: CampaignEmail[] }>({
    queryKey: expandedCampaign ? [`/api/admin/campaigns/${expandedCampaign}/emails`] : [],
    enabled: !!expandedCampaign,
  });

  const renderCampaignCard = (campaign: CampaignWithDetails) => {
    const isExpanded = expandedCampaign === campaign.id;
    const emails = isExpanded ? (campaignEmailsData?.emails || []) : [];

    return (
      <Card key={campaign.id} className="mb-4">
        <Collapsible open={isExpanded} onOpenChange={(open) => setExpandedCampaign(open ? campaign.id : null)}>
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
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`button-toggle-details-${campaign.id}`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        View Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {emails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No emails in this campaign</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Email Sequence ({emails.length} email{emails.length !== 1 ? 's' : ''})
                  </h4>
                  {emails.map((email, idx) => (
                    <Card key={email.id} className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" data-testid={`badge-sequence-${email.id}`}>
                                Email #{email.sequenceNumber}
                              </Badge>
                              <Badge variant="secondary" data-testid={`badge-day-offset-${email.id}`}>
                                Day {email.dayOffset}
                              </Badge>
                              {email.generatedByAI && (
                                <Badge variant="default" className="bg-purple-500">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base mt-2" data-testid={`text-email-subject-${email.id}`}>
                              {email.subject}
                            </CardTitle>
                            {email.preheader && (
                              <CardDescription className="mt-1" data-testid={`text-email-preheader-${email.id}`}>
                                Preview: {email.preheader}
                              </CardDescription>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>Sent: {email.totalSent}</div>
                            <div>Opened: {email.totalOpened}</div>
                            <div>Clicked: {email.totalClicked}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDialog({ open: true, email, campaign })}
                            data-testid={`button-preview-email-${email.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Email
                          </Button>
                          {email.generatedByAI && campaign.status === 'pending_approval' && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Plain Text Content</Label>
                          <div className="mt-1 p-3 bg-background rounded-md border text-sm whitespace-pre-wrap line-clamp-3" data-testid={`text-email-text-content-${email.id}`}>
                            {email.textContent}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Manage email campaigns linked to ServiceTitan Marketing
          </p>
        </div>
        <Button 
          onClick={() => setManualBlastDialog(true)}
          data-testid="button-manual-blast"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Manual Campaign
        </Button>
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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="templates" data-testid="tab-templates">
            Templates ({templatesData?.length || 0})
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

        <TabsContent value="templates" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Email Templates Library</h3>
              <Button
                onClick={() => {
                  setTemplateForm({
                    name: '',
                    category: '',
                    subject: '',
                    preheader: '',
                    htmlContent: '',
                    textContent: '',
                    mergeVariables: [],
                    isActive: true,
                  });
                  setTemplateDialog({ open: true, mode: 'create', template: null });
                }}
                data-testid="button-create-template"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>

            {templatesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : templatesData && templatesData.length > 0 ? (
              <div className="grid gap-4">
                {templatesData.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.category}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Subject</Label>
                        <p className="text-sm font-medium">{template.subject}</p>
                      </div>
                      {template.preheader && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Preheader</Label>
                          <p className="text-sm">{template.preheader}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-xs text-muted-foreground">
                          Created: {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateDialog({ open: true, mode: 'preview', template });
                            }}
                            data-testid={`button-preview-template-${template.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateForm({
                                name: template.name,
                                category: template.category,
                                subject: template.subject,
                                preheader: template.preheader || '',
                                htmlContent: template.htmlContent,
                                textContent: template.textContent,
                                mergeVariables: template.mergeVariables || [],
                                isActive: template.isActive,
                              });
                              setTemplateDialog({ open: true, mode: 'edit', template });
                            }}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No email templates yet</p>
                  <Button
                    onClick={() => {
                      setTemplateDialog({ open: true, mode: 'create', template: null });
                    }}
                    data-testid="button-create-first-template"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ open, email: null, campaign: null })}
        email={previewDialog.email}
        campaign={previewDialog.campaign}
        onApprove={() => {
          if (previewDialog.campaign) {
            approveMutation.mutate(previewDialog.campaign.id);
            setPreviewDialog({ open: false, email: null, campaign: null });
          }
        }}
        onReject={() => {
          // Handle rejection (could add a rejection API endpoint)
          toast({
            title: "Campaign rejected",
            description: "The AI-generated content has been rejected. Please regenerate or edit manually.",
            variant: "destructive",
          });
          setPreviewDialog({ open: false, email: null, campaign: null });
        }}
      />
      
      {/* Manual Email Blast Dialog */}
      <ManualEmailBlastDialog 
        open={manualBlastDialog}
        onOpenChange={setManualBlastDialog}
      />

      {/* Template Dialog */}
      <Dialog open={templateDialog.open} onOpenChange={(open) => !open && setTemplateDialog({ open: false, mode: 'create', template: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {templateDialog.mode === 'create' ? 'Create Email Template' : 
               templateDialog.mode === 'edit' ? 'Edit Email Template' : 
               'Preview Email Template'}
            </DialogTitle>
            <DialogDescription>
              {templateDialog.mode === 'create' ? 'Create a reusable email template for campaigns' :
               templateDialog.mode === 'edit' ? 'Update the template details and content' :
               'Preview how this template will look'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {templateDialog.mode === 'preview' && templateDialog.template ? (
              <Tabs defaultValue="preview" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Visual Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Source</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Subject</Label>
                      <div className="p-3 bg-background rounded-md border">{templateDialog.template.subject}</div>
                    </div>
                    {templateDialog.template.preheader && (
                      <div>
                        <Label>Preheader</Label>
                        <div className="p-3 bg-background rounded-md border">{templateDialog.template.preheader}</div>
                      </div>
                    )}
                    <div>
                      <Label>Email Content</Label>
                      <div className="border rounded-md bg-white">
                        <iframe
                          srcDoc={templateDialog.template.htmlContent}
                          className="w-full h-[400px]"
                          title="Template Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="html" className="mt-4">
                  <ScrollArea className="h-[500px] border rounded-md p-4">
                    <pre className="text-xs">{templateDialog.template.htmlContent}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Welcome Email"
                      data-testid="input-template-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={templateForm.category}
                      onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="template-category" data-testid="select-template-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="review_request">Review Request</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line with {variables}"
                    data-testid="input-template-subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-preheader">Preheader (Optional)</Label>
                  <Input
                    id="template-preheader"
                    value={templateForm.preheader}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, preheader: e.target.value }))}
                    placeholder="Preview text shown in inbox"
                    data-testid="input-template-preheader"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-html">HTML Content</Label>
                  <Textarea
                    id="template-html"
                    value={templateForm.htmlContent}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="HTML email content with {customerName}, {appointmentDate}, etc."
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="textarea-template-html"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-text">Plain Text Content</Label>
                  <Textarea
                    id="template-text"
                    value={templateForm.textContent}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, textContent: e.target.value }))}
                    placeholder="Plain text version of the email"
                    className="min-h-[150px]"
                    data-testid="textarea-template-text"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                    data-testid="checkbox-template-active"
                  />
                  <Label htmlFor="template-active" className="cursor-pointer">
                    Template is active and available for use
                  </Label>
                </div>
              </div>
            )}
          </div>
          
          {templateDialog.mode !== 'preview' && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTemplateDialog({ open: false, mode: 'create', template: null })}
                data-testid="button-cancel-template"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (templateDialog.mode === 'create') {
                    createTemplateMutation.mutate(templateForm);
                  } else if (templateDialog.mode === 'edit' && templateDialog.template) {
                    updateTemplateMutation.mutate({ id: templateDialog.template.id, ...templateForm });
                  }
                }}
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending || !templateForm.name || !templateForm.subject || !templateForm.htmlContent}
                data-testid="button-save-template"
              >
                {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'Saving...' : 
                 templateDialog.mode === 'create' ? 'Create Template' : 'Update Template'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
