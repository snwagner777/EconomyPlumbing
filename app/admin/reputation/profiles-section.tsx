'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function ProfilesSection() {
  const { data: platforms, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/review-platforms'],
  });

  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    platform: '',
    displayName: '',
    url: '',
    description: '',
    enabled: true,
    sortOrder: 999,
  });
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/admin/review-platforms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update platform');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-platforms'] });
      toast({ title: "Platform updated successfully" });
      setShowDialog(false);
      setEditingPlatform(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating platform", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (platformData: any) => {
      const response = await fetch('/api/admin/review-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(platformData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create platform');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review-platforms'] });
      toast({ title: "Platform created successfully" });
      setShowAddDialog(false);
      setNewPlatform({
        platform: '',
        displayName: '',
        url: '',
        description: '',
        enabled: true,
        sortOrder: 999,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error creating platform", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!editingPlatform) return;
    updateMutation.mutate({
      id: editingPlatform.id,
      updates: {
        displayName: editingPlatform.displayName,
        url: editingPlatform.url,
        enabled: editingPlatform.enabled,
        description: editingPlatform.description,
        sortOrder: editingPlatform.sortOrder,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-platform"
        >
          Add New Platform
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms?.map((platform) => (
            <Card key={platform.id} data-testid={`card-platform-${platform.platform}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                    <CardDescription className="text-xs mt-1">{platform.platform}</CardDescription>
                  </div>
                  <Badge variant={platform.enabled ? "default" : "secondary"}>
                    {platform.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Review URL</p>
                  <p className="text-sm font-mono truncate">{platform.url}</p>
                </div>
                {platform.description && (
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEdit(platform)}
                  data-testid={`button-edit-${platform.platform}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Platform
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Platform Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review Platform</DialogTitle>
            <DialogDescription>
              Add a new review platform link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-platform">Platform ID</Label>
              <Input
                id="new-platform"
                value={newPlatform.platform}
                onChange={(e) => setNewPlatform({ ...newPlatform, platform: e.target.value })}
                placeholder="e.g., angi, thumbtack, nextdoor"
                data-testid="input-new-platform"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, no spaces)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-displayName">Display Name</Label>
              <Input
                id="new-displayName"
                value={newPlatform.displayName}
                onChange={(e) => setNewPlatform({ ...newPlatform, displayName: e.target.value })}
                placeholder="e.g., Angi (formerly Angie's List)"
                data-testid="input-new-displayName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-url">Review URL</Label>
              <Input
                id="new-url"
                type="url"
                value={newPlatform.url}
                onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                placeholder="https://..."
                data-testid="input-new-url"
              />
              <p className="text-xs text-muted-foreground">
                Direct link to your business profile/reviews
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-description">Description (Optional)</Label>
              <Input
                id="new-description"
                value={newPlatform.description}
                onChange={(e) => setNewPlatform({ ...newPlatform, description: e.target.value })}
                placeholder="e.g., Home services reviews"
                data-testid="input-new-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-sortOrder">Sort Order</Label>
              <Input
                id="new-sortOrder"
                type="number"
                value={newPlatform.sortOrder}
                onChange={(e) => setNewPlatform({ ...newPlatform, sortOrder: parseInt(e.target.value) || 999 })}
                data-testid="input-new-sortOrder"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="new-enabled"
                checked={newPlatform.enabled}
                onCheckedChange={(checked) => setNewPlatform({ ...newPlatform, enabled: checked })}
                data-testid="switch-new-enabled"
              />
              <Label htmlFor="new-enabled">Enabled</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-add-cancel">
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate(newPlatform)} 
                disabled={createMutation.isPending || !newPlatform.platform || !newPlatform.displayName || !newPlatform.url}
                data-testid="button-add-save"
              >
                {createMutation.isPending ? 'Creating...' : 'Add Platform'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingPlatform?.displayName}</DialogTitle>
            <DialogDescription>
              Update the review platform settings
            </DialogDescription>
          </DialogHeader>
          {editingPlatform && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editingPlatform.displayName}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, displayName: e.target.value })}
                  data-testid="input-displayName"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Review URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={editingPlatform.url}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, url: e.target.value })}
                  data-testid="input-url"
                />
                <p className="text-xs text-muted-foreground">
                  Direct link to your business review page on this platform
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingPlatform.description || ''}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, description: e.target.value })}
                  data-testid="input-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={editingPlatform.sortOrder}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, sortOrder: parseInt(e.target.value) })}
                  data-testid="input-sortOrder"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={editingPlatform.enabled}
                  onCheckedChange={(checked) => setEditingPlatform({ ...editingPlatform, enabled: checked })}
                  data-testid="switch-enabled"
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
