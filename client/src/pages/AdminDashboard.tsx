import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, ImageIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      setLocation("/admin/login");
    }
  }, [authData, setLocation]);

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

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Reprocess photos mutation
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/reprocess-photos");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Reprocessing Complete",
        description: `${data.reprocessed} photos reprocessed with improved AI focal points. ${data.errors > 0 ? `${data.errors} errors occurred.` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reprocessing Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Cleanup similar photos mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/cleanup-similar-photos");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Cleanup Complete",
        description: `Found ${data.groupsFound} groups of similar photos and deleted ${data.photosDeleted} duplicates.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    setLocation("/admin/login");
  };
  
  const handleReprocess = () => {
    if (confirm("Reprocess ALL photos with improved AI analysis? This will update focal points for better image positioning.")) {
      reprocessMutation.mutate();
    }
  };

  const handleCleanupSimilar = () => {
    if (confirm("Find and remove similar/duplicate photos? AI will compare photos and keep only the best quality version from each similar group. This action cannot be undone!")) {
      cleanupMutation.mutate();
    }
  };

  if (!authData?.isAdmin) {
    return null;
  }

  const photos = photosData?.photos || [];
  const stats = statsData?.stats || {};

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Photo Admin Portal</h1>
            <p className="text-muted-foreground">Manage all photos (CompanyCam & Google Drive)</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={handleReprocess}
              disabled={reprocessMutation.isPending}
              data-testid="button-reprocess"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
              {reprocessMutation.isPending ? 'Reprocessing...' : 'Reprocess All Photos'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCleanupSimilar}
              disabled={cleanupMutation.isPending}
              data-testid="button-cleanup-similar"
            >
              <ImageIcon className={`w-4 h-4 mr-2 ${cleanupMutation.isPending ? 'animate-spin' : ''}`} />
              {cleanupMutation.isPending ? 'Finding Similar...' : 'Remove Similar Photos'}
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Photos</CardDescription>
              <CardTitle className="text-2xl">{stats.total || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unused</CardDescription>
              <CardTitle className="text-2xl">{stats.unused || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Used</CardDescription>
              <CardTitle className="text-2xl">{stats.used || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Good Quality</CardDescription>
              <CardTitle className="text-2xl">{stats.goodQuality || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Poor Quality</CardDescription>
              <CardTitle className="text-2xl">{stats.poorQuality || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="water_heater">Water Heater</SelectItem>
                  <SelectItem value="drain">Drain</SelectItem>
                  <SelectItem value="leak">Leak</SelectItem>
                  <SelectItem value="toilet_faucet">Toilet/Faucet</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="backflow">Backflow</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-quality">
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
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Photos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {photosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No photos found with current filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={photo.photoUrl}
                        alt={photo.aiDescription || 'Photo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {photo.isGoodQuality ? (
                          <Badge variant="default" className="bg-green-600">
                            Good ({photo.qualityScore}/10)
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Poor ({photo.qualityScore}/10)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{photo.category}</Badge>
                        {(photo.usedInBlogPostId || photo.usedInPageUrl) ? (
                          <Badge variant="secondary">Used</Badge>
                        ) : (
                          <Badge>Unused</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {photo.aiDescription || 'No description'}
                      </p>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {photo.tags.slice(0, 3).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
