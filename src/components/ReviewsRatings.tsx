import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Eye,
  Edit,
  Send,
  X,
  RefreshCw,
  Download,
  Hash,
  Package,
  User,
  StarHalf,
  Check,
  ChevronDown
} from 'lucide-react';

// TypeScript Interfaces
interface Review {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  customerName: string;
  customerImage?: string;
  rating: number;
  comment: string;
  response?: string;
  responseDate?: string;
  status: 'pending-response' | 'responded' | 'flagged' | 'hidden';
  createdAt: string;
  helpfulCount: number;
  images?: string[];
  orderType: 'ready-made' | 'custom';
  verifiedPurchase: boolean;
}

interface RatingSummary {
  overallRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  fiveStarPercent: number;
  oneTwoStarPercent: number;
  responseRate: number;
  averageRatingThisMonth: number;
  ratingChange: number;
  helpfulReviews: number;
  productWithMostReviews: string;
}

interface FilterState {
  rating: number | 'all';
  status: string;
  product: string;
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  search: string;
}

// Mock Data Generation
const generateMockReviews = (): Review[] => [
  {
    id: 'REV-001',
    orderId: 'ORD-7845',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Office Chairs',
    customerName: 'Ahmed Al-Mansoor',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'Excellent quality! The chair is extremely comfortable and well-built. The lumbar support is perfect for long work hours. Delivery was faster than expected.',
    response: 'Thank you for your wonderful feedback, Ahmed! We\'re thrilled to hear you\'re enjoying your new office chair. Your satisfaction is our top priority.',
    responseDate: '2024-01-16',
    status: 'responded',
    createdAt: '2024-01-15',
    helpfulCount: 12,
    images: [],
    orderType: 'custom',
    verifiedPurchase: true
  },
  {
    id: 'REV-002',
    orderId: 'ORD-7844',
    productId: '2',
    productName: 'Leather Reclining Sofa',
    productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    category: 'Sofas',
    customerName: 'Sarah Johnson',
    customerImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    rating: 4,
    comment: 'Great sofa, very comfortable. The leather quality is good, but there was a small scratch on one leg. Customer service was helpful in resolving.',
    response: 'Dear Sarah, thank you for bringing this to our attention. We apologize for the inconvenience and have noted this for quality improvement.',
    responseDate: '2024-01-16',
    status: 'responded',
    createdAt: '2024-01-14',
    helpfulCount: 8,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-003',
    orderId: 'ORD-7843',
    productId: '3',
    productName: 'Custom Wood Dining Table',
    productImage: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    category: 'Dining Tables',
    customerName: 'Mohammed Khan',
    customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'Absolutely stunning! The custom table exceeded my expectations. The craftsmanship is exceptional and it fits perfectly in our dining room.',
    status: 'pending-response',
    createdAt: '2024-01-14',
    helpfulCount: 15,
    images: [],
    orderType: 'custom',
    verifiedPurchase: true
  },
  {
    id: 'REV-004',
    orderId: 'ORD-7842',
    productId: '4',
    productName: 'Minimalist Coffee Table',
    productImage: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    category: 'Coffee Tables',
    customerName: 'Fatima Al-Sayed',
    customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    rating: 3,
    comment: 'Table looks nice but arrived with minor damage on one corner. The glass is slightly scratched. Expected better quality control.',
    response: 'We sincerely apologize for the damage, Fatima. Our quality team will investigate this. Please contact our support for a replacement.',
    responseDate: '2024-01-15',
    status: 'responded',
    createdAt: '2024-01-13',
    helpfulCount: 5,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-005',
    orderId: 'ORD-7841',
    productId: '5',
    productName: 'Ergonomic Study Desk',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Desks',
    customerName: 'Robert Chen',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rating: 2,
    comment: 'Not happy with the quality. The desk wobbles and the height adjustment mechanism is stiff. Expected more from this price range.',
    status: 'pending-response',
    createdAt: '2024-01-13',
    helpfulCount: 7,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-006',
    orderId: 'ORD-7840',
    productId: '6',
    productName: 'Queen Size Storage Bed',
    productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
    category: 'Beds',
    customerName: 'Khalid Abdullah',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'Perfect bed! The storage drawers are spacious and the build quality is solid. Assembly was straightforward with the provided instructions.',
    status: 'pending-response',
    createdAt: '2024-01-12',
    helpfulCount: 9,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-007',
    orderId: 'ORD-7839',
    productId: '7',
    productName: 'Outdoor Patio Set',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Outdoor Furniture',
    customerName: 'Layla Mohammed',
    customerImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    rating: 1,
    comment: 'Very disappointed. The cushions faded after 2 weeks in the sun. The table surface has stains that won\'t come off. Poor quality materials.',
    status: 'flagged',
    createdAt: '2024-01-12',
    helpfulCount: 11,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-008',
    orderId: 'ORD-7838',
    productId: '8',
    productName: 'Custom Bookshelf',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Shelves',
    customerName: 'Yusuf Ahmed',
    customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 4,
    comment: 'Good quality bookshelf. The customization options were excellent and the finish is beautiful. Took longer than expected to arrive though.',
    response: 'Thank you for your feedback, Yusuf. We apologize for the delivery delay and are working to improve our logistics process.',
    responseDate: '2024-01-14',
    status: 'responded',
    createdAt: '2024-01-11',
    helpfulCount: 6,
    images: [],
    orderType: 'custom',
    verifiedPurchase: true
  },
  {
    id: 'REV-009',
    orderId: 'ORD-7837',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Office Chairs',
    customerName: 'Amira Hassan',
    customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'Best office chair I\'ve owned! The adjustable armrests and lumbar support have eliminated my back pain during long work sessions.',
    status: 'pending-response',
    createdAt: '2024-01-10',
    helpfulCount: 14,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-010',
    orderId: 'ORD-7836',
    productId: '2',
    productName: 'Leather Reclining Sofa',
    productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    category: 'Sofas',
    customerName: 'David Wilson',
    rating: 3,
    comment: 'Comfortable but the leather started showing wear after 3 months. Expected better durability for the price.',
    status: 'pending-response',
    createdAt: '2024-01-09',
    helpfulCount: 4,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-011',
    orderId: 'ORD-7835',
    productId: '3',
    productName: 'Custom Wood Dining Table',
    productImage: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    category: 'Dining Tables',
    customerName: 'Noura Al-Rashid',
    rating: 5,
    comment: 'Beautiful craftsmanship! The custom dimensions fit our space perfectly. The wood finish is exactly what we wanted.',
    status: 'pending-response',
    createdAt: '2024-01-08',
    helpfulCount: 8,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
    orderType: 'custom',
    verifiedPurchase: true
  },
  {
    id: 'REV-012',
    orderId: 'ORD-7834',
    productId: '4',
    productName: 'Minimalist Coffee Table',
    productImage: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    category: 'Coffee Tables',
    customerName: 'Carlos Rodriguez',
    rating: 4,
    comment: 'Great design and good quality. The glass top is easy to clean. Assembly took about 30 minutes.',
    response: 'Thank you for your feedback, Carlos! We\'re glad you\'re enjoying the coffee table.',
    responseDate: '2024-01-10',
    status: 'responded',
    createdAt: '2024-01-07',
    helpfulCount: 3,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-013',
    orderId: 'ORD-7833',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Office Chairs',
    customerName: 'Samira Khalid',
    rating: 2,
    comment: 'The chair arrived with a broken wheel. Customer service was slow to respond. Not a good experience overall.',
    status: 'flagged',
    createdAt: '2024-01-06',
    helpfulCount: 9,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-014',
    orderId: 'ORD-7832',
    productId: '5',
    productName: 'Ergonomic Study Desk',
    productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Desks',
    customerName: 'Thomas Brown',
    rating: 5,
    comment: 'Excellent desk! The cable management system is fantastic and the standing desk function works smoothly.',
    status: 'pending-response',
    createdAt: '2024-01-05',
    helpfulCount: 7,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  },
  {
    id: 'REV-015',
    orderId: 'ORD-7831',
    productId: '6',
    productName: 'Queen Size Storage Bed',
    productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
    category: 'Beds',
    customerName: 'Fatima Zahra',
    rating: 4,
    comment: 'Good bed overall. The storage is very useful. Took longer to assemble than expected but worth it.',
    response: 'Thank you for your feedback, Fatima. We\'re working on improving our assembly instructions.',
    responseDate: '2024-01-07',
    status: 'responded',
    createdAt: '2024-01-04',
    helpfulCount: 5,
    images: [],
    orderType: 'ready-made',
    verifiedPurchase: true
  }
];

const calculateRatingSummary = (reviews: Review[]): RatingSummary => {
  const totalReviews = reviews.length;
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fourStarCount = reviews.filter(r => r.rating === 4).length;
  const threeStarCount = reviews.filter(r => r.rating === 3).length;
  const twoStarCount = reviews.filter(r => r.rating === 2).length;
  const oneStarCount = reviews.filter(r => r.rating === 1).length;
  
  const overallRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews)
    : 0;
  
  const respondedReviews = reviews.filter(r => r.status === 'responded').length;
  const helpfulReviews = reviews.filter(r => r.helpfulCount >= 3).length;
  
  const productReviews: Record<string, number> = {};
  reviews.forEach(r => {
    productReviews[r.productName] = (productReviews[r.productName] || 0) + 1;
  });
  
  const productWithMostReviews = Object.entries(productReviews)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No products';

  return {
    overallRating: Number(overallRating.toFixed(1)),
    totalReviews,
    fiveStarCount,
    fourStarCount,
    threeStarCount,
    twoStarCount,
    oneStarCount,
    fiveStarPercent: totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0,
    oneTwoStarPercent: totalReviews > 0 ? Math.round(((oneStarCount + twoStarCount) / totalReviews) * 100) : 0,
    responseRate: totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0,
    averageRatingThisMonth: 4.3,
    ratingChange: 0.2,
    helpfulReviews,
    productWithMostReviews
  };
};

// Star Rating Component
const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg'; showNumber?: boolean }> = ({ 
  rating, 
  size = 'md', 
  showNumber = false 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} className={`${sizeClasses[size]} text-yellow-400 fill-current`} />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <StarHalf key={i} className={`${sizeClasses[size]} text-yellow-400 fill-current`} />
      );
    } else {
      stars.push(
        <Star key={i} className={`${sizeClasses[size]} text-gray-300`} />
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Rating Distribution Component
const RatingDistribution: React.FC<{ summary: RatingSummary }> = ({ summary }) => {
  const maxCount = Math.max(
    summary.fiveStarCount,
    summary.fourStarCount,
    summary.threeStarCount,
    summary.twoStarCount,
    summary.oneStarCount
  );

  return (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = summary[`${stars}StarCount` as keyof RatingSummary] as number;
        const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium text-gray-900">{stars}</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    stars >= 4 ? 'bg-green-500' :
                    stars === 3 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <div className="w-20 text-right">
              <span className="text-sm font-medium text-gray-900">{count}</span>
              <span className="text-sm text-gray-500 ml-1">({percent}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Response Modal Component
const ResponseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onSubmit: (reviewId: string, response: string) => void;
}> = ({ isOpen, onClose, review, onSubmit }) => {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (review?.response) {
      setResponse(review.response);
    } else {
      setResponse('');
    }
  }, [review]);

  if (!isOpen || !review) return null;

  const handleSubmit = async () => {
    if (!response.trim()) return;
    
    setSubmitting(true);
    try {
      onSubmit(review.id, response);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Respond to Review</h2>
            <p className="text-gray-600 text-sm mt-1">Your response will be visible to all customers</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Review Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={review.productImage}
                alt={review.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{review.productName}</h3>
                  <p className="text-sm text-gray-600">{review.category}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{review.customerName}</p>
                    <p className="text-xs text-gray-500">{review.createdAt}</p>
                  </div>
                  {review.verifiedPurchase && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-sm">{review.comment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Response Area */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Your Response <span className="text-gray-500">(Public)</span>
          </label>
          <div className="relative">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Write your professional response here. Remember that your response will be public and reflects your business."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {response.length}/500 characters
            </div>
          </div>

          {/* Response Tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for a great response:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Address the customer by name</li>
              <li>• Thank them for their feedback</li>
              <li>• Apologize for any issues (if applicable)</li>
              <li>• Explain how you'll improve</li>
              <li>• Keep it professional and polite</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            disabled={submitting}
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {review.response && (
              <button
                onClick={() => setResponse('')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={submitting}
              >
                Clear Response
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin mx-4" />
              ) : (
                <>
                  <Send className="w-4 h-4 inline mr-2" />
                  {review.response ? 'Update Response' : 'Submit Response'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const ReviewsRatings: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    rating: 'all',
    status: 'all',
    product: 'all',
    dateRange: 'all',
    search: ''
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, filters]);

  const loadReviews = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockReviews = generateMockReviews();
    setReviews(mockReviews);
    setFilteredReviews(mockReviews);
    setSummary(calculateRatingSummary(mockReviews));
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    if (filters.rating !== 'all') {
      filtered = filtered.filter(r => r.rating === filters.rating);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.product !== 'all') {
      filtered = filtered.filter(r => r.productName === filters.product);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.customerName.toLowerCase().includes(searchTerm) ||
        r.productName.toLowerCase().includes(searchTerm) ||
        r.comment.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filter
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch (filters.dateRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
    }

    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(r => new Date(r.createdAt) >= startDate);
    }

    setFilteredReviews(filtered);
    setPage(1);
  };

  const handleSubmitResponse = (reviewId: string, response: string) => {
    setReviews(reviews.map(r => 
      r.id === reviewId 
        ? { 
            ...r, 
            response, 
            responseDate: new Date().toISOString().split('T')[0],
            status: 'responded' 
          }
        : r
    ));
  };

  const getUniqueProducts = () => {
    const products = [...new Set(reviews.map(r => r.productName))];
    return products;
  };

  const getStatusBadge = (status: Review['status']) => {
    const config = {
      'pending-response': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      'responded': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Responded' },
      'flagged': { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Flagged' },
      'hidden': { color: 'bg-gray-100 text-gray-800', icon: Eye, label: 'Hidden' }
    };
    
    const { color, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const paginatedReviews = filteredReviews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
            <p className="text-gray-600 mt-1">Monitor customer feedback and improve product quality</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadReviews}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => console.log('Export reviews')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Ratings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Overall Rating */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              summary.ratingChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {summary.ratingChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(summary.ratingChange)}
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold text-gray-900">{summary.overallRating.toFixed(1)}</p>
            <span className="text-gray-600 text-sm">/ 5.0</span>
          </div>
          <StarRating rating={summary.overallRating} size="md" />
          <p className="text-sm text-gray-600 mt-2">Overall Rating</p>
        </div>

        {/* Total Reviews */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{summary.totalReviews}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
            </div>
            <span className="text-xs text-gray-600">All time</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total Reviews</p>
        </div>

        {/* 5-Star Reviews */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Top Tier
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{summary.fiveStarPercent}%</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${summary.fiveStarPercent}%` }} />
            </div>
            <span className="text-xs text-gray-600">{summary.fiveStarCount}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">5-Star Reviews</p>
        </div>

        {/* 1-2 Star Reviews */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            {summary.oneTwoStarPercent > 10 && (
              <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">
                Attention
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{summary.oneTwoStarPercent}%</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${summary.oneTwoStarPercent}%` }} />
            </div>
            <span className="text-xs text-gray-600">{summary.oneStarCount + summary.twoStarCount}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">1-2 Star Reviews</p>
        </div>

        {/* Response Rate */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              summary.responseRate >= 90 ? 'bg-green-100 text-green-800' :
              summary.responseRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {summary.responseRate >= 90 ? 'Excellent' : summary.responseRate >= 70 ? 'Good' : 'Needs Work'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{summary.responseRate}%</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${summary.responseRate}%` }} />
            </div>
            <span className="text-xs text-gray-600">Target: 95%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Response Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Rating Distribution */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Rating Distribution</h2>
                <p className="text-gray-600 text-sm mt-1">Breakdown by star rating</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            <RatingDistribution summary={summary} />
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average This Month</span>
                  <span className="font-semibold text-gray-900">{summary.averageRatingThisMonth.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Helpful Reviews</span>
                  <span className="font-semibold text-gray-900">{summary.helpfulReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Most Reviewed Product</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {summary.productWithMostReviews}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Review Insights</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Positive Sentiment</span>
                  <span className="text-sm font-bold text-green-600">72%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Neutral Sentiment</span>
                  <span className="text-sm font-bold text-yellow-600">18%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Negative Sentiment</span>
                  <span className="text-sm font-bold text-red-600">10%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reviews Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reviews by customer, product, or comment..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFilters({
                      rating: 'all',
                      status: 'all',
                      product: 'all',
                      dateRange: 'all',
                      search: ''
                    })}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({ ...filters, rating: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending-response">Pending Response</option>
                    <option value="responded">Responded</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Product</label>
                  <select
                    value={filters.product}
                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Products</option>
                    {getUniqueProducts().map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {review.customerName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{review.customerName}</p>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{review.comment}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{review.orderId}</span>
                              {review.verifiedPurchase && (
                                <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                              )}
                            </div>
                            {review.helpfulCount > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <ThumbsUp className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{review.helpfulCount} found helpful</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={review.productImage}
                              alt={review.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">{review.productName}</p>
                            <p className="text-xs text-gray-500">{review.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <StarRating rating={review.rating} showNumber />
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(review.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm text-gray-900">{review.createdAt}</p>
                          {review.responseDate && (
                            <p className="text-xs text-gray-500">Replied: {review.responseDate}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setShowResponseModal(true);
                            }}
                            className={`p-2 rounded-lg transition ${
                              review.status === 'responded'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                            title={review.status === 'responded' ? 'Edit Response' : 'Respond'}
                          >
                            {review.status === 'responded' ? (
                              <Edit className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => console.log('View details', review.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>{filteredReviews.filter(r => r.status === 'pending-response').length} pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{filteredReviews.filter(r => r.status === 'responded').length} responded</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(filteredReviews.length / itemsPerPage) }, (_, i) => i + 1)
                      .slice(Math.max(0, page - 3), Math.min(Math.ceil(filteredReviews.length / itemsPerPage), page + 2))
                      .map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(filteredReviews.length / itemsPerPage), p + 1))}
                    disabled={page === Math.ceil(filteredReviews.length / itemsPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
        onSubmit={handleSubmitResponse}
      />
    </div>
  );
};

export default ReviewsRatings;