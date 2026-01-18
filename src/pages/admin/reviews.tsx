import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Search, 
  Filter, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Package,
  Calendar,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface Review {
  id: number;
  user: string;
  product: string;
  rating: number;
  title: string;
  comment: string;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  helpful: number;
  notHelpful: number;
  date: string;
  verified: boolean;
  response?: {
    admin: string;
    message: string;
    date: string;
  };
}

const ReviewsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [view, setView] = useState<'list' | 'grid'>('list');

  const reviews: Review[] = [
    { id: 1, user: "John Smith", product: "Modern Leather Sofa", rating: 5, title: "Excellent Quality!", comment: "Very comfortable and durable. Exceeded my expectations.", status: "approved", helpful: 12, notHelpful: 1, date: "2024-01-15", verified: true, response: { admin: "Admin User", message: "Thank you for your feedback!", date: "2024-01-16" } },
    { id: 2, user: "Sarah Johnson", product: "Queen Size Bed Frame", rating: 4, title: "Good product", comment: "Easy to assemble, sturdy construction. Minor scratches on delivery.", status: "approved", helpful: 8, notHelpful: 2, date: "2024-01-16", verified: true },
    { id: 3, user: "Mike Chen", product: "Dining Table Set", rating: 2, title: "Disappointed", comment: "Table arrived with damaged legs. Waiting for replacement.", status: "pending", helpful: 3, notHelpful: 0, date: "2024-01-17", verified: true },
    { id: 4, user: "Emma Wilson", product: "Office Chair", rating: 5, title: "Best chair ever!", comment: "Very comfortable for long working hours. Highly recommended.", status: "approved", helpful: 15, notHelpful: 0, date: "2024-01-18", verified: true },
    { id: 5, user: "David Brown", product: "Outdoor Patio Set", rating: 1, title: "Poor quality", comment: "Rust appeared after one week. Not weather resistant as advertised.", status: "rejected", helpful: 2, notHelpful: 5, date: "2024-01-19", verified: false },
    { id: 6, user: "Lisa Taylor", product: "Coffee Table", rating: 3, title: "Average product", comment: "Looks good but surface scratches easily.", status: "approved", helpful: 5, notHelpful: 1, date: "2024-01-20", verified: true },
    { id: 7, user: "Robert Garcia", product: "Bookshelf", rating: 5, title: "Perfect for my office", comment: "Exactly what I needed. Good value for money.", status: "spam", helpful: 0, notHelpful: 0, date: "2024-01-21", verified: false },
    { id: 8, user: "Maria Martinez", product: "Wardrobe Cabinet", rating: 4, title: "Great storage solution", comment: "Spacious and well-designed. Assembly took some time.", status: "approved", helpful: 10, notHelpful: 2, date: "2024-01-22", verified: true },
  ];

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.user.toLowerCase().includes(search.toLowerCase()) || 
                         review.product.toLowerCase().includes(search.toLowerCase()) ||
                         review.comment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === "all" || review.status === selectedStatus;
    const matchesRating = selectedRating === "all" || review.rating.toString() === selectedRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    pending: reviews.filter(r => r.status === 'pending').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    spam: reviews.filter(r => r.status === 'spam').length,
    averageRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    helpfulReviews: reviews.reduce((sum, r) => sum + r.helpful, 0),
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'spam': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <AlertCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'spam': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}.0</span>
      </div>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
              <p className="text-gray-600">Monitor and manage customer reviews</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Export Reviews
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.averageRating}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.helpfulReviews}</div>
              <div className="text-sm text-gray-600">Helpful Votes</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search reviews by user, product, or comment..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="spam">Spam</option>
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  className={`px-3 py-2 ${view === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setView('list')}
                >
                  List
                </button>
                <button 
                  className={`px-3 py-2 ${view === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setView('grid')}
                >
                  Grid
                </button>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List/Grid */}
        {view === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Helpfulness
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{review.user}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Package className="h-3 w-3 mr-1" />
                                {review.product}
                              </div>
                            </div>
                            {review.verified && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 mb-1">{review.title}</div>
                            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                          {getStatusIcon(review.status)}
                          <span className="ml-1">{review.status.charAt(0).toUpperCase() + review.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-green-600">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="ml-1 font-medium">{review.helpful}</span>
                          </div>
                          <div className="flex items-center text-red-600">
                            <ThumbsDown className="h-4 w-4" />
                            <span className="ml-1 font-medium">{review.notHelpful}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(review.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {review.status === 'pending' && (
                            <>
                              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                                Approve
                              </button>
                              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                                Reject
                              </button>
                            </>
                          )}
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{review.user}</div>
                      {review.verified && (
                        <span className="text-xs text-blue-600">Verified Purchase</span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                    {getStatusIcon(review.status)}
                    <span className="ml-1">{review.status.charAt(0).toUpperCase() + review.status.slice(1)}</span>
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    {renderStars(review.rating)}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{review.comment}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Package className="h-4 w-4 mr-2" />
                    {review.product}
                  </div>
                  <div className="text-sm text-gray-600">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    {formatDate(review.date)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-green-600">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="ml-1 font-medium">{review.helpful}</span>
                    </div>
                    <div className="flex items-center text-red-600">
                      <ThumbsDown className="h-4 w-4" />
                      <span className="ml-1 font-medium">{review.notHelpful}</span>
                    </div>
                  </div>
                </div>

                {review.response && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Admin Response
                    </div>
                    <p className="text-sm text-blue-700">{review.response.message}</p>
                    <div className="text-xs text-blue-600 mt-1">
                      by {review.response.admin} on {formatDate(review.response.date)}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    ID: REV-{review.id.toString().padStart(3, '0')}
                  </div>
                  <div className="flex items-center gap-2">
                    {review.status === 'pending' && (
                      <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        Approve
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🌟</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedStatus("all");
                setSelectedRating("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewsPage;