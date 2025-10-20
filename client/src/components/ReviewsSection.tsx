import { useQuery } from "@tanstack/react-query";
import { Star, Quote, ArrowRight } from "lucide-react";
import { SiGoogle, SiFacebook, SiYelp } from "react-icons/si";
import type { GoogleReview } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { createReviewSchema } from "@/components/SEO/JsonLd";

interface ReviewsSectionProps {
  category?: string;
  minRating?: number;
  title?: string;
  maxReviews?: number;
}

// Helper to get platform icon and colors
function getPlatformInfo(source: string) {
  switch (source) {
    case 'dataforseo':
    case 'google_places':
    case 'gmb_api':
      return {
        icon: SiGoogle,
        name: 'Google',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30'
      };
    case 'facebook':
      return {
        icon: SiFacebook,
        name: 'Facebook',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30'
      };
    case 'yelp':
      return {
        icon: SiYelp,
        name: 'Yelp',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30'
      };
    case 'custom_review':
    case 'email_link':
    case 'website':
      return {
        icon: Star,
        name: 'Verified Customer',
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
    default:
      return {
        icon: Star,
        name: 'Review',
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
  }
}

export default function ReviewsSection({ 
  category, 
  minRating = 4,
  title = "What Our Customers Say",
  maxReviews = 3
}: ReviewsSectionProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  queryParams.set('minRating', minRating.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
  const { data: reviews, isLoading } = useQuery<GoogleReview[]>({
    queryKey: [`/api/reviews${queryString}`],
    staleTime: 1000 * 60 * 30,
    enabled: shouldLoad,
  });

  // Fallback query: if primary query returns fewer than 3 reviews, get general high-rated reviews
  const fallbackQueryParams = new URLSearchParams();
  fallbackQueryParams.set('minRating', minRating.toString());
  const fallbackQueryString = `?${fallbackQueryParams.toString()}`;
  
  const { data: fallbackReviews } = useQuery<GoogleReview[]>({
    queryKey: [`/api/reviews${fallbackQueryString}`],
    staleTime: 1000 * 60 * 30,
    enabled: shouldLoad && reviews !== undefined && reviews.length < 3,
  });

  // Final fallback: if still fewer than 3, get all reviews sorted by rating
  const { data: allReviews } = useQuery<GoogleReview[]>({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30,
    enabled: shouldLoad && fallbackReviews !== undefined && fallbackReviews.length < 3,
  });

  // Determine which review set to use
  let displayReviewsSource = reviews || [];
  if (displayReviewsSource.length < 3 && fallbackReviews && fallbackReviews.length >= 3) {
    displayReviewsSource = fallbackReviews;
  } else if (displayReviewsSource.length < 3 && allReviews && allReviews.length > displayReviewsSource.length) {
    // Use all reviews sorted by rating if we have more
    displayReviewsSource = [...allReviews].sort((a, b) => b.rating - a.rating);
  }

  if (!shouldLoad) {
    return (
      <section ref={sectionRef} className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20">
              Customer Testimonials
            </Badge>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
              <span className="ml-2 text-lg font-semibold">5.0 Rating</span>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-8 hover-elevate">
                <div className="h-32 bg-muted/30 rounded mb-4 animate-pulse" />
                <div className="h-4 bg-muted/30 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-muted/30 rounded w-1/2 animate-pulse" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section ref={sectionRef} className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20">
              Customer Testimonials
            </Badge>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
              <span className="ml-2 text-lg font-semibold">5.0 Rating</span>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-8 hover-elevate">
                <div className="h-32 bg-muted rounded mb-4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayReviewsSource || displayReviewsSource.length === 0) {
    return null;
  }

  const displayReviews = displayReviewsSource.slice(0, maxReviews);
  const avgRating = displayReviewsSource.length > 0 
    ? (displayReviewsSource.reduce((sum, r) => sum + r.rating, 0) / displayReviewsSource.length).toFixed(1)
    : "5.0";

  return (
    <>
      {/* Review Schema Markup */}
      <Helmet>
        {displayReviews.map((review) => (
          <script key={review.id} type="application/ld+json">
            {JSON.stringify(createReviewSchema(review))}
          </script>
        ))}
      </Helmet>
      
      <section ref={sectionRef} className="relative py-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/20" data-testid="badge-testimonials">
            Customer Testimonials
          </Badge>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {title}
          </h2>
          <div className="flex items-center justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className="w-6 h-6 fill-primary text-primary drop-shadow-sm" 
                data-testid={`star-header-${i}`}
              />
            ))}
            <span className="ml-2 text-lg font-semibold" data-testid="text-avg-rating">
              {avgRating} Rating
            </span>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trusted by hundreds of homeowners across Central Texas
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {displayReviews.map((review) => {
            const platform = getPlatformInfo(review.source);
            const PlatformIcon = platform.icon;
            
            return (
              <Card 
                key={review.id} 
                className="relative p-8 hover-elevate transition-all duration-300 border-border/50 group"
                data-testid={`review-${review.id}`}
              >
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Quote className="w-6 h-6 text-primary" />
                </div>

                {/* Platform Badge */}
                <div className="absolute -top-3 -right-3">
                  <Badge 
                    variant="secondary" 
                    className={`${platform.bgColor} ${platform.color} border-0 gap-1.5 px-3 py-1`}
                  >
                    <PlatformIcon className="w-3.5 h-3.5" />
                    {platform.name}
                  </Badge>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating
                          ? "fill-primary text-primary"
                          : "fill-muted-foreground/20 text-muted-foreground/20"
                      }`}
                      data-testid={`star-${review.id}-${i}`}
                    />
                  ))}
                </div>
                
                {/* Review Text */}
                <p className="text-foreground leading-relaxed mb-6 line-clamp-6">
                  "{review.text}"
                </p>
                
                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                    {review.profilePhotoUrl && review.authorName !== 'Anonymous' && (
                      <AvatarImage 
                        src={review.profilePhotoUrl} 
                        alt={review.authorName}
                        loading="lazy"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {review.authorName === 'Anonymous' 
                        ? 'GC' 
                        : review.authorName.split(' ').map(n => n[0]).join('').toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {review.authorName === 'Anonymous' ? 'Google Customer' : review.authorName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{review.relativeTime}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Economy+Plumbing+Services+Austin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-md font-semibold hover-elevate active-elevate-2 transition-all shadow-lg shadow-primary/20"
            data-testid="link-all-reviews"
          >
            <Star className="w-5 h-5 fill-current" />
            Read All Google Reviews
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
    </>
  );
}
