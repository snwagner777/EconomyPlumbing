import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean; // For first 3 images - loads with high priority
}

const BlogCard = memo(({ post, priority = false }: BlogCardProps) => {
  // Generate responsive image srcset from the base image URL
  const getResponsiveSrcSet = (imagePath: string | null) => {
    if (!imagePath) return '';
    
    // Check if this is a new responsive image (has _1200w suffix)
    if (imagePath.includes('_1200w.webp')) {
      const base = imagePath.replace('_1200w.webp', '');
      return `${base}_400w.webp 400w, ${base}_800w.webp 800w, ${base}_1200w.webp 1200w`;
    }
    
    // For older images without responsive variants, just return the single image
    return `${imagePath} 1200w`;
  };

  return (
    <Card className="flex flex-col h-full hover-elevate active-elevate-2 overflow-hidden">
      <div className="overflow-hidden">
        {post.featuredImage ? (
          <Link href={`/${post.slug}`} data-testid={`link-image-${post.slug}`}>
            <img
              src={post.featuredImage}
              srcSet={getResponsiveSrcSet(post.featuredImage)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              alt={`Featured image for: ${post.title}`}
              width="1200"
              height="675"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="w-full h-56 object-cover cursor-pointer transition-transform hover:scale-105"
              style={{
                objectPosition: post.focalPointX && post.focalPointY 
                  ? `${post.focalPointX}% ${post.focalPointY}%`
                  : 'center center'
              }}
            />
          </Link>
        ) : (
          <div className="w-full h-56 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge variant="secondary" data-testid={`badge-category-${post.slug}`}>
            {post.category}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-date-${post.slug}`}>
              {format(new Date(post.publishDate), "MMM dd, yyyy")}
            </span>
          </div>
        </div>
        <Link href={`/${post.slug}`}>
          <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors" data-testid={`text-title-${post.slug}`}>
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3 flex-1" data-testid={`text-excerpt-${post.slug}`}>
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid={`text-author-${post.slug}`}>{post.author}</span>
          </div>
          <Link
            href={`/${post.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            aria-label={`Read more about ${post.title}`}
            data-testid={`link-read-more-${post.slug}`}
          >
            Read More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
});

BlogCard.displayName = "BlogCard";

export default BlogCard;
