'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Play, XCircle, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type AuditTool = 'lighthouse' | 'site-audit-seo' | 'seo-analyzer';
type AuditScope = 'single' | 'batch' | 'full-crawl';
type AuditStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

interface AuditJob {
  id: string;
  tool: AuditTool;
  scope: AuditScope;
  targetUrl?: string;
  batchId?: string;
  status: AuditStatus;
  errorMessage?: string;
  config?: any;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  triggeredBy?: string;
  result?: AuditResult;
}

interface AuditResult {
  id: string;
  jobId: string;
  lighthouseScores?: {
    performance?: number;
    seo?: number;
    accessibility?: number;
    bestPractices?: number;
  };
  seoFindings?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    url?: string;
    recommendation: string;
  }>;
  topRecommendations?: string[];
  pageCount?: number;
  duration?: number;
  rawOutput?: string;
  createdAt: string;
}

interface Batch {
  id: string;
  label: string;
  description?: string;
  pages: Array<{ url: string; label: string }>;
  createdBy?: string;
  createdAt: string;
}

export default function SeoAuditsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('run');
  
  const [tool, setTool] = useState<AuditTool>('lighthouse');
  const [scope, setScope] = useState<AuditScope>('single');
  const [targetUrl, setTargetUrl] = useState('https://plumbersthatcare.com');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [preset, setPreset] = useState<'mobile' | 'desktop'>('mobile');
  const [maxDepth, setMaxDepth] = useState(5);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<AuditJob[]>({
    queryKey: ['/api/admin/seo-audits'],
    refetchInterval: 5000,
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['/api/admin/seo-audits/batches'],
  });

  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  const createAuditMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/seo-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create audit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo-audits'] });
      toast({ title: 'Audit queued', description: 'Your SEO audit has been added to the queue.' });
      setActiveTab('history');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/admin/seo-audits/${jobId}/cancel`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to cancel job');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo-audits'] });
      toast({ title: 'Job cancelled', description: 'The audit job has been cancelled.' });
    },
  });

  const handleRunAudit = () => {
    const config: any = {};
    
    if (tool === 'lighthouse') {
      config.preset = preset;
      config.categories = ['performance', 'seo', 'accessibility', 'best-practices'];
    } else if (tool === 'site-audit-seo') {
      config.maxDepth = maxDepth;
    }

    createAuditMutation.mutate({
      tool,
      scope,
      targetUrl: scope === 'single' || scope === 'full-crawl' ? targetUrl : undefined,
      batchId: scope === 'batch' ? selectedBatch : undefined,
      config,
    });
  };

  const getStatusBadge = (status: AuditStatus) => {
    const variants: Record<AuditStatus, any> = {
      queued: <Badge data-testid={`badge-status-queued`} variant="secondary"><Clock className="w-3 h-3 mr-1" />Queued</Badge>,
      running: <Badge data-testid={`badge-status-running`} variant="default"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>,
      succeeded: <Badge data-testid={`badge-status-succeeded`} variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>,
      failed: <Badge data-testid={`badge-status-failed`} variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>,
      cancelled: <Badge data-testid={`badge-status-cancelled`} variant="outline"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>,
    };
    return variants[status];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SEO Audits</h1>
        <p className="text-muted-foreground">Run local SEO and performance audits using Lighthouse, site-audit-seo, and seo-analyzer</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="run" data-testid="tab-run-audit">Run Audit</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">Batch Sets</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Audit</CardTitle>
              <CardDescription>Select a tool and configure your SEO audit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tool">Tool</Label>
                  <Select value={tool} onValueChange={(v) => setTool(v as AuditTool)}>
                    <SelectTrigger id="tool" data-testid="select-tool">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lighthouse" data-testid="option-lighthouse">Lighthouse (Performance + SEO)</SelectItem>
                      <SelectItem value="site-audit-seo" data-testid="option-site-audit">Site Audit SEO (Full Crawl)</SelectItem>
                      <SelectItem value="seo-analyzer" data-testid="option-seo-analyzer">SEO Analyzer (Quick Check)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as AuditScope)}>
                    <SelectTrigger id="scope" data-testid="select-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single" data-testid="option-single">Single URL</SelectItem>
                      <SelectItem value="batch" data-testid="option-batch">Batch (Multiple URLs)</SelectItem>
                      <SelectItem value="full-crawl" data-testid="option-full-crawl">Full Site Crawl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(scope === 'single' || scope === 'full-crawl') && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    data-testid="input-url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://plumbersthatcare.com"
                  />
                </div>
              )}

              {scope === 'batch' && (
                <div className="space-y-2">
                  <Label htmlFor="batch">Select Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger id="batch" data-testid="select-batch">
                      <SelectValue placeholder="Choose a batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.label} ({batch.pages.length} pages)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tool === 'lighthouse' && (
                <div className="space-y-2">
                  <Label htmlFor="preset">Device</Label>
                  <Select value={preset} onValueChange={(v) => setPreset(v as 'mobile' | 'desktop')}>
                    <SelectTrigger id="preset" data-testid="select-preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile" data-testid="option-mobile">Mobile</SelectItem>
                      <SelectItem value="desktop" data-testid="option-desktop">Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(tool === 'site-audit-seo' || scope === 'full-crawl') && (
                <div className="space-y-2">
                  <Label htmlFor="depth">Max Crawl Depth</Label>
                  <Input
                    id="depth"
                    data-testid="input-depth"
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value) || 5)}
                    min={1}
                    max={10}
                  />
                </div>
              )}

              <Button
                data-testid="button-run-audit"
                onClick={handleRunAudit}
                disabled={createAuditMutation.isPending || (scope === 'batch' && !selectedBatch)}
                className="w-full"
              >
                {createAuditMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting Audit...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Run Audit</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {jobsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No audits yet. Run your first audit to get started!
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Audit History</CardTitle>
                <CardDescription>View past and ongoing SEO audits</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>URL/Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scores</TableHead>
                      <TableHead>Queued</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-tool-${job.tool}`}>{job.tool}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`text-url-${job.id}`}>
                          {job.targetUrl || `Batch (${job.batchId})`}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {job.result?.lighthouseScores && (
                            <div className="flex gap-2 text-sm">
                              <span className={getScoreColor(job.result.lighthouseScores.performance || 0)} data-testid={`score-performance-${job.id}`}>
                                P:{job.result.lighthouseScores.performance}
                              </span>
                              <span className={getScoreColor(job.result.lighthouseScores.seo || 0)} data-testid={`score-seo-${job.id}`}>
                                S:{job.result.lighthouseScores.seo}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-queued-${job.id}`}>
                          {format(new Date(job.queuedAt), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {job.status === 'succeeded' && (
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-${job.id}`}
                                onClick={() => {
                                  setSelectedJob(job.id);
                                  setActiveTab('history');
                                }}
                              >
                                View
                              </Button>
                            )}
                            {(job.status === 'queued' || job.status === 'running') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                data-testid={`button-cancel-${job.id}`}
                                onClick={() => cancelJobMutation.mutate(job.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {selectedJobData?.result && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Audit Results</h3>
                    
                    {selectedJobData.result.lighthouseScores && (
                      <div className="grid grid-cols-4 gap-4">
                        {Object.entries(selectedJobData.result.lighthouseScores).map(([key, value]) => (
                          <Card key={key}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm capitalize">{key.replace('bestPractices', 'Best Practices')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-3xl font-bold ${getScoreColor(typeof value === 'number' ? value : 0)}`}>
                                {value}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {selectedJobData.result.topRecommendations && selectedJobData.result.topRecommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Top Recommendations</h4>
                        <ul className="space-y-2">
                          {selectedJobData.result.topRecommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex gap-2 items-start">
                              <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedJobData.result.seoFindings && selectedJobData.result.seoFindings.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">SEO Issues ({selectedJobData.result.seoFindings.length})</h4>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {selectedJobData.result.seoFindings.slice(0, 20).map((finding: any, i: number) => (
                            <div key={i} className="border p-3 rounded-md">
                              <div className="flex items-start gap-2">
                                <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                                  {finding.severity}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{finding.issue}</p>
                                  {finding.url && <p className="text-xs text-muted-foreground">{finding.url}</p>}
                                  <p className="text-sm text-muted-foreground mt-1">{finding.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Sets</CardTitle>
              <CardDescription>Manage reusable page collections for batch testing</CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No batch sets created yet. Create one to test multiple pages at once.
                </p>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <Card key={batch.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{batch.label}</CardTitle>
                        {batch.description && (
                          <CardDescription>{batch.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {batch.pages.length} pages
                        </p>
                        <ul className="text-sm space-y-1">
                          {batch.pages.slice(0, 5).map((page, i) => (
                            <li key={i} className="text-muted-foreground">
                              • {page.label}: {page.url}
                            </li>
                          ))}
                          {batch.pages.length > 5 && (
                            <li className="text-muted-foreground italic">
                              ... and {batch.pages.length - 5} more
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
