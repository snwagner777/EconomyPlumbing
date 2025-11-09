'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Sparkles, CheckCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function ReferralTrackingSection() {
  const { data, isLoading } = useQuery<{referrals: any[], stats: any}>({
    queryKey: ['/api/admin/referrals'],
  });

  if (isLoading) {
    return <div className="space-y-4">{Array(5).fill(0).map((_, i) => (
      <Skeleton key={i} className="h-24" />
    ))}</div>;
  }

  const stats = data?.stats || {};
  const referrals = data?.referrals || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{stats.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{stats.completed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">${((stats.totalRevenue || 0) / 100).toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Latest {referrals.length} referral submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No referrals yet</p>
          ) : (
            <div className="space-y-4">
              {referrals.slice(0, 10).map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{ref.refereeName}</p>
                    <p className="text-sm text-muted-foreground">Referred by: {ref.referrerName}</p>
                    <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {ref.status}
                    </Badge>
                  </div>
                  {ref.jobAmount && (
                    <p className="text-lg font-semibold">${(ref.jobAmount / 100).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralEmailTemplatesSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'history'>('settings');
  
  // Settings state
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [thankYouPrompt, setThankYouPrompt] = useState('');
  const [successPrompt, setSuccessPrompt] = useState('');
  
  // Preview state
  const [previewType, setPreviewType] = useState<'thank_you' | 'success'>('thank_you');
  const [previewEmail, setPreviewEmail] = useState<any>(null);
  
  // Load settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/referral-email-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/referral-email-settings', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load settings');
      return response.json();
    },
  });
  
  // Load email history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/admin/email-send-log'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-send-log?type=referral', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load history');
      return response.json();
    },
  });
  
  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setBrandGuidelines(settings.brandGuidelines || '');
      setThankYouPrompt(settings.thankYouCustomPrompt || '');
      setSuccessPrompt(settings.successCustomPrompt || '');
    }
  }, [settings]);
  
  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/api/admin/referral-email-settings', {
        brandGuidelines,
        thankYouCustomPrompt: thankYouPrompt,
        successCustomPrompt: successPrompt,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral-email-settings'] });
      toast({
        title: "Settings Saved",
        description: "Template customizations will apply to all future emails.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/referral-email-preview', {
        emailType: previewType,
        customPrompt: previewType === 'thank_you' ? thankYouPrompt : successPrompt,
        brandGuidelines,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewEmail(data);
      toast({
        title: "Preview Generated",
        description: "Review the AI-generated email below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Email Template Customization</CardTitle>
          <CardDescription>
            Customize how AI generates referral emails (thank-you & success notifications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">Email History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-guidelines">Brand Guidelines (applies to both email types)</Label>
                  <Textarea
                    id="brand-guidelines"
                    value={brandGuidelines}
                    onChange={(e) => setBrandGuidelines(e.target.value)}
                    placeholder="e.g., Always mention our 100% satisfaction guarantee, emphasize family-owned business, use friendly Austin-area references..."
                    rows={4}
                    data-testid="input-brand-guidelines"
                  />
                  <p className="text-sm text-muted-foreground">
                    These guidelines augment the default professional tone
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="thank-you-prompt">Thank You Email Custom Instructions</Label>
                  <Textarea
                    id="thank-you-prompt"
                    value={thankYouPrompt}
                    onChange={(e) => setThankYouPrompt(e.target.value)}
                    placeholder="e.g., Extra emphasis on how much we appreciate their trust, mention our referral program details..."
                    rows={4}
                    data-testid="input-thank-you-prompt"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sent when customer submits a referral
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="success-prompt">Success Notification Custom Instructions</Label>
                  <Textarea
                    id="success-prompt"
                    value={successPrompt}
                    onChange={(e) => setSuccessPrompt(e.target.value)}
                    placeholder="e.g., Celebrate their success, remind them they can refer more people, suggest seasonal services..."
                    rows={4}
                    data-testid="input-success-prompt"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sent when referral becomes a customer ($25 credit issued)
                  </p>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Email Type:</Label>
                  <Select value={previewType} onValueChange={(v: any) => setPreviewType(v)}>
                    <SelectTrigger className="w-[250px]" data-testid="select-preview-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thank_you">Thank You (Referral Submitted)</SelectItem>
                      <SelectItem value="success">Success (Referral Converted)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => previewMutation.mutate()}
                    disabled={previewMutation.isPending}
                    data-testid="button-generate-preview"
                  >
                    {previewMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Preview
                      </>
                    )}
                  </Button>
                </div>
                
                {previewEmail && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <div className="p-3 bg-muted rounded-md" data-testid="preview-subject">
                        {previewEmail.subject}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>HTML Preview</Label>
                      <div
                        className="border rounded-md p-4 bg-background max-h-[500px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: previewEmail.bodyHtml }}
                        data-testid="preview-html"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Plain Text Version</Label>
                      <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm max-h-[300px] overflow-y-auto" data-testid="preview-plain">
                        {previewEmail.bodyPlain}
                      </div>
                    </div>
                  </div>
                )}
                
                {!previewEmail && (
                  <div className="text-center p-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an email type and click Generate Preview</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4 mt-6">
              {historyLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {history?.emails?.length || 0} referral emails sent
                    </p>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history?.emails?.length > 0 ? (
                          history.emails.map((email: any) => (
                            <TableRow key={email.id} data-testid={`history-row-${email.id}`}>
                              <TableCell className="text-sm">
                                {format(new Date(email.sentAt), 'MMM d, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {email.emailType === 'referrer_thank_you' ? 'Thank You' : 'Success'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{email.recipientEmail}</TableCell>
                              <TableCell className="text-sm max-w-[300px] truncate">{email.subject}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">Sent</span>
                                  {email.openedAt && (
                                    <Badge variant="secondary" className="text-xs">Opened</Badge>
                                  )}
                                  {email.clickedAt && (
                                    <Badge variant="secondary" className="text-xs">Clicked</Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              No referral emails sent yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'emails'>('tracking');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Referral System</h1>
        <p className="text-muted-foreground mb-6">
          Manage referral tracking, AI email templates, and campaign history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="tracking" data-testid="tab-tracking">Referral Tracking</TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracking" className="mt-6">
          <ReferralTrackingSection />
        </TabsContent>
        
        <TabsContent value="emails" className="mt-6">
          <ReferralEmailTemplatesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
