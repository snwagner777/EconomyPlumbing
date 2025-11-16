/**
 * Edit Blog Post Page
 * 
 * Form to edit existing blog post
 */

import { notFound } from 'next/navigation';
import { storage } from '@/server/storage';
import BlogPostForm from '../_components/BlogPostForm';

interface EditBlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { slug } = await params;
  
  const post = await storage.getBlogPostBySlug(slug);
  
  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-edit-blog-post">
          Edit Blog Post
        </h1>
        <p className="text-muted-foreground">
          Update blog post: {post.title}
        </p>
      </div>

      <BlogPostForm post={post} />
    </div>
  );
}
