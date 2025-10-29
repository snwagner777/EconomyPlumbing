'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, Plus, Edit, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PageMetadata } from "@shared/schema";

export default function PageMetadataAdmin() {
  const router = useRouter();
  const [editingMetadata, setEditingMetadata] = useState<PageMetadata | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    path: "",
    title: "",
    description: "",
  });

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push("/admin/login");
    }
  }, [authData, router]);

  // Fetch page metadata
  const { data: metadataList, isLoading } = useQuery<PageMetadata[]>({
    queryKey: ['/api/admin/page-metadata'],
  });

  // Upsert mutation
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

  // Delete mutation
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

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    router.push("/admin/login");
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingMetadata(null);
    setFormData({
      path: "",
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
    
    // Validation
    if (!formData.path.trim()) {
      toast({
        title: "Validation Error",
        description: "Page path is required",
        variant: "destructive",
      });
      return;
    }

    // Validate description length (SEO best practice: 120-160 characters)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading page metadata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Page Metadata Admin</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Manage SEO Metadata</h2>
            <p className="text-muted-foreground mt-1">
              Control page titles and meta descriptions for all pages
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            data-testid="button-add-metadata"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page Metadata
          </Button>
        </div>

        {/* Metadata List */}
        <div className="space-y-4">
          {metadataList && metadataList.length > 0 ? (
            metadataList.map((metadata) => (
              <Card key={metadata.id} data-testid={`card-metadata-${metadata.path}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {metadata.path}
                        <Badge variant="outline" className="text-xs">
                          {metadata.title?.length || 0} chars
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{metadata.title}</p>
                          <p className="text-sm">
                            {metadata.description}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {metadata.description?.length || 0} chars
                            </Badge>
                          </p>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(metadata)}
                        data-testid={`button-edit-${metadata.path}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(metadata.id)}
                        data-testid={`button-delete-${metadata.path}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No page metadata configured yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add metadata to override default SEO titles and descriptions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

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
