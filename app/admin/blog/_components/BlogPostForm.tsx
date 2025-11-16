/**
 * Blog Post Form Component
 * 
 * Reusable form for creating and editing blog posts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Eye } from 'lucide-react';
import type { BlogPost } from '@shared/schema';

const blogPostFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  h1: z.string().optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  excerpt: z.string().optional(),
  author: z.string().min(2, 'Author must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  metaDescription: z.string().max(160, 'Meta description should be under 160 characters').optional(),
  published: z.boolean(),
  generatedByAI: z.boolean(),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

interface BlogPostFormProps {
  post?: BlogPost;
}

const categories = [
  'Plumbing Tips',
  'Emergency Services',
  'Water Heaters',
  'Drain Cleaning',
  'Pipe Repair',
  'Bathroom Plumbing',
  'Kitchen Plumbing',
  'Commercial Plumbing',
  'Seasonal Maintenance',
  'DIY Guides',
  'Industry News',
];

export default function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!post;

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: post?.title || '',
      h1: post?.h1 || '',
      slug: post?.slug || '',
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      author: post?.author || 'Economy Plumbing',
      category: post?.category || '',
      featuredImage: post?.featuredImage || '',
      metaDescription: post?.metaDescription || '',
      published: post?.published ?? true,
      generatedByAI: post?.generatedByAI ?? false,
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!isEditMode || !form.getValues('slug')) {
      form.setValue('slug', generateSlug(value));
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode
        ? `/api/admin/blog/${post.slug}`
        : '/api/admin/blog';
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save blog post');
      }

      const result = await response.json();

      toast({
        title: isEditMode ? 'Post Updated' : 'Post Created',
        description: `Blog post "${data.title}" has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });

      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      console.error('Blog post save error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save blog post. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>Basic information about the blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter blog post title"
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormDescription>
                    The main title that appears on the blog post
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="h1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom H1 Tag (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Leave empty to use title"
                      data-testid="input-h1"
                    />
                  </FormControl>
                  <FormDescription>
                    Override the H1 tag for SEO purposes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="url-friendly-slug"
                      data-testid="input-slug"
                    />
                  </FormControl>
                  <FormDescription>
                    The URL-friendly version of the title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief summary of the post"
                      rows={3}
                      data-testid="input-excerpt"
                    />
                  </FormControl>
                  <FormDescription>
                    A short summary shown in blog listings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Markdown Supported)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write your blog post content here..."
                      rows={20}
                      className="font-mono text-sm"
                      data-testid="input-content"
                    />
                  </FormControl>
                  <FormDescription>
                    Supports Markdown formatting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>SEO and categorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Author name"
                        data-testid="input-author"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-featured-image"
                    />
                  </FormControl>
                  <FormDescription>
                    URL to the featured image for this post
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="SEO-friendly description for search engines"
                      rows={3}
                      maxLength={160}
                      data-testid="input-meta-description"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/160 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
            <CardDescription>Control visibility and attribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <FormDescription>
                      Make this post visible on the website
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-published"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generatedByAI"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">AI Generated</FormLabel>
                    <FormDescription>
                      Mark this post as AI-generated for tracking
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-ai-generated"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-save-blog-post"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Update Post' : 'Create Post'}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/blog')}
            data-testid="button-cancel"
          >
            Cancel
          </Button>

          {isEditMode && post && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
              data-testid="button-preview"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
