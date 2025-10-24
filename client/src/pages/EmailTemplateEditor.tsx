import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, Sparkles, Eye, Code, FileText, RefreshCw, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface EmailTemplate {
  id: string;
  campaignType: string;
  emailNumber: number;
  subject: string;
  preheader: string | null;
  bodyHtml: string;
  bodyPlain: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplateEditor() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'plain'>('visual');
  
  // Edit form state
  const [editSubject, setEditSubject] = useState("");
  const [editPreheader, setEditPreheader] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editBodyPlain, setEditBodyPlain] = useState("");

  // Generate form state
  const [generateCampaignType, setGenerateCampaignType] = useState<'review_request' | 'referral_nurture'>('review_request');
  const [generateEmailNumber, setGenerateEmailNumber] = useState<1 | 2 | 3 | 4>(1);
  const [generateStrategy, setGenerateStrategy] = useState("");

  // Fetch all templates
  const { data: templatesData, isLoading } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['/api/admin/emails/templates'],
  });

  const templates = templatesData?.templates || [];

  // Generate email mutation
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/generate", params);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Generated",
        description: "AI has created your email. Review and save if you like it."
      });
      // Pre-populate edit dialog with generated content
      setEditSubject(data.subject);
      setEditPreheader(data.preheader || "");
      setEditBodyHtml(data.bodyHtml);
      setEditBodyPlain(data.bodyPlain || "");
      setGenerateDialogOpen(false);
      setEditDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email",
        variant: "destructive"
      });
    }
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/admin/emails/save-template", params);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/emails/templates'] });
      setEditDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  });

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditPreheader(template.preheader || "");
    setEditBodyHtml(template.bodyHtml);
    setEditBodyPlain(template.bodyPlain || "");
    setEditDialogOpen(true);
  };

  const handleGenerateEmail = () => {
    // Mock job details for preview generation
    const mockJobDetails = {
      customerId: 12345,
      customerName: "John Smith",
      serviceType: "Water Heater Installation",
      jobAmount: 185000, // $1,850.00
      jobDate: new Date(),
      location: "Austin, TX"
    };

    generateMutation.mutate({
      campaignType: generateCampaignType,
      emailNumber: generateEmailNumber,
      jobDetails: mockJobDetails,
      phoneNumber: "(512) 276-1690",
      strategy: generateStrategy || undefined
    });
  };

  const handleSaveTemplate = () => {
    if (!editSubject.trim() || !editBodyHtml.trim()) {
      toast({
        title: "Missing Fields",
        description: "Subject and HTML body are required",
        variant: "destructive"
      });
      return;
    }

    const campaignType = selectedTemplate?.campaignType || generateCampaignType;
    const emailNumber = selectedTemplate?.emailNumber || generateEmailNumber;

    saveMutation.mutate({
      campaignType,
      emailNumber,
      subject: editSubject,
      preheader: editPreheader,
      bodyHtml: editBodyHtml,
      bodyPlain: editBodyPlain,
      isActive: true
    });
  };

  const getTemplateTitle = (template: EmailTemplate) => {
    const type = template.campaignType === 'review_request' ? 'Review Request' : 'Referral Nurture';
    return `${type} - Email ${template.emailNumber}`;
  };

  const getTemplateDescription = (template: EmailTemplate) => {
    if (template.campaignType === 'review_request') {
      const days = [1, 7, 14, 21][template.emailNumber - 1];
      return `Sent ${days} day${days > 1 ? 's' : ''} after job completion`;
    } else {
      const days = [14, 60, 150, 210][template.emailNumber - 1];
      return `Sent ${days} days after positive review`;
    }
  };

  // Group templates by campaign type
  const reviewTemplates = templates.filter((t: EmailTemplate) => t.campaignType === 'review_request');
  const referralTemplates = templates.filter((t: EmailTemplate) => t.campaignType === 'referral_nurture');

  return (
    <>
      <SEOHead
        title="Email Template Editor | Economy Plumbing"
        description="Manage review and referral email templates"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Email Template Editor</h1>
              <p className="text-muted-foreground">
                Manage and customize review request and referral nurture email templates
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                data-testid="button-generate-new"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/admin/review-requests"}
                data-testid="button-back-to-admin"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Back to Review Admin
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Review Request Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Request Drip Campaign</CardTitle>
                  <CardDescription>
                    4-email sequence sent over 21 days after job completion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map(num => {
                    const template = reviewTemplates.find((t: EmailTemplate) => t.emailNumber === num);
                    return (
                      <div
                        key={num}
                        className="p-4 border rounded-lg hover-elevate"
                        data-testid={`template-review-${num}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">
                              Email {num} - {template ? template.subject : 'Not Created'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {template ? getTemplateDescription(template) : `Day ${[1, 7, 14, 21][num - 1]}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {template ? (
                              <>
                                <Badge variant={template.isActive ? "default" : "outline"}>
                                  {template.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                  data-testid={`button-edit-review-${num}`}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setGenerateCampaignType('review_request');
                                  setGenerateEmailNumber(num as 1 | 2 | 3 | 4);
                                  setGenerateDialogOpen(true);
                                }}
                                data-testid={`button-create-review-${num}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Create
                              </Button>
                            )}
                          </div>
                        </div>
                        {template && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Preview:</strong> {template.preheader || 'No preheader'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Referral Nurture Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Nurture Campaign</CardTitle>
                  <CardDescription>
                    4-email sequence sent over 6 months to happy reviewers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map(num => {
                    const template = referralTemplates.find((t: EmailTemplate) => t.emailNumber === num);
                    return (
                      <div
                        key={num}
                        className="p-4 border rounded-lg hover-elevate"
                        data-testid={`template-referral-${num}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">
                              Email {num} - {template ? template.subject : 'Not Created'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {template ? getTemplateDescription(template) : `Day ${[14, 60, 150, 210][num - 1]}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {template ? (
                              <>
                                <Badge variant={template.isActive ? "default" : "outline"}>
                                  {template.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                  data-testid={`button-edit-referral-${num}`}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setGenerateCampaignType('referral_nurture');
                                  setGenerateEmailNumber(num as 1 | 2 | 3 | 4);
                                  setGenerateDialogOpen(true);
                                }}
                                data-testid={`button-create-referral-${num}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Create
                              </Button>
                            )}
                          </div>
                        </div>
                        {template && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Preview:</strong> {template.preheader || 'No preheader'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Generate AI Email Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent data-testid="dialog-generate-email">
          <DialogHeader>
            <DialogTitle>Generate Email with AI</DialogTitle>
            <DialogDescription>
              Use AI to create a personalized email template based on best practices
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <select
                id="campaign-type"
                className="w-full border rounded-md p-2"
                value={generateCampaignType}
                onChange={(e) => setGenerateCampaignType(e.target.value as any)}
                data-testid="select-campaign-type"
              >
                <option value="review_request">Review Request</option>
                <option value="referral_nurture">Referral Nurture</option>
              </select>
            </div>
            <div>
              <Label htmlFor="email-number">Email Number in Sequence</Label>
              <select
                id="email-number"
                className="w-full border rounded-md p-2"
                value={generateEmailNumber}
                onChange={(e) => setGenerateEmailNumber(parseInt(e.target.value) as any)}
                data-testid="select-email-number"
              >
                <option value="1">Email 1 (First contact)</option>
                <option value="2">Email 2 (Follow-up)</option>
                <option value="3">Email 3 (Social proof)</option>
                <option value="4">Email 4 (Final reminder)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="strategy">Strategy (Optional)</Label>
              <select
                id="strategy"
                className="w-full border rounded-md p-2"
                value={generateStrategy}
                onChange={(e) => setGenerateStrategy(e.target.value)}
                data-testid="select-strategy"
              >
                <option value="">Auto (Recommended)</option>
                <option value="value">Value-focused</option>
                <option value="trust">Trust-building</option>
                <option value="urgency">Urgency-driven</option>
                <option value="social_proof">Social Proof</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                data-testid="button-cancel-generate"
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
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Preview Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-template">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? getTemplateTitle(selectedTemplate) : 'New Email Template'}
            </DialogTitle>
            <DialogDescription>
              Preview and edit email content. Use AI to regenerate if needed.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visual" data-testid="tab-visual">
                <Eye className="w-4 h-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html" data-testid="tab-html">
                <Code className="w-4 h-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="plain" data-testid="tab-plain">
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
                <Label htmlFor="edit-preheader">Preheader Text (Optional)</Label>
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
                    className="min-h-[400px]"
                    data-testid="textarea-plain"
                  />
                </div>
              </TabsContent>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedTemplate(null);
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setGenerateDialogOpen(true);
                }}
                data-testid="button-regenerate"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate with AI
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={saveMutation.isPending}
                data-testid="button-save-template"
              >
                {saveMutation.isPending ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
