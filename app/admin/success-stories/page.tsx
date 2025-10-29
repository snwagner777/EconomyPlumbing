'use client';

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SuccessStoriesAdmin() {
  const router = useRouter();
  const { toast } = useToast();

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push("/admin/login");
    }
  }, [authData, router]);

  // Fetch success stories
  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['/api/admin/success-stories'],
  });

  // Approve story mutation
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

  // Delete story mutation
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

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    router.push("/admin/login");
  };

  const handleApprove = (id: string) => {
    if (confirm("Approve this success story and publish it to the website?")) {
      approveMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this success story? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (!authData?.isAdmin) {
    return null;
  }

  const stories = storiesData?.stories || [];
  const pendingStories = stories.filter((s: any) => !s.approved);
  const approvedStories = stories.filter((s: any) => s.approved);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-admin">Success Stories Admin</h1>
            <p className="text-muted-foreground mt-1">Review and approve customer success stories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin")} data-testid="button-back">
              Back to Admin
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

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
              <Card key={story.id} className="opacity-75" data-testid={`story-approved-${story.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{story.customerName}</CardTitle>
                      <CardDescription>{story.serviceCategory} • {story.location}</CardDescription>
                    </div>
                    <Badge variant="default">Published</Badge>
                  </div>
                </CardHeader>
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
      </div>
    </div>
  );
}
