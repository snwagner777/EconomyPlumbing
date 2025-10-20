import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { CustomerSegment } from "@shared/schema";

type SegmentWithCount = CustomerSegment & {
  memberCount: number;
};

export default function CustomerSegmentsAdmin() {
  // Fetch all segments
  const { data: segmentsData, isLoading } = useQuery<{ segments: SegmentWithCount[] }>({
    queryKey: ['/api/admin/segments'],
  });

  const segments = segmentsData?.segments || [];
  const activeSegments = segments.filter(s => s.status === 'active');
  const pausedSegments = segments.filter(s => s.status === 'paused');
  const draftSegments = segments.filter(s => s.status === 'draft');

  const getSegmentTypeColor = (type: string) => {
    switch (type) {
      case 'evergreen':
        return 'default';
      case 'one-time':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderSegmentCard = (segment: SegmentWithCount) => (
    <Card key={segment.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg" data-testid={`text-segment-name-${segment.id}`}>
                {segment.name}
              </CardTitle>
              <Badge
                variant={getStatusColor(segment.status)}
                data-testid={`badge-status-${segment.id}`}
              >
                {segment.status}
              </Badge>
              <Badge
                variant={getSegmentTypeColor(segment.segmentType)}
                data-testid={`badge-type-${segment.id}`}
              >
                {segment.segmentType}
              </Badge>
            </div>
            {segment.description && (
              <CardDescription className="mb-3" data-testid={`text-segment-description-${segment.id}`}>
                {segment.description}
              </CardDescription>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium" data-testid={`text-member-count-${segment.id}`}>
                  {segment.memberCount} members
                </span>
              </div>
              {segment.generatedByAI && (
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Generated</span>
                </div>
              )}
              {segment.lastRefreshedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span data-testid={`text-last-refreshed-${segment.id}`}>
                    Last refreshed: {format(new Date(segment.lastRefreshedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
            {segment.targetCriteria && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <div className="text-xs font-medium text-muted-foreground mb-1">Segment Criteria:</div>
                <pre className="text-xs overflow-x-auto" data-testid={`text-criteria-${segment.id}`}>
                  {JSON.stringify(segment.targetCriteria, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
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
      <div>
        <h2 className="text-2xl font-bold mb-2">Customer Segments</h2>
        <p className="text-muted-foreground">
          AI-generated customer segments for targeted email campaigns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Paused Segments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-paused-segments-count">
              {pausedSegments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pausedSegments.reduce((sum, s) => sum + s.memberCount, 0)} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Segments</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-segments-count">
              {draftSegments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {draftSegments.reduce((sum, s) => sum + s.memberCount, 0)} total members
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
          <TabsTrigger value="paused" data-testid="tab-paused-segments">
            Paused ({pausedSegments.length})
          </TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft-segments">
            Draft ({draftSegments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeSegments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active segments</p>
              </CardContent>
            </Card>
          ) : (
            activeSegments.map(renderSegmentCard)
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          {pausedSegments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No paused segments</p>
              </CardContent>
            </Card>
          ) : (
            pausedSegments.map(renderSegmentCard)
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          {draftSegments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No draft segments</p>
              </CardContent>
            </Card>
          ) : (
            draftSegments.map(renderSegmentCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
