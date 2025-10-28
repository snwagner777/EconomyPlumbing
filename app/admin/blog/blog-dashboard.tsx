/**
 * Blog Dashboard Client Component
 * 
 * Manage blog posts with AI generation (GPT-4o) and SEO optimization
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Eye,
  Edit,
  Sparkles,
  Tag,
  Filter,
} from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  publishDate: string;
  category?: string;
  tags?: string[];
  featuredImageUrl?: string;
}

export function BlogDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fetch all blog posts
  const {
    data: blogData,
    isLoading,
    isError,
  } = useQuery<{ posts?: BlogPost[]; count?: number }>({
    queryKey: ['/api/admin/blog'],
  });

  // AI generate placeholder
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter posts based on search and category
  const filteredPosts = blogData?.posts?.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.content ?? '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ||
      (post.category && post.category === categoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories
  const categories = Array.from(
    new Set(blogData?.posts?.map((p) => p.category)?.filter(Boolean) ?? [])
  );

  const handleCreatePost = () => {
    router.push('/admin/blog/new');
  };

  const handleEditPost = (slug: string) => {
    router.push(`/admin/blog/${slug}`);
  };

  const handleViewPost = (slug: string) => {
    window.open(`/blog/${slug}`, '_blank');
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: 'Feature Coming Soon',
        description: 'AI blog generation will be migrated in the next update',
      });
    }, 1500);
  };

  const isPublished = (publishDate: string) => {
    return new Date(publishDate) <= new Date();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-blog-cms">
            Blog CMS
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage blog posts with AI-powered content generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAIGenerate}
            variant="outline"
            disabled={isGenerating}
            data-testid="button-ai-generate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button
            onClick={handleCreatePost}
            data-testid="button-create-post"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6" data-testid="stat-total-posts">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-total-posts" />
              ) : isError ? (
                <div className="text-2xl font-bold text-destructive">—</div>
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-posts">
                  {blogData?.posts?.length ?? 0}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="stat-published">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-published" />
              ) : isError ? (
                <div className="text-2xl font-bold text-destructive">—</div>
              ) : (
                <div className="text-2xl font-bold" data-testid="text-published-count">
                  {blogData?.posts?.filter((p) => isPublished(p.publishDate))?.length ?? 0}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="stat-drafts">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-drafts" />
              ) : isError ? (
                <div className="text-2xl font-bold text-destructive">—</div>
              ) : (
                <div className="text-2xl font-bold" data-testid="text-drafts-count">
                  {blogData?.posts?.filter((p) => !isPublished(p.publishDate))?.length ?? 0}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="stat-categories">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" data-testid="skeleton-categories" />
              ) : isError ? (
                <div className="text-2xl font-bold text-destructive">—</div>
              ) : (
                <div className="text-2xl font-bold" data-testid="text-categories-count">
                  {categories.length}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-posts"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!} data-testid={`filter-${cat}`}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Blog Posts List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4" data-testid="heading-blog-posts">
          Blog Posts
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" data-testid={`skeleton-post-${i}`} />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" data-testid="alert-error-posts">
            <AlertDescription>
              Failed to load blog posts. Please try again.
            </AlertDescription>
          </Alert>
        ) : !filteredPosts || filteredPosts.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-posts">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || categoryFilter !== 'all' ? 'No posts found' : 'No blog posts yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first blog post or generating one with AI'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleCreatePost}
                  data-testid="button-empty-create"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
                <Button
                  onClick={handleAIGenerate}
                  variant="outline"
                  disabled={isGenerating}
                  data-testid="button-empty-ai-generate"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const published = isPublished(post.publishDate);
              return (
                <div
                  key={post.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition"
                  data-testid={`post-${post.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold" data-testid={`post-title-${post.id}`}>
                          {post.title}
                        </h3>
                        <Badge
                          variant={published ? 'default' : 'secondary'}
                          data-testid={`post-status-${post.id}`}
                        >
                          {published ? 'Published' : 'Draft'}
                        </Badge>
                        {post.category && (
                          <Badge variant="outline" data-testid={`post-category-${post.id}`}>
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      {post.metaDescription && (
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`post-description-${post.id}`}>
                          {post.metaDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span data-testid={`post-date-${post.id}`}>
                            {new Date(post.publishDate).toLocaleDateString()}
                          </span>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{post.tags.length} tags</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {published && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPost(post.slug)}
                          data-testid={`button-view-${post.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPost(post.slug)}
                        data-testid={`button-edit-${post.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
