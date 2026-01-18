// src/api/reviews.ts
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReviewCustomer {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
}

export interface Review {
  id: string;
  seller_id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  status: 'approved' | 'pending' | 'flagged' | 'reported';
  response: string | null;
  created_at: string;
  updated_at: string;
  customer?: ReviewCustomer;
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  };
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  positive_reviews: number; // 4-5 stars
  negative_reviews: number; // 1-2 stars
  neutral_reviews: number; // 3 stars
  response_rate: number; // Percentage of reviews with seller response
  recent_reviews: number; // Reviews from last 30 days
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ReviewFilterOptions {
  rating?: number;
  status?: Review['status'];
  date_from?: string;
  date_to?: string;
  has_response?: boolean;
  search_query?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all reviews for a seller's products with optional filtering and pagination
 */
export async function getReviews(
  sellerId: string,
  options?: {
    page?: number;
    limit?: number;
    filters?: ReviewFilterOptions;
  }
): Promise<ApiResponse<PaginatedReviews>> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;
    const filters = options?.filters || {};

    // Build the base query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        product:products!product_id (
          id,
          name,
          image_url
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Apply rating filter
    if (filters.rating && filters.rating >= 1 && filters.rating <= 5) {
      query = query.eq('rating', filters.rating);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply date range filter
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply response filter
    if (filters.has_response !== undefined) {
      if (filters.has_response) {
        query = query.not('response', 'is', null);
      } else {
        query = query.is('response', null);
      }
    }

    // Apply search filter on comment
    if (filters.search_query) {
      query = query.ilike('comment', `%${filters.search_query}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return {
        data: null,
        error: error.message
      };
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    const response: PaginatedReviews = {
      reviews: data || [],
      total,
      page,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1
    };

    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getReviews:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews'
    };
  }
}

/**
 * Get aggregated review summary for a seller
 */
export async function getReviewSummary(
  sellerId: string
): Promise<ApiResponse<ReviewSummary>> {
  try {
    // Fetch all reviews for the seller
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, response, created_at, status')
      .eq('seller_id', sellerId)
      .eq('status', 'approved'); // Only count approved reviews in summary

    if (reviewsError) {
      console.error('Error fetching reviews for summary:', reviewsError);
      return {
        data: null,
        error: reviewsError.message
      };
    }

    if (!reviews || reviews.length === 0) {
      return {
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          positive_reviews: 0,
          negative_reviews: 0,
          neutral_reviews: 0,
          response_rate: 0,
          recent_reviews: 0
        },
        error: null
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average_rating = parseFloat((totalRating / reviews.length).toFixed(1));

    // Calculate rating distribution
    const rating_distribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    // Calculate positive/negative/neutral reviews
    const positive_reviews = reviews.filter(r => r.rating >= 4).length;
    const negative_reviews = reviews.filter(r => r.rating <= 2).length;
    const neutral_reviews = reviews.filter(r => r.rating === 3).length;

    // Calculate response rate
    const reviews_with_response = reviews.filter(r => r.response !== null).length;
    const response_rate = parseFloat(((reviews_with_response / reviews.length) * 100).toFixed(1));

    // Calculate recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent_reviews = reviews.filter(r => 
      new Date(r.created_at) >= thirtyDaysAgo
    ).length;

    const summary: ReviewSummary = {
      average_rating,
      total_reviews: reviews.length,
      rating_distribution,
      positive_reviews,
      negative_reviews,
      neutral_reviews,
      response_rate,
      recent_reviews
    };

    return {
      data: summary,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getReviewSummary:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch review summary'
    };
  }
}

/**
 * Add a seller response to a specific review
 */
export async function respondToReview(
  reviewId: string,
  response: string,
  sellerId: string
): Promise<ApiResponse<Review>> {
  try {
    // First, verify the review belongs to the seller
    const { data: review, error: verifyError } = await supabase
      .from('reviews')
      .select('seller_id')
      .eq('id', reviewId)
      .single();

    if (verifyError) {
      console.error('Error verifying review ownership:', verifyError);
      return {
        data: null,
        error: 'Review not found'
      };
    }

    if (review.seller_id !== sellerId) {
      return {
        data: null,
        error: 'You are not authorized to respond to this review'
      };
    }

    // Update the review with response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        product:products!product_id (
          id,
          name,
          image_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error responding to review:', updateError);
      return {
        data: null,
        error: updateError.message
      };
    }

    return {
      data: updatedReview,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in respondToReview:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to respond to review'
    };
  }
}

/**
 * Report a review for admin moderation
 */
export async function reportReview(
  reviewId: string,
  reason: string,
  sellerId: string
): Promise<ApiResponse<boolean>> {
  try {
    // Verify the review belongs to the seller
    const { data: review, error: verifyError } = await supabase
      .from('reviews')
      .select('seller_id, status')
      .eq('id', reviewId)
      .single();

    if (verifyError) {
      console.error('Error verifying review:', verifyError);
      return {
        data: null,
        error: 'Review not found'
      };
    }

    if (review.seller_id !== sellerId) {
      return {
        data: null,
        error: 'You are not authorized to report this review'
      };
    }

    // Check if already reported
    if (review.status === 'reported') {
      return {
        data: null,
        error: 'This review has already been reported'
      };
    }

    // Update review status to reported and add report reason
    const { error: reportError } = await supabase
      .from('reviews')
      .update({
        status: 'reported',
        updated_at: new Date().toISOString(),
        // Store report reason in a separate field or table
        // For simplicity, we'll use a JSON field or store in a reports table
      })
      .eq('id', reviewId);

    if (reportError) {
      console.error('Error reporting review:', reportError);
      return {
        data: null,
        error: reportError.message
      };
    }

    // Optional: Create a report record in a separate table for better tracking
    const { error: reportLogError } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reporter_id: sellerId,
        reason: reason,
        reported_at: new Date().toISOString()
      });

    if (reportLogError) {
      console.warn('Failed to log report:', reportLogError);
      // Continue even if logging fails
    }

    return {
      data: true,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in reportReview:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to report review'
    };
  }
}

/**
 * Get reviews for a specific product
 */
export async function getProductReviews(
  productId: string,
  sellerId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedReviews>> {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('product_id', productId)
      .eq('seller_id', sellerId)
      .eq('status', 'approved') // Only show approved reviews
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching product reviews:', error);
      return {
        data: null,
        error: error.message
      };
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    const response: PaginatedReviews = {
      reviews: data || [],
      total,
      page,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1
    };

    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getProductReviews:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch product reviews'
    };
  }
}

/**
 * Delete a review response (seller can delete their own response)
 */
export async function deleteReviewResponse(
  reviewId: string,
  sellerId: string
): Promise<ApiResponse<Review>> {
  try {
    // Verify the review belongs to the seller
    const { data: review, error: verifyError } = await supabase
      .from('reviews')
      .select('seller_id, response')
      .eq('id', reviewId)
      .single();

    if (verifyError) {
      console.error('Error verifying review:', verifyError);
      return {
        data: null,
        error: 'Review not found'
      };
    }

    if (review.seller_id !== sellerId) {
      return {
        data: null,
        error: 'You are not authorized to modify this review'
      };
    }

    if (!review.response) {
      return {
        data: null,
        error: 'No response found to delete'
      };
    }

    // Remove the response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        product:products!product_id (
          id,
          name,
          image_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error deleting response:', updateError);
      return {
        data: null,
        error: updateError.message
      };
    }

    return {
      data: updatedReview,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in deleteReviewResponse:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete response'
    };
  }
}

/**
 * Get review statistics for dashboard widgets
 */
export async function getReviewStats(sellerId: string): Promise<ApiResponse<{
  total_reviews: number;
  average_rating: number;
  pending_reviews: number;
  reported_reviews: number;
  recent_review_count: number;
  response_rate: number;
}>> {
  try {
    // Get total and average
    const { data: approvedReviews, error: approvedError } = await supabase
      .from('reviews')
      .select('rating, response, created_at')
      .eq('seller_id', sellerId)
      .eq('status', 'approved');

    if (approvedError) {
      console.error('Error fetching approved reviews:', approvedError);
      return {
        data: null,
        error: approvedError.message
      };
    }

    // Get pending reviews count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending reviews:', pendingError);
      return {
        data: null,
        error: pendingError.message
      };
    }

    // Get reported reviews count
    const { count: reportedCount, error: reportedError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'reported');

    if (reportedError) {
      console.error('Error fetching reported reviews:', reportedError);
      return {
        data: null,
        error: reportedError.message
      };
    }

    const total_reviews = approvedReviews?.length || 0;
    const totalRating = approvedReviews?.reduce((sum, r) => sum + r.rating, 0) || 0;
    const average_rating = total_reviews > 0 ? parseFloat((totalRating / total_reviews).toFixed(1)) : 0;
    
    const reviews_with_response = approvedReviews?.filter(r => r.response !== null).length || 0;
    const response_rate = total_reviews > 0 ? parseFloat(((reviews_with_response / total_reviews) * 100).toFixed(1)) : 0;
    
    // Calculate recent reviews (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent_review_count = approvedReviews?.filter(r => 
      new Date(r.created_at) >= sevenDaysAgo
    ).length || 0;

    return {
      data: {
        total_reviews,
        average_rating,
        pending_reviews: pendingCount || 0,
        reported_reviews: reportedCount || 0,
        recent_review_count,
        response_rate
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getReviewStats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch review stats'
    };
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT/TESTING
// ============================================================================

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    seller_id: 'seller-123',
    product_id: 'product-1',
    customer_id: 'customer-1',
    rating: 5,
    comment: 'Excellent product! Fast shipping and high quality.',
    status: 'approved',
    response: 'Thank you for your feedback! We\'re glad you liked our product.',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T09:15:00Z',
    customer: {
      id: 'customer-1',
      full_name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      avatar_url: null
    },
    product: {
      id: 'product-1',
      name: 'Premium Office Chair',
      image_url: null
    }
  },
  {
    id: 'review-2',
    seller_id: 'seller-123',
    product_id: 'product-2',
    customer_id: 'customer-2',
    rating: 4,
    comment: 'Good quality but shipping was a bit slow.',
    status: 'approved',
    response: null,
    created_at: '2024-01-10T14:45:00Z',
    updated_at: '2024-01-10T14:45:00Z',
    customer: {
      id: 'customer-2',
      full_name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar_url: null
    },
    product: {
      id: 'product-2',
      name: 'Modern Coffee Table',
      image_url: null
    }
  },
  {
    id: 'review-3',
    seller_id: 'seller-123',
    product_id: 'product-3',
    customer_id: 'customer-3',
    rating: 1,
    comment: 'Product arrived damaged. Very disappointed.',
    status: 'reported',
    response: 'We apologize for the inconvenience. Please contact our support team for a replacement.',
    created_at: '2024-01-05T08:20:00Z',
    updated_at: '2024-01-06T11:30:00Z',
    customer: {
      id: 'customer-3',
      full_name: 'Mohammed Khan',
      email: 'mohammed@example.com',
      avatar_url: null
    },
    product: {
      id: 'product-3',
      name: 'Executive Desk',
      image_url: null
    }
  },
  {
    id: 'review-4',
    seller_id: 'seller-123',
    product_id: 'product-1',
    customer_id: 'customer-4',
    rating: 3,
    comment: 'Average product. Could be better for the price.',
    status: 'pending',
    response: null,
    created_at: '2024-01-02T16:10:00Z',
    updated_at: '2024-01-02T16:10:00Z',
    customer: {
      id: 'customer-4',
      full_name: 'Fatima Al-Sayed',
      email: 'fatima@example.com',
      avatar_url: null
    },
    product: {
      id: 'product-1',
      name: 'Premium Office Chair',
      image_url: null
    }
  },
  {
    id: 'review-5',
    seller_id: 'seller-123',
    product_id: 'product-4',
    customer_id: 'customer-5',
    rating: 5,
    comment: 'Perfect! Exactly what I was looking for.',
    status: 'approved',
    response: 'We\'re thrilled you love it! Thank you for choosing our store.',
    created_at: '2023-12-28T11:25:00Z',
    updated_at: '2023-12-29T10:15:00Z',
    customer: {
      id: 'customer-5',
      full_name: 'Robert Chen',
      email: 'robert@example.com',
      avatar_url: null
    },
    product: {
      id: 'product-4',
      name: 'Bookshelf Unit',
      image_url: null
    }
  }
];

export const mockReviewSummary: ReviewSummary = {
  average_rating: 3.6,
  total_reviews: 45,
  rating_distribution: {
    1: 5,
    2: 8,
    3: 12,
    4: 10,
    5: 10
  },
  positive_reviews: 20,
  negative_reviews: 13,
  neutral_reviews: 12,
  response_rate: 65.5,
  recent_reviews: 8
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Utility function to format rating for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Utility function to get rating color based on value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-yellow-600';
  if (rating >= 2.5) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Utility function to get rating label
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Poor';
  return 'Very Poor';
}

/**
 * Utility function to check if a review is positive (4-5 stars)
 */
export function isPositiveReview(rating: number): boolean {
  return rating >= 4;
}

/**
 * Utility function to check if a review is negative (1-2 stars)
 */
export function isNegativeReview(rating: number): boolean {
  return rating <= 2;
}

/**
 * Utility function to calculate days since review
 */
export function getDaysSinceReview(createdAt: string): number {
  const reviewDate = new Date(createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - reviewDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}