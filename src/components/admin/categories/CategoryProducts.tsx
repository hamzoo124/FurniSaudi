import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Filter,
  Search,
  Download,
  ChevronDown
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryProductsProps {
  categoryId: string;
  categoryName: string;
  onBack?: () => void;
}

const CategoryProducts: React.FC<CategoryProductsProps> = ({
  categoryId,
  categoryName,
  onBack
}) => {
  const {
    categoryProducts,
    loading,
    fetchProductsByCategory
  } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const products = categoryProducts[categoryId] || [];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.seller?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : product.approval_status === statusFilter;
    
    const matchesDate = (!dateRange.from || new Date(product.created_at) >= new Date(dateRange.from)) &&
                       (!dateRange.to || new Date(product.created_at) <= new Date(dateRange.to));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: products.length,
    pending: products.filter(p => p.approval_status === 'pending').length,
    approved: products.filter(p => p.approval_status === 'approved').length,
    rejected: products.filter(p => p.approval_status === 'rejected').length
  };

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    }
  }, [categoryId, fetchProductsByCategory]);

  const handleApproveProduct = async (productId: string) => {
    // Implement approval logic
    console.log('Approve product:', productId);
  };

  const handleRejectProduct = async (productId: string) => {
    // Implement rejection logic
    console.log('Reject product:', productId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {categoryName} Products
            </h2>
            <p className="text-gray-600 text-sm">
              Manage products in this category
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">From:</span>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">To:</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          
          <button
            onClick={() => setDateRange({ from: '', to: '' })}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Dates
          </button>
        </div>
      </div>

      {/* Products Table */}
      {loading.products ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No products found</h3>
          <p className="text-gray-500 text-sm">
            {searchQuery || statusFilter !== 'all' || dateRange.from || dateRange.to
              ? 'Try adjusting your filters'
              : `No products in ${categoryName} category yet`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.seller?.business_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.seller?.email || ''}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        ${product.price?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        product.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.approval_status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {/* View details */}}
                          className="p-1 text-gray-600 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {product.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveProduct(product.id)}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectProduct(product.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;