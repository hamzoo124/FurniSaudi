import { useState, useEffect, useCallback } from 'react';
import { supabase } from  '../lib/supabase';
import { toast } from 'react-hot-toast';

// ==================== TYPE DEFINITIONS ====================

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  product_id: string;
  seller_id: string;
  customer_id: string;
  rating: RatingValue;
  title: string;
  comment: string;
  seller_response: string | null;
  response_at: string | null;
  is_reported: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    image: string;
    category: string;
  };
  customer?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_verified: boolean;
    total_reviews: number;
  };
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  total_ratings: number;
  rating_breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  percentage_breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: number; // Reviews in last 30 days
  average_response_time: number | null; // Hours
  response_rate: number; // Percentage
}

export interface ReviewReport {
  id: string;
  review_id: string;
  seller_id: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportReason = 
  | 'inappropriate_content'
  | 'false_information'
  | 'competitor_attack'
  | 'spam'
  | 'personal_information'
  | 'harassment'
  | 'other';

export interface PaginatedReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
export interface ReviewStats {
  total: number;        // total reviews
  pending: number;      // reviews without response
  approved: number;     // reviews with response and not reported
  reported: number;     // reviews marked as reported
}


export interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
    pendingReviews: Review[];      // <-- add this
  reviewStats: ReviewStats;   
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  filterByRating: (rating: RatingValue | 'all') => void;
  filterByResponseStatus: (hasResponse: boolean | 'all') => void;
  sortBy: (field: 'created_at' | 'rating' | 'helpful_count', direction: 'asc' | 'desc') => void;
  searchReviews: (query: string) => void;
}

export interface UseReviewSummaryReturn {
  summary: ReviewSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseRespondToReviewReturn {
  responding: boolean;
  error: string | null;
  respondToReview: (reviewId: string, response: string) => Promise<boolean>;
  editResponse: (reviewId: string, newResponse: string) => Promise<boolean>;
  deleteResponse: (reviewId: string) => Promise<boolean>;
}

export interface UseReportReviewReturn {
  reporting: boolean;
  error: string | null;
  reportReview: (
    reviewId: string,
    reason: ReportReason,
    description: string
  ) => Promise<boolean>;
  getReportStatus: (reviewId: string) => Promise<ReviewReport | null>;
}

// ==================== MAIN REVIEWS HOOK ====================

export const useReviews = (
  sellerId: string,
  page: number = 1,
  limit: number = 20,
  initialRatingFilter?: RatingValue | 'all'
): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>(initialRatingFilter || 'all');
  const [responseFilter, setResponseFilter] = useState<boolean | 'all'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'rating' | 'helpful_count'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build the query with joins and filters
      let query = supabase
        .from('reviews')
        .select(`
          *,
          product:products (
            id,
            name,
            image,
            category,
            price
          ),
          customer:profiles (
            id,
            full_name,
            avatar_url,
            is_verified
          )
        `, { count: 'exact' })
        .eq('seller_id', sellerId)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * limit, currentPage * limit - 1);

      // Apply rating filter
      if (ratingFilter !== 'all') {
        query = query.eq('rating', ratingFilter);
      }

      // Apply response filter
      if (responseFilter !== 'all') {
        query = responseFilter 
          ? query.not('seller_response', 'is', null)
          : query.is('seller_response', null);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,comment.ilike.%${searchQuery}%`);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and enrich the data
      const enrichedReviews = (data || []).map(review => ({
        ...review,
        product: review.product || {
          id: review.product_id,
          name: 'Unknown Product',
          image: '',
          category: '',
          price: 0
        },
        customer: review.customer || {
          id: review.customer_id,
          full_name: 'Anonymous Customer',
          avatar_url: null,
          is_verified: false,
          total_reviews: 0
        },
        images: review.images || [],
        helpful_count: review.helpful_count || 0
      }));

      // If it's the first page, replace reviews, otherwise append
      if (currentPage === 1) {
        setReviews(enrichedReviews);
      } else {
        setReviews(prev => [...prev, ...enrichedReviews]);
      }

      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockReviews = generateMockReviews(sellerId);
        setReviews(mockReviews);
        setTotal(mockReviews.length);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId, currentPage, limit, ratingFilter, responseFilter, sortField, sortDirection, searchQuery]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refresh = async () => {
    setCurrentPage(1);
    await fetchReviews();
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setCurrentPage(prev => prev + 1);
  };

  const filterByRating = (rating: RatingValue | 'all') => {
    setRatingFilter(rating);
    setCurrentPage(1);
    setReviews([]);
  };

  const filterByResponseStatus = (hasResponse: boolean | 'all') => {
    setResponseFilter(hasResponse);
    setCurrentPage(1);
    setReviews([]);
  };

  const sortBy = (field: 'created_at' | 'rating' | 'helpful_count', direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    setReviews([]);
  };

  const searchReviews = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setReviews([]);
  };

  const hasMore = reviews.length < total;
  const totalPages = Math.ceil(total / limit);
const pendingReviews: Review[] = reviews.filter(
  r => !r.seller_response && !r.is_reported
);

const reviewStats: ReviewStats = {
  total: reviews.length,
  pending: pendingReviews.length,
  approved: reviews.filter(r => r.seller_response && !r.is_reported).length,
  reported: reviews.filter(r => r.is_reported).length
};
   return {
    reviews,
    pendingReviews,
    reviewStats,
    loading,
    error,
    total,
    page: currentPage,
    totalPages,
    hasMore,
    refresh,
    loadMore,
    filterByRating,
    filterByResponseStatus,
    sortBy,
    searchReviews
  };
};

// ==================== REVIEW SUMMARY HOOK ====================

export const useReviewSummary = (sellerId: string): UseReviewSummaryReturn => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all reviews for this seller
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, seller_response, created_at')
        .eq('seller_id', sellerId);

      if (reviewsError) throw reviewsError;

      // Fetch seller's average response time
      const { data: responseData } = await supabase
        .from('reviews')
        .select('created_at, response_at')
        .eq('seller_id', sellerId)
        .not('seller_response', 'is', null)
        .not('response_at', 'is', null);

      // Calculate statistics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalReviews = reviews?.length || 0;
      const recentReviews = reviews?.filter(r => 
        new Date(r.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Calculate rating breakdown
      const ratingBreakdown = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      let totalRating = 0;
      let totalResponses = 0;

      reviews?.forEach(review => {
        ratingBreakdown[review.rating as RatingValue]++;
        totalRating += review.rating;
        if (review.seller_response) totalResponses++;
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      const responseRate = totalReviews > 0 ? (totalResponses / totalReviews) * 100 : 0;

      // Calculate average response time in hours
      let totalResponseTime = 0;
      let responseCount = 0;

      responseData?.forEach(review => {
        if (review.created_at && review.response_at) {
          const createdAt = new Date(review.created_at);
          const responseAt = new Date(review.response_at);
          const diffHours = (responseAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          totalResponseTime += diffHours;
          responseCount++;
        }
      });

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : null;

      // Calculate percentage breakdown
      const percentageBreakdown = {
        1: totalReviews > 0 ? (ratingBreakdown[1] / totalReviews) * 100 : 0,
        2: totalReviews > 0 ? (ratingBreakdown[2] / totalReviews) * 100 : 0,
        3: totalReviews > 0 ? (ratingBreakdown[3] / totalReviews) * 100 : 0,
        4: totalReviews > 0 ? (ratingBreakdown[4] / totalReviews) * 100 : 0,
        5: totalReviews > 0 ? (ratingBreakdown[5] / totalReviews) * 100 : 0,
      };

      const reviewSummary: ReviewSummary = {
        average_rating: parseFloat(averageRating.toFixed(1)),
        total_reviews: totalReviews,
        total_ratings: totalRating,
        rating_breakdown: ratingBreakdown,
        percentage_breakdown: percentageBreakdown,
        recent_reviews: recentReviews,
        average_response_time: averageResponseTime ? parseFloat(averageResponseTime.toFixed(1)) : null,
        response_rate: parseFloat(responseRate.toFixed(1))
      };

      setSummary(reviewSummary);
    } catch (err) {
      console.error('Error fetching review summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch review summary');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockSummary = generateMockReviewSummary(sellerId);
        setSummary(mockSummary);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary
  };
};

// ==================== RESPOND TO REVIEW HOOK ====================

export const useRespondToReview = (): UseRespondToReviewReturn => {
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respondToReview = async (reviewId: string, response: string): Promise<boolean> => {
    if (!response.trim()) {
      setError('Response cannot be empty');
      return false;
    }

    try {
      setResponding(true);
      setError(null);

      // Get current user (seller)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      // Update the review with seller's response
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          seller_response: response,
          response_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success('Response posted successfully');
      return true;
    } catch (err) {
      console.error('Error responding to review:', err);
      setError(err instanceof Error ? err.message : 'Failed to post response');
      toast.error('Failed to post response');
      return false;
    } finally {
      setResponding(false);
    }
  };

  const editResponse = async (reviewId: string, newResponse: string): Promise<boolean> => {
    if (!newResponse.trim()) {
      setError('Response cannot be empty');
      return false;
    }

    try {
      setResponding(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          seller_response: newResponse,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success('Response updated successfully');
      return true;
    } catch (err) {
      console.error('Error editing response:', err);
      setError(err instanceof Error ? err.message : 'Failed to update response');
      toast.error('Failed to update response');
      return false;
    } finally {
      setResponding(false);
    }
  };

  const deleteResponse = async (reviewId: string): Promise<boolean> => {
    try {
      setResponding(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          seller_response: null,
          response_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success('Response deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting response:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete response');
      toast.error('Failed to delete response');
      return false;
    } finally {
      setResponding(false);
    }
  };

  return {
    responding,
    error,
    respondToReview,
    editResponse,
    deleteResponse
  };
};

// ==================== REPORT REVIEW HOOK ====================

export const useReportReview = (): UseReportReviewReturn => {
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReview = async (
    reviewId: string,
    reason: ReportReason,
    description: string
  ): Promise<boolean> => {
    if (!description.trim()) {
      setError('Please provide a reason for reporting');
      return false;
    }

    try {
      setReporting(true);
      setError(null);

      // Get current user (seller)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      // Check if review exists
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('seller_id')
        .eq('id', reviewId)
        .single();

      if (reviewError) throw reviewError;

      if (!review) {
        setError('Review not found');
        return false;
      }

      // Check if already reported
      const { data: existingReport } = await supabase
        .from('review_reports')
        .select('id')
        .eq('review_id', reviewId)
        .eq('seller_id', review.seller_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingReport) {
        setError('This review has already been reported and is pending review');
        return false;
      }

      // Create report
      const { error: insertError } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          seller_id: review.seller_id,
          reason,
          description,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Mark review as reported
      await supabase
        .from('reviews')
        .update({
          is_reported: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      toast.success('Review reported successfully. Our team will review it shortly.');
      return true;
    } catch (err) {
      console.error('Error reporting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to report review');
      toast.error('Failed to report review');
      return false;
    } finally {
      setReporting(false);
    }
  };

  const getReportStatus = async (reviewId: string): Promise<ReviewReport | null> => {
    try {
      const { data, error } = await supabase
        .from('review_reports')
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching report status:', err);
      return null;
    }
  };

  return {
    reporting,
    error,
    reportReview,
    getReportStatus
  };
};

// ==================== MOCK DATA GENERATORS ====================

const generateMockReviews = (sellerId: string): Review[] => {
  const products = [
    { id: 'prod-1', name: 'Modern Sofa Set', image: 'https://example.com/sofa.jpg', category: 'Sofas', price: 12999 },
    { id: 'prod-2', name: 'Wooden Dining Table', image: 'https://example.com/table.jpg', category: 'Dining', price: 8999 },
    { id: 'prod-3', name: 'King Size Bed', image: 'https://example.com/bed.jpg', category: 'Beds', price: 15999 },
    { id: 'prod-4', name: 'Office Chair', image: 'https://example.com/chair.jpg', category: 'Chairs', price: 2999 },
    { id: 'prod-5', name: 'Bookshelf', image: 'https://example.com/shelf.jpg', category: 'Storage', price: 5999 },
  ];

  const customers = [
    { id: 'cust-1', full_name: 'Ahmed Al-Mansoor', avatar_url: null, is_verified: true, total_reviews: 12 },
    { id: 'cust-2', full_name: 'Sarah Johnson', avatar_url: 'https://example.com/avatar1.jpg', is_verified: true, total_reviews: 8 },
    { id: 'cust-3', full_name: 'Mohammed Khan', avatar_url: null, is_verified: false, total_reviews: 3 },
    { id: 'cust-4', full_name: 'Fatima Al-Sayed', avatar_url: 'https://example.com/avatar2.jpg', is_verified: true, total_reviews: 15 },
    { id: 'cust-5', full_name: 'Robert Chen', avatar_url: null, is_verified: false, total_reviews: 5 },
  ];

  const titles = [
    'Excellent quality!',
    'Good product, but...',
    'Exceeded expectations',
    'Not as described',
    'Perfect for my home',
    'Delivery was delayed',
    'Great value for money',
    'Poor craftsmanship',
    'Beautiful design',
    'Would buy again'
  ];

  const comments = [
    'The quality is outstanding. The material feels premium and the craftsmanship is excellent.',
    'Good product overall, but delivery took longer than expected. The quality is decent for the price.',
    'This exceeded my expectations! The color is exactly as shown and assembly was straightforward.',
    'The product was not as described. There were some scratches and the color was different.',
    'Perfect addition to my living room. All my guests compliment it!',
    'Product is good but delivery was 3 days late without any notification.',
    'Great value for the price. Comparable items cost twice as much elsewhere.',
    'Disappointed with the craftsmanship. There are visible glue marks and uneven joints.',
    'The design is beautiful and modern. Exactly what I was looking for.',
    'Excellent experience from start to finish. Will definitely buy from this seller again.'
  ];

  const responses = [
    'Thank you for your feedback! We\'re glad you\'re happy with your purchase.',
    'We apologize for the delivery delay. We\'re working with our logistics partner to improve.',
    'Thank you for the 5-star review! We appreciate your business.',
    'We\'re sorry to hear about the issue. Please contact our support team for assistance.',
    null,
    null,
    'Thank you for recognizing the value! We strive to provide quality at competitive prices.',
    'We apologize for the craftsmanship issues. Our quality team will investigate.',
    'We\'re thrilled you love the design! Thank you for choosing our store.',
    null
  ];

  const images = [
    [],
    ['https://example.com/review1.jpg'],
    ['https://example.com/review2.jpg', 'https://example.com/review3.jpg'],
    [],
    ['https://example.com/review4.jpg'],
    [],
    [],
    ['https://example.com/review5.jpg'],
    ['https://example.com/review6.jpg'],
    []
  ];

  return Array.from({ length: 25 }, (_, i) => {
    const product = products[i % products.length];
    const customer = customers[i % customers.length];
    const rating = Math.floor(Math.random() * 5) + 1 as RatingValue;
    const hasResponse = Math.random() > 0.4;
    const responseIndex = hasResponse ? i % responses.length : responses.length - 1;
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const responseAt = hasResponse 
      ? new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
      : null;

    return {
      id: `review-${i + 1}`,
      product_id: product.id,
      seller_id: sellerId,
      customer_id: customer.id,
      rating,
      title: titles[i % titles.length],
      comment: comments[i % comments.length],
      seller_response: responses[responseIndex],
      response_at: responseAt?.toISOString() || null,
      is_reported: Math.random() > 0.9,
      is_verified_purchase: Math.random() > 0.3,
      helpful_count: Math.floor(Math.random() * 15),
      images: images[i % images.length],
      created_at: createdAt.toISOString(),
      updated_at: responseAt?.toISOString() || createdAt.toISOString(),
      product,
      customer
    };
  });
};

const generateMockReviewSummary = (sellerId: string): ReviewSummary => {
  // Generate realistic distribution (more 4-5 star reviews)
  const ratingBreakdown = {
    1: Math.floor(Math.random() * 5) + 1,
    2: Math.floor(Math.random() * 8) + 2,
    3: Math.floor(Math.random() * 12) + 5,
    4: Math.floor(Math.random() * 25) + 15,
    5: Math.floor(Math.random() * 35) + 25
  };

  const totalReviews = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);
  const totalRating = Object.entries(ratingBreakdown).reduce((sum, [rating, count]) => {
    return sum + (parseInt(rating) * count);
  }, 0);

  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  const percentageBreakdown = {
    1: totalReviews > 0 ? (ratingBreakdown[1] / totalReviews) * 100 : 0,
    2: totalReviews > 0 ? (ratingBreakdown[2] / totalReviews) * 100 : 0,
    3: totalReviews > 0 ? (ratingBreakdown[3] / totalReviews) * 100 : 0,
    4: totalReviews > 0 ? (ratingBreakdown[4] / totalReviews) * 100 : 0,
    5: totalReviews > 0 ? (ratingBreakdown[5] / totalReviews) * 100 : 0,
  };

  return {
    average_rating: parseFloat(averageRating.toFixed(1)),
    total_reviews: totalReviews,
    total_ratings: totalRating,
    rating_breakdown: ratingBreakdown,
    percentage_breakdown: percentageBreakdown,
    recent_reviews: Math.floor(totalReviews * 0.3), // 30% of reviews in last 30 days
    average_response_time: Math.floor(Math.random() * 48) + 12, // 12-60 hours
    response_rate: Math.floor(Math.random() * 40) + 60 // 60-100%
  };
};

// ==================== HELPER FUNCTIONS ====================

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600 bg-green-100';
  if (rating >= 4.0) return 'text-green-500 bg-green-50';
  if (rating >= 3.0) return 'text-yellow-600 bg-yellow-100';
  if (rating >= 2.0) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

export const getStarRating = (rating: number): { full: number; half: number; empty: number } => {
  const full = Math.floor(rating);
  const decimal = rating - full;
  const half = decimal >= 0.25 && decimal < 0.75 ? 1 : 0;
  const empty = 5 - full - half;
  
  return { full, half, empty };
};

// ==================== EXPORT HOOKS COLLECTION ====================

export const useReviewsCollection = {
  useReviews,
  useReviewSummary,
  useRespondToReview,
  useReportReview,
  formatRating,
  getRatingColor,
  getStarRating
};