import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  LayoutDashboard,
  ImageIcon, 
  FileText, 
  Phone, 
  Building2, 
  FileEdit,
  LogOut,
  TrendingUp,
  Users,
  Star,
  Settings,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Upload,
  Sparkles,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrackingNumber, PageMetadata, CommercialCustomer } from "@shared/schema";
import { FocalPointEditor } from "@/components/FocalPointEditor";

type AdminSection = 'dashboard' | 'photos' | 'success-stories' | 'commercial-customers' | 'page-metadata' | 'tracking-numbers';

// Define all application pages
const ALL_PAGES = [
  { path: '/', title: 'Home' },
  { path: '/water-heater-services', title: 'Water Heater Services' },
  { path: '/drain-cleaning', title: 'Drain Cleaning' },
  { path: '/leak-repair', title: 'Leak Repair' },
  { path: '/toilet-faucet', title: 'Toilet & Faucet' },
  { path: '/gas-services', title: 'Gas Services' },
  { path: '/commercial-plumbing', title: 'Commercial Plumbing' },
  { path: '/backflow', title: 'Backflow Testing' },
  { path: '/emergency', title: 'Emergency Plumbing' },
  { path: '/plumber-near-me', title: 'Plumber Near Me' },
  { path: '/commercial-services', title: 'Commercial Services' },
  { path: '/drainage-solutions', title: 'Drainage Solutions' },
  { path: '/faucet-installation', title: 'Faucet Installation' },
  { path: '/garbage-disposal-repair', title: 'Garbage Disposal' },
  { path: '/gas-leak-detection', title: 'Gas Leak Detection' },
  { path: '/hydro-jetting-services', title: 'Hydro Jetting' },
  { path: '/permit-resolution-services', title: 'Permit Resolution' },
  { path: '/rooter-services', title: 'Rooter Services' },
  { path: '/sewage-pump-services', title: 'Sewage Pump' },
  { path: '/water-pressure-solutions', title: 'Water Pressure' },
  { path: '/water-heater-guide', title: 'Water Heater Guide' },
  { path: '/services', title: 'Services' },
  { path: '/service-area', title: 'Service Areas' },
  { path: '/plumber-austin', title: 'Austin Plumber' },
  { path: '/plumber-in-cedar-park--tx', title: 'Cedar Park Plumber' },
  { path: '/plumber-leander', title: 'Leander Plumber' },
  { path: '/round-rock-plumber', title: 'Round Rock Plumber' },
  { path: '/plumber-georgetown', title: 'Georgetown Plumber' },
  { path: '/plumber-pflugerville', title: 'Pflugerville Plumber' },
  { path: '/plumber-liberty-hill', title: 'Liberty Hill Plumber' },
  { path: '/plumber-buda', title: 'Buda Plumber' },
  { path: '/plumber-kyle', title: 'Kyle Plumber' },
  { path: '/plumber-marble-falls', title: 'Marble Falls Plumber' },
  { path: '/plumber-burnet', title: 'Burnet Plumber' },
  { path: '/plumber-horseshoe-bay', title: 'Horseshoe Bay Plumber' },
  { path: '/plumber-kingsland', title: 'Kingsland Plumber' },
  { path: '/plumber-granite-shoals', title: 'Granite Shoals Plumber' },
  { path: '/plumber-bertram', title: 'Bertram Plumber' },
  { path: '/plumber-spicewood', title: 'Spicewood Plumber' },
  { path: '/contact', title: 'Contact' },
  { path: '/faq', title: 'FAQ' },
  { path: '/privacy-policy', title: 'Privacy Policy' },
  { path: '/refund_returns', title: 'Refund & Returns' },
  { path: '/membership-benefits', title: 'Membership Benefits' },
  { path: '/success-stories', title: 'Success Stories' },
  { path: '/store', title: 'Store' },
  { path: '/blog', title: 'Blog' },
  { path: '/about', title: 'About' },
];

function AdminSidebar({ activeSection, setActiveSection }: { activeSection: AdminSection; setActiveSection: (section: AdminSection) => void }) {
  const [, setLocation] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      section: 'dashboard' as AdminSection,
      description: "Overview & stats"
    },
    {
      title: "Photo Management",
      icon: ImageIcon,
      section: 'photos' as AdminSection,
      description: "Manage all photos"
    },
    {
      title: "Success Stories",
      icon: Star,
      section: 'success-stories' as AdminSection,
      description: "Review & approve stories"
    },
    {
      title: "Commercial Customers",
      icon: Building2,
      section: 'commercial-customers' as AdminSection,
      description: "Manage customer logos"
    },
    {
      title: "Page Metadata",
      icon: FileEdit,
      section: 'page-metadata' as AdminSection,
      description: "SEO titles & descriptions"
    },
    {
      title: "Tracking Numbers",
      icon: Phone,
      section: 'tracking-numbers' as AdminSection,
      description: "Phone number tracking"
    },
  ];

  const handleLogout = () => {
    // OAuth logout - redirects to Replit logout then back to homepage
    window.location.href = "/api/oauth/logout";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Admin Portal</h2>
            <p className="text-xs text-muted-foreground">Economy Plumbing</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.section)}
                    isActive={activeSection === item.section}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardOverview({ stats, photos }: { stats: any; photos: any[] }) {
  const unusedPhotos = photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl);
  const goodQualityUnused = unusedPhotos.filter((p: any) => p.isGoodQuality);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>All sources</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unused Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.unused || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Ready for blogs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Good Quality</CardDescription>
            <CardTitle className="text-3xl">{goodQualityUnused.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>High quality unused</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Used Photos</CardDescription>
            <CardTitle className="text-3xl">{stats.used || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>In blog posts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and background tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Photo Import System</p>
                  <p className="text-xs text-muted-foreground">Monitoring Google Drive & CompanyCam</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Auto Blog Generator</p>
                  <p className="text-xs text-muted-foreground">Weekly content creation</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Review Sync</p>
                  <p className="text-xs text-muted-foreground">Google Places API integration</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoManagement() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showSuccessStoryDialog, setShowSuccessStoryDialog] = useState(false);
  const [showBlogPostDialog, setShowBlogPostDialog] = useState(false);
  const { toast } = useToast();

  // Fetch photos with filters
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['/api/admin/photos', categoryFilter, qualityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: categoryFilter,
        quality: qualityFilter,
        status: statusFilter,
      });
      return await fetch(`/api/admin/photos?${params}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
  });

  const photos = photosData?.photos || [];

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const clearSelection = () => setSelectedPhotos([]);

  const handleCreateSuccessStory = () => {
    if (selectedPhotos.length !== 2) {
      toast({
        title: "Selection Error",
        description: "Please select exactly 2 photos for a success story",
        variant: "destructive",
      });
      return;
    }
    setShowSuccessStoryDialog(true);
  };

  const handleCreateBlogPost = () => {
    if (selectedPhotos.length !== 1) {
      toast({
        title: "Selection Error",
        description: "Please select exactly 1 photo for a blog post",
        variant: "destructive",
      });
      return;
    }
    setShowBlogPostDialog(true);
  };

  const getSelectedPhotoObjects = () => {
    return photos.filter((p: any) => selectedPhotos.includes(p.id));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter photos by category, quality, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="companycam">CompanyCam</SelectItem>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="servicetitan">ServiceTitan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality-filter">Quality</Label>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger id="quality-filter" data-testid="select-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="good">Good Quality</SelectItem>
                  <SelectItem value="poor">Poor Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unused">Unused Only</SelectItem>
                  <SelectItem value="used">Used Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedPhotos.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">{selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected</p>
                <Button variant="outline" size="sm" onClick={clearSelection} data-testid="button-clear-selection">
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateBlogPost}
                  disabled={selectedPhotos.length !== 1}
                  data-testid="button-create-blog-post"
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Create Blog Post {selectedPhotos.length !== 1 && `(Select 1)`}
                </Button>
                <Button
                  onClick={handleCreateSuccessStory}
                  disabled={selectedPhotos.length !== 2}
                  data-testid="button-create-success-story"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Create Success Story {selectedPhotos.length !== 2 && `(Select 2)`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
          <CardDescription>Select photos to create content manually</CardDescription>
        </CardHeader>
        <CardContent>
          {photosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos found with current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div key={photo.id} className="group relative">
                  <div 
                    className={`aspect-square relative rounded-lg overflow-hidden bg-muted cursor-pointer ${
                      selectedPhotos.includes(photo.id) ? 'ring-4 ring-primary' : ''
                    }`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.aiDescription || 'Photo'}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <div
                        className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${
                          selectedPhotos.includes(photo.id) 
                            ? 'bg-primary border-primary' 
                            : 'bg-white/80 border-white'
                        }`}
                      >
                        {selectedPhotos.includes(photo.id) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(photo.photoUrl, '_blank');
                        }}
                        data-testid={`view-photo-${photo.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={photo.isGoodQuality ? 'default' : 'outline'}>
                        {photo.isGoodQuality ? 'Good' : 'Poor'}
                      </Badge>
                      {(photo.usedInBlogPostId || photo.usedInPageUrl) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Used
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {photo.aiDescription || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Story Creation Dialog */}
      {showSuccessStoryDialog && (
        <ManualSuccessStoryDialog
          photos={getSelectedPhotoObjects()}
          onClose={() => {
            setShowSuccessStoryDialog(false);
            clearSelection();
          }}
        />
      )}

      {/* Blog Post Creation Dialog */}
      {showBlogPostDialog && (
        <ManualBlogPostDialog
          photo={getSelectedPhotoObjects()[0]}
          onClose={() => {
            setShowBlogPostDialog(false);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}

function SuccessStoriesSection() {
  const { toast } = useToast();
  const [editingStory, setEditingStory] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    story: "",
    location: "",
  });

  const [isFocalPointDialogOpen, setIsFocalPointDialogOpen] = useState(false);
  const [focalPointStory, setFocalPointStory] = useState<any | null>(null);
  const [beforeFocalPoint, setBeforeFocalPoint] = useState<{ x: number; y: number } | null>(null);
  const [afterFocalPoint, setAfterFocalPoint] = useState<{ x: number; y: number } | null>(null);

  const { data: storiesData, isLoading } = useQuery<{ stories: any[] }>({
    queryKey: ['/api/admin/success-stories'],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/admin/success-stories/${id}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Success Story Approved",
        description: "The success story has been approved and published.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/admin/success-stories/${id}/unapprove`);
    },
    onSuccess: () => {
      toast({
        title: "Success Story Unapproved",
        description: "The success story has been moved back to pending review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Unapprove Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/success-stories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success Story Deleted",
        description: "The success story has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof editFormData> }) => {
      return await apiRequest("PUT", `/api/admin/success-stories/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success Story Updated",
        description: "The success story has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/success-stories'] });
      handleCloseEditDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateFocalPointsMutation = useMutation({
    mutationFn: async ({ id, focalPoints }: { id: string; focalPoints: any }) => {
      return await apiRequest("PUT", `/api/admin/success-stories/${id}/focal-points`, focalPoints);
    },
    onSuccess: () => {
      toast({
        title: "Focal Points Updated",
        description: "The collage has been regenerated with your custom focal points.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/success-stories'] });
      setIsFocalPointDialogOpen(false);
      setFocalPointStory(null);
      setBeforeFocalPoint(null);
      setAfterFocalPoint(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const [isReprocessing, setIsReprocessing] = useState(false);

  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/reprocess-success-story-collages', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Reprocessing Complete",
        description: `Successfully reprocessed ${data.successful} of ${data.total} success stories with AI focal point detection.`,
      });
      setIsReprocessing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reprocessing Failed",
        description: error.message || "An error occurred while reprocessing collages.",
        variant: "destructive",
      });
      setIsReprocessing(false);
    },
  });

  const handleReprocess = () => {
    if (confirm("This will regenerate all success story collages with AI-detected focal points. This may take several minutes. Continue?")) {
      setIsReprocessing(true);
      reprocessMutation.mutate();
    }
  };

  const handleApprove = (id: string) => {
    if (confirm("Approve this success story and publish it to the website?")) {
      approveMutation.mutate(id);
    }
  };

  const handleUnapprove = (id: string) => {
    if (confirm("Move this success story back to pending review? It will be removed from the public website.")) {
      unapproveMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this success story? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (story: any) => {
    setEditingStory(story);
    setEditFormData({
      customerName: story.customerName || "",
      story: story.story || "",
      location: story.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingStory(null);
    setEditFormData({
      customerName: "",
      story: "",
      location: "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingStory) return;

    if (!editFormData.customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editFormData.story.trim()) {
      toast({
        title: "Validation Error",
        description: "Story is required",
        variant: "destructive",
      });
      return;
    }

    if (!editFormData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingStory.id,
      updates: editFormData,
    });
  };

  const handleOpenFocalPointEditor = (story: any) => {
    setFocalPointStory(story);
    setBeforeFocalPoint(
      story.beforeFocalX !== null && story.beforeFocalY !== null
        ? { x: story.beforeFocalX, y: story.beforeFocalY }
        : { x: 50, y: 50 }
    );
    setAfterFocalPoint(
      story.afterFocalX !== null && story.afterFocalY !== null
        ? { x: story.afterFocalX, y: story.afterFocalY }
        : { x: 50, y: 50 }
    );
    setIsFocalPointDialogOpen(true);
  };

  const handleSaveFocalPoints = () => {
    if (!focalPointStory) return;

    updateFocalPointsMutation.mutate({
      id: focalPointStory.id,
      focalPoints: {
        beforeFocalX: beforeFocalPoint?.x,
        beforeFocalY: beforeFocalPoint?.y,
        afterFocalX: afterFocalPoint?.x,
        afterFocalY: afterFocalPoint?.y,
      },
    });
  };

  const stories = storiesData?.stories || [];
  const pendingStories = stories.filter((s: any) => !s.approved);
  const approvedStories = stories.filter((s: any) => s.approved);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Badge variant="secondary">{pendingStories.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStories.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Badge variant="default">{approvedStories.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedStories.length}</div>
            <p className="text-xs text-muted-foreground">Published stories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Badge variant="outline">{stories.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stories.length}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Collage Maintenance</CardTitle>
          <CardDescription>
            Regenerate all success story collages with AI focal point detection for better photo positioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleReprocess}
            disabled={isReprocessing}
            data-testid="button-reprocess-collages"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reprocessing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reprocess All Collages
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Stories */}
      {pendingStories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Pending Review ({pendingStories.length})</h2>
          {pendingStories.map((story: any) => (
            <Card key={story.id} className="overflow-hidden" data-testid={`story-pending-${story.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{story.customerName}</CardTitle>
                    <CardDescription className="mt-1">
                      {story.email && `${story.email} • `}
                      {story.phone && `${story.phone} • `}
                      {story.location}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Service Category</p>
                  <Badge>{story.serviceCategory}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Customer Story</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{story.story}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Before Photo</p>
                    <a 
                      href={story.beforePhotoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid={`link-before-photo-${story.id}`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      View Before Photo
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">After Photo</p>
                    <a 
                      href={story.afterPhotoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid={`link-after-photo-${story.id}`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      View After Photo
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(story.id)}
                    disabled={approveMutation.isPending}
                    data-testid={`button-approve-${story.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Publish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(story)}
                    data-testid={`button-edit-${story.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(story.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${story.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approved Stories */}
      {approvedStories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Approved Stories ({approvedStories.length})</h2>
          {approvedStories.map((story: any) => (
            <Card key={story.id} data-testid={`story-approved-${story.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{story.customerName}</CardTitle>
                    <CardDescription>{story.serviceCategory} • {story.location}</CardDescription>
                  </div>
                  <Badge variant="default">Published</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{story.story}</p>
                </div>
                {story.collagePhotoUrl && (
                  <div>
                    <a 
                      href={story.collagePhotoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid={`link-collage-${story.id}`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      View Before/After Collage
                    </a>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(story)}
                    data-testid={`button-edit-approved-${story.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenFocalPointEditor(story)}
                    data-testid={`button-focal-points-${story.id}`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Adjust Focal Points
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUnapprove(story.id)}
                    disabled={unapproveMutation.isPending}
                    data-testid={`button-unapprove-${story.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Unapprove
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(story.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-approved-${story.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : stories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No success stories yet. Check back later!</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Success Story</DialogTitle>
            <DialogDescription>
              Update the customer name, description, or location for this success story.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customerName">Customer Name</Label>
              <Input
                id="edit-customerName"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                placeholder="Enter customer name"
                data-testid="input-edit-customerName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="Enter location (e.g., Austin, TX)"
                data-testid="input-edit-location"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-story">Story Description</Label>
              <Textarea
                id="edit-story"
                value={editFormData.story}
                onChange={(e) => setEditFormData({ ...editFormData, story: e.target.value })}
                placeholder="Enter the customer's story"
                rows={6}
                data-testid="input-edit-story"
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={updateMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Focal Point Editor Dialog */}
      <Dialog open={isFocalPointDialogOpen} onOpenChange={setIsFocalPointDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Focal Points</DialogTitle>
            <DialogDescription>
              Click on each image to set where the main subject should be centered in the collage.
              The collage will be regenerated with your custom positioning.
            </DialogDescription>
          </DialogHeader>
          {focalPointStory && (
            <div className="grid gap-6 py-4">
              <FocalPointEditor
                imageUrl={focalPointStory.beforePhotoUrl}
                initialFocalPoint={beforeFocalPoint || undefined}
                onFocalPointChange={setBeforeFocalPoint}
                label="Before Photo - Click to set focal point"
              />
              <FocalPointEditor
                imageUrl={focalPointStory.afterPhotoUrl}
                initialFocalPoint={afterFocalPoint || undefined}
                onFocalPointChange={setAfterFocalPoint}
                label="After Photo - Click to set focal point"
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFocalPointDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFocalPoints} 
                  disabled={updateFocalPointsMutation.isPending}
                  data-testid="button-save-focal-points"
                >
                  {updateFocalPointsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating Collage...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Save & Regenerate Collage
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommercialCustomersSection() {
  const [editingCustomer, setEditingCustomer] = useState<CommercialCustomer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    location: "",
    industry: "",
    customerSince: new Date().getFullYear(),
    displayOrder: 0,
    active: true,
  });

  const { data: customersData, isLoading } = useQuery<{ customers: CommercialCustomer[] }>({
    queryKey: ['/api/admin/commercial-customers'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/commercial-customers", data);
    },
    onSuccess: () => {
      toast({
        title: "Customer Added",
        description: "Commercial customer has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof formData> }) => {
      return await apiRequest("PUT", `/api/admin/commercial-customers/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Customer Updated",
        description: "Commercial customer has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/commercial-customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Customer Deleted",
        description: "Commercial customer has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commercial-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial-customers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingCustomer(null);
    setFormData({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      location: "",
      industry: "",
      customerSince: new Date().getFullYear(),
      displayOrder: (customersData?.customers.length || 0) + 1,
      active: true,
    });
    setLogoFile(null);
    setLogoPreview("");
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: CommercialCustomer) => {
    setIsAddingNew(false);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      logoUrl: customer.logoUrl,
      websiteUrl: customer.websiteUrl || "",
      location: customer.location || "",
      industry: customer.industry || "",
      customerSince: customer.customerSince || new Date().getFullYear(),
      displayOrder: customer.displayOrder,
      active: customer.active,
    });
    setLogoPreview(customer.logoUrl);
    setLogoFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this commercial customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setIsAddingNew(false);
    setLogoFile(null);
    setLogoPreview("");
    setFormData({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      location: "",
      industry: "",
      customerSince: new Date().getFullYear(),
      displayOrder: 0,
      active: true,
    });
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Automatically upload and process the logo
      await handleProcessLogoAuto(file);
    }
  };

  const handleProcessLogoAuto = async (file: File) => {
    setIsProcessingLogo(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Failed to upload logo' }));
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const { logoUrl } = await uploadResponse.json();

      const processResponse = await apiRequest("POST", "/api/admin/process-logo", {
        logoUrl,
        customerName: formData.name || "Logo",
      });

      const processData = await processResponse.json();
      const { processedLogoUrl } = processData;

      setFormData(prev => ({ ...prev, logoUrl: processedLogoUrl }));
      setLogoPreview(processedLogoUrl);

      toast({
        title: "Logo Uploaded",
        description: "Logo uploaded and processed successfully.",
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleProcessLogo = async () => {
    if (!logoFile) {
      toast({
        title: "No Logo Selected",
        description: "Please select a logo file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingLogo(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', logoFile);

      const uploadResponse = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      const { logoUrl } = await uploadResponse.json();

      const processResponse = await apiRequest("POST", "/api/admin/process-logo", {
        logoUrl,
        customerName: formData.name || "Logo",
      });

      const { processedLogoUrl } = await processResponse.json();

      setFormData(prev => ({ ...prev, logoUrl: processedLogoUrl }));
      setLogoPreview(processedLogoUrl);

      toast({
        title: "Logo Processed Successfully",
        description: "Your logo has been optimized and background removed.",
      });
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process logo",
        variant: "destructive",
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.logoUrl) {
      toast({
        title: "Missing Information",
        description: "Customer name and logo are required.",
        variant: "destructive",
      });
      return;
    }

    if (isAddingNew) {
      createMutation.mutate(formData);
    } else if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer.id,
        updates: formData,
      });
    }
  };

  const handleToggleActive = (customer: CommercialCustomer) => {
    updateMutation.mutate({
      id: customer.id,
      updates: { active: !customer.active }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Commercial Customers</h2>
          <p className="text-muted-foreground mt-1">Manage customer logos displayed on commercial services page</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-customer">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customersData?.customers.map((customer) => (
          <Card key={customer.id} data-testid={`customer-card-${customer.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {customer.logoUrl && (
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-md p-2 flex items-center justify-center min-w-[60px]">
                      <img
                        src={customer.logoUrl}
                        alt={`${customer.name} logo`}
                        className="h-12 w-auto object-contain"
                        data-testid={`logo-preview-${customer.id}`}
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.location && (
                      <CardDescription>{customer.location}</CardDescription>
                    )}
                  </div>
                </div>
                <Switch
                  checked={customer.active}
                  onCheckedChange={() => handleToggleActive(customer)}
                  data-testid={`switch-active-${customer.id}`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                {customer.industry && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Industry:</span> {customer.industry}
                  </p>
                )}
                {customer.customerSince && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Customer Since:</span> {customer.customerSince}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium">Display Order:</span> {customer.displayOrder}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(customer)}
                  data-testid={`button-edit-${customer.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(customer.id)}
                  data-testid={`button-delete-${customer.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? "Add Commercial Customer" : "Edit Commercial Customer"}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew
                ? "Add a new commercial customer to display on the commercial services page."
                : "Update the commercial customer information."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label>Logo *</Label>
              <div className="flex gap-4 items-start">
                {logoPreview && (
                  <div className="border rounded-lg p-4 bg-slate-900 dark:bg-slate-800 flex items-center justify-center min-w-[120px]">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-auto object-contain"
                      data-testid="logo-preview"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={isProcessingLogo}
                    data-testid="input-logo-file"
                  />
                  {isProcessingLogo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing logo...</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload any image format (PNG, JPEG, SVG, etc.). Logo will be automatically processed and optimized.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="O'Reilly Auto Parts"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://www.example.com"
                data-testid="input-website"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Austin, TX"
                  data-testid="input-location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Restaurant, Auto Services, etc."
                  data-testid="input-industry"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerSince">Customer Since (Year)</Label>
                <Input
                  id="customerSince"
                  type="number"
                  value={formData.customerSince}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerSince: parseInt(e.target.value) }))}
                  placeholder="2020"
                  data-testid="input-customer-since"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                  placeholder="1"
                  data-testid="input-display-order"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                data-testid="switch-active-form"
              />
              <Label htmlFor="active">Active (Show on website)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageMetadataSection() {
  const [editingMetadata, setEditingMetadata] = useState<PageMetadata | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    path: "",
    title: "",
    description: "",
  });

  const { data: metadataResponse, isLoading, error } = useQuery<{ metadata: PageMetadata[] }>({
    queryKey: ['/api/admin/page-metadata'],
    retry: false, // Don't retry on error
  });
  
  const customMetadata = metadataResponse?.metadata || [];

  // Show error state if query fails
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">Error loading page metadata</p>
        <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Unknown error'}</p>
      </div>
    );
  }

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/page-metadata", data);
    },
    onSuccess: () => {
      toast({
        title: isAddingNew ? "Metadata Added" : "Metadata Updated",
        description: `Page metadata has been ${isAddingNew ? 'added' : 'updated'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-metadata'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/page-metadata/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Metadata Deleted",
        description: "Page metadata has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-metadata'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = (path: string) => {
    setIsAddingNew(true);
    setEditingMetadata(null);
    setFormData({
      path,
      title: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (metadata: PageMetadata) => {
    setIsAddingNew(false);
    setEditingMetadata(metadata);
    setFormData({
      path: metadata.path,
      title: metadata.title || "",
      description: metadata.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page metadata? The page will use default metadata.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMetadata(null);
    setIsAddingNew(false);
    setFormData({
      path: "",
      title: "",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.path.trim()) {
      toast({
        title: "Validation Error",
        description: "Page path is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.description && formData.description.length > 0) {
      if (formData.description.length < 120) {
        toast({
          title: "Validation Error",
          description: "Meta description must be at least 120 characters for optimal SEO",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.description.length > 160) {
        toast({
          title: "Validation Error",
          description: "Meta description must not exceed 160 characters to avoid truncation in search results",
          variant: "destructive",
        });
        return;
      }
    }

    upsertMutation.mutate(formData);
  };

  // Merge all pages with custom metadata
  const allPagesWithMetadata = ALL_PAGES.map(page => {
    const custom = customMetadata?.find(m => m.path === page.path);
    return {
      ...page,
      customMetadata: custom,
      hasCustom: !!custom
    };
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading page metadata...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Manage SEO Metadata</h2>
        <p className="text-muted-foreground mt-1">
          Control page titles and meta descriptions for all {ALL_PAGES.length} pages. Pages with custom metadata show their overrides.
        </p>
      </div>

      {/* Metadata Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">Page</th>
                  <th className="text-left p-3 font-medium text-sm">Custom Title</th>
                  <th className="text-left p-3 font-medium text-sm">Custom Description</th>
                  <th className="text-center p-3 font-medium text-sm">Status</th>
                  <th className="text-right p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allPagesWithMetadata.map((page) => (
                  <tr key={page.path} className="border-b last:border-b-0 hover-elevate">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{page.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {page.path}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {page.customMetadata?.title ? (
                        <div className="text-sm">{page.customMetadata.title}</div>
                      ) : (
                        <div className="max-w-md">
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {page.defaultTitle || `${page.title} | Economy Plumbing`}
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs">Default from page</Badge>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {page.customMetadata?.description ? (
                        <div className="max-w-md">
                          <div className="text-sm line-clamp-2">{page.customMetadata.description}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {page.customMetadata.description.length} chars
                          </Badge>
                        </div>
                      ) : (
                        <div className="max-w-md">
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {page.defaultDescription || `Professional ${page.title.toLowerCase()} services in Austin & Marble Falls, TX. Licensed plumbers, same-day service available.`}
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs">Default from page</Badge>
                        </div>
                      )}
                    </td>                    <td className="p-3 text-center">
                      {page.hasCustom ? (
                        <Badge variant="default" className="text-xs">Custom</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {page.hasCustom ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(page.customMetadata!)}
                              data-testid={`button-edit-${page.path}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(page.customMetadata!.id)}
                              data-testid={`button-delete-${page.path}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddNew(page.path)}
                            data-testid={`button-add-${page.path}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? "Add Page Metadata" : "Edit Page Metadata"}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew 
                ? "Add custom SEO metadata for a page" 
                : "Update SEO metadata for this page"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Path */}
              <div className="space-y-2">
                <Label htmlFor="path">
                  Page Path <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/services/drain-cleaning"
                  disabled={!isAddingNew}
                  data-testid="input-path"
                />
                <p className="text-xs text-muted-foreground">
                  The URL path of the page (e.g., /about, /services/plumbing)
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Page Title
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.title.length} characters)
                  </span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Drain Cleaning Services | Economy Plumbing"
                  data-testid="input-title"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 50-60 characters for optimal display
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Meta Description
                  <span className={`text-xs ml-2 ${
                    formData.description.length >= 120 && formData.description.length <= 160 
                      ? "text-green-600" 
                      : "text-muted-foreground"
                  }`}>
                    ({formData.description.length} characters)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Professional drain cleaning services in Austin & Marble Falls. Call (512) 469-5858 for emergency service."
                  rows={3}
                  data-testid="input-description"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 120-160 characters. Include phone number for SEO.
                  {formData.description.length > 160 && (
                    <span className="text-destructive block mt-1">
                      ⚠️ Over 160 characters - may be truncated in search results
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                data-testid="button-save"
              >
                {upsertMutation.isPending ? "Saving..." : "Save Metadata"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrackingNumbersSection() {
  const [editingNumber, setEditingNumber] = useState<TrackingNumber | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    channelKey: "",
    channelName: "",
    phoneNumber: "", // Single input field
    displayNumber: "",
    rawNumber: "",
    telLink: "",
    detectionRules: "{}",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  });

  // Detection rule fields (parsed from JSON)
  const [urlParams, setUrlParams] = useState<string[]>([]);
  const [utmSources, setUtmSources] = useState<string[]>([]);
  const [referrerIncludes, setReferrerIncludes] = useState<string[]>([]);
  const [newUrlParam, setNewUrlParam] = useState("");
  const [newUtmSource, setNewUtmSource] = useState("");
  const [newReferrer, setNewReferrer] = useState("");

  // Auto-generate JSON from detection rule fields
  const generateDetectionRulesJSON = () => {
    const rules: any = {};
    if (urlParams.length > 0) rules.urlParams = urlParams;
    if (utmSources.length > 0) rules.utmSources = utmSources;
    if (referrerIncludes.length > 0) rules.referrerIncludes = referrerIncludes;
    return JSON.stringify(rules, null, 2);
  };

  // Parse detection rules JSON into individual fields
  const parseDetectionRules = (json: string) => {
    try {
      const rules = JSON.parse(json);
      setUrlParams(rules.urlParams || []);
      setUtmSources(rules.utmSources || []);
      setReferrerIncludes(rules.referrerIncludes || []);
    } catch (e) {
      // Invalid JSON, initialize with empty arrays
      setUrlParams([]);
      setUtmSources([]);
      setReferrerIncludes([]);
    }
  };

  // Auto-generate phone fields when phone number changes with live formatting
  const handlePhoneNumberChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10); // Max 10 digits
    
    // Live format as you type: (512) 123-4567
    let formattedInput = digitsOnly;
    if (digitsOnly.length >= 1) {
      formattedInput = `(${digitsOnly.slice(0, 3)}`;
      if (digitsOnly.length >= 4) {
        formattedInput += `) ${digitsOnly.slice(3, 6)}`;
        if (digitsOnly.length >= 7) {
          formattedInput += `-${digitsOnly.slice(6, 10)}`;
        }
      }
    }
    
    // Generate display number (always formatted if 10 digits)
    const displayNumber = digitsOnly.length === 10 
      ? `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
      : '';
    
    // Generate tel link
    const telLink = digitsOnly.length === 10 ? `tel:+1${digitsOnly}` : '';
    
    setFormData({
      ...formData,
      phoneNumber: formattedInput,
      displayNumber,
      rawNumber: digitsOnly,
      telLink,
    });
  };

  const { data: trackingData, isLoading } = useQuery<{ trackingNumbers: TrackingNumber[] }>({
    queryKey: ['/api/admin/tracking-numbers'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/tracking-numbers", data);
    },
    onSuccess: () => {
      toast({
        title: "Tracking Number Created",
        description: "The tracking number has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-numbers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TrackingNumber> }) => {
      return await apiRequest("PUT", `/api/admin/tracking-numbers/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Tracking Number Updated",
        description: "The tracking number has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-numbers'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/tracking-numbers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tracking Number Deleted",
        description: "The tracking number has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-numbers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingNumber(null);
    // Initialize with empty arrays
    setUrlParams([]);
    setUtmSources([]);
    setReferrerIncludes([]);
    setNewUrlParam("");
    setNewUtmSource("");
    setNewReferrer("");
    setFormData({
      channelKey: "",
      channelName: "",
      phoneNumber: "",
      displayNumber: "",
      rawNumber: "",
      telLink: "",
      detectionRules: JSON.stringify({ urlParams: [], utmSources: [], referrerIncludes: [] }, null, 2),
      isActive: true,
      isDefault: false,
      sortOrder: (trackingData?.trackingNumbers.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (number: TrackingNumber) => {
    setIsAddingNew(false);
    setEditingNumber(number);
    // Parse detection rules into individual fields
    parseDetectionRules(number.detectionRules);
    setNewUrlParam("");
    setNewUtmSource("");
    setNewReferrer("");
    setFormData({
      channelKey: number.channelKey,
      channelName: number.channelName,
      phoneNumber: number.displayNumber, // Use display number as initial value
      displayNumber: number.displayNumber,
      rawNumber: number.rawNumber,
      telLink: number.telLink,
      detectionRules: number.detectionRules,
      isActive: number.isActive,
      isDefault: number.isDefault,
      sortOrder: number.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tracking number?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (number: TrackingNumber) => {
    updateMutation.mutate({
      id: number.id,
      updates: { isActive: !number.isActive }
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNumber(null);
    setIsAddingNew(false);
  };

  const handleSave = () => {
    if (!formData.channelKey || !formData.channelName || !formData.displayNumber) {
      toast({
        title: "Missing Information",
        description: "Channel key, name, and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    // Auto-generate detection rules JSON from individual fields
    const generatedJSON = generateDetectionRulesJSON();
    const dataToSave = {
      ...formData,
      detectionRules: generatedJSON,
    };

    if (isAddingNew) {
      createMutation.mutate(dataToSave);
    } else if (editingNumber) {
      updateMutation.mutate({
        id: editingNumber.id,
        updates: dataToSave,
      });
    }
  };

  const trackingNumbers = trackingData?.trackingNumbers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tracking Numbers Admin</h2>
          <p className="text-muted-foreground mt-1">
            Manage marketing channel phone numbers and detection rules
          </p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-tracking-number">
          <Plus className="w-4 h-4 mr-2" />
          Add Tracking Number
        </Button>
      </div>

      {/* Tracking Numbers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8">
              <p className="text-center text-muted-foreground">Loading tracking numbers...</p>
            </div>
          ) : trackingNumbers.length === 0 ? (
            <div className="py-8">
              <p className="text-center text-muted-foreground">No tracking numbers yet. Click "Add Tracking Number" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Channel</th>
                    <th className="text-left p-3 font-medium text-sm">Phone Number</th>
                    <th className="text-left p-3 font-medium text-sm">Detection Rules</th>
                    <th className="text-center p-3 font-medium text-sm">Status</th>
                    <th className="text-right p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingNumbers.map((number) => (
                    <tr key={number.id} className="border-b last:border-b-0 hover-elevate">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{number.channelName}</div>
                          <div className="text-xs text-muted-foreground">
                            {number.channelKey}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-sm">{number.displayNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-muted-foreground max-w-xs">
                          {(() => {
                            try {
                              const rules = JSON.parse(number.detectionRules);
                              const parts = [];
                              if (rules.urlParams?.length) parts.push(`URL: ${rules.urlParams.join(', ')}`);
                              if (rules.utmSources?.length) parts.push(`UTM: ${rules.utmSources.join(', ')}`);
                              if (rules.referrerIncludes?.length) parts.push(`Ref: ${rules.referrerIncludes.join(', ')}`);
                              return parts.length ? parts.join(' | ') : 'No rules';
                            } catch (e) {
                              return 'Invalid';
                            }
                          })()}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {number.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                          {number.isActive ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">Inactive</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(number)}
                            data-testid={`button-edit-${number.channelKey}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(number)}
                            data-testid={`button-toggle-${number.channelKey}`}
                          >
                            {number.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          {!number.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(number.id)}
                              data-testid={`button-delete-${number.channelKey}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isAddingNew ? "Add Tracking Number" : "Edit Tracking Number"}</DialogTitle>
            <DialogDescription>
              {isAddingNew ? "Create a new tracking number" : "Update tracking number details and detection rules"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="channelKey">Channel Key *</Label>
              <Input
                id="channelKey"
                value={formData.channelKey}
                onChange={(e) => setFormData({ ...formData, channelKey: e.target.value })}
                placeholder="google_ads"
                disabled={!isAddingNew}
                data-testid="input-channelKey"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channelName">Channel Name *</Label>
              <Input
                id="channelName"
                value={formData.channelName}
                onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                placeholder="Google Ads"
                data-testid="input-channelName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                placeholder="5121234567 or (512) 123-4567"
                data-testid="input-phoneNumber"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generates: Display format, Raw number, and Tel link
              </p>
            </div>
            {formData.displayNumber && (
              <div className="grid gap-2 p-3 bg-muted/30 rounded-md">
                <div className="text-sm">
                  <span className="font-medium">Display:</span> {formData.displayNumber}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Raw:</span> {formData.rawNumber}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tel Link:</span> {formData.telLink}
                </div>
              </div>
            )}
            {/* Detection Rules - Individual Fields */}
            <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label className="text-base font-semibold">Detection Rules</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure when this phone number should be displayed
                </p>
              </div>

              {/* URL Parameters */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium">URL Parameters</Label>
                <p className="text-xs text-muted-foreground">
                  Show this number when these URL parameters are present (e.g., gclid, fbclid)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newUrlParam}
                    onChange={(e) => setNewUrlParam(e.target.value)}
                    placeholder="gclid"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newUrlParam.trim() && !urlParams.includes(newUrlParam.trim())) {
                          setUrlParams([...urlParams, newUrlParam.trim()]);
                          setNewUrlParam("");
                        }
                      }
                    }}
                    data-testid="input-new-url-param"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newUrlParam.trim() && !urlParams.includes(newUrlParam.trim())) {
                        setUrlParams([...urlParams, newUrlParam.trim()]);
                        setNewUrlParam("");
                      }
                    }}
                    data-testid="button-add-url-param"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {urlParams.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {urlParams.map((param, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {param}
                        <button
                          type="button"
                          onClick={() => setUrlParams(urlParams.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-url-param-${index}`}
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* UTM Sources */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium">UTM Sources</Label>
                <p className="text-xs text-muted-foreground">
                  Show this number when utm_source matches these values (e.g., google, facebook)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newUtmSource}
                    onChange={(e) => setNewUtmSource(e.target.value)}
                    placeholder="google"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newUtmSource.trim() && !utmSources.includes(newUtmSource.trim())) {
                          setUtmSources([...utmSources, newUtmSource.trim()]);
                          setNewUtmSource("");
                        }
                      }
                    }}
                    data-testid="input-new-utm-source"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newUtmSource.trim() && !utmSources.includes(newUtmSource.trim())) {
                        setUtmSources([...utmSources, newUtmSource.trim()]);
                        setNewUtmSource("");
                      }
                    }}
                    data-testid="button-add-utm-source"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {utmSources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {utmSources.map((source, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {source}
                        <button
                          type="button"
                          onClick={() => setUtmSources(utmSources.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-utm-source-${index}`}
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Referrer Includes */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Referrer Contains</Label>
                <p className="text-xs text-muted-foreground">
                  Show this number when the referrer URL contains these strings (e.g., google.com, facebook.com)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newReferrer}
                    onChange={(e) => setNewReferrer(e.target.value)}
                    placeholder="google.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newReferrer.trim() && !referrerIncludes.includes(newReferrer.trim())) {
                          setReferrerIncludes([...referrerIncludes, newReferrer.trim()]);
                          setNewReferrer("");
                        }
                      }
                    }}
                    data-testid="input-new-referrer"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newReferrer.trim() && !referrerIncludes.includes(newReferrer.trim())) {
                        setReferrerIncludes([...referrerIncludes, newReferrer.trim()]);
                        setNewReferrer("");
                      }
                    }}
                    data-testid="button-add-referrer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {referrerIncludes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {referrerIncludes.map((referrer, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {referrer}
                        <button
                          type="button"
                          onClick={() => setReferrerIncludes(referrerIncludes.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-referrer-${index}`}
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Traffic Capture Preview */}
              <div className="grid gap-2 pt-2 border-t">
                <Label className="text-sm font-medium">📊 Traffic Capture Preview</Label>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 text-sm space-y-2">
                  <p className="font-medium text-blue-900 dark:text-blue-100">This number will display for visitors from:</p>
                  {urlParams.length > 0 && (
                    <div className="flex gap-2 items-start">
                      <span className="text-blue-700 dark:text-blue-300 font-medium min-w-[80px]">URL Params:</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        {urlParams.map(param => `?${param}=...`).join(', ')}
                      </span>
                    </div>
                  )}
                  {utmSources.length > 0 && (
                    <div className="flex gap-2 items-start">
                      <span className="text-blue-700 dark:text-blue-300 font-medium min-w-[80px]">UTM Source:</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        {utmSources.map(source => `utm_source=${source}`).join(' OR ')}
                      </span>
                    </div>
                  )}
                  {referrerIncludes.length > 0 && (
                    <div className="flex gap-2 items-start">
                      <span className="text-blue-700 dark:text-blue-300 font-medium min-w-[80px]">Referrer:</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        Coming from {referrerIncludes.map(ref => `*${ref}*`).join(' OR ')}
                      </span>
                    </div>
                  )}
                  {urlParams.length === 0 && utmSources.length === 0 && referrerIncludes.length === 0 && (
                    <p className="text-blue-700 dark:text-blue-300 italic">
                      No detection rules set. This number won't match any traffic automatically.
                    </p>
                  )}
                </div>
              </div>

              {/* Auto-Generated JSON Preview */}
              <div className="grid gap-2 pt-2 border-t">
                <Label className="text-sm font-medium">Auto-Generated JSON</Label>
                <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto border">
                  {generateDetectionRulesJSON()}
                </pre>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-isActive"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                data-testid="switch-isDefault"
              />
              <Label htmlFor="isDefault">Default</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                data-testid="input-sortOrder"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-testid="button-save">
                {isAddingNew ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UnifiedAdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [, setLocation] = useLocation();

  // Check auth status
  const { data: authData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      setLocation("/admin/oauth-login");
    }
  }, [authData, setLocation]);

  // Fetch stats
  const { data: statsData } = useQuery<{ stats: any }>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: photosData } = useQuery({
    queryKey: ['/api/admin/photos', 'all', 'all', 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'all',
        quality: 'all',
        status: 'all',
      });
      return await fetch(`/api/admin/photos?${params}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
  });

  if (!authData?.isAdmin) {
    return null;
  }

  const stats = statsData?.stats || {};
  const photos = photosData?.photos || [];

  const sidebarStyle = {
    "--sidebar-width": "280px",
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview stats={stats} photos={photos} />;
      case 'photos':
        return <PhotoManagement />;
      case 'success-stories':
        return <SuccessStoriesSection />;
      case 'commercial-customers':
        return <CommercialCustomersSection />;
      case 'page-metadata':
        return <PageMetadataSection />;
      case 'tracking-numbers':
        return <TrackingNumbersSection />;
      default:
        return <DashboardOverview stats={stats} photos={photos} />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<AdminSection, string> = {
      'dashboard': 'Dashboard',
      'photos': 'Photo Management',
      'success-stories': 'Success Stories',
      'commercial-customers': 'Commercial Customers',
      'page-metadata': 'Page Metadata',
      'tracking-numbers': 'Tracking Numbers',
    };
    return titles[activeSection];
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold">{getSectionTitle()}</h1>
                <p className="text-sm text-muted-foreground">
                  {activeSection === 'dashboard' ? 'Welcome to the admin portal' : `Manage ${getSectionTitle().toLowerCase()}`}
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Manual Success Story Dialog Component
function ManualSuccessStoryDialog({ photos, onClose }: { photos: any[], onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const response = await fetch('/api/admin/generate-story-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo1Url: photos[0].photoUrl,
          photo2Url: photos[1].photoUrl
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate caption');
      
      const data = await response.json();
      setTitle(data.title);
      setDescription(data.description);
      
      toast({
        title: "Caption Generated",
        description: "AI has generated a caption for your success story.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !description) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/admin/success-stories/manual", {
        photo1Id: photos[0].id,
        photo2Id: photos[1].id,
        title,
        description,
      });
      
      toast({
        title: "Success Story Created",
        description: "The success story has been created and is pending review.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/success-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-success-story">
        <DialogHeader>
          <DialogTitle>Create Success Story</DialogTitle>
          <DialogDescription>
            Create a before/after success story from 2 selected photos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Before Photo</p>
              <img 
                src={photos[0].photoUrl} 
                alt="Before" 
                className="w-full h-48 object-cover rounded-lg"
                data-testid="img-before-photo"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">After Photo</p>
              <img 
                src={photos[1].photoUrl} 
                alt="After" 
                className="w-full h-48 object-cover rounded-lg"
                data-testid="img-after-photo"
              />
            </div>
          </div>

          {/* Generate Caption Button */}
          <Button
            onClick={generateCaption}
            disabled={isGeneratingCaption}
            className="w-full"
            data-testid="button-generate-caption"
          >
            {isGeneratingCaption ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Caption with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Caption with AI
              </>
            )}
          </Button>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium" htmlFor="story-title">
              Title
            </label>
            <Input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Water Heater Replacement"
              data-testid="input-story-title"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label className="text-sm font-medium" htmlFor="story-description">
              Description
            </label>
            <Textarea
              id="story-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the before/after transformation..."
              rows={4}
              data-testid="textarea-story-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} data-testid="button-create-story">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Success Story'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Manual Blog Post Dialog Component
function ManualBlogPostDialog({ photo, onClose }: { photo: any, onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generateBlogPost = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/generate-blog-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: photo.photoUrl,
          aiDescription: photo.aiDescription
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate blog post');
      
      const data = await response.json();
      setTitle(data.title);
      setContent(data.content);
      
      toast({
        title: "Blog Post Generated",
        description: "AI has generated a blog post from your photo.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !content) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and content",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/admin/blog-posts/manual", {
        photoId: photo.id,
        title,
        content,
      });
      
      toast({
        title: "Blog Post Created",
        description: "The blog post has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-blog-post">
        <DialogHeader>
          <DialogTitle>Create Blog Post</DialogTitle>
          <DialogDescription>
            Create a blog post from selected photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Selected Photo</p>
            <img 
              src={photo.photoUrl} 
              alt="Blog photo" 
              className="w-full h-64 object-cover rounded-lg"
              data-testid="img-blog-photo"
            />
            {photo.aiDescription && (
              <p className="text-sm text-muted-foreground mt-2">
                AI Description: {photo.aiDescription}
              </p>
            )}
          </div>

          {/* Generate Blog Post Button */}
          <Button
            onClick={generateBlogPost}
            disabled={isGenerating}
            className="w-full"
            data-testid="button-generate-blog-post"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Blog Post with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Blog Post with AI
              </>
            )}
          </Button>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium" htmlFor="blog-title">
              Title
            </label>
            <Input
              id="blog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Expert Water Heater Repair in Austin"
              data-testid="input-blog-title"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-sm font-medium" htmlFor="blog-content">
              Content
            </label>
            <Textarea
              id="blog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post content (supports markdown)..."
              rows={12}
              data-testid="textarea-blog-content"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} data-testid="button-create-blog-post">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Blog Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
