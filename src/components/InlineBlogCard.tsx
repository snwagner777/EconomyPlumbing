import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@shared/schema";

interface InlineBlogCardProps {
  category?: string;
}

export default function InlineBlogCard({ category }: InlineBlogCardProps) {
  const { data } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ['/api/blog'],
  });

  const posts = data?.posts;

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

  // Extract 80 characters from the blog content (strip markdown)
  const getExcerpt = (content: string, maxLength: number = 80): string => {
    const stripped = content
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength) + '...' 
      : stripped;
  };

  return (
    <Link href={`/${randomPost.slug}`}>
      <Card 
        className="p-6 mb-6 md:float-right md:ml-6 md:w-80 lg:w-96 hover-elevate cursor-pointer"
        data-testid={`inline-blog-${randomPost.id}`}
      >
        {/* Featured Image */}
        {randomPost.featuredImage && (
          <div className="mb-4 -mx-6 -mt-6">
            <img
              src={randomPost.featuredImage}
              alt={`Featured image for: ${randomPost.title}`}
              width="800"
              height="400"
              loading="lazy"
              decoding="async"
              className="w-full h-40 object-cover rounded-t-lg"
            />
          </div>
        )}

        {/* Category Badge */}
        <Badge variant="secondary" className="mb-3">
          {randomPost.category}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {randomPost.title}
        </h3>

        {/* Excerpt from content */}
        <p className="text-sm text-muted-foreground mb-3">
          {getExcerpt(randomPost.content, 80)}
        </p>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(randomPost.publishDate.toString())}</span>
        </div>

        {/* Read More Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          data-testid={`button-blog-${randomPost.slug}`}
        >
          Read Article
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </Link>
  );
}
