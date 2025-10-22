import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, Save, Sparkles, Edit, Eye, Users, 
  Mail, MessageSquare, AlertTriangle, CheckCircle,
  Calendar, Target, Filter, ChevronRight
} from "lucide-react";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: string;
  tags: string[];
  variables: string[];
}

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  criteria: any;
}

export default function EmailComposer() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("compose");
  const [emailContent, setEmailContent] = useState({
    subject: "",
    htmlContent: "",
    textContent: "",
    recipientType: "all", // all, segment, individual
    segmentId: "",
    individualEmails: "",
    scheduledFor: "",
    testMode: false,
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email-templates'],
  });

  // Fetch customer segments
  const { data: segments, isLoading: segmentsLoading } = useQuery<CustomerSegment[]>({
    queryKey: ['/api/admin/segments'],
  });

  // Fetch campaign stats
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/email-stats'],
  });

  // Generate AI content
  const generateAIMutation = useMutation({
    mutationFn: async (data: { prompt: string; tone: string; includePersonalization: boolean }) => {
      return apiRequest('/api/admin/email/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setEmailContent(prev => ({
        ...prev,
        subject: data.subject || prev.subject,
        htmlContent: data.htmlContent || prev.htmlContent,
        textContent: data.textContent || prev.textContent,
      }));
      toast({
        title: "Content Generated",
        description: "AI has generated email content based on your prompt",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save as template
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; tags: string[] }) => {
      return apiRequest('/api/admin/email-templates', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          ...emailContent,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
    },
  });

  // Send email campaign
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/email/send-campaign', {
        method: 'POST',
        body: JSON.stringify(emailContent),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign Sent",
        description: `Email campaign sent to ${data.recipientCount} recipients`,
      });
      // Reset form
      setEmailContent({
        subject: "",
        htmlContent: "",
        textContent: "",
        recipientType: "all",
        segmentId: "",
        individualEmails: "",
        scheduledFor: "",
        testMode: false,
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send email campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load template
  const loadTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setEmailContent(prev => ({
        ...prev,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      }));
      setSelectedTemplate(templateId);
    }
  };

  // Preview with personalization
  const renderPreview = () => {
    let content = emailContent.htmlContent;
    // Replace common variables with sample data
    content = content.replace(/\{\{customerName\}\}/g, "John Smith");
    content = content.replace(/\{\{companyName\}\}/g, "Economy Plumbing Services");
    content = content.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
    content = content.replace(/\{\{currentMonth\}\}/g, format(new Date(), "MMMM"));
    return content;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Email Campaign Composer</h1>
          <p className="mt-2 text-muted-foreground">Create, customize, and send email campaigns to your customers</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalContacts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.sentToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.openRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.clickRate}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose" data-testid="tab-compose">
              <Edit className="w-4 h-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <Mail className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="audience" data-testid="tab-audience">
              <Users className="w-4 h-4 mr-2" />
              Audience
            </TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Create your email content manually or with AI assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Generation Section */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Content Generation
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-prompt">Describe your email campaign</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="E.g., Create a promotional email for our summer plumbing maintenance special offering 20% off..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="min-h-[100px]"
                        data-testid="input-ai-prompt"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="tone">Tone</Label>
                        <Select defaultValue="professional">
                          <SelectTrigger id="tone" data-testid="select-tone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            setIsGenerating(true);
                            generateAIMutation.mutate({
                              prompt: aiPrompt,
                              tone: "professional",
                              includePersonalization: true,
                            });
                            setIsGenerating(false);
                          }}
                          disabled={!aiPrompt || isGenerating}
                          data-testid="button-generate-ai"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Email Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject..."
                      value={emailContent.subject}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                      data-testid="input-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="html-content">HTML Content</Label>
                    <Textarea
                      id="html-content"
                      placeholder="Enter HTML email content..."
                      value={emailContent.htmlContent}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, htmlContent: e.target.value }))}
                      className="min-h-[300px] font-mono text-sm"
                      data-testid="input-html-content"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Available variables: {`{{customerName}}, {{companyName}}, {{currentYear}}, {{currentMonth}}`}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="text-content">Plain Text Version</Label>
                    <Textarea
                      id="text-content"
                      placeholder="Enter plain text version..."
                      value={emailContent.textContent}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, textContent: e.target.value }))}
                      className="min-h-[200px]"
                      data-testid="input-text-content"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Choose from pre-built templates or save your own</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates?.map((template) => (
                      <div
                        key={template.id}
                        className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => loadTemplate(template.id)}
                        data-testid={`template-${template.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{template.category}</Badge>
                              {template.tags?.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          {selectedTemplate === template.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Save as Template Button */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open save template dialog
                      const name = prompt("Template name:");
                      if (name) {
                        saveTemplateMutation.mutate({
                          name,
                          category: "custom",
                          tags: [],
                        });
                      }
                    }}
                    data-testid="button-save-template"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Current as Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Recipients</CardTitle>
                <CardDescription>Choose who will receive this email campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all-contacts"
                      name="recipient-type"
                      value="all"
                      checked={emailContent.recipientType === "all"}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, recipientType: e.target.value }))}
                    />
                    <Label htmlFor="all-contacts" className="cursor-pointer">
                      Send to all contacts with email addresses
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="segment"
                      name="recipient-type"
                      value="segment"
                      checked={emailContent.recipientType === "segment"}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, recipientType: e.target.value }))}
                    />
                    <Label htmlFor="segment" className="cursor-pointer">
                      Send to a customer segment
                    </Label>
                  </div>

                  {emailContent.recipientType === "segment" && (
                    <div className="ml-6 space-y-4">
                      {segmentsLoading ? (
                        <Skeleton className="h-32 w-full" />
                      ) : (
                        <div className="space-y-2">
                          {segments?.map((segment) => (
                            <div
                              key={segment.id}
                              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                                emailContent.segmentId === segment.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setEmailContent(prev => ({ ...prev, segmentId: segment.id }))}
                              data-testid={`segment-${segment.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{segment.name}</h4>
                                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                                </div>
                                <Badge>{segment.customerCount} customers</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="individual"
                      name="recipient-type"
                      value="individual"
                      checked={emailContent.recipientType === "individual"}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, recipientType: e.target.value }))}
                    />
                    <Label htmlFor="individual" className="cursor-pointer">
                      Send to specific email addresses
                    </Label>
                  </div>

                  {emailContent.recipientType === "individual" && (
                    <div className="ml-6">
                      <Textarea
                        placeholder="Enter email addresses separated by commas..."
                        value={emailContent.individualEmails}
                        onChange={(e) => setEmailContent(prev => ({ ...prev, individualEmails: e.target.value }))}
                        className="min-h-[100px]"
                        data-testid="input-individual-emails"
                      />
                    </div>
                  )}
                </div>

                {/* Schedule Options */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="font-semibold">Delivery Options</h3>
                  
                  <div>
                    <Label htmlFor="schedule">Schedule for later</Label>
                    <Input
                      id="schedule"
                      type="datetime-local"
                      value={emailContent.scheduledFor}
                      onChange={(e) => setEmailContent(prev => ({ ...prev, scheduledFor: e.target.value }))}
                      data-testid="input-schedule"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="test-mode"
                      checked={emailContent.testMode}
                      onCheckedChange={(checked) => setEmailContent(prev => ({ ...prev, testMode: checked }))}
                    />
                    <Label htmlFor="test-mode">Test mode (send to admin email only)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>See how your email will look to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-sm font-medium mb-1">Subject:</p>
                    <p className="text-lg">{emailContent.subject || "No subject"}</p>
                  </div>

                  <div className="rounded-lg border p-6 bg-white">
                    {emailContent.htmlContent ? (
                      <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                    ) : (
                      <p className="text-muted-foreground text-center py-12">No content to preview</p>
                    )}
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This is a preview with sample data. Actual emails will use real customer information.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setEmailContent({
                subject: "",
                htmlContent: "",
                textContent: "",
                recipientType: "all",
                segmentId: "",
                individualEmails: "",
                scheduledFor: "",
                testMode: false,
              });
              setSelectedTemplate("");
            }}
            data-testid="button-reset"
          >
            Reset
          </Button>
          <Button
            onClick={() => sendEmailMutation.mutate()}
            disabled={!emailContent.subject || !emailContent.htmlContent || sendEmailMutation.isPending}
            data-testid="button-send-campaign"
          >
            <Send className="w-4 h-4 mr-2" />
            {emailContent.testMode ? "Send Test" : emailContent.scheduledFor ? "Schedule Campaign" : "Send Campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}