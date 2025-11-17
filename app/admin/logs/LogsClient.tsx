'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  FileCode, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  Filter,
  Download,
  AlertCircle,
} from 'lucide-react';

interface LogFile {
  name: string;
  workflow: string;
  timestamp: string;
  size: number;
  path: string;
}

export function LogsClient() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchLogFiles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedWorkflow !== 'all') {
        params.append('workflow', selectedWorkflow);
      }
      
      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching logs:', data.error);
        setLogFiles([]);
        setWorkflows([]);
        return;
      }
      
      setLogFiles(data.files || []);
      setWorkflows(data.workflows || []);
      
      if (data.files && data.files.length > 0 && !selectedFile) {
        setSelectedFile(data.files[0]);
      }
    } catch (error) {
      console.error('Error fetching log files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch log files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogContent = async (file: LogFile) => {
    try {
      setIsLoadingContent(true);
      const params = new URLSearchParams({
        file: file.path,
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (logLevel !== 'all') {
        params.append('level', logLevel);
      }
      
      const response = await fetch(`/api/admin/logs/content?${params}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setLogContent(data.content || '');
    } catch (error: any) {
      console.error('Error fetching log content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch log content',
        variant: 'destructive',
      });
      setLogContent('');
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchLogFiles();
  }, [selectedWorkflow]);

  useEffect(() => {
    if (selectedFile) {
      fetchLogContent(selectedFile);
    }
  }, [selectedFile, searchTerm, logLevel]);

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logContent);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Logs copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy logs',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.name || 'logs.log';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Logs</h1>
        <p className="text-muted-foreground">
          View and search application logs for debugging and monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log Files</CardTitle>
              <CardDescription>Select a log file to view</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow</label>
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                  <SelectTrigger data-testid="select-workflow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workflows</SelectItem>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow} value={workflow}>
                        {workflow}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : logFiles.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No log files found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {logFiles.map((file) => (
                    <Button
                      key={file.path}
                      variant={selectedFile?.path === file.path ? 'default' : 'outline'}
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => setSelectedFile(file)}
                      data-testid={`log-file-${file.workflow}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCode className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium truncate">{file.workflow}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{file.timestamp}</div>
                          <div>{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Log Content</CardTitle>
                  {selectedFile && (
                    <CardDescription className="mt-1">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedFile && fetchLogContent(selectedFile)}
                    disabled={!selectedFile || isLoadingContent}
                    data-testid="button-refresh-logs"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingContent ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLogs}
                    disabled={!selectedFile || !logContent}
                    data-testid="button-download-logs"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLogs}
                    disabled={!logContent}
                    data-testid="button-copy-logs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </label>
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-logs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Log Level
                  </label>
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger data-testid="select-log-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoadingContent ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : !selectedFile ? (
                <div className="text-center py-16">
                  <FileCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a log file to view its contents</p>
                </div>
              ) : (
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono max-h-[600px] overflow-y-auto">
                    {logContent || 'No content'}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
