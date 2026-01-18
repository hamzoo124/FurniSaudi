// src/components/admin/ProductManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Package, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, AlertCircle, 
  Download, RefreshCw, MoreVertical, Store,
  Tag, DollarSign, BarChart, Star, Grid, List,
  ChevronDown, Calendar, User, Hash, Shield
} from 'lucide-react';
import { supabase } from  '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  stock_quantity: number;
  category_id: string | null;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string;
  product_categories: string[];
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  is_featured: boolean;
  is_advertised: boolean;
  rating: number;
  reviews_count: number;
  orders_count: number;
  views_count: number;
  images: string[];
  brand: string | null;
  warranty: string | null;
  dimensions: any;
  weight: string | null;
  colors: string[];
  finish_type: string | null;
  primary_color: string | null;
  placement: 'indoor' | 'outdoor' | null;
  section: string | null;
  short_description: string | null;
  specifications: any;
  variants: any[];
  shipping_info: any;
  policies: any;
  seller_id: string;
  seller_name: string;
  seller_business: string;
  seller_cr_number: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    display_name: string;
  };
}

interface FilterState {
  status: string;
  category_type: string;
  usage_type: string;
  product_type: string;
  min_price: number;
  max_price: number;
  min_stock: number;
  max_stock: number;
  date_range: {
    start: string;
    end: string;
  };
  seller_type: string;
}

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    suspended: 0,
    low_stock: 0,
    featured: 0,
    advertised: 0
  });

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category_type: 'all',
    usage_type: 'all',
    product_type: 'all',
    min_price: 0,
    max_price: 10000,
    min_stock: 0,
    max_stock: 1000,
    date_range: {
      start: '',
      end: ''
    },
    seller_type: 'all'
  });

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching products from database...');

      // Fetch products with seller and category info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, display_name),
          seller:profiles!products_seller_id_fkey(
            id,
            full_name,
            business_name,
            cr_number
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
        // Try alternative query structure
        const { data: altData, error: altError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (altError) {
          console.error('❌ Error with alternative query:', altError);
          // Try to load from localStorage as fallback
          const localProducts = localStorage.getItem('admin_products_fallback');
          if (localProducts) {
            const parsed = JSON.parse(localProducts);
            processProducts(parsed);
            return;
          }
          throw altError;
        }

        // Enrich with seller data separately
        const enrichedProducts = await Promise.all(
          (altData || []).map(async (product: any) => {
            let sellerInfo = {
              seller_name: 'Unknown Seller',
              seller_business: 'Unknown Business',
              seller_cr_number: ''
            };

            try {
              // Try to get seller from profiles
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, business_name, cr_number')
                .eq('id', product.seller_id)
                .single();

              if (profile) {
                sellerInfo = {
                  seller_name: profile.full_name || 'Unknown Seller',
                  seller_business: profile.business_name || 'Unknown Business',
                  seller_cr_number: profile.cr_number || ''
                };
              }
            } catch (error) {
              console.log('⚠️ Could not fetch seller info:', error);
            }

            // Try to get category info
            let categoryInfo = null;
            if (product.category_id) {
              try {
                const { data: category } = await supabase
                  .from('categories')
                  .select('id, name, display_name')
                  .eq('id', product.category_id)
                  .single();

                if (category) {
                  categoryInfo = category;
                }
              } catch (error) {
                console.log('⚠️ Could not fetch category info:', error);
              }
            }

            return {
              ...product,
              ...sellerInfo,
              category: categoryInfo
            };
          })
        );

        processProducts(enrichedProducts);
        return;
      }

      // Process data with joins
      const processedProducts = (productsData || []).map((product: any) => ({
        ...product,
        seller_name: product.seller?.full_name || 'Unknown Seller',
        seller_business: product.seller?.business_name || 'Unknown Business',
        seller_cr_number: product.seller?.cr_number || '',
        category: product.category || null
      }));

      processProducts(processedProducts);

    } catch (error) {
      console.error('❌ Error in fetchProducts:', error);
      alert('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const processProducts = (productsList: any[]) => {
    console.log('📦 Processing products:', productsList.length);
    
    // Convert to Product type
    const convertedProducts: Product[] = productsList.map((product: any) => ({
      id: product.id,
      name: product.name || product.title || 'Unnamed Product',
      description: product.description || '',
      price: product.price || 0,
      original_price: product.original_price || null,
      discount: product.discount || null,
      stock_quantity: product.stock_quantity || product.stock || 0,
      category_id: product.category_id || null,
      category_type: product.category_type || (product.category?.category_type || 'ready_made'),
      usage_type: product.usage_type || (product.category?.usage_type || 'indoor'),
      product_type: product.product_type || (product.category?.product_type || ''),
      product_categories: product.product_categories || (product.category?.product_categories || []),
      status: product.status || 'pending',
      is_featured: product.is_featured || product.is_top_seller || false,
      is_advertised: product.is_advertised || false,
      rating: product.rating || 0,
      reviews_count: product.reviews_count || product.reviews || 0,
      orders_count: product.orders_count || product.orders || 0,
      views_count: product.views_count || 0,
      images: product.images || [product.image || ''],
      brand: product.brand || null,
      warranty: product.warranty || null,
      dimensions: product.dimensions || null,
      weight: product.weight || null,
      colors: product.colors || product.available_colors || [],
      finish_type: product.finish_type || null,
      primary_color: product.primary_color || null,
      placement: product.placement || null,
      section: product.section || null,
      short_description: product.short_description || null,
      specifications: product.specifications || null,
      variants: product.variants || [],
      shipping_info: product.shipping_info || product.shipping || null,
      policies: product.policies || null,
      seller_id: product.seller_id || '',
      seller_name: product.seller_name || product.seller?.full_name || 'Unknown',
      seller_business: product.seller_business || product.seller?.business_name || 'Unknown',
      seller_cr_number: product.seller_cr_number || product.seller?.cr_number || '',
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString(),
      category: product.category || null
    }));

    setProducts(convertedProducts);
    
    // Calculate statistics
    const stats = {
      total: convertedProducts.length,
      active: convertedProducts.filter(p => p.status === 'active').length,
      pending: convertedProducts.filter(p => p.status === 'pending').length,
      rejected: convertedProducts.filter(p => p.status === 'rejected').length,
      suspended: convertedProducts.filter(p => p.status === 'suspended').length,
      low_stock: convertedProducts.filter(p => p.stock_quantity < 10).length,
      featured: convertedProducts.filter(p => p.is_featured).length,
      advertised: convertedProducts.filter(p => p.is_advertised).length
    };
    setStats(stats);
    
    // Save to localStorage as fallback
    localStorage.setItem('admin_products_fallback', JSON.stringify(convertedProducts));
    
    console.log('✅ Products processed successfully');
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...products];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.seller_name.toLowerCase().includes(query) ||
        product.seller_business.toLowerCase().includes(query) ||
        product.seller_cr_number.includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.product_type.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter(product => product.status === filters.status);
    }

    if (filters.category_type !== 'all') {
      result = result.filter(product => product.category_type === filters.category_type);
    }

    if (filters.usage_type !== 'all') {
      result = result.filter(product => product.usage_type === filters.usage_type);
    }

    if (filters.product_type !== 'all') {
      result = result.filter(product => product.product_type === filters.product_type);
    }

    if (filters.min_price > 0) {
      result = result.filter(product => product.price >= filters.min_price);
    }

    if (filters.max_price < 10000) {
      result = result.filter(product => product.price <= filters.max_price);
    }

    if (filters.min_stock > 0) {
      result = result.filter(product => product.stock_quantity >= filters.min_stock);
    }

    if (filters.max_stock < 1000) {
      result = result.filter(product => product.stock_quantity <= filters.max_stock);
    }

    if (filters.date_range.start) {
      const startDate = new Date(filters.date_range.start);
      result = result.filter(product => new Date(product.created_at) >= startDate);
    }

    if (filters.date_range.end) {
      const endDate = new Date(filters.date_range.end);
      result = result.filter(product => new Date(product.created_at) <= endDate);
    }

    if (filters.seller_type !== 'all') {
      if (filters.seller_type === 'with_cr') {
        result = result.filter(product => product.seller_cr_number);
      } else if (filters.seller_type === 'without_cr') {
        result = result.filter(product => !product.seller_cr_number);
      }
    }

    setFilteredProducts(result);
  }, [products, searchQuery, filters]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle product actions
  const handleProductAction = async (action: string, productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      switch (action) {
        case 'approve':
          if (confirm(`Approve "${product.name}"?`)) {
            const { error } = await supabase
              .from('products')
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', productId);

            if (error) throw error;
            await fetchProducts();
            alert('✅ Product approved successfully!');
          }
          break;

        case 'reject':
          const reason = prompt('Enter reason for rejection:');
          if (reason) {
            const { error } = await supabase
              .from('products')
              .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
              })
              .eq('id', productId);

            if (error) throw error;
            await fetchProducts();
            alert('✅ Product rejected successfully!');
          }
          break;

        case 'suspend':
          if (confirm(`Suspend "${product.name}"?`)) {
            const { error } = await supabase
              .from('products')
              .update({ 
                status: 'suspended',
                updated_at: new Date().toISOString()
              })
              .eq('id', productId);

            if (error) throw error;
            await fetchProducts();
            alert('✅ Product suspended successfully!');
          }
          break;

        case 'delete':
          if (confirm(`Delete "${product.name}" permanently?`)) {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', productId);

            if (error) throw error;
            await fetchProducts();
            alert('✅ Product deleted successfully!');
          }
          break;

        case 'feature':
          const { error: featureError } = await supabase
            .from('products')
            .update({ 
              is_featured: !product.is_featured,
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);

          if (featureError) throw featureError;
          await fetchProducts();
          alert(`✅ Product ${product.is_featured ? 'unfeatured' : 'featured'} successfully!`);
          break;

        case 'view':
          navigate(`/admin/products/${productId}`);
          break;

        case 'edit':
          navigate(`/admin/products/edit/${productId}`);
          break;
      }
    } catch (error: any) {
      console.error('❌ Error performing action:', error);
      alert(`❌ Error: ${error.message || 'Failed to perform action'}`);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    try {
      switch (action) {
        case 'approve':
          if (confirm(`Approve ${selectedProducts.length} products?`)) {
            const { error } = await supabase
              .from('products')
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .in('id', selectedProducts);

            if (error) throw error;
            setSelectedProducts([]);
            await fetchProducts();
            alert(`✅ ${selectedProducts.length} products approved successfully!`);
          }
          break;

        case 'reject':
          if (confirm(`Reject ${selectedProducts.length} products?`)) {
            const { error } = await supabase
              .from('products')
              .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
              })
              .in('id', selectedProducts);

            if (error) throw error;
            setSelectedProducts([]);
            await fetchProducts();
            alert(`✅ ${selectedProducts.length} products rejected successfully!`);
          }
          break;

        case 'delete':
          if (confirm(`Delete ${selectedProducts.length} products permanently?`)) {
            const { error } = await supabase
              .from('products')
              .delete()
              .in('id', selectedProducts);

            if (error) throw error;
            setSelectedProducts([]);
            await fetchProducts();
            alert(`✅ ${selectedProducts.length} products deleted successfully!`);
          }
          break;

        case 'feature':
          if (confirm(`Feature ${selectedProducts.length} products?`)) {
            const { error } = await supabase
              .from('products')
              .update({ 
                is_featured: true,
                updated_at: new Date().toISOString()
              })
              .in('id', selectedProducts);

            if (error) throw error;
            setSelectedProducts([]);
            await fetchProducts();
            alert(`✅ ${selectedProducts.length} products featured successfully!`);
          }
          break;
      }
    } catch (error: any) {
      console.error('❌ Error performing bulk action:', error);
      alert(`❌ Error: ${error.message || 'Failed to perform bulk action'}`);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all filtered products
  const selectAllFiltered = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      category_type: 'all',
      usage_type: 'all',
      product_type: 'all',
      min_price: 0,
      max_price: 10000,
      min_stock: 0,
      max_stock: 1000,
      date_range: { start: '', end: '' },
      seller_type: 'all'
    });
    setSearchQuery('');
  };

  // Export data
  const exportData = () => {
    const data = filteredProducts.map(product => ({
      'Product ID': product.id,
      'Name': product.name,
      'Price': product.price,
      'Stock': product.stock_quantity,
      'Status': product.status,
      'Category': product.category?.display_name || product.category_type,
      'Seller': product.seller_business,
      'Seller CR': product.seller_cr_number,
      'Created Date': new Date(product.created_at).toLocaleDateString(),
      'Orders': product.orders_count,
      'Rating': product.rating,
      'Featured': product.is_featured ? 'Yes' : 'No',
      'Advertised': product.is_advertised ? 'Yes' : 'No'
    }));

    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert(`✅ Exported ${data.length} products to CSV`);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getBadgeStyle = () => {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'rejected':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'suspended':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'draft':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render product card (Grid view)
  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Product Image */}
        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80'}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <StatusBadge status={product.status} />
            {product.is_featured && (
              <span className="bg-[#D4AF37] text-white text-xs px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {product.is_advertised && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Advertised
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProductSelection(product.id)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="p-4">
          {/* Product Name & Seller */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Store className="w-3 h-3 mr-1" />
              <span className="truncate">{product.seller_business}</span>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-lg text-gray-900">
                {formatCurrency(product.price)}
              </div>
              {product.original_price && (
                <div className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.original_price)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                Stock: {product.stock_quantity}
              </div>
              {product.stock_quantity < 10 && (
                <div className="text-xs text-red-500">Low stock</div>
              )}
            </div>
          </div>

          {/* Category & Type */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              <span>{product.category_type}</span>
            </div>
            <div className="flex items-center">
              <Package className="w-3 h-3 mr-1" />
              <span>{product.product_type}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
            <div className="bg-gray-50 p-1.5 rounded">
              <div className="font-semibold text-gray-900">{product.orders_count}</div>
              <div className="text-gray-600">Orders</div>
            </div>
            <div className="bg-gray-50 p-1.5 rounded">
              <div className="font-semibold text-gray-900">{product.rating.toFixed(1)}</div>
              <div className="text-gray-600">Rating</div>
            </div>
            <div className="bg-gray-50 p-1.5 rounded">
              <div className="font-semibold text-gray-900">{product.reviews_count}</div>
              <div className="text-gray-600">Reviews</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleProductAction('view', product.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => handleProductAction('edit', product.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <div className="relative group">
              <button className="p-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                {product.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleProductAction('approve', product.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleProductAction('reject', product.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Product
                    </button>
                  </>
                )}
                {product.status === 'active' && (
                  <button
                    onClick={() => handleProductAction('suspend', product.id)}
                    className="flex items-center w-full px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Suspend Product
                  </button>
                )}
                {product.status !== 'active' && product.status !== 'pending' && (
                  <button
                    onClick={() => handleProductAction('approve', product.id)}
                    className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Product
                  </button>
                )}
                <button
                  onClick={() => handleProductAction('feature', product.id)}
                  className="flex items-center w-full px-3 py-2 text-sm text-[#D4AF37] hover:bg-yellow-50"
                >
                  <Star className="w-4 h-4 mr-2" />
                  {product.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleProductAction('delete', product.id)}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </button>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className="mt-3 text-xs text-gray-500">
            Created: {formatDate(product.created_at)}
          </div>
        </div>
      </div>
    );
  };

  // Render product row (List view)
  const ProductRow = ({ product }: { product: Product }) => {
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selectedProducts.includes(product.id)}
            onChange={() => toggleProductSelection(product.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=100&q=80'}
                alt={product.name}
                className="h-10 w-10 rounded object-cover"
              />
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-500">{product.short_description}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{product.seller_business}</div>
          <div className="text-xs text-gray-500">{product.seller_cr_number || 'No CR'}</div>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={product.status} />
          <div className="mt-1">
            {product.is_featured && (
              <span className="text-xs bg-[#D4AF37] text-white px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {product.is_advertised && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-1">
                Ad
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{product.category?.display_name || product.category_type}</div>
          <div className="text-xs text-gray-500">{product.product_type}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
          <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-1">({product.reviews_count})</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{product.orders_count}</div>
          <div className="text-xs text-gray-500">orders</div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatDate(product.created_at)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleProductAction('view', product.id)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleProductAction('edit', product.id)}
              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <div className="relative group">
              <button className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                {product.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleProductAction('approve', product.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleProductAction('reject', product.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleProductAction('delete', product.id)}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">Manage and monitor all products in your marketplace</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Real-time updates</span>
                </div>
                <span>•</span>
                <span>Last updated: Just now</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-600">{stats.suspended}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-orange-600">{stats.low_stock}</div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.advertised}</div>
            <div className="text-sm text-gray-600">Advertised</div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, seller, CR number, or brand..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {Object.values(filters).some(v => 
                v !== 'all' && 
                v !== 0 && 
                v !== 10000 && 
                v !== 1000 &&
                !(typeof v === 'object' && v.start === '' && v.end === '')
              ) && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>Bulk Actions ({selectedProducts.length})</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showBulkActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        handleBulkAction('approve');
                        setShowBulkActions(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkAction('reject');
                        setShowBulkActions(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkAction('feature');
                        setShowBulkActions(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-[#D4AF37] hover:bg-yellow-50"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Feature Selected
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        handleBulkAction('delete');
                        setShowBulkActions(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Category Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Type</label>
                <select
                  value={filters.category_type}
                  onChange={(e) => setFilters({ ...filters, category_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="customized">Customized</option>
                  <option value="ready_made">Ready Made</option>
                </select>
              </div>

              {/* Usage Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usage Type</label>
                <select
                  value={filters.usage_type}
                  onChange={(e) => setFilters({ ...filters, usage_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Usage</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* Seller Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller Type</label>
                <select
                  value={filters.seller_type}
                  onChange={(e) => setFilters({ ...filters, seller_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sellers</option>
                  <option value="with_cr">With CR Number</option>
                  <option value="without_cr">Without CR Number</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (SAR)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: Number(e.target.value) })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: Number(e.target.value) })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Stock Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_stock}
                    onChange={(e) => setFilters({ ...filters, min_stock: Number(e.target.value) })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_stock}
                    onChange={(e) => setFilters({ ...filters, max_stock: Number(e.target.value) })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.date_range.start}
                    onChange={(e) => setFilters({ ...filters, date_range: { ...filters.date_range, start: e.target.value } })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={filters.date_range.end}
                    onChange={(e) => setFilters({ ...filters, date_range: { ...filters.date_range, end: e.target.value } })}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <input
                  type="text"
                  placeholder="e.g., sofa, bed, table"
                  value={filters.product_type}
                  onChange={(e) => setFilters({ ...filters, product_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} products match your filters
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          // Loading State
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || Object.values(filters).some(v => v !== 'all' && v !== 0 && v !== 10000 && v !== 1000)
                ? 'Try adjusting your search or filters'
                : 'No products in the database yet'
              }
            </p>
            {searchQuery || Object.values(filters).some(v => v !== 'all' && v !== 0 && v !== 10000 && v !== 1000) ? (
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                onClick={fetchProducts}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Products
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <>
            {/* Grid Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
                {selectedProducts.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedProducts.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length}
                  onChange={selectAllFiltered}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          // List View
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* List Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredProducts.length} products
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      • {selectedProducts.length} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length}
                    onChange={selectAllFiltered}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              </div>
            </div>

            {/* List Content */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price & Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination (Optional) */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 1 to {filteredProducts.length} of {products.length} results
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;