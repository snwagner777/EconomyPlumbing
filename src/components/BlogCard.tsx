import { memo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean; // For first 3 images - loads with high priority
}

const BlogCard = memo(({ post, priority = false }: BlogCardProps) => {
  return (
    <Card className="flex flex-col h-full hover-elevate active-elevate-2 overflow-hidden">
      <div className="overflow-hidden">
        {post.featuredImage ? (
          <Link href={`/${post.slug}`} data-testid={`link-image-${post.slug}`}>
            <div className="relative w-full h-56 overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={`Featured image for: ${post.title}`}
                fill={true}
                priority={priority}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover cursor-pointer transition-transform hover:scale-105"
                style={{
                  objectPosition: post.focalPointX && post.focalPointY 
                    ? `${post.focalPointX}% ${post.focalPointY}%`
                    : 'center center'
                }}
              />
            </div>
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
            data-testid={`link-read-more-${post.slug}`}
          >
            Read Full Article
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
});

BlogCard.displayName = "BlogCard";

export default BlogCard;
