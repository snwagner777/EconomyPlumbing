import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = memo(({ post }: BlogCardProps) => {
  return (
    <Card className="flex flex-col h-full hover-elevate active-elevate-2">
      <div className="overflow-hidden">
        {post.featuredImage ? (
          <Link href={`/blog/${post.slug}`} data-testid={`link-image-${post.slug}`}>
            <img
              src={post.featuredImage}
              alt={post.title}
              width="800"
              height="533"
              className="w-full h-56 object-cover cursor-pointer transition-transform hover:scale-105"
              loading="lazy"
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
        <Link href={`/blog/${post.slug}`}>
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
            href={`/blog/${post.slug}`}
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
