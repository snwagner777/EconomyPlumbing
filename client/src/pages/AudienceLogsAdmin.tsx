import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

type AudienceLog = {
  id: string;
  segmentId: string;
  segmentName: string;
  customerId: number;
  customerName: string;
  action: 'entered' | 'exited';
  reason: string;
  triggeredBy: string;
  createdAt: string;
};

export default function AudienceLogsAdmin() {
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Fetch all logs
  const { data: logsData, isLoading } = useQuery<{ logs: AudienceLog[] }>({
    queryKey: ['/api/admin/audience-logs', segmentFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (segmentFilter !== "all") params.set("segmentId", segmentFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      
      const response = await fetch(`/api/admin/audience-logs?${params}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  // Fetch segments for filter
  const { data: segmentsData } = useQuery<{ segments: { id: string; name: string }[] }>({
    queryKey: ['/api/admin/segments'],
  });

  const logs = logsData?.logs || [];
  const segments = segmentsData?.segments || [];

  const getActionColor = (action: string) => {
    return action === 'entered' ? 'default' : 'secondary';
  };

  const getActionIcon = (action: string) => {
    return action === 'entered' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />;
  };

  const renderLogCard = (log: AudienceLog) => (
    <Card key={log.id} className="mb-3">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={getActionColor(log.action)}
                data-testid={`badge-action-${log.id}`}
                className="flex items-center gap-1"
              >
                {getActionIcon(log.action)}
                {log.action}
              </Badge>
              <span className="font-medium" data-testid={`text-customer-name-${log.id}`}>
                {log.customerName}
              </span>
              <span className="text-muted-foreground text-sm">
                {log.action === 'entered' ? '→' : '←'}
              </span>
              <span className="text-sm" data-testid={`text-segment-name-${log.id}`}>
                {log.segmentName}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span data-testid={`text-reason-${log.id}`}>{log.reason}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span data-testid={`text-timestamp-${log.id}`}>
                  {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <span className="text-xs">
                Triggered by: {log.triggeredBy}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Audience Movement Logs</h2>
        <p className="text-muted-foreground">
          Track customer segment entry and exit events with full audit trail
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger data-testid="select-segment-filter">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger data-testid="select-action-filter">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="entered">Entered</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-logs">
              {logs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {logs.filter(l => l.action === 'entered').length} entries, {logs.filter(l => l.action === 'exited').length} exits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-segments">
              {new Set(logs.map(l => l.segmentId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Segments with activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div>
        {logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audience movement logs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map(renderLogCard)}
          </div>
        )}
      </div>
    </div>
  );
}
