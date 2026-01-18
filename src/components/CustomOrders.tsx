import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Send, 
  Check, 
  X, 
  Package, 
  Truck, 
  Clock, 
  AlertCircle,
  FileText,
  Download,
  Plus,
  MessageSquare,
  Camera,
  Ruler,
  Palette,
  HardHat,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Warehouse,
  Shield
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CustomOrder {
  id: string;
  request_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_location: string;
  furniture_type: string;
  material: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  color_preference: string;
  finish_type: string;
  estimated_budget: number;
  quoted_price: number | null;
  production_days: number | null;
  delivery_days: number | null;
  status: OrderStatus;
  special_requirements: string;
  reference_images: string[];
  created_at: string;
  updated_at: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  urgency_level: 'standard' | 'urgent' | 'very_urgent';
}

type OrderStatus = 
  | 'new' 
  | 'quotation_sent' 
  | 'accepted' 
  | 'in_production' 
  | 'completed' 
  | 'rejected';

interface FilterOptions {
  status: OrderStatus | 'all';
  furniture_type: string;
  material: string;
  date_range: {
    start: string;
    end: string;
  };
}

interface QuotationData {
  price: number;
  production_days: number;
  delivery_days: number;
  notes: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CUSTOM_ORDERS: CustomOrder[] = [
  {
    id: '1',
    request_id: 'CUST-001',
    customer_name: 'Ahmed Al-Mansoor',
    customer_email: 'ahmed@example.com',
    customer_phone: '+966 55 123 4567',
    customer_location: 'Riyadh, Al Olaya',
    furniture_type: 'Sofa',
    material: 'Italian Leather',
    dimensions: { length: 220, width: 95, height: 85, unit: 'cm' },
    color_preference: 'Dark Brown',
    finish_type: 'Matte',
    estimated_budget: 8500,
    quoted_price: 9500,
    production_days: 21,
    delivery_days: 3,
    status: 'in_production',
    special_requirements: 'Extra storage underneath, removable covers',
    reference_images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc'],
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
    notes: 'Customer requested premium stitching',
    priority: 'high',
    urgency_level: 'urgent'
  },
  {
    id: '2',
    request_id: 'CUST-002',
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah@example.com',
    customer_phone: '+966 50 987 6543',
    customer_location: 'Jeddah, Al Hamra',
    furniture_type: 'Dining Table',
    material: 'Solid Oak',
    dimensions: { length: 180, width: 90, height: 75, unit: 'cm' },
    color_preference: 'Natural Wood',
    finish_type: 'Glossy',
    estimated_budget: 4500,
    quoted_price: null,
    production_days: null,
    delivery_days: null,
    status: 'new',
    special_requirements: 'Extendable to seat 8 people',
    reference_images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c'],
    created_at: '2024-01-16',
    updated_at: '2024-01-16',
    notes: '',
    priority: 'medium',
    urgency_level: 'standard'
  },
  {
    id: '3',
    request_id: 'CUST-003',
    customer_name: 'Mohammed Khan',
    customer_email: 'mohammed@example.com',
    customer_phone: '+966 56 111 2233',
    customer_location: 'Dammam, Al Khobar',
    furniture_type: 'Wardrobe',
    material: 'Walnut Wood',
    dimensions: { length: 200, width: 60, height: 220, unit: 'cm' },
    color_preference: 'Dark Walnut',
    finish_type: 'Satin',
    estimated_budget: 12000,
    quoted_price: 13500,
    production_days: 30,
    delivery_days: 5,
    status: 'quotation_sent',
    special_requirements: 'Mirrored doors, LED lighting inside',
    reference_images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7'],
    created_at: '2024-01-14',
    updated_at: '2024-01-18',
    notes: 'Waiting for customer confirmation',
    priority: 'high',
    urgency_level: 'urgent'
  },
  {
    id: '4',
    request_id: 'CUST-004',
    customer_name: 'Fatima Al-Sayed',
    customer_email: 'fatima@example.com',
    customer_phone: '+966 54 555 6677',
    customer_location: 'Riyadh, Diplomatic Quarter',
    furniture_type: 'Bed Frame',
    material: 'Mahogany',
    dimensions: { length: 200, width: 180, height: 45, unit: 'cm' },
    color_preference: 'Cherry Red',
    finish_type: 'Matte',
    estimated_budget: 6500,
    quoted_price: 7200,
    production_days: 25,
    delivery_days: 4,
    status: 'accepted',
    special_requirements: 'Hydraulic storage, headboard with USB ports',
    reference_images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'],
    created_at: '2024-01-10',
    updated_at: '2024-01-17',
    notes: 'Deposit received',
    priority: 'medium',
    urgency_level: 'standard'
  },
  {
    id: '5',
    request_id: 'CUST-005',
    customer_name: 'Robert Chen',
    customer_email: 'robert@example.com',
    customer_phone: '+966 53 888 9999',
    customer_location: 'Jeddah, Al Rawdah',
    furniture_type: 'Office Desk',
    material: 'Metal & Glass',
    dimensions: { length: 160, width: 80, height: 75, unit: 'cm' },
    color_preference: 'Black & Clear',
    finish_type: 'Glossy',
    estimated_budget: 3200,
    quoted_price: 2800,
    production_days: 14,
    delivery_days: 2,
    status: 'completed',
    special_requirements: 'Cable management system, height adjustable',
    reference_images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd'],
    created_at: '2024-01-05',
    updated_at: '2024-01-19',
    notes: 'Delivered successfully',
    priority: 'low',
    urgency_level: 'standard'
  },
  {
    id: '6',
    request_id: 'CUST-006',
    customer_name: 'Layla Hassan',
    customer_email: 'layla@example.com',
    customer_phone: '+966 57 444 5555',
    customer_location: 'Medina, Al Qiblatain',
    furniture_type: 'Bookshelf',
    material: 'Pine Wood',
    dimensions: { length: 120, width: 30, height: 200, unit: 'cm' },
    color_preference: 'White',
    finish_type: 'Matte',
    estimated_budget: 1800,
    quoted_price: 2200,
    production_days: 18,
    delivery_days: 3,
    status: 'rejected',
    special_requirements: 'Adjustable shelves, ladder included',
    reference_images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7'],
    created_at: '2024-01-12',
    updated_at: '2024-01-16',
    notes: 'Customer found cheaper alternative',
    priority: 'low',
    urgency_level: 'standard'
  },
  {
    id: '7',
    request_id: 'CUST-007',
    customer_name: 'Abdullah Omar',
    customer_email: 'abdullah@example.com',
    customer_phone: '+966 58 333 2222',
    customer_location: 'Riyadh, Al Malaz',
    furniture_type: 'TV Unit',
    material: 'MDF with Veneer',
    dimensions: { length: 180, width: 45, height: 60, unit: 'cm' },
    color_preference: 'Grey Oak',
    finish_type: 'Matte',
    estimated_budget: 2900,
    quoted_price: null,
    production_days: null,
    delivery_days: null,
    status: 'new',
    special_requirements: 'Built-in soundbar compartment',
    reference_images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc'],
    created_at: '2024-01-18',
    updated_at: '2024-01-18',
    notes: '',
    priority: 'medium',
    urgency_level: 'urgent'
  },
  {
    id: '8',
    request_id: 'CUST-008',
    customer_name: 'Elena Rodriguez',
    customer_email: 'elena@example.com',
    customer_phone: '+966 59 777 8888',
    customer_location: 'Jeddah, Al Salamah',
    furniture_type: 'Coffee Table',
    material: 'Marble & Brass',
    dimensions: { length: 120, width: 60, height: 45, unit: 'cm' },
    color_preference: 'Carrara Marble',
    finish_type: 'Polished',
    estimated_budget: 5500,
    quoted_price: 6200,
    production_days: 28,
    delivery_days: 4,
    status: 'quotation_sent',
    special_requirements: 'Custom brass legs, heat resistant',
    reference_images: ['https://images.unsplash.com/photo-1549488344-a018-e5c1-69de8c625052'],
    created_at: '2024-01-13',
    updated_at: '2024-01-17',
    notes: 'Premium materials requested',
    priority: 'high',
    urgency_level: 'standard'
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CustomOrders: React.FC = () => {
  // State Management
  const [orders, setOrders] = useState<CustomOrder[]>(MOCK_CUSTOM_ORDERS);
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>(MOCK_CUSTOM_ORDERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [quotationData, setQuotationData] = useState<QuotationData>({
    price: 0,
    production_days: 14,
    delivery_days: 3,
    notes: ''
  });

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    furniture_type: 'all',
    material: 'all',
    date_range: {
      start: '',
      end: ''
    }
  });

  // Constants
  const ITEMS_PER_PAGE = 6;
  const FURNITURE_TYPES = ['all', 'Sofa', 'Dining Table', 'Wardrobe', 'Bed Frame', 'Office Desk', 'Bookshelf', 'TV Unit', 'Coffee Table', 'Cabinet', 'Shelf'];
  const MATERIALS = ['all', 'Italian Leather', 'Solid Oak', 'Walnut Wood', 'Mahogany', 'Metal & Glass', 'Pine Wood', 'MDF with Veneer', 'Marble & Brass', 'Fabric', 'Velvet'];

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = orders.length;
    const newRequests = orders.filter(o => o.status === 'new').length;
    const inQuotation = orders.filter(o => o.status === 'quotation_sent').length;
    const inProduction = orders.filter(o => o.status === 'in_production').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const accepted = orders.filter(o => o.status === 'accepted').length;
    const rejected = orders.filter(o => o.status === 'rejected').length;

    const totalValue = orders.reduce((sum, order) => 
      sum + (order.quoted_price || order.estimated_budget), 0);

    return {
      total,
      newRequests,
      inQuotation,
      inProduction,
      completed,
      accepted,
      rejected,
      totalValue
    };
  }, [orders]);

  // Apply filters
  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery) {
      result = result.filter(order =>
        order.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(order => order.status === filters.status);
    }

    // Furniture type filter
    if (filters.furniture_type !== 'all') {
      result = result.filter(order => order.furniture_type === filters.furniture_type);
    }

    // Material filter
    if (filters.material !== 'all') {
      result = result.filter(order => order.material === filters.material);
    }

    // Date range filter
    if (filters.date_range.start && filters.date_range.end) {
      result = result.filter(order => {
        const orderDate = new Date(order.created_at);
        const startDate = new Date(filters.date_range.start);
        const endDate = new Date(filters.date_range.end);
        endDate.setHours(23, 59, 59, 999);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, searchQuery, filters]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  // Status badge colors
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'quotation_sent': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'in_production': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'quotation_sent': return <Send className="w-4 h-4" />;
      case 'accepted': return <Check className="w-4 h-4" />;
      case 'in_production': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format dimensions
  const formatDimensions = (dimensions: CustomOrder['dimensions']) => {
    return `${dimensions.length}×${dimensions.width}×${dimensions.height} ${dimensions.unit}`;
  };

  // Handlers
  const handleViewDetails = (order: CustomOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleSendQuotation = (order: CustomOrder) => {
    setSelectedOrder(order);
    setQuotationData({
      price: order.estimated_budget || 0,
      production_days: 14,
      delivery_days: 3,
      notes: ''
    });
    setShowQuotationModal(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleSubmitQuotation = () => {
    if (!selectedOrder) return;

    const updatedOrder: CustomOrder = {
      ...selectedOrder,
      quoted_price: quotationData.price,
      production_days: quotationData.production_days,
      delivery_days: quotationData.delivery_days,
      status: 'quotation_sent',
      updated_at: new Date().toISOString().split('T')[0],
      notes: quotationData.notes
    };

    setOrders(prev => prev.map(order => 
      order.id === selectedOrder.id ? updatedOrder : order
    ));

    setSelectedOrder(updatedOrder);
    setShowQuotationModal(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      furniture_type: 'all',
      material: 'all',
      date_range: { start: '', end: '' }
    });
  };

  const handleExportData = () => {
    // In real app, this would generate CSV/Excel
    alert('Export functionality would download CSV file');
  };

  // Load data (simulate API call)
  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // In real app, fetch from Supabase
      // const { data } = await supabase.from('custom_orders').select('*').eq('seller_id', sellerId);
    }, 500);
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Orders</h1>
            <p className="text-gray-600 mt-1">Manage custom furniture requests and quotations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Requests */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
            <p className="text-sm font-medium text-gray-700">Custom Requests</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(summaryStats.totalValue)} total value
            </p>
          </div>

          {/* New Requests */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">New</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.newRequests}</p>
            <p className="text-sm font-medium text-gray-700">New Requests</p>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting quotation
            </p>
          </div>

          {/* In Quotation */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Quotation</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.inQuotation}</p>
            <p className="text-sm font-medium text-gray-700">In Quotation</p>
            <p className="text-xs text-gray-500 mt-1">
              Waiting for acceptance
            </p>
          </div>

          {/* In Production */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Production</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.inProduction}</p>
            <p className="text-sm font-medium text-gray-700">In Production</p>
            <p className="text-xs text-gray-500 mt-1">
              Being manufactured
            </p>
          </div>

          {/* Completed */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.completed}</p>
            <p className="text-sm font-medium text-gray-700">Completed Orders</p>
            <p className="text-xs text-gray-500 mt-1">
              Delivered to customers
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Requests
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID or customer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="quotation_sent">Quotation Sent</option>
                <option value="accepted">Accepted</option>
                <option value="in_production">In Production</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Furniture Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Furniture Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.furniture_type}
                onChange={(e) => setFilters(prev => ({ ...prev, furniture_type: e.target.value }))}
              >
                {FURNITURE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.material}
                onChange={(e) => setFilters(prev => ({ ...prev, material: e.target.value }))}
              >
                {MATERIALS.map(material => (
                  <option key={material} value={material}>
                    {material === 'all' ? 'All Materials' : material}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.date_range.start}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    date_range: { ...prev.date_range, start: e.target.value }
                  }))}
                />
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.date_range.end}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    date_range: { ...prev.date_range, end: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} custom orders
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              New: {summaryStats.newRequests}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
              Quotation: {summaryStats.inQuotation}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
              Production: {summaryStats.inProduction}
            </span>
          </div>
        </div>

        {/* Custom Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Furniture Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget / Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.request_id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.furniture_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customer_location}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{order.furniture_type}</div>
                        <div className="text-xs text-gray-500">{order.material}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Ruler className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDimensions(order.dimensions)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {order.quoted_price 
                            ? formatCurrency(order.quoted_price)
                            : formatCurrency(order.estimated_budget)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.quoted_price ? 'Quoted' : 'Estimated'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        
                        {order.status === 'new' && (
                          <button
                            onClick={() => handleSendQuotation(order)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Quote
                          </button>
                        )}
                        
                        {order.status === 'quotation_sent' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'accepted')}
                              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'rejected')}
                              className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'in_production')}
                            className="inline-flex items-center px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Start Prod
                          </button>
                        )}
                        
                        {order.status === 'in_production' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No custom orders found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredOrders.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Custom Order Details</h2>
                  <p className="text-gray-600">{selectedOrder.request_id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Customer & Requirements */}
                <div className="space-y-6">
                  {/* Customer Details */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Customer Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedOrder.customer_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <p className="text-gray-900">{selectedOrder.customer_phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{selectedOrder.customer_email}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedOrder.customer_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Ruler className="w-5 h-5 mr-2" />
                      Furniture Requirements
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Type</label>
                          <p className="text-gray-900">{selectedOrder.furniture_type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Material</label>
                          <p className="text-gray-900">{selectedOrder.material}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Dimensions</label>
                        <p className="text-gray-900">{formatDimensions(selectedOrder.dimensions)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Color</label>
                          <p className="text-gray-900">{selectedOrder.color_preference}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Finish</label>
                          <p className="text-gray-900">{selectedOrder.finish_type}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Special Requirements</label>
                        <p className="text-gray-900 mt-1">{selectedOrder.special_requirements || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Request Created</span>
                        <span className="text-sm font-medium">{selectedOrder.created_at}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <span className="text-sm font-medium">{selectedOrder.updated_at}</span>
                      </div>
                      {selectedOrder.production_days && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Production Time</span>
                          <span className="text-sm font-medium">{selectedOrder.production_days} days</span>
                        </div>
                      )}
                      {selectedOrder.delivery_days && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Delivery Time</span>
                          <span className="text-sm font-medium">{selectedOrder.delivery_days} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Quotation & Actions */}
                <div className="space-y-6">
                  {/* Quotation Details */}
                  <div className="bg-blue-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Quotation Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estimated Budget</label>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedOrder.estimated_budget)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quoted Price</label>
                          <p className={`text-lg font-bold ${
                            selectedOrder.quoted_price 
                              ? 'text-gray-900' 
                              : 'text-yellow-600'
                          }`}>
                            {selectedOrder.quoted_price 
                              ? formatCurrency(selectedOrder.quoted_price)
                              : 'Not quoted yet'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedOrder.quoted_price && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Production Days</label>
                              <p className="text-gray-900">{selectedOrder.production_days} days</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Delivery Days</label>
                              <p className="text-gray-900">{selectedOrder.delivery_days} days</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Notes</label>
                            <p className="text-gray-900 mt-1">{selectedOrder.notes || 'No notes'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                    <div className="mb-6">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-2 capitalize">{selectedOrder.status.replace('_', ' ')}</span>
                      </div>
                      <div className="mt-3 flex items-center">
                        <span className="text-sm text-gray-600 mr-2">Priority:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                          {selectedOrder.priority}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {selectedOrder.status === 'new' && (
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            handleSendQuotation(selectedOrder);
                          }}
                          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Send Quotation
                        </button>
                      )}
                      
                      {selectedOrder.status === 'quotation_sent' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              handleUpdateStatus(selectedOrder.id, 'accepted');
                              setShowDetailsModal(false);
                            }}
                            className="bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateStatus(selectedOrder.id, 'rejected');
                              setShowDetailsModal(false);
                            }}
                            className="bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-medium"
                          >
                            Reject Order
                          </button>
                        </div>
                      )}
                      
                      {selectedOrder.status === 'accepted' && (
                        <button
                          onClick={() => {
                            handleUpdateStatus(selectedOrder.id, 'in_production');
                            setShowDetailsModal(false);
                          }}
                          className="w-full bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-medium"
                        >
                          Mark as In Production
                        </button>
                      )}
                      
                      {selectedOrder.status === 'in_production' && (
                        <button
                          onClick={() => {
                            handleUpdateStatus(selectedOrder.id, 'completed');
                            setShowDetailsModal(false);
                          }}
                          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium"
                        >
                          Mark as Completed
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Reference Images */}
                  {selectedOrder.reference_images.length > 0 && (
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Camera className="w-5 h-5 mr-2" />
                        Reference Images
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedOrder.reference_images.map((img, index) => (
                          <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                            <img
                              src={img}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuotationModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Send Quotation</h2>
                  <p className="text-gray-600 text-sm">
                    {selectedOrder.request_id} • {selectedOrder.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuotationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quotation Price (SAR)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={quotationData.price}
                      onChange={(e) => setQuotationData(prev => ({ 
                        ...prev, 
                        price: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Customer's budget: {formatCurrency(selectedOrder.estimated_budget)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Production Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={quotationData.production_days}
                      onChange={(e) => setQuotationData(prev => ({ 
                        ...prev, 
                        production_days: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={quotationData.delivery_days}
                      onChange={(e) => setQuotationData(prev => ({ 
                        ...prev, 
                        delivery_days: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about materials, production details, or special conditions..."
                    value={quotationData.notes}
                    onChange={(e) => setQuotationData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quotation Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-semibold">{formatCurrency(quotationData.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Production Time:</span>
                      <span>{quotationData.production_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Time:</span>
                      <span>{quotationData.delivery_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Lead Time:</span>
                      <span className="font-medium">
                        {quotationData.production_days + quotationData.delivery_days} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowQuotationModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitQuotation}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Send Quotation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOrders;