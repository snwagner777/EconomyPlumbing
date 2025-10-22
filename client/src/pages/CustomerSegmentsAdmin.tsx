import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, TrendingUp, Calendar, Sparkles, AlertCircle, 
  PlayCircle, Mail, MessageSquare, FileText, Eye, 
  BarChart, RefreshCw, Settings, CheckCircle, XCircle,
  ChevronDown, ChevronUp, DollarSign, Target, Brain,
  Wand2, Clock, Edit
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomerSegment } from "@shared/schema";

type SegmentWithDetails = CustomerSegment & {
  memberCount: number;
  totalRevenue?: number;
  totalJobsBooked?: number;
  aiReasoning?: string;
  recommendedActions?: string[];
  potentialRevenue?: number;
  urgencyLevel?: 'low' | 'medium' | 'high';
};

type AnalysisResult = {
  segmentIds: string[];
  analysis: {
    opportunitiesFound: number;
    totalCustomersAnalyzed: number;
    analysisDate: string;
  };
};

type GeneratedCampaign = {
  id: string;
  segmentId: string;
  channel: 'email' | 'sms' | 'newsletter';
  subject?: string;
  content: string;
  status: 'draft' | 'pending_approval' | 'approved';
  generatedAt: string;
};

export default function CustomerSegmentsAdmin() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<SegmentWithDetails | null>(null);
  const [generatedCampaigns, setGeneratedCampaigns] = useState<GeneratedCampaign[]>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingReasoning, setEditingReasoning] = useState(false);
  const [editedReasoning, setEditedReasoning] = useState("");

  // Fetch all segments with details
  const { data: segmentsData, isLoading, refetch } = useQuery<{ segments: SegmentWithDetails[] }>({
    queryKey: ['/api/admin/segments'],
  });

  // Mutation for triggering AI analysis
  const runAnalysis = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setAnalysisProgress(10);
      
      // Start AI analysis
      const response = await apiRequest('POST', '/api/admin/ai-segmentation/analyze');
      const result = await response.json() as AnalysisResult;

      setAnalysisProgress(100);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "AI Analysis Complete",
        description: `Found ${data.analysis.opportunitiesFound} opportunities across ${data.analysis.totalCustomersAnalyzed} customers`,
      });
      refetch();
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze customer data. Please try again.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  });

  // Mutation for generating campaigns
  const generateCampaign = useMutation({
    mutationFn: async ({ segmentId, channel }: { segmentId: string; channel: 'email' | 'sms' | 'newsletter' }) => {
      const response = await apiRequest('POST', '/api/admin/segments/generate-campaign', { segmentId, channel });
      const result = await response.json() as GeneratedCampaign;
      return result;
    },
    onSuccess: (data) => {
      setGeneratedCampaigns(prev => [...prev, data]);
      toast({
        title: "Campaign Generated",
        description: `${data.channel} campaign created and ready for review`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate campaign. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for refreshing segment members
  const refreshSegment = useMutation({
    mutationFn: async (segmentId: string) => {
      const response = await apiRequest('POST', `/api/admin/segments/${segmentId}/refresh`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Segment Refreshed",
        description: "Segment members have been updated",
      });
      refetch();
    }
  });

  // Mutation for updating segment
  const updateSegment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SegmentWithDetails> }) => {
      const response = await apiRequest('PATCH', `/api/admin/segments/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Segment Updated",
        description: "Changes saved successfully",
      });
      refetch();
    }
  });

  const segments = segmentsData?.segments || [];
  const activeSegments = segments.filter(s => s.status === 'active');
  const pendingApproval = segments.filter(s => s.status === 'pending_approval' || s.status === 'draft');
  const pausedSegments = segments.filter(s => s.status === 'paused');

  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const renderSegmentCard = (segment: SegmentWithDetails): JSX.Element => (
    <Card key={segment.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg" data-testid={`text-segment-name-${segment.id}`}>
                {segment.name}
              </CardTitle>
              <Badge
                variant={segment.status === 'active' ? 'default' : segment.status === 'paused' ? 'secondary' : 'outline'}
                data-testid={`badge-status-${segment.id}`}
              >
                {segment.status}
              </Badge>
              <Badge
                variant={segment.segmentType === 'evergreen' ? 'default' : 'secondary'}
                data-testid={`badge-type-${segment.id}`}
              >
                {segment.segmentType}
              </Badge>
              {segment.generatedByAI && (
                <Badge className="bg-purple-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              )}
              {segment.urgencyLevel && (
                <Badge variant="outline" className={getUrgencyColor(segment.urgencyLevel)}>
                  <Target className="w-3 h-3 mr-1" />
                  {segment.urgencyLevel} urgency
                </Badge>
              )}
            </div>
            
            {segment.description && (
              <CardDescription className="mb-3" data-testid={`text-segment-description-${segment.id}`}>
                {segment.description}
              </CardDescription>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{segment.memberCount}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
              </div>
              
              {segment.potentialRevenue && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">
                      ${(segment.potentialRevenue / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Potential</div>
                  </div>
                </div>
              )}
              
              {segment.totalRevenue !== undefined && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">
                      ${(segment.totalRevenue / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Actual Revenue</div>
                  </div>
                </div>
              )}
              
              {segment.totalJobsBooked !== undefined && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">{segment.totalJobsBooked}</div>
                    <div className="text-xs text-muted-foreground">Jobs Booked</div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Reasoning Collapsible */}
            {segment.aiReasoning && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mb-2">
                    <Brain className="w-4 h-4 mr-2" />
                    View AI Analysis
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-muted p-3 rounded-md mb-3">
                    {editingReasoning && selectedSegment?.id === segment.id ? (
                      <div className="space-y-2">
                        <Label>Edit AI Reasoning</Label>
                        <Textarea
                          value={editedReasoning}
                          onChange={(e) => setEditedReasoning(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              updateSegment.mutate({ 
                                id: segment.id, 
                                updates: { aiReasoning: editedReasoning }
                              });
                              setEditingReasoning(false);
                            }}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingReasoning(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-xs font-medium text-muted-foreground">AI Reasoning:</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSegment(segment);
                              setEditedReasoning(segment.aiReasoning || '');
                              setEditingReasoning(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm">{segment.aiReasoning}</p>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Recommended Actions */}
            {segment.recommendedActions && segment.recommendedActions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-3">
                <div className="text-xs font-medium mb-2 flex items-center gap-2">
                  <Wand2 className="w-3 h-3" />
                  Recommended Actions:
                </div>
                <ul className="text-xs space-y-1">
                  {segment.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Criteria */}
            {segment.targetCriteria && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    View Criteria
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <pre className="text-xs overflow-x-auto" data-testid={`text-criteria-${segment.id}`}>
                      {JSON.stringify(segment.targetCriteria, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex flex-wrap gap-2">
        {/* Action Buttons */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => refreshSegment.mutate(segment.id)}
          disabled={refreshSegment.isPending}
          data-testid={`button-refresh-${segment.id}`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshSegment.isPending ? 'animate-spin' : ''}`} />
          Refresh Members
        </Button>

        <Button
          size="sm"
          onClick={() => {
            setSelectedSegment(segment);
            generateCampaign.mutate({ segmentId: segment.id, channel: 'email' });
          }}
          disabled={generateCampaign.isPending}
          data-testid={`button-email-campaign-${segment.id}`}
        >
          <Mail className="w-4 h-4 mr-2" />
          Generate Email
        </Button>

        <Button
          size="sm"
          onClick={() => {
            setSelectedSegment(segment);
            generateCampaign.mutate({ segmentId: segment.id, channel: 'sms' });
          }}
          disabled={generateCampaign.isPending}
          data-testid={`button-sms-campaign-${segment.id}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Generate SMS
        </Button>

        <Button
          size="sm"
          onClick={() => {
            setSelectedSegment(segment);
            generateCampaign.mutate({ segmentId: segment.id, channel: 'newsletter' });
          }}
          disabled={generateCampaign.isPending}
          data-testid={`button-newsletter-${segment.id}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Newsletter
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedSegment(segment);
            setShowCampaignDialog(true);
          }}
          data-testid={`button-view-campaigns-${segment.id}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Campaigns
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            updateSegment.mutate({
              id: segment.id,
              updates: { status: segment.status === 'active' ? 'paused' : 'active' }
            });
          }}
          data-testid={`button-toggle-status-${segment.id}`}
        >
          {segment.status === 'active' ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </Button>
      </CardFooter>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Customer Segments</h2>
          <p className="text-muted-foreground">
            AI-powered customer segmentation with automated marketing generation
          </p>
        </div>
        <Button
          onClick={() => runAnalysis.mutate()}
          disabled={isAnalyzing}
          data-testid="button-run-ai-analysis"
        >
          <Brain className="w-4 h-4 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={analysisProgress} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Analyzing ServiceTitan data to identify marketing opportunities...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Approval Alert */}
      {pendingApproval.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span>You have {pendingApproval.length} segments awaiting approval.</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 hover:bg-transparent text-primary underline underline-offset-4"
              onClick={() => setShowApprovalDialog(true)}
              data-testid="button-review-pending"
            >
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-segments-count">
              {activeSegments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeSegments.reduce((sum, s) => sum + s.memberCount, 0)} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${((segments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0)) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From all segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Booked</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-jobs">
              {segments.reduce((sum, s) => sum + (s.totalJobsBooked || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From targeted campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-potential-revenue">
              ${((segments.reduce((sum, s) => sum + (s.potentialRevenue || 0), 0)) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segments List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" data-testid="tab-active-segments">
            Active ({activeSegments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-segments">
            Pending Approval ({pendingApproval.length})
          </TabsTrigger>
          <TabsTrigger value="paused" data-testid="tab-paused-segments">
            Paused ({pausedSegments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeSegments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No active segments</p>
                <Button onClick={() => runAnalysis.mutate()}>
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeSegments.map(renderSegmentCard)
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingApproval.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No segments pending approval</p>
              </CardContent>
            </Card>
          ) : (
            pendingApproval.map(renderSegmentCard)
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          {pausedSegments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No paused segments</p>
              </CardContent>
            </Card>
          ) : (
            pausedSegments.map(renderSegmentCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Preview Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generated Campaigns for {selectedSegment?.name}</DialogTitle>
            <DialogDescription>
              Review and approve AI-generated marketing campaigns
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] mt-4">
            {generatedCampaigns.filter(c => c.segmentId === selectedSegment?.id).length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No campaigns generated yet</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    size="sm"
                    onClick={() => generateCampaign.mutate({ segmentId: selectedSegment?.id || '', channel: 'email' })}
                  >
                    Generate Email
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generateCampaign.mutate({ segmentId: selectedSegment?.id || '', channel: 'sms' })}
                  >
                    Generate SMS
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedCampaigns
                  .filter(c => c.segmentId === selectedSegment?.id)
                  .map(campaign => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {campaign.channel === 'email' && <Mail className="w-4 h-4" />}
                            {campaign.channel === 'sms' && <MessageSquare className="w-4 h-4" />}
                            {campaign.channel === 'newsletter' && <FileText className="w-4 h-4" />}
                            <CardTitle className="text-sm">
                              {campaign.channel.charAt(0).toUpperCase() + campaign.channel.slice(1)} Campaign
                            </CardTitle>
                          </div>
                          <Badge variant={campaign.status === 'approved' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {campaign.subject && (
                          <div className="mb-2">
                            <Label className="text-xs">Subject:</Label>
                            <p className="font-medium">{campaign.subject}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">Content:</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{campaign.content}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="default">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}