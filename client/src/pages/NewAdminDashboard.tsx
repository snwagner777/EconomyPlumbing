import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

function AdminSidebar() {
  const [location, setLocation] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/admin",
      description: "Overview & stats"
    },
    {
      title: "Photo Management",
      icon: ImageIcon,
      url: "/admin/photos",
      description: "Manage all photos"
    },
    {
      title: "Success Stories",
      icon: Star,
      url: "/admin/success-stories",
      description: "Review & approve stories"
    },
    {
      title: "Commercial Customers",
      icon: Building2,
      url: "/admin/commercial-customers",
      description: "Manage customer logos"
    },
    {
      title: "Page Metadata",
      icon: FileEdit,
      url: "/admin/page-metadata",
      description: "SEO titles & descriptions"
    },
    {
      title: "Tracking Numbers",
      icon: Phone,
      url: "/admin/tracking-numbers",
      description: "Phone number tracking"
    },
  ];

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    setLocation("/admin/login");
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
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
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

export default function NewAdminDashboard() {
  const [, setLocation] = useLocation();

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      setLocation("/admin/login");
    }
  }, [authData, setLocation]);

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
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
  const unusedPhotos = photos.filter((p: any) => !p.isUsed);
  const goodQualityUnused = unusedPhotos.filter((p: any) => p.aiQuality === 'good');

  const sidebarStyle = {
    "--sidebar-width": "280px",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome to the admin portal</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
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

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start h-auto py-6"
                      onClick={() => setLocation("/admin/photos")}
                      data-testid="quick-action-photos"
                    >
                      <ImageIcon className="h-8 w-8 mr-4 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Manage Photos</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Process and organize images
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto py-6"
                      onClick={() => setLocation("/admin/success-stories")}
                      data-testid="quick-action-stories"
                    >
                      <Star className="h-8 w-8 mr-4 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Review Stories</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Approve customer testimonials
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto py-6"
                      onClick={() => setLocation("/admin/page-metadata")}
                      data-testid="quick-action-seo"
                    >
                      <FileEdit className="h-8 w-8 mr-4 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Update SEO</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Edit page meta descriptions
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
