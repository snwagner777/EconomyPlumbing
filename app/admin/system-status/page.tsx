/**
 * System Status Page
 * 
 * Monitors all background workers and cron jobs
 * Provides external cron service setup instructions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  ExternalLink, 
  Mail, 
  CheckCircle,
  AlertCircle,
  Info,
  Send,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HealthCheckPanel } from './HealthCheckPanel';

interface CronJob {
  name: string;
  endpoint: string;
  schedule: string;
  frequency: string;
  critical: 'High' | 'Medium' | 'Low';
  description: string;
  status: 'Not Implemented' | 'Ready';
}

const cronJobs: CronJob[] = [
  {
    name: 'Google Reviews Refresh',
    endpoint: '/api/cron/google-reviews',
    schedule: '0 3 * * *',
    frequency: 'Daily at 3:00 AM',
    critical: 'Medium',
    description: 'Fetches latest Google reviews via SerpAPI',
    status: 'Ready',
  },
  {
    name: 'Auto Blog Generation',
    endpoint: '/api/cron/auto-blog',
    schedule: '0 9 * * 1',
    frequency: 'Weekly on Mondays at 9:00 AM',
    critical: 'Low',
    description: 'Generates new blog posts using AI',
    status: 'Ready',
  },
  {
    name: 'Google Drive Sync',
    endpoint: '/api/cron/google-drive',
    schedule: '*/5 * * * *',
    frequency: 'Every 5 minutes',
    critical: 'Medium',
    description: 'Monitors Google Drive for new photos',
    status: 'Ready',
  },
  {
    name: 'Photo Cleanup',
    endpoint: '/api/cron/photo-cleanup',
    schedule: '0 3 * * *',
    frequency: 'Daily at 3:00 AM',
    critical: 'Low',
    description: 'Automated photo cleanup and quality analysis',
    status: 'Ready',
  },
  {
    name: 'GMB Automation',
    endpoint: '/api/cron/gmb-automation',
    schedule: '*/30 * * * *',
    frequency: 'Every 30 minutes',
    critical: 'Medium',
    description: '⚠️ Placeholder - Not yet implemented',
    status: 'Not Implemented',
  },
  {
    name: 'Review Request Emails',
    endpoint: '/api/cron/review-requests',
    schedule: '*/30 * * * *',
    frequency: 'Every 30 minutes',
    critical: 'High',
    description: 'Sends review requests after completed jobs',
    status: 'Ready',
  },
  {
    name: 'Referral Nurture Campaigns',
    endpoint: '/api/cron/referral-nurture',
    schedule: '*/30 * * * *',
    frequency: 'Every 30 minutes',
    critical: 'Medium',
    description: 'Automated follow-up emails to referrals',
    status: 'Ready',
  },
  {
    name: 'Custom Marketing Campaigns',
    endpoint: '/api/cron/custom-campaigns',
    schedule: '*/30 * * * *',
    frequency: 'Every 30 minutes',
    critical: 'Medium',
    description: 'AI-generated personalized marketing emails',
    status: 'Ready',
  },
  {
    name: 'Health Monitoring',
    endpoint: '/api/cron/health-alerter',
    schedule: '*/5 * * * *',
    frequency: 'Every 5 minutes',
    critical: 'High',
    description: 'System health checks and admin alerts',
    status: 'Ready',
  },
];

const backgroundWorkers = [
  {
    name: 'ServiceTitan Photo Fetcher',
    description: 'Processes photo fetch queue from ServiceTitan invoices',
    frequency: 'Every 1 minute',
    status: 'Running',
  },
  {
    name: 'Zone Sync',
    description: 'Syncs ServiceTitan business units/zones',
    frequency: 'Daily at 3:00 AM',
    status: 'Running',
  },
];

export default function SystemStatusPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-system-status">
          System Status
        </h1>
        <p className="text-muted-foreground">
          Monitor background workers and configure external cron service
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>External Cron Service Required</AlertTitle>
        <AlertDescription>
          Production requires an external cron service (like cron-job.org) to trigger scheduled jobs.
          Use the setup instructions below to configure your service.
        </AlertDescription>
      </Alert>

      <HealthCheckPanel />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Background Workers
              </CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Running
              </Badge>
            </div>
            <CardDescription>Active worker processes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {backgroundWorkers.map((worker) => (
              <div key={worker.name} className="space-y-1" data-testid={`worker-${worker.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">{worker.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {worker.frequency}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
            <CardDescription>Email complete cron configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send yourself a complete setup guide with cURL examples and cron expressions.
            </p>
            <form action="/api/send-cron-docs" method="POST" className="space-y-3">
              <Button 
                type="submit" 
                className="w-full"
                data-testid="button-send-setup-instructions"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Setup Instructions
              </Button>
            </form>
            <div className="pt-2 border-t">
              <a 
                href="/CRON_ENDPOINTS.md" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
                data-testid="link-view-docs"
              >
                View Full Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cron Endpoints ({cronJobs.length} total)
          </CardTitle>
          <CardDescription>
            Configure these endpoints in your external cron service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cronJobs.map((job) => (
              <div 
                key={job.endpoint}
                className="p-4 border rounded-lg space-y-3"
                data-testid={`cron-job-${job.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{job.name}</h3>
                      {job.status === 'Not Implemented' ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Implemented
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          job.critical === 'High' ? 'destructive' : 
                          job.critical === 'Medium' ? 'default' : 
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {job.critical}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{job.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Endpoint:</span>
                    <code className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                      {job.endpoint}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Schedule:</span>
                    <code className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                      {job.schedule}
                    </code>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-2">{job.frequency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Cron Services (Free Tier)</CardTitle>
          <CardDescription>External services to trigger scheduled jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <a 
              href="https://cron-job.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
              data-testid="link-cron-job-org"
            >
              <div>
                <p className="font-medium text-sm">cron-job.org</p>
                <p className="text-xs text-muted-foreground">Free tier: up to 50 jobs</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a 
              href="https://www.easycron.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
              data-testid="link-easycron"
            >
              <div>
                <p className="font-medium text-sm">EasyCron</p>
                <p className="text-xs text-muted-foreground">Free tier: limited jobs</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a 
              href="https://uptimerobot.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
              data-testid="link-uptimerobot"
            >
              <div>
                <p className="font-medium text-sm">UptimeRobot</p>
                <p className="text-xs text-muted-foreground">Free tier: can trigger webhooks</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
