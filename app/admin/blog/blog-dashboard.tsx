/**
 * Blog Dashboard Client Component
 * 
 * Manage blog posts with AI generation (GPT-4o) and SEO optimization
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';

export function BlogDashboard() {
  // Fetch blog posts from admin API (includes drafts and AI metadata)
  const { data: blogData, isLoading } = useQuery({
    queryKey: ['/api/admin/blog'],
  });

  const posts = blogData?.posts || [];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link 
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
                data-testid="link-back-admin"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold mb-2">Blog Management</h1>
              <p className="text-muted-foreground">
                Manage blog posts with AI-powered generation and SEO optimization
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" data-testid="button-ai-generate">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
              <Button data-testid="button-new-post">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6" data-testid="stat-total-posts">
              <div className="text-sm text-muted-foreground mb-1">Total Posts</div>
              <div className="text-3xl font-bold" data-testid="text-total-posts-count">{posts.length}</div>
            </Card>
            <Card className="p-6" data-testid="stat-published-posts">
              <div className="text-sm text-muted-foreground mb-1">Published</div>
              <div className="text-3xl font-bold" data-testid="text-published-count">
                {posts.filter((p: any) => p.published).length}
              </div>
            </Card>
            <Card className="p-6" data-testid="stat-draft-posts">
              <div className="text-sm text-muted-foreground mb-1">Drafts</div>
              <div className="text-3xl font-bold" data-testid="text-drafts-count">
                {posts.filter((p: any) => !p.published).length}
              </div>
            </Card>
            <Card className="p-6" data-testid="stat-ai-generated-posts">
              <div className="text-sm text-muted-foreground mb-1">AI Generated</div>
              <div className="text-3xl font-bold" data-testid="text-ai-generated-count">
                {posts.filter((p: any) => p.aiGenerated).length}
              </div>
            </Card>
          </div>

          {/* AI Blog Generation Info */}
          <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">AI Blog Generation System</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  GPT-4o automatically generates SEO-optimized blog posts using unused photos from CompanyCam, 
                  Google Drive, and ServiceTitan. Runs weekly to maintain fresh content.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Features:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Seasonal awareness (winter freeze, summer prep)</li>
                      <li>• Local SEO optimization (Austin, TX areas)</li>
                      <li>• Automatic focal point detection</li>
                      <li>• JSON-LD schema generation</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Photo Sources:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• CompanyCam project photos</li>
                      <li>• Google Drive shared folders</li>
                      <li>• ServiceTitan job photos</li>
                      <li>• Manual admin uploads</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Blog Posts List */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Recent Blog Posts</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No blog posts yet</p>
                <Button data-testid="button-create-first-post">
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.slice(0, 10).map((post: any) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                    data-testid={`post-item-${post.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.title}</h3>
                        {post.aiGenerated && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            AI Generated
                          </span>
                        )}
                        {!post.published && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.excerpt || post.content?.substring(0, 150)}...
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {post.category && <span>{post.category}</span>}
                        {post.category && post.createdAt && <span className="mx-2">•</span>}
                        {post.createdAt && (
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-edit-${post.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-${post.id}`}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
