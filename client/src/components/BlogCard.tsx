import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-card-border">
      {post.featuredImage ? (
        <Link href={`/blog/${post.slug}`} data-testid={`link-image-${post.slug}`}>
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-48 object-cover cursor-pointer hover-elevate"
          />
        </Link>
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-3">
          <Badge data-testid={`badge-category-${post.slug}`}>{post.category}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-date-${post.slug}`}>
              {format(new Date(post.publishDate), "MMM dd, yyyy")}
            </span>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-2" data-testid={`text-title-${post.slug}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-muted-foreground mb-4" data-testid={`text-excerpt-${post.slug}`}>
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid={`text-author-${post.slug}`}>{post.author}</span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 text-primary font-medium hover-elevate px-2 py-1 rounded-md"
            data-testid={`link-read-more-${post.slug}`}
          >
            Read More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
