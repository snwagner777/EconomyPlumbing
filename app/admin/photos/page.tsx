'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Image as ImageIcon, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Photo {
  id: string;
  url: string;
  source: string;
  jobId: string | null;
  category: string | null;
  tags: string[] | null;
  metadata: any;
  uploadedAt: string;
}

export default function PhotosAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');

  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push('/admin/login');
    }
  }, [authData, router]);

  const { data: photosData, isLoading } = useQuery({
    queryKey: ['/api/admin/photos', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'unused') {
        params.append('unused', 'true');
      } else if (filter !== 'all') {
        params.append('category', filter);
      }
      const response = await fetch(`/api/admin/photos?${params}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
  });

  const handleLogout = async () => {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (response.ok) {
      router.push('/admin/login');
    }
  };

  if (!authData?.isAdmin) {
    return null;
  }

  const photos = photosData?.photos || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-photos">Photo Library</h1>
            <p className="text-muted-foreground mt-1">Manage photos from CompanyCam, Google Drive, and ServiceTitan</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin')} data-testid="button-back">
              Back to Admin
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo Statistics</CardTitle>
            <CardDescription>Overview of photo library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CompanyCam</p>
                <p className="text-2xl font-bold">{photos.filter((p: Photo) => p.source === 'companycam').length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Google Drive</p>
                <p className="text-2xl font-bold">{photos.filter((p: Photo) => p.source === 'google_drive').length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ServiceTitan</p>
                <p className="text-2xl font-bold">{photos.filter((p: Photo) => p.source === 'servicetitan').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48" data-testid="select-filter">
              <SelectValue placeholder="Filter photos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
              </Card>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 gap-2">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No photos found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo: Photo) => (
              <Card key={photo.id} className="overflow-hidden hover-elevate cursor-pointer" data-testid={`photo-${photo.id}`}>
                <div className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.category || 'Photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {photo.source}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  {photo.category && (
                    <p className="text-sm font-medium mb-1">{photo.category}</p>
                  )}
                  {photo.jobId && (
                    <p className="text-xs text-muted-foreground mb-1">Job: {photo.jobId}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(photo.uploadedAt), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
