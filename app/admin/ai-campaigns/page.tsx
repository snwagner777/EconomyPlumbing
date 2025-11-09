'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Wand2, 
  Eye, 
  Send, 
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CampaignType = 'email' | 'sms';
type EmailCampaignSubtype = 'review_request' | 'referral_nurture' | 'quote_followup' | 'custom';
type Strategy = 'value' | 'trust' | 'urgency' | 'social_proof' | 'educational' | 'seasonal';

interface GeneratedContent {
  subject?: string;
  preheader?: string;
  htmlContent?: string;
  plainTextContent?: string;
  smsBody?: string;
  strategy?: string;
  seasonalContext?: string;
}

export default function AIampCampaignGenerationPage() {
  const { toast } = useToast();
  const [campaignType, setCampaignType] = useState<CampaignType>('email');
  const [emailSubtype, setEmailSubtype] = useState<EmailCampaignSubtype>('custom');
  const [strategy, setStrategy] = useState<Strategy>('value');
  const [description, setDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'plain'>('html');
  const [copied, setCopied] = useState(false);

  // Generate AI content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!description.trim()) {
        throw new Error('Please provide a campaign description');
      }

      if (campaignType === 'email') {
        const response = await apiRequest('POST', '/api/admin/ai-campaigns/generate-email', {
          subtype: emailSubtype,
          strategy,
          description: description.trim(),
        });
        return await response.json();
      } else {
        // SMS generation
        const response = await apiRequest('POST', '/api/admin/ai-campaigns/generate-sms', {
          strategy,
          description: description.trim(),
        });
        return await response.json();
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: 'AI content generated successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Generation failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleRegenerate = () => {
    generateMutation.mutate();
  };

  const handleCopyContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const characterCount = campaignType === 'sms' && generatedContent?.smsBody 
    ? generatedContent.smsBody.length 
    : 0;
  const segmentCount = campaignType === 'sms' && generatedContent?.smsBody
    ? Math.ceil(generatedContent.smsBody.length / 160)
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Campaign Generation
          </h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered email and SMS campaigns with GPT-4o
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Configuration Panel */}
        <Card className="col-span-5 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Campaign Configuration</CardTitle>
            <CardDescription>
              Configure your campaign parameters and let AI generate the content
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Tabs value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" data-testid="tab-email">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="sms" data-testid="tab-sms">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      SMS
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Email Subtype (only for email) */}
              {campaignType === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email-subtype">Email Campaign Type</Label>
                  <Select value={emailSubtype} onValueChange={(v) => setEmailSubtype(v as EmailCampaignSubtype)}>
                    <SelectTrigger id="email-subtype" data-testid="select-email-subtype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Campaign</SelectItem>
                      <SelectItem value="review_request">Review Request</SelectItem>
                      <SelectItem value="referral_nurture">Referral Nurture</SelectItem>
                      <SelectItem value="quote_followup">Quote Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Strategy */}
              <div className="space-y-2">
                <Label htmlFor="strategy">Messaging Strategy</Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
                  <SelectTrigger id="strategy" data-testid="select-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Value-Focused</SelectItem>
                    <SelectItem value="trust">Trust-Building</SelectItem>
                    <SelectItem value="urgency">Urgency-Driven</SelectItem>
                    <SelectItem value="social_proof">Social Proof</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {strategy === 'value' && 'Focus on unique value proposition and benefits'}
                  {strategy === 'trust' && 'Build credibility through testimonials and reliability'}
                  {strategy === 'urgency' && 'Create time-sensitive offers or limited availability'}
                  {strategy === 'social_proof' && 'Highlight customer success stories and reviews'}
                  {strategy === 'educational' && 'Provide helpful information and insights'}
                  {strategy === 'seasonal' && 'Leverage seasonal context and timely messaging'}
                </p>
              </div>

              {/* Campaign Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Campaign Goal / Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={campaignType === 'email' 
                    ? "Describe your campaign goal, target audience, and key message. Example: 'Promote our new water heater installation special for homeowners. Emphasize energy savings and 0% financing.'"
                    : "Describe your SMS campaign goal. Example: 'Remind customers about annual water heater maintenance. Include limited-time discount code.'"}
                  rows={6}
                  data-testid="textarea-description"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length} characters
                  {campaignType === 'sms' && description.length > 500 && (
                    <span className="text-yellow-600 ml-2">
                      Keep it concise for SMS generation
                    </span>
                  )}
                </p>
              </div>

              {/* Strategy Tips */}
              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>AI Tips:</strong> Be specific about your goals, target audience, and desired tone. 
                  Mention any specific offers, deadlines, or seasonal context for better results.
                </AlertDescription>
              </Alert>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !description.trim()}
                className="w-full"
                size="lg"
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Campaign
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="col-span-7 flex flex-col overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Generated Content</CardTitle>
                <CardDescription>
                  {!generatedContent && 'Preview will appear here after generation'}
                  {generatedContent && campaignType === 'email' && 'Email preview and content'}
                  {generatedContent && campaignType === 'sms' && 'SMS message preview'}
                </CardDescription>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={generateMutation.isPending}
                    data-testid="button-regenerate"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {!generatedContent ? (
              <div className="flex-1 flex items-center justify-center text-center p-12">
                <div>
                  <Wand2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content generated yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your campaign parameters and click "Generate Campaign" to create AI-powered content
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden gap-4">
                {campaignType === 'email' ? (
                  <>
                    {/* Email Metadata */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Subject Line</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={generatedContent.subject || ''}
                            readOnly
                            className="font-medium"
                            data-testid="input-subject"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyContent(generatedContent.subject || '')}
                            data-testid="button-copy-subject"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {generatedContent.subject?.length || 0} characters
                        </p>
                      </div>

                      {generatedContent.preheader && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Preheader</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={generatedContent.preheader}
                              readOnly
                              data-testid="input-preheader"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyContent(generatedContent.preheader || '')}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      {generatedContent.strategy && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{generatedContent.strategy}</Badge>
                          {generatedContent.seasonalContext && (
                            <Badge variant="secondary">{generatedContent.seasonalContext}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Email Preview Tabs */}
                    <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'html' | 'plain')} className="flex-1 flex flex-col overflow-hidden">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="html" data-testid="tab-html-preview">
                          <Eye className="w-4 h-4 mr-2" />
                          HTML Preview
                        </TabsTrigger>
                        <TabsTrigger value="plain" data-testid="tab-plain-preview">
                          Plain Text
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="html" className="flex-1 mt-4 overflow-hidden">
                        <ScrollArea className="h-full border rounded-lg p-4 bg-white dark:bg-slate-950">
                          <div
                            dangerouslySetInnerHTML={{ __html: generatedContent.htmlContent || '' }}
                            className="prose dark:prose-invert max-w-none"
                            data-testid="html-preview"
                          />
                        </ScrollArea>
                      </TabsContent>
                      <TabsContent value="plain" className="flex-1 mt-4 overflow-hidden">
                        <ScrollArea className="h-full">
                          <Textarea
                            value={generatedContent.plainTextContent || ''}
                            readOnly
                            className="min-h-[400px] font-mono text-sm"
                            data-testid="textarea-plain-preview"
                          />
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <>
                    {/* SMS Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>SMS Message</Label>
                        <div className="flex gap-2">
                          <Badge variant="outline">{characterCount} chars</Badge>
                          <Badge variant={segmentCount > 1 ? 'destructive' : 'secondary'}>
                            {segmentCount} segment{segmentCount !== 1 && 's'}
                          </Badge>
                        </div>
                      </div>

                      {segmentCount > 1 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This message is {segmentCount} SMS segments. Consider shortening to reduce costs.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="max-w-sm mx-auto">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm p-4 shadow-sm">
                            <p className="whitespace-pre-wrap break-words text-sm" data-testid="sms-preview">
                              {generatedContent.smsBody}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Preview - actual delivery may vary by carrier
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          value={generatedContent.smsBody || ''}
                          readOnly
                          rows={6}
                          className="flex-1"
                          data-testid="textarea-sms"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyContent(generatedContent.smsBody || '')}
                          data-testid="button-copy-sms"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>

                      {generatedContent.strategy && (
                        <Badge variant="outline">{generatedContent.strategy}</Badge>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" data-testid="button-save-draft">
                    Save as Draft
                  </Button>
                  <Button className="flex-1" data-testid="button-use-campaign">
                    <Send className="w-4 h-4 mr-2" />
                    Use in Campaign
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
