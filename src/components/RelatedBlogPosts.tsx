import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

interface RelatedBlogPostsProps {
  category?: string;
  limit?: number;
  title?: string;
}

export default function RelatedBlogPosts({ 
  category, 
  limit = 3,
  title = "Related Articles"
}: RelatedBlogPostsProps) {
  const { data: allPostsData, isLoading } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog"],
  });

  if (isLoading || !allPostsData?.posts) {
    return null;
  }

  // Filter by category if provided, otherwise get latest posts
  let posts = allPostsData.posts;
  if (category) {
    posts = posts.filter((p) => p.category === category);
  }

  // Sort by publish date (newest first) and limit
  posts = posts
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, limit);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          <Link href="/blog" className="text-primary hover:underline inline-flex items-center gap-1" data-testid="link-view-all-blog">
            View All Plumbing Tips
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover-elevate overflow-hidden" data-testid={`card-blog-${post.id}`}>
              <Link href={`/${post.slug}`}>
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      style={{
                        objectPosition: post.focalPointX && post.focalPointY 
                          ? `${post.focalPointX}% ${post.focalPointY}%`
                          : 'center center'
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={new Date(post.publishDate).toISOString()}>
                      {format(new Date(post.publishDate), "MMMM dd, yyyy")}
                    </time>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors" data-testid={`text-title-${post.id}`}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-3" data-testid={`text-excerpt-${post.id}`}>
                      {post.excerpt}
                    </p>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
