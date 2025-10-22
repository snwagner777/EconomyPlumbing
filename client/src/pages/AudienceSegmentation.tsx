import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Trash2,
  Edit,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  DollarSign,
  MapPin,
  Activity,
  User,
  Building,
  Mail,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Mock data for demonstration
const mockSegments = [
  {
    id: "1",
    name: "VIP Members",
    description: "Customers with VIP membership status",
    segmentType: "membership",
    criteria: {
      membershipType: ["vip", "platinum"],
    },
    memberCount: 234,
    status: "active",
    lastRefreshed: new Date("2024-03-18T10:00:00"),
    createdAt: new Date("2024-01-15"),
    performance: {
      openRate: 42.3,
      clickRate: 6.8,
      conversionRate: 3.2,
    },
  },
  {
    id: "2",
    name: "High Value Customers",
    description: "Customers with lifetime value over $5,000",
    segmentType: "behavioral",
    criteria: {
      lifetimeValue: { min: 5000 },
      lastServiceDate: { within: "90d" },
    },
    memberCount: 156,
    status: "active",
    lastRefreshed: new Date("2024-03-18T10:00:00"),
    createdAt: new Date("2024-02-01"),
    performance: {
      openRate: 38.5,
      clickRate: 5.2,
      conversionRate: 2.8,
    },
  },
  {
    id: "3",
    name: "Win Back - Inactive",
    description: "Customers inactive for 6+ months",
    segmentType: "behavioral",
    criteria: {
      lastServiceDate: { moreThan: "180d" },
      hasEmail: true,
    },
    memberCount: 892,
    status: "active",
    lastRefreshed: new Date("2024-03-18T08:00:00"),
    createdAt: new Date("2024-02-15"),
    performance: {
      openRate: 18.2,
      clickRate: 2.1,
      conversionRate: 0.8,
    },
  },
  {
    id: "4",
    name: "New Customers",
    description: "Customers acquired in the last 30 days",
    segmentType: "behavioral",
    criteria: {
      firstServiceDate: { within: "30d" },
    },
    memberCount: 78,
    status: "active",
    lastRefreshed: new Date("2024-03-18T10:00:00"),
    createdAt: new Date("2024-03-01"),
    performance: {
      openRate: 28.9,
      clickRate: 3.8,
      conversionRate: 2.1,
    },
  },
];

const criteriaOptions = {
  demographic: [
    { value: "age", label: "Age Range" },
    { value: "location", label: "Service Area" },
    { value: "customerType", label: "Customer Type (Residential/Commercial)" },
  ],
  behavioral: [
    { value: "lifetimeValue", label: "Lifetime Value" },
    { value: "lastServiceDate", label: "Last Service Date" },
    { value: "firstServiceDate", label: "First Service Date" },
    { value: "serviceFrequency", label: "Service Frequency" },
    { value: "averageTicket", label: "Average Ticket Size" },
  ],
  membership: [
    { value: "membershipType", label: "Membership Type" },
    { value: "membershipDuration", label: "Membership Duration" },
    { value: "membershipExpiry", label: "Membership Expiry" },
  ],
  engagement: [
    { value: "emailEngagement", label: "Email Engagement Level" },
    { value: "smsOptIn", label: "SMS Opt-In Status" },
    { value: "reviewSubmitted", label: "Review Submitted" },
    { value: "referralsMade", label: "Referrals Made" },
  ],
};

interface Segment {
  id: string;
  name: string;
  description: string;
  segmentType: string;
  criteria: any;
  memberCount: number;
  status: string;
  lastRefreshed: Date;
  createdAt: Date;
  performance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  isActive?: boolean;
}

export default function AudienceSegmentation() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [selectedSegmentType, setSelectedSegmentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Form state for creating/editing segments
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    segmentType: "behavioral",
    criteria: {},
    isActive: true,
  });

  // Fetch segments
  const { data: segments, isLoading, refetch } = useQuery({
    queryKey: ["/api/segments", selectedSegmentType, searchQuery],
    queryFn: async () => {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSegments.filter(s => 
        (selectedSegmentType === "all" || s.segmentType === selectedSegmentType) &&
        (searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    },
  });

  // Create segment mutation
  const createSegment = useMutation({
    mutationFn: async (data: typeof formData) => {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id: Date.now().toString() };
    },
    onSuccess: () => {
      toast({
        title: "Segment created",
        description: "Your audience segment has been created successfully.",
      });
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
  });

  // Update segment mutation
  const updateSegment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id, ...data };
    },
    onSuccess: () => {
      toast({
        title: "Segment updated",
        description: "The segment has been updated successfully.",
      });
      setEditingSegment(null);
      refetch();
      resetForm();
    },
  });

  // Delete segment mutation
  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Segment deleted",
        description: "The segment has been deleted successfully.",
      });
      refetch();
    },
  });

  // Refresh segment members
  const refreshSegment = useMutation({
    mutationFn: async (id: string) => {
      // In production, this would refresh the segment members from ServiceTitan
      await new Promise(resolve => setTimeout(resolve, 2000));
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Segment refreshed",
        description: "Segment members have been updated from ServiceTitan.",
      });
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      segmentType: "behavioral",
      criteria: {},
      isActive: true,
    });
  };

  const handleCreateSubmit = () => {
    createSegment.mutate(formData);
  };

  const handleUpdateSubmit = () => {
    if (editingSegment) {
      updateSegment.mutate({ id: editingSegment.id, data: formData });
    }
  };

  const handleExportSegment = (segment: Segment) => {
    // In production, this would trigger a CSV download
    toast({
      title: "Export started",
      description: `Exporting ${segment.memberCount} contacts from "${segment.name}"...`,
    });
  };

  const duplicateSegment = (segment: Segment) => {
    setFormData({
      name: `${segment.name} (Copy)`,
      description: segment.description,
      segmentType: segment.segmentType,
      criteria: segment.criteria,
      isActive: segment.isActive ?? true,
    });
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audience Segmentation</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer segments for targeted campaigns
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          data-testid="button-create-segment"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {segments?.filter(s => s.status === "active").length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments?.reduce((acc, s) => acc + s.memberCount, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments?.length ? 
                (segments.reduce((acc, s) => acc + s.performance.openRate, 0) / segments.length).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Segment average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">
              {segments?.length ? 
                segments.reduce((best, s) => 
                  s.performance.conversionRate > best.performance.conversionRate ? s : best
                ).name 
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              By conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                data-testid="input-search-segments"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedSegmentType} onValueChange={setSelectedSegmentType}>
                <SelectTrigger className="w-[180px]" data-testid="select-segment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="demographic">Demographic</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                data-testid="button-refresh-segments"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Segments</CardTitle>
          <CardDescription>
            Manage and monitor your customer segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments?.map((segment) => (
              <div
                key={segment.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{segment.name}</h3>
                      <Badge variant="outline">{segment.segmentType}</Badge>
                      <Badge variant={segment.status === "active" ? "default" : "secondary"}>
                        {segment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {segment.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {segment.memberCount.toLocaleString()} contacts
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Refreshed {formatDistanceToNow(segment.lastRefreshed, { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDistanceToNow(segment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshSegment.mutate(segment.id)}
                      disabled={refreshSegment.isPending}
                      data-testid={`button-refresh-${segment.id}`}
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshSegment.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportSegment(segment)}
                      data-testid={`button-export-${segment.id}`}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateSegment(segment)}
                      data-testid={`button-duplicate-${segment.id}`}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSegment(segment);
                        setFormData({
                          name: segment.name,
                          description: segment.description,
                          segmentType: segment.segmentType,
                          criteria: segment.criteria,
                          isActive: segment.isActive ?? true,
                        });
                      }}
                      data-testid={`button-edit-${segment.id}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSegment.mutate(segment.id)}
                      disabled={deleteSegment.isPending}
                      data-testid={`button-delete-${segment.id}`}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                    <p className="text-lg font-semibold">{segment.performance.openRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                    <p className="text-lg font-semibold">{segment.performance.clickRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Conversion</p>
                    <p className="text-lg font-semibold text-green-600">
                      {segment.performance.conversionRate}%
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {segments?.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No segments found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first segment to start targeting specific customer groups.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Segment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Segment Dialog */}
      <Dialog open={isCreateOpen || !!editingSegment} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingSegment(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? "Edit Segment" : "Create New Segment"}
            </DialogTitle>
            <DialogDescription>
              Define criteria to create a targeted customer segment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Segment Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VIP Members, High Value Customers"
                  data-testid="input-segment-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this segment represents..."
                  rows={3}
                  data-testid="textarea-segment-description"
                />
              </div>

              <div>
                <Label htmlFor="type">Segment Type</Label>
                <Select 
                  value={formData.segmentType} 
                  onValueChange={(value) => setFormData({ ...formData, segmentType: value })}
                >
                  <SelectTrigger data-testid="select-segment-type-form">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demographic">Demographic</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Segment Criteria</Label>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure specific criteria to define who belongs in this segment.
                    Members are automatically updated based on these rules.
                  </AlertDescription>
                </Alert>
                
                {/* Simplified criteria builder - in production, this would be more complex */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Advanced criteria builder coming soon. For now, segments are created
                    based on the type and description you provide.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">Active segment (can be used in campaigns)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingSegment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingSegment ? handleUpdateSubmit : handleCreateSubmit}
              disabled={createSegment.isPending || updateSegment.isPending}
              data-testid="button-save-segment"
            >
              {(createSegment.isPending || updateSegment.isPending) && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingSegment ? "Update Segment" : "Create Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}