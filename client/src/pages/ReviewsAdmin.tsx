import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Check, X, Star, Calendar, Mail, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

type Review = {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  rating: number;
  reviewText: string;
  serviceDate: string | null;
  photoUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requestId: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ReviewsAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch all reviews
  const { data: reviewsData, isLoading } = useQuery<{ reviews: Review[] }>({
    queryKey: ['/api/admin/reviews'],
  });

  // Approve review mutation
  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return await apiRequest("POST", `/api/admin/reviews/${reviewId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Review approved",
        description: "The review is now visible on your website.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject review mutation
  const rejectMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return await apiRequest("POST", `/api/admin/reviews/${reviewId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Review rejected",
        description: "The review will not be displayed on your website.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return await apiRequest("DELETE", `/api/admin/reviews/${reviewId}`);
    },
    onSuccess: () => {
      toast({
        title: "Review deleted",
        description: "The review has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviews = reviewsData?.reviews || [];
  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const rejectedReviews = reviews.filter(r => r.status === 'rejected');

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg" data-testid={`text-review-name-${review.id}`}>
                {review.customerName}
              </CardTitle>
              <Badge
                variant={
                  review.status === 'approved' ? 'default' :
                  review.status === 'rejected' ? 'destructive' :
                  'secondary'
                }
                data-testid={`badge-status-${review.id}`}
              >
                {review.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(review.rating)}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {review.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span data-testid={`text-review-email-${review.id}`}>{review.email}</span>
                </div>
              )}
              {review.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span data-testid={`text-review-phone-${review.id}`}>{review.phone}</span>
                </div>
              )}
              {review.serviceDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span data-testid={`text-review-service-date-${review.id}`}>
                    Service: {format(new Date(review.serviceDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {review.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => approveMutation.mutate(review.id)}
                  disabled={approveMutation.isPending}
                  data-testid={`button-approve-${review.id}`}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(review.id)}
                  disabled={rejectMutation.isPending}
                  data-testid={`button-reject-${review.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {review.status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate(review.id)}
                disabled={rejectMutation.isPending}
                data-testid={`button-unapprove-${review.id}`}
              >
                <X className="w-4 h-4 mr-1" />
                Unapprove
              </Button>
            )}
            {review.status === 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => approveMutation.mutate(review.id)}
                disabled={approveMutation.isPending}
                data-testid={`button-reapprove-${review.id}`}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to permanently delete this review?')) {
                  deleteMutation.mutate(review.id);
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${review.id}`}
            >
              <X className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 text-sm">
          <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <p className="flex-1" data-testid={`text-review-text-${review.id}`}>
            {review.reviewText}
          </p>
        </div>
        {review.photoUrl && (
          <div className="mt-4">
            <img
              src={review.photoUrl}
              alt="Customer photo"
              className="max-w-md rounded-md border"
              data-testid={`img-review-photo-${review.id}`}
            />
          </div>
        )}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Submitted: {format(new Date(review.createdAt), 'MMM d, yyyy h:mm a')}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                data-testid="button-back-to-admin"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                Reviews Management
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Moderate customer reviews and testimonials
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {pendingReviews.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-approved-count">
                {approvedReviews.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-rejected-count">
                {rejectedReviews.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedReviews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            {pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <p className="text-muted-foreground" data-testid="text-no-pending">
                    No pending reviews
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <p className="text-muted-foreground" data-testid="text-no-approved">
                    No approved reviews yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              approvedReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <p className="text-muted-foreground" data-testid="text-no-rejected">
                    No rejected reviews
                  </p>
                </CardContent>
              </Card>
            ) : (
              rejectedReviews.map(renderReviewCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
