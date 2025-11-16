/**
 * New Blog Post Page
 * 
 * Form to create new blog post
 */

import BlogPostForm from '../_components/BlogPostForm';

export default function NewBlogPostPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-new-blog-post">
          Create New Blog Post
        </h1>
        <p className="text-muted-foreground">
          Write and publish a new blog post
        </p>
      </div>

      <BlogPostForm />
    </div>
  );
}
