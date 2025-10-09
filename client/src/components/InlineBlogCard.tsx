import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { BlogPost } from "@shared/schema";

interface InlineBlogCardProps {
  category?: string;
}

export default function InlineBlogCard({ category }: InlineBlogCardProps) {
  const { data: posts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
  });

  // Filter posts by category and get a random one
  const filteredPosts = posts?.filter(post => 
    category ? post.category === category : true
  );
  
  const randomPost = filteredPosts && filteredPosts.length > 0
    ? filteredPosts[Math.floor(Math.random() * filteredPosts.length)]
    : null;

  if (!randomPost) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className="relative p-6 mb-6 md:float-right md:ml-6 md:w-80 lg:w-96 hover-elevate transition-all duration-300 border-border/50 bg-gradient-to-br from-accent/5 to-primary/5"
      data-testid={`inline-blog-${randomPost.id}`}
    >
      {/* Book Icon */}
      <div className="absolute -top-3 -left-3 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-accent" />
      </div>

      {/* Category Badge */}
      <div className="absolute -top-2 -right-2">
        <Badge 
          variant="secondary" 
          className="bg-accent/10 text-accent border-0 px-3 py-1"
        >
          {randomPost.category}
        </Badge>
      </div>

      {/* Featured Image */}
      {randomPost.featuredImage && (
        <div className="mt-2 mb-4 -mx-6 -mt-6">
          <img
            src={randomPost.featuredImage}
            alt={randomPost.title}
            className="w-full h-40 object-cover rounded-t-lg"
            loading="lazy"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 mt-2">
        {randomPost.title}
      </h3>

      {/* Excerpt */}
      {randomPost.excerpt && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {randomPost.excerpt}
        </p>
      )}

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDate(randomPost.publishDate.toString())}</span>
      </div>

      {/* Read More Link */}
      <Link 
        href={`/blog/${randomPost.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        data-testid={`link-blog-${randomPost.slug}`}
      >
        Read Article
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* Related Content Badge */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Badge variant="outline" className="text-xs">
          📚 Related Reading
        </Badge>
      </div>
    </Card>
  );
}
