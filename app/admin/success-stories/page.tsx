'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  ImageIcon, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DraggableCollageEditor } from '@/components/DraggableCollageEditor';

interface SuccessStory {
  id: string;
  customerName: string;
  email?: string;
  phone?: string;
  location: string;
  serviceCategory: string;
  story: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  collagePhotoUrl?: string;
  approved: boolean;
  beforeFocalX?: number;
  beforeFocalY?: number;
  afterFocalX?: number;
  afterFocalY?: number;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export default function SuccessStoriesAdminPage() {
  const { toast } = useToast();
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    story: "",
    location: "",
  });

  const [isFocalPointDialogOpen, setIsFocalPointDialogOpen] = useState(false);
  const [focalPointStory, setFocalPointStory] = useState<SuccessStory | null>(null);
  const [beforeFocalPoint, setBeforeFocalPoint] = useState<{ x: number; y: number } | null>(null);
  const [afterFocalPoint, setAfterFocalPoint] = useState<{ x: number; y: number } | null>(null);

  const { data: storiesData, isLoading } = useQuery<{ stories: SuccessStory[] }>({
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
      const response = await apiRequest('POST', '/api/admin/reprocess-success-story-collages');
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

  const handleEdit = (story: SuccessStory) => {
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

  const handleOpenFocalPointEditor = (story: SuccessStory) => {
    setFocalPointStory(story);
    setBeforeFocalPoint(
      story.beforeFocalX !== null && story.beforeFocalY !== null && story.beforeFocalX !== undefined && story.beforeFocalY !== undefined
        ? { x: story.beforeFocalX, y: story.beforeFocalY }
        : { x: 50, y: 50 }
    );
    setAfterFocalPoint(
      story.afterFocalX !== null && story.afterFocalY !== null && story.afterFocalX !== undefined && story.afterFocalY !== undefined
        ? { x: story.afterFocalX, y: story.afterFocalY }
        : { x: 50, y: 50 }
    );
    setIsFocalPointDialogOpen(true);
  };

  const handleSaveFocalPoints = (focalPoints: { before: { x: number; y: number }; after: { x: number; y: number } }) => {
    if (!focalPointStory) return;

    updateFocalPointsMutation.mutate({
      id: focalPointStory.id,
      focalPoints: {
        beforeFocalX: focalPoints.before.x,
        beforeFocalY: focalPoints.before.y,
        afterFocalX: focalPoints.after.x,
        afterFocalY: focalPoints.after.y,
      },
    });
  };

  const stories = storiesData?.stories || [];
  const pendingStories = stories.filter((s) => !s.approved);
  const approvedStories = stories.filter((s) => s.approved);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-success-stories">Success Stories</h1>
        <p className="text-muted-foreground mt-1">Review and approve customer success stories for your website</p>
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
          {pendingStories.map((story) => (
            <Card key={story.id} className="overflow-hidden" data-testid={`story-pending-${story.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{story.customerName}</CardTitle>
                    <CardDescription className="mt-1">
                      {story.email && `${story.email} • `}
                      {story.phone && `${formatPhoneNumber(story.phone)} • `}
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
                <div className="flex gap-2 pt-2 flex-wrap">
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
          {approvedStories.map((story) => (
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
                <div className="flex gap-2 pt-2 flex-wrap">
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

      {/* Draggable Collage Editor */}
      {focalPointStory && (
        <DraggableCollageEditor
          beforeImageUrl={focalPointStory.beforePhotoUrl}
          afterImageUrl={focalPointStory.afterPhotoUrl}
          initialBeforeFocal={beforeFocalPoint || { x: 50, y: 50 }}
          initialAfterFocal={afterFocalPoint || { x: 50, y: 50 }}
          onSave={handleSaveFocalPoints}
          onClose={() => {
            setIsFocalPointDialogOpen(false);
            setFocalPointStory(null);
            setBeforeFocalPoint(null);
            setAfterFocalPoint(null);
          }}
          open={isFocalPointDialogOpen}
          isSaving={updateFocalPointsMutation.isPending}
        />
      )}
    </div>
  );
}
