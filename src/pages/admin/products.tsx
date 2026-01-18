// src/pages/admin/ProductsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


import { 
  Search, Filter, Package, CheckCircle, XCircle, 
  Edit, Trash2, Download, Eye, MoreVertical, Star,
  RefreshCw, AlertCircle, Loader2, Plus, Tag,
  DollarSign, Store, Calendar, TrendingUp, TrendingDown
} from "lucide-react";
import { supabaseAdmin as supabase} from '../../lib/supabase'
import { useProducts } from "../../hooks/useProducts";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'pending';
  approval_status: 'approved' | 'pending' | 'rejected';
  images: string[];
  seller_id: string;
  seller?: {
    business_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedApproval, setSelectedApproval] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    out_of_stock: 0,
    rejected: 0,
    totalValue: 0,
    lowStock: 0
  });

  // Fetch products from database
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch products with seller info
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          sellers (
            business_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(productsData || []);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((productsData || []).map(p => p.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);

      // Calculate stats
      const totalValue = (productsData || []).reduce((sum, p) => sum + (p.price * p.stock), 0);
      const lowStock = (productsData || []).filter(p => p.stock <= 10 && p.stock > 0).length;

      setStats({
        total: productsData?.length || 0,
        active: productsData?.filter(p => p.status === 'active').length || 0,
        pending: productsData?.filter(p => p.approval_status === 'pending').length || 0,
        out_of_stock: productsData?.filter(p => p.status === 'out_of_stock').length || 0,
        rejected: productsData?.filter(p => p.approval_status === 'rejected').length || 0,
        totalValue,
        lowStock
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) || 
      product.description?.toLowerCase().includes(search.toLowerCase()) ||
      product.seller?.business_name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;
    const matchesApproval = selectedApproval === "all" || product.approval_status === selectedApproval;

    return matchesSearch && matchesCategory && matchesStatus && matchesApproval;
  });

  // Handle product actions
  const handleProductAction = async (productId: string, action: string) => {
    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('products')
            .update({ 
              approval_status: 'approved',
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);
          alert('Product approved successfully!');
          await fetchProducts();
          break;
          
        case 'reject':
          const reason = prompt('Enter rejection reason:');
          if (reason) {
            await supabase
              .from('products')
              .update({ 
                approval_status: 'rejected',
                updated_at: new Date().toISOString()
              })
              .eq('id', productId);
            alert('Product rejected.');
            await fetchProducts();
          }
          break;
          
        case 'activate':
          await supabase
            .from('products')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);
          alert('Product activated.');
          await fetchProducts();
          break;
          
        case 'deactivate':
          await supabase
            .from('products')
            .update({ 
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);
          alert('Product deactivated.');
          await fetchProducts();
          break;
          
        case 'delete':
          if (confirm('Are you sure you want to delete this product?')) {
            await supabase
              .from('products')
              .delete()
              .eq('id', productId);
            alert('Product deleted.');
            await fetchProducts();
          }
          break;
          
        case 'edit':
          navigate(`/admin/products/edit/${productId}`);
          break;
          
        case 'view':
          navigate(`/admin/products/${productId}`);
          break;
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get approval color
  const getApprovalColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Initialize
  useEffect(() => {
    fetchProducts();
  }, []);

  console.log("protudssssssssssssss",products);
  return (
    
      <div className="p-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
              <p className="text-gray-600">Manage all products in the marketplace</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchProducts}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Products</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live from database
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Approval</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Inventory Value</div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
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
                  placeholder="Search products by name, description, or seller..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="pending">Pending</option>
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedApproval}
                onChange={(e) => setSelectedApproval(e.target.value)}
              >
                <option value="all">All Approval</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600">Loading products from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedApproval("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Approval
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
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.seller?.business_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.seller?.email || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${
                          product.stock === 0 ? 'text-red-600' :
                          product.stock <= 10 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {product.stock} units
                        </div>
                        {product.stock <= 10 && product.stock > 0 && (
                          <div className="text-xs text-orange-500">Low stock</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status === 'out_of_stock' ? 'Out of Stock' : 
                           product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApprovalColor(product.approval_status)}`}>
                          {product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProductAction(product.id, 'view')}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleProductAction(product.id, 'edit')}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          {product.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleProductAction(product.id, 'approve')}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleProductAction(product.id, 'reject')}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {product.approval_status === 'approved' && product.status === 'active' && (
                            <button
                              onClick={() => handleProductAction(product.id, 'deactivate')}
                              className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg"
                              title="Deactivate"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {product.approval_status === 'approved' && product.status === 'inactive' && (
                            <button
                              onClick={() => handleProductAction(product.id, 'activate')}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleProductAction(product.id, 'delete')}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

export default ProductsPage;