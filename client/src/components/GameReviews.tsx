import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatNumber, getTimeAgo } from '@/lib/utils';

interface GameReviewsProps {
  gameId: number;
}

interface Review {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
}

export default function GameReviews({ gameId }: GameReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch reviews for this game
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/games/${gameId}/reviews`],
    enabled: !!gameId,
  });

  // Fetch user's existing review (if authenticated)
  const { data: userReview } = useQuery({
    queryKey: [`/api/games/${gameId}/reviews/user/${user?.id}`],
    enabled: !!gameId && !!user?.id,
    onSuccess: (data) => {
      if (data) {
        setUserRating(data.rating);
        setReviewComment(data.comment || '');
      }
    },
    onError: () => {
      // If 404, that's fine - user hasn't reviewed yet
    }
  });

  // Submit or update review
  const submitReviewMutation = useMutation({
    mutationFn: async (newReview: { 
      userId: number; 
      gameId: number; 
      rating: number; 
      comment?: string; 
    }) => {
      return apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
      });
    },
    onSuccess: () => {
      toast({
        title: userReview ? 'Review updated!' : 'Review submitted!',
        description: 'Thanks for sharing your opinion.',
      });
      
      // Invalidate cache to refresh reviews
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/reviews/user/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error submitting review',
        description: 'Please try again later',
        variant: 'destructive',
      });
      console.error('Error submitting review:', error);
    },
  });

  // Delete review
  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/games/${gameId}/reviews/user/${user?.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });
      
      // Reset form
      setUserRating(0);
      setReviewComment('');
      
      // Invalidate cache to refresh reviews
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/reviews/user/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting review',
        description: 'Please try again later',
        variant: 'destructive',
      });
      console.error('Error deleting review:', error);
    },
  });

  const handleSubmitReview = () => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to submit a review',
        variant: 'destructive',
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating',
        variant: 'destructive',
      });
      return;
    }

    submitReviewMutation.mutate({
      userId: user.id,
      gameId,
      rating: userRating,
      comment: reviewComment.trim() || undefined,
    });
  };

  const handleDeleteReview = () => {
    if (!isAuthenticated || !user || !userReview) {
      return;
    }

    deleteReviewMutation.mutate();
  };

  // Calculate average rating from reviews
  const averageRating = reviews.length 
    ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Render star rating display (readonly)
  const StarRatingDisplay = ({ rating }: { rating: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render star rating input (interactive)
  const StarRatingInput = () => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer ${
              star <= userRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => setUserRating(star)}
            onMouseEnter={() => setUserRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <MessageCircle className="mr-2" /> Game Reviews
        </h3>
        <div className="flex items-center">
          <p className="font-medium mr-2">Average Rating:</p>
          <StarRatingDisplay rating={averageRating} />
          <p className="ml-2">({formatNumber(reviews.length)} reviews)</p>
        </div>
      </div>

      {isAuthenticated ? (
        <Card className="p-4 mb-6">
          <h4 className="font-medium mb-2">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </h4>
          <div className="flex items-center mb-3">
            <p className="mr-2">Your Rating:</p>
            <StarRatingInput />
          </div>
          <Textarea
            placeholder="Share your experience with this game..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end space-x-2">
            {userReview && (
              <Button
                variant="outline"
                onClick={handleDeleteReview}
                disabled={deleteReviewMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1" />
              {userReview ? 'Update' : 'Submit'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 mb-6 bg-gray-100 text-center">
          <p>Please log in to write a review</p>
        </Card>
      )}

      {isLoadingReviews ? (
        <div className="flex justify-center my-6">
          <p>Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center my-6 text-gray-500">
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <Card key={review.id} className="p-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {review.user.avatarUrl ? (
                      <img
                        src={review.user.avatarUrl}
                        alt={review.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {review.user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{review.user.username}</p>
                    <StarRatingDisplay rating={review.rating} />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {getTimeAgo(new Date(review.createdAt))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-gray-700">{review.comment}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}