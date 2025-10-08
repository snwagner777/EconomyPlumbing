import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { GoogleReview } from "@shared/schema";

interface ReviewsSectionProps {
  keywords?: string[];
  minRating?: number;
  title?: string;
  maxReviews?: number;
}

export default function ReviewsSection({ 
  keywords = [], 
  minRating = 4,
  title = "What Our Customers Say",
  maxReviews = 3
}: ReviewsSectionProps) {
  const keywordsParam = keywords.length > 0 ? keywords.join(',') : '';
  const queryString = keywordsParam 
    ? `?keywords=${encodeURIComponent(keywordsParam)}&minRating=${minRating}`
    : `?minRating=${minRating}`;
    
  const { data: reviews, isLoading } = useQuery<GoogleReview[]>({
    queryKey: [`/api/reviews${queryString}`],
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card p-6 rounded-md border border-card-border animate-pulse">
                <div className="h-20 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const displayReviews = reviews.slice(0, maxReviews);

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayReviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-card p-6 rounded-md border border-card-border hover-elevate"
              data-testid={`review-${review.id}`}
            >
              <div className="flex items-start gap-4 mb-4">
                {review.profilePhotoUrl && (
                  <img 
                    src={review.profilePhotoUrl} 
                    alt={review.authorName}
                    className="w-12 h-12 rounded-full"
                    loading="lazy"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{review.authorName}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{review.relativeTime}</p>
                </div>
              </div>
              
              <p className="text-foreground leading-relaxed">{review.text}</p>
              
              {review.authorUrl && (
                <a 
                  href={review.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-4 inline-block"
                  data-testid={`review-link-${review.id}`}
                >
                  View on Google
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Economy+Plumbing+Services+Austin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            data-testid="link-all-reviews"
          >
            <Star className="w-5 h-5" />
            See All Reviews on Google
          </a>
        </div>
      </div>
    </section>
  );
}
