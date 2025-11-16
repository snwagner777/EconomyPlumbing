'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  error?: string;
  timestamp: string;
}

export function HealthCheckPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/admin/health-check', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      
      const data = await response.json();
      setResults(data.checks || []);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check error:', error);
      setResults([{
        component: 'Health Check System',
        status: 'down',
        message: 'Failed to run health check',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Degraded
          </Badge>
        );
      case 'down':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            Down
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Monitor
            </CardTitle>
            <CardDescription>
              Manual health check for critical system components
            </CardDescription>
          </div>
          <Button 
            onClick={runHealthCheck} 
            disabled={isChecking}
            data-testid="button-run-health-check"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Check
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastCheck && (
          <div className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleString()}
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className="p-4 border rounded-lg"
                data-testid={`health-check-${result.component.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <h3 className="font-semibold text-sm">{result.component}</h3>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
                
                {result.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs font-mono text-red-600 dark:text-red-400">
                    {result.error}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No health checks run yet</p>
            <p className="text-xs mt-1">Click "Run Check" to test system health</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
