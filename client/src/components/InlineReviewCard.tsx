import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";
import { SiGoogle, SiFacebook, SiYelp } from "react-icons/si";
import type { GoogleReview } from "@shared/schema";

interface InlineReviewCardProps {
  category?: string;
  minRating?: number;
}

export default function InlineReviewCard({ 
  category, 
  minRating = 4 
}: InlineReviewCardProps) {
  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  queryParams.set('minRating', minRating.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const { data: reviews } = useQuery<GoogleReview[]>({
    queryKey: ['/api/reviews', queryString],
  });

  const review = reviews?.[0]; // Get just the first review

  if (!review) {
    return null;
  }

  const getPlatformInfo = (source: string) => {
    if (source.includes('places_api') || source.includes('dataforseo')) {
      return {
        name: 'Google',
        icon: SiGoogle,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
    if (source === 'facebook') {
      return {
        name: 'Facebook',
        icon: SiFacebook,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
    if (source === 'yelp') {
      return {
        name: 'Yelp',
        icon: SiYelp,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        color: 'text-red-600 dark:text-red-400',
      };
    }
    return {
      name: 'Review',
      icon: Star,
      bgColor: 'bg-primary/10',
      color: 'text-primary',
    };
  };

  const platform = getPlatformInfo(review.source);
  const PlatformIcon = platform.icon;

  return (
    <Card 
      className="relative p-6 mb-6 md:float-right md:ml-6 md:w-80 lg:w-96 hover-elevate transition-all duration-300 border-border/50 bg-gradient-to-br from-primary/5 to-accent/5"
      data-testid={`inline-review-${review.id}`}
    >
      {/* Quote Icon */}
      <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Quote className="w-5 h-5 text-primary" />
      </div>

      {/* Platform Badge */}
      <div className="absolute -top-2 -right-2">
        <Badge 
          variant="secondary" 
          className={`${platform.bgColor} ${platform.color} border-0 gap-1.5 px-3 py-1`}
        >
          <PlatformIcon className="w-3.5 h-3.5" />
          {platform.name}
        </Badge>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating
                ? 'fill-primary text-primary'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>

      {/* Review Text */}
      <p className="text-sm text-foreground/90 mb-4 line-clamp-4 italic">
        "{review.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {review.profilePhotoUrl ? (
          <img
            src={review.profilePhotoUrl}
            alt={review.authorName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {review.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {review.authorName}
          </p>
          {review.relativeTime && (
            <p className="text-xs text-muted-foreground">
              {review.relativeTime}
            </p>
          )}
        </div>
      </div>

      {/* Verified Customer Badge */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Badge variant="outline" className="text-xs">
          ✓ Verified Customer
        </Badge>
      </div>
    </Card>
  );
}
