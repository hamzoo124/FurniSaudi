import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  Star,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Clock,
  FileText,
  PieChart,
  BarChart as BarChartIcon,
  LineChart,
  Database,
  Target,
  Activity,
  Eye,
  Printer,
  Share2,
  MoreVertical
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnalyticsSummary {
  total_sales: number;
  total_orders: number;
  avg_order_value: number;
  conversion_rate: number;
  repeat_customers: number;
  previous_period_sales: number;
  previous_period_orders: number;
}

interface SalesDataPoint {
  date: string;
  sales_amount: number;
  orders_count: number;
  avg_order_value: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
  return_rate: number;
  rating: number;
  inventory_level: 'healthy' | 'low' | 'critical';
}

interface InventoryHealth {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  fast_moving: number;
  slow_moving: number;
  inventory_value: number;
}

interface OrderMetrics {
  completed: number;
  cancelled: number;
  returned: number;
  pending: number;
  processing: number;
  delivered: number;
}

interface FilterOptions {
  date_range: 'today' | '7d' | '30d' | '90d' | 'custom';
  product_type: 'all' | 'ready_made' | 'custom';
  region: string;
  custom_start_date?: string;
  custom_end_date?: string;
}

interface KpiCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  description: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock analytics data
const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  total_sales: 154850,
  total_orders: 342,
  avg_order_value: 452,
  conversion_rate: 3.8,
  repeat_customers: 45,
  previous_period_sales: 128500,
  previous_period_orders: 289
};

// Mock sales data (30 days)
const generateSalesData = (): SalesDataPoint[] => {
  const data: SalesDataPoint[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate realistic sales patterns (weekends higher)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseSales = isWeekend ? 6000 : 4000;
    const variance = Math.random() * 2000;
    const salesAmount = Math.floor(baseSales + variance);
    const ordersCount = Math.floor(salesAmount / (400 + Math.random() * 100));
    
    data.push({
      date: date.toISOString().split('T')[0],
      sales_amount: salesAmount,
      orders_count: ordersCount,
      avg_order_value: Math.floor(salesAmount / ordersCount)
    });
  }
  
  return data;
};

const MOCK_SALES_DATA = generateSalesData();

// Mock top products
const MOCK_TOP_PRODUCTS: TopProduct[] = [
  {
    id: '1',
    name: 'Executive Office Chair',
    category: 'Office Furniture',
    units_sold: 87,
    revenue: 43500,
    return_rate: 0.8,
    rating: 4.8,
    inventory_level: 'healthy'
  },
  {
    id: '2',
    name: 'Luxury Leather Sofa',
    category: 'Living Room',
    units_sold: 65,
    revenue: 81250,
    return_rate: 1.2,
    rating: 4.9,
    inventory_level: 'low'
  },
  {
    id: '3',
    name: 'Minimalist Dining Table',
    category: 'Dining Room',
    units_sold: 52,
    revenue: 36400,
    return_rate: 0.5,
    rating: 4.7,
    inventory_level: 'healthy'
  },
  {
    id: '4',
    name: 'King Size Bed Frame',
    category: 'Bedroom',
    units_sold: 48,
    revenue: 45600,
    return_rate: 1.5,
    rating: 4.6,
    inventory_level: 'critical'
  },
  {
    id: '5',
    name: 'Modern Bookshelf',
    category: 'Storage',
    units_sold: 43,
    revenue: 27950,
    return_rate: 0.3,
    rating: 4.9,
    inventory_level: 'healthy'
  },
  {
    id: '6',
    name: 'Gaming Desk Pro',
    category: 'Office Furniture',
    units_sold: 38,
    revenue: 28500,
    return_rate: 1.1,
    rating: 4.5,
    inventory_level: 'healthy'
  },
  {
    id: '7',
    name: 'Coffee Table Set',
    category: 'Living Room',
    units_sold: 35,
    revenue: 26250,
    return_rate: 2.1,
    rating: 4.4,
    inventory_level: 'low'
  },
  {
    id: '8',
    name: 'Executive Desk',
    category: 'Office Furniture',
    units_sold: 32,
    revenue: 35200,
    return_rate: 0.9,
    rating: 4.7,
    inventory_level: 'healthy'
  },
  {
    id: '9',
    name: 'Dining Chair Set (6)',
    category: 'Dining Room',
    units_sold: 29,
    revenue: 26100,
    return_rate: 1.8,
    rating: 4.3,
    inventory_level: 'healthy'
  },
  {
    id: '10',
    name: 'Wardrobe Cabinet',
    category: 'Storage',
    units_sold: 26,
    revenue: 31200,
    return_rate: 0.7,
    rating: 4.6,
    inventory_level: 'critical'
  }
];

// Mock inventory health
const MOCK_INVENTORY_HEALTH: InventoryHealth = {
  total_products: 156,
  low_stock: 12,
  out_of_stock: 3,
  fast_moving: 28,
  slow_moving: 41,
  inventory_value: 485000
};

// Mock order metrics
const MOCK_ORDER_METRICS: OrderMetrics = {
  completed: 298,
  cancelled: 18,
  returned: 9,
  pending: 7,
  processing: 6,
  delivered: 314
};

// Regions for filtering
const REGIONS = ['All Regions', 'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'];

// ============================================================================
// CHART COMPONENT (Simple implementation without external library)
// ============================================================================

const SalesChart: React.FC<{ data: SalesDataPoint[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  // Find min/max values
  const maxSales = Math.max(...data.map(d => d.sales_amount));
  const maxOrders = Math.max(...data.map(d => d.orders_count));
  
  // Scale functions
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
  const yScaleSales = (value: number) => chartHeight - padding.bottom - (value / maxSales) * innerHeight;
  const yScaleOrders = (value: number) => chartHeight - padding.bottom - (value / maxOrders) * innerHeight;
  
  // Generate sales line points
  const salesLinePoints = data.map((point, i) => `${xScale(i)},${yScaleSales(point.sales_amount)}`).join(' ');
  
  // Generate orders line points
  const ordersLinePoints = data.map((point, i) => `${xScale(i)},${yScaleOrders(point.orders_count * 50)}`).join(' ');
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
          <p className="text-sm text-gray-600">Daily sales and order trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Sales (SAR)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Orders Count</span>
          </div>
        </div>
      </div>
      
      <svg width={chartWidth} height={chartHeight} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={padding.top + ratio * innerHeight}
              x2={chartWidth - padding.right}
              y2={padding.top + ratio * innerHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={padding.top + ratio * innerHeight}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(maxSales * (1 - ratio)).toLocaleString()}
            </text>
          </g>
        ))}
        
        {/* X-axis labels */}
        {data.filter((_, i) => i % 5 === 0).map((point, i) => {
          const index = i * 5;
          return (
            <text
              key={index}
              x={xScale(index)}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {formatDate(point.date)}
            </text>
          );
        })}
        
        {/* Sales line */}
        <polyline
          points={salesLinePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Orders line */}
        <polyline
          points={ordersLinePoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4,4"
        />
        
        {/* Data points */}
        {data.map((point, i) => (
          <g key={i}>
            {/* Sales points */}
            <circle
              cx={xScale(i)}
              cy={yScaleSales(point.sales_amount)}
              r="4"
              fill="#3b82f6"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            
            {/* Orders points */}
            <circle
              cx={xScale(i)}
              cy={yScaleOrders(point.orders_count * 50)}
              r="4"
              fill="#10b981"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            
            {/* Hover tooltip */}
            {hoveredIndex === i && (
              <g>
                <rect
                  x={xScale(i) - 75}
                  y={yScaleSales(point.sales_amount) - 80}
                  width={150}
                  height={70}
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={xScale(i)}
                  y={yScaleSales(point.sales_amount) - 60}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  fontWeight="600"
                >
                  {formatDate(point.date)}
                </text>
                <text
                  x={xScale(i)}
                  y={yScaleSales(point.sales_amount) - 45}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#3b82f6"
                >
                  Sales: {point.sales_amount.toLocaleString()} SAR
                </text>
                <text
                  x={xScale(i)}
                  y={yScaleSales(point.sales_amount) - 30}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#10b981"
                >
                  Orders: {point.orders_count}
                </text>
              </g>
            )}
          </g>
        ))}
        
        {/* Axis labels */}
        <text
          x={-chartHeight / 2}
          y={15}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
        >
          Sales Amount (SAR)
        </text>
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
        >
          Date
        </text>
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReportsAnalytics: React.FC = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    date_range: '30d',
    product_type: 'all',
    region: 'All Regions'
  });
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'products' | 'inventory'>('sales');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TopProduct; direction: 'asc' | 'desc' }>({
    key: 'revenue',
    direction: 'desc'
  });

  // Memoized calculations
  const summaryData = useMemo(() => MOCK_ANALYTICS_SUMMARY, []);
  const salesData = useMemo(() => MOCK_SALES_DATA, []);
  const topProducts = useMemo(() => MOCK_TOP_PRODUCTS, []);
  const inventoryHealth = useMemo(() => MOCK_INVENTORY_HEALTH, []);
  const orderMetrics = useMemo(() => MOCK_ORDER_METRICS, []);

  // Format currency for Saudi Arabia
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate metrics based on filters
  const calculatedMetrics = useMemo(() => {
    const conversionRate = orderMetrics.completed / (orderMetrics.completed + orderMetrics.cancelled) * 100;
    const cancellationRate = (orderMetrics.cancelled / (orderMetrics.completed + orderMetrics.cancelled)) * 100;
    const returnRate = (orderMetrics.returned / orderMetrics.delivered) * 100;

    return {
      conversionRate: conversionRate.toFixed(1),
      cancellationRate: cancellationRate.toFixed(1),
      returnRate: returnRate.toFixed(1)
    };
  }, [orderMetrics]);

  // KPI Cards Data
  const kpiCards: KpiCard[] = useMemo(() => [
    {
      title: 'Total Sales',
      value: formatCurrency(summaryData.total_sales),
      change: ((summaryData.total_sales - summaryData.previous_period_sales) / summaryData.previous_period_sales) * 100,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      description: 'Gross revenue from all orders'
    },
    {
      title: 'Total Orders',
      value: summaryData.total_orders,
      change: ((summaryData.total_orders - summaryData.previous_period_orders) / summaryData.previous_period_orders) * 100,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Number of completed orders'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(summaryData.avg_order_value),
      change: 8.2,
      icon: <BarChart2 className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
      description: 'Average revenue per order'
    },
    {
      title: 'Conversion Rate',
      value: `${summaryData.conversion_rate}%`,
      change: 0.4,
      icon: <Target className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600',
      description: 'Visitor to customer ratio'
    },
    {
      title: 'Repeat Customers',
      value: `${summaryData.repeat_customers}%`,
      change: 2.1,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Percentage of returning customers'
    }
  ], [summaryData]);

  // Sort top products
  const sortedTopProducts = useMemo(() => {
    const sorted = [...topProducts];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [topProducts, sortConfig]);

  const handleSort = (key: keyof TopProduct) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters (simulate API call)
  const applyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Filters applied:', filters);
    }, 500);
  };

  // Export reports
  const handleExport = (type: 'sales' | 'orders' | 'inventory' | 'finance') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully`);
    }, 1000);
  };

  // Render trend indicator
  const renderTrendIndicator = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
        <span className="text-sm font-medium">
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    );
  };

  // Render inventory status indicator
  const renderInventoryStatus = (level: 'healthy' | 'low' | 'critical') => {
    const config = {
      healthy: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      low: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> },
      critical: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> }
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config[level].color}`}>
        {config[level].icon}
        <span className="ml-1 capitalize">{level}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen  px-3">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence for your furniture store</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={() => applyFilters()}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters({
                  date_range: '30d',
                  product_type: 'all',
                  region: 'All Regions'
                })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date Range
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.date_range}
                onChange={(e) => handleFilterChange('date_range', e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline w-4 h-4 mr-1" />
                Product Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.product_type}
                onChange={(e) => handleFilterChange('product_type', e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="ready_made">Ready-made Furniture</option>
                <option value="custom">Custom Furniture</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="inline w-4 h-4 mr-1" />
                Region
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-yellow-400 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {filters.date_range === 'custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.custom_start_date || ''}
                  onChange={(e) => handleFilterChange('custom_start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.custom_end_date || ''}
                  onChange={(e) => handleFilterChange('custom_end_date', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
              {renderTrendIndicator(card.change)}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm font-medium text-gray-700 mb-1">{card.title}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Sales Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <SalesChart data={salesData} />
          </div>
        </div>

        {/* Order Metrics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Metrics</h3>
              <p className="text-sm text-gray-600">Order performance insights</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Activity className="w-5 h-5 text-gray-700" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Completed Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{orderMetrics.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Cancelled Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{orderMetrics.cancelled}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Returned Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{orderMetrics.returned}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Conversion Rate</span>
              </div>
              <span className="font-semibold text-green-600">{calculatedMetrics.conversionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Cancellation Rate</span>
              </div>
              <span className="font-semibold text-red-600">{calculatedMetrics.cancellationRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Return Rate</span>
              </div>
              <span className="font-semibold text-orange-600">{calculatedMetrics.returnRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="text-sm text-gray-600">Best performing products by revenue</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Award className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('units_sold')}
                  >
                    <div className="flex items-center">
                      Units Sold
                      {sortConfig.key === 'units_sold' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="w-4 h-4 ml-1" /> : 
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center">
                      Revenue
                      {sortConfig.key === 'revenue' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="w-4 h-4 ml-1" /> : 
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTopProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.units_sold}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{product.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({product.return_rate}% return)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderInventoryStatus(product.inventory_level)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Products →
            </button>
          </div>
        </div>

        {/* Inventory Health */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Health</h3>
              <p className="text-sm text-gray-600">Stock status and movement analysis</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Database className="w-5 h-5 text-gray-700" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Products</span>
                <span className="text-lg font-bold text-gray-900">{inventoryHealth.total_products}</span>
              </div>
              <p className="text-xs text-gray-500">Total value: {formatCurrency(inventoryHealth.inventory_value)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${
                inventoryHealth.low_stock > 5 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Low Stock</span>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <p className={`text-2xl font-bold ${
                  inventoryHealth.low_stock > 5 ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {inventoryHealth.low_stock}
                </p>
                <p className="text-xs text-gray-500 mt-1">Needs restocking</p>
              </div>

              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Out of Stock</span>
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{inventoryHealth.out_of_stock}</p>
                <p className="text-xs text-gray-500 mt-1">Urgent attention needed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Fast Moving</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{inventoryHealth.fast_moving}</p>
                <p className="text-xs text-gray-500 mt-1">High demand items</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Slow Moving</span>
                  <TrendingDown className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-600">{inventoryHealth.slow_moving}</p>
                <p className="text-xs text-gray-500 mt-1">Consider discounts</p>
              </div>
            </div>

            {/* Inventory Progress Bars */}
            <div className="space-y-3 pt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Stock Health</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(((inventoryHealth.total_products - inventoryHealth.low_stock - inventoryHealth.out_of_stock) / inventoryHealth.total_products) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${((inventoryHealth.total_products - inventoryHealth.low_stock - inventoryHealth.out_of_stock) / inventoryHealth.total_products) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Reports Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600">Download detailed business reports for analysis</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales Report */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                CSV, PDF
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Sales Report</h4>
            <p className="text-sm text-gray-600 mb-3">Detailed sales breakdown by product, region, and time</p>
            <button
              onClick={() => handleExport('sales')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Download className="inline w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          {/* Orders Report */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                CSV, Excel
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Orders Report</h4>
            <p className="text-sm text-gray-600 mb-3">Order fulfillment, cancellations, and returns analysis</p>
            <button
              onClick={() => handleExport('orders')}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Download className="inline w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          {/* Inventory Report */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                CSV, PDF
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Inventory Report</h4>
            <p className="text-sm text-gray-600 mb-3">Stock levels, turnover rates, and restocking recommendations</p>
            <button
              onClick={() => handleExport('inventory')}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              <Download className="inline w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          {/* Finance Summary */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChartIcon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                PDF, Excel
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Finance Summary</h4>
            <p className="text-sm text-gray-600 mb-3">Revenue, expenses, VAT, and profit margin analysis</p>
            <button
              onClick={() => handleExport('finance')}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <Download className="inline w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Advanced Export Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Advanced Export Options</h4>
              <p className="text-sm text-gray-600">Custom date ranges and data filters</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              <Share2 className="w-4 h-4" />
              <span>Schedule Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Query Examples */}
      <div className="mt-8 p-4 bg-gray-900 text-gray-300 rounded-lg text-sm font-mono">
        <div className="mb-2">// Supabase Queries for Real Implementation:</div>
        <div className="ml-4">
          <div className="text-blue-400">// Get sales data for last 30 days</div>
          <div>const {'{'} data {'}'} = await supabase</div>
          <div className="ml-4">.from('orders')</div>
          <div className="ml-4">.select('total_amount, created_at')</div>
          <div className="ml-4">.gte('created_at', `{'${'}thirtyDaysAgo{'}'}`)</div>
          <div className="ml-4">.eq('seller_id', sellerId);</div>
          
          <div className="mt-4 text-blue-400">// Get top products</div>
          <div>const {'{'} data: topProducts {'}'} = await supabase</div>
          <div className="ml-4">.from('order_items')</div>
          <div className="ml-4">.select('product_id, quantity, products(name)')</div>
          <div className="ml-4">.eq('seller_id', sellerId)</div>
          <div className="ml-4">.order('quantity', {'{'} ascending: false {'}'});</div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;