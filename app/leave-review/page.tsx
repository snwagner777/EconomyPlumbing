'use client';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Star, CheckCircle2, Mail, Phone, Calendar, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const reviewFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  rating: z.number().min(1, "Please select a rating").max(5),
  text: z.string().min(10, "Review must be at least 10 characters"),
  serviceDate: z.string().optional(),
  photoUrl: z.string().optional(),
  honeypot: z.string().max(0, "Invalid submission"),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

export default function LeaveReview() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [step, setStep] = useState<'rating' | 'form' | 'submitted'>('rating');

  // Fetch pre-filled data if token provided
  const { data: requestData, isLoading: isLoadingRequest, error: requestError } = useQuery({
    queryKey: ['/api/review-request', token],
    enabled: !!token,
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      rating: 0,
      text: "",
      serviceDate: "",
      photoUrl: "",
      honeypot: "",
    },
  });

  // Pre-fill form when token-based request data arrives
  useEffect(() => {
    if (requestData && token) {
      const data = requestData as {
        customerName?: string;
        email?: string;
        phone?: string;
        requestId?: string;
      };
      form.reset({
        customerName: data.customerName || "",
        email: data.email || "",
        phone: data.phone || "",
        rating: 0,
        text: "",
        serviceDate: "",
        photoUrl: "",
        honeypot: "",
      });
    }
  }, [requestData, token, form]);

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const requestId = requestData ? (requestData as { requestId?: string }).requestId : undefined;
      return await apiRequest('POST', '/api/reviews/submit', {
        ...data,
        requestId,
      });
    },
    onSuccess: () => {
      setStep('submitted');
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback. Your review will be published after moderation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating, { shouldValidate: true });
  };

  const handleRatingSubmit = () => {
    if (selectedRating) {
      setStep('form');
    }
  };

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  // Success screen
  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-primary" data-testid="icon-success" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-success-title">
              Review Submitted!
            </h2>
            <p className="text-muted-foreground mb-6" data-testid="text-success-message">
              Thank you for taking the time to share your experience. Your review will be published after our team reviews it.
            </p>
            <Button asChild className="w-full" data-testid="button-return-home">
              <a href="/">Return to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (token && isLoadingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground" data-testid="text-loading">
              Loading your review request...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (token && requestError && !requestData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <h2 className="text-2xl font-semibold mb-3 text-destructive" data-testid="text-error-title">
              Link Not Found
            </h2>
            <p className="text-muted-foreground mb-6" data-testid="text-error-message">
              The review request link you followed is invalid or has expired. You can still leave a review using the form below.
            </p>
            <Button asChild className="w-full" data-testid="button-continue-anyway">
              <a href="/leave-review">Leave a Review</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Rating selection
  if (step === 'rating') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3" data-testid="text-page-title">
              How Was Your Experience?
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              We'd love to hear about your experience with Economy Plumbing Services
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle data-testid="text-rating-title">Rate Your Experience</CardTitle>
              <CardDescription data-testid="text-rating-description">
                Click the stars to rate your service
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-12">
              <div className="flex justify-center gap-4 mb-8" data-testid="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    data-testid={`button-rating-${star}`}
                  >
                    <Star
                      className={`h-16 w-16 ${
                        star <= (hoveredRating || selectedRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {selectedRating && (
                <div className="text-center">
                  <Button 
                    onClick={handleRatingSubmit} 
                    size="lg"
                    className="min-w-48"
                    data-testid="button-continue"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Show options based on rating or direct form
  const showPublicReviewOptions = selectedRating && selectedRating >= 4;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3" data-testid="text-page-title">
            Leave a Review
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            {showPublicReviewOptions 
              ? "Thank you! We'd love if you shared your experience publicly"
              : "We appreciate your feedback and want to make things right"
            }
          </p>
        </div>

        {showPublicReviewOptions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle data-testid="text-public-review-title">Share Your Experience Publicly</CardTitle>
              <CardDescription data-testid="text-public-review-description">
                Help others find great service by reviewing us on Google or Yelp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                asChild 
                className="w-full" 
                size="lg"
                data-testid="button-google-review"
              >
                <a 
                  href="https://g.page/r/CRYwq5zqH7VGEBM/review" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Review on Google
                </a>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full" 
                size="lg"
                data-testid="button-yelp-review"
              >
                <a 
                  href="https://www.yelp.com/writeareview/biz/qKdYP8bnPGvnIbsYpYRkLQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Review on Yelp
                </a>
              </Button>
              <div className="text-center text-sm text-muted-foreground my-4">
                Or share your feedback privately below
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-form-title">
              {showPublicReviewOptions ? "Or Share Privately" : "Share Your Feedback"}
            </CardTitle>
            <CardDescription data-testid="text-form-description">
              Your feedback helps us improve our service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Honeypot field */}
                <input
                  type="text"
                  {...form.register("honeypot")}
                  style={{ position: 'absolute', left: '-9999px' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Customer Name */}
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Mail className="inline h-4 w-4 mr-2" />
                        Your Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Smith"
                          {...field}
                          data-testid="input-customer-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Mail className="inline h-4 w-4 mr-2" />
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone (optional) */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Phone className="inline h-4 w-4 mr-2" />
                        Phone Number (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(512) 555-0123"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service Date */}
                <FormField
                  control={form.control}
                  name="serviceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Service Date (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-service-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Review Text */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MessageSquare className="inline h-4 w-4 mr-2" />
                        Your Review *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your experience with our service..."
                          rows={6}
                          {...field}
                          data-testid="textarea-review"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitReviewMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
