import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  Calendar,
  Clock,
  ChevronRight,
  BarChart3,
  Star,
  Award,
  Truck,
  Settings,
  ArrowUpRight,
  ShoppingCart,
  Layers,
  AlertCircle
} from 'lucide-react';

// TypeScript Interfaces
interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  revenueGrowth: number;
  orderGrowth: number;
  averageOrderValue: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: 'ready-made' | 'custom';
  totalAmount: number;
  status: 'pending' | 'in-production' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  itemsCount: number;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  unitsSold: number;
  revenue: number;
  stock: number;
  isBestSeller: boolean;
  rating: number;
}

interface Alert {
  id: string;
  type: 'low-stock' | 'pending-order' | 'custom-order' | 'dispute';
  message: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  targetPage: string;
}

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// Mock data generators
const generateSalesSummary = (): SalesSummary => ({
  totalRevenue: 154250,
  totalOrders: 127,
  pendingOrders: 15,
  completedOrders: 98,
  lowStockCount: 8,
  revenueGrowth: 12.5,
  orderGrowth: 8.3,
  averageOrderValue: 1214
});

const generateRecentOrders = (): Order[] => [
  {
    id: '1',
    orderNumber: 'ORD-7845',
    customerName: 'Ahmed Al-Mansoor',
    orderType: 'custom',
    totalAmount: 8450,
    status: 'in-production',
    createdAt: '2024-01-15',
    itemsCount: 3
  },
  {
    id: '2',
    orderNumber: 'ORD-7844',
    customerName: 'Sarah Johnson',
    orderType: 'ready-made',
    totalAmount: 2890,
    status: 'shipped',
    createdAt: '2024-01-14',
    itemsCount: 2
  },
  {
    id: '3',
    orderNumber: 'ORD-7843',
    customerName: 'Mohammed Khan',
    orderType: 'custom',
    totalAmount: 12500,
    status: 'pending',
    createdAt: '2024-01-14',
    itemsCount: 5
  },
  {
    id: '4',
    orderNumber: 'ORD-7842',
    customerName: 'Fatima Al-Sayed',
    orderType: 'ready-made',
    totalAmount: 4560,
    status: 'delivered',
    createdAt: '2024-01-13',
    itemsCount: 4
  },
  {
    id: '5',
    orderNumber: 'ORD-7841',
    customerName: 'Robert Chen',
    orderType: 'ready-made',
    totalAmount: 1890,
    status: 'delivered',
    createdAt: '2024-01-13',
    itemsCount: 1
  },
  {
    id: '6',
    orderNumber: 'ORD-7840',
    customerName: 'Khalid Abdullah',
    orderType: 'custom',
    totalAmount: 9200,
    status: 'shipped',
    createdAt: '2024-01-12',
    itemsCount: 2
  },
  {
    id: '7',
    orderNumber: 'ORD-7839',
    customerName: 'Layla Mohammed',
    orderType: 'ready-made',
    totalAmount: 3450,
    status: 'cancelled',
    createdAt: '2024-01-12',
    itemsCount: 3
  }
];

const generateTopProducts = (): Product[] => [
  {
    id: '1',
    name: 'Modern Executive Office Chair',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Office Chairs',
    unitsSold: 42,
    revenue: 126000,
    stock: 15,
    isBestSeller: true,
    rating: 4.8
  },
  {
    id: '2',
    name: 'Leather Reclining Sofa',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w-400&h=300&fit=crop',
    category: 'Sofas',
    unitsSold: 28,
    revenue: 196000,
    stock: 8,
    isBestSeller: false,
    rating: 4.6
  },
  {
    id: '3',
    name: 'Minimalist Coffee Table',
    imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    category: 'Tables',
    unitsSold: 35,
    revenue: 87500,
    stock: 3,
    isBestSeller: false,
    rating: 4.7
  },
  {
    id: '4',
    name: 'Ergonomic Study Desk',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Desks',
    unitsSold: 31,
    revenue: 108500,
    stock: 12,
    isBestSeller: false,
    rating: 4.5
  },
  {
    id: '5',
    name: 'Queen Size Storage Bed',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
    category: 'Beds',
    unitsSold: 23,
    revenue: 161000,
    stock: 6,
    isBestSeller: false,
    rating: 4.9
  }
];

const generateAlerts = (): Alert[] => [
  {
    id: '1',
    type: 'low-stock',
    message: '3 products are low in stock and need restocking',
    priority: 'high',
    createdAt: '2024-01-15T10:30:00Z',
    targetPage: '/seller/inventory'
  },
  {
    id: '2',
    type: 'pending-order',
    message: '5 orders are pending confirmation',
    priority: 'medium',
    createdAt: '2024-01-15T09:15:00Z',
    targetPage: '/seller/orders'
  },
  {
    id: '3',
    type: 'custom-order',
    message: '2 new custom furniture requests received',
    priority: 'medium',
    createdAt: '2024-01-15T08:45:00Z',
    targetPage: '/seller/custom-orders'
  },
  {
    id: '4',
    type: 'dispute',
    message: '1 order dispute requires attention',
    priority: 'high',
    createdAt: '2024-01-14T16:20:00Z',
    targetPage: '/seller/orders'
  }
];

const generateSalesData = (dateRange: string): SalesDataPoint[] => {
  const days = dateRange === '7d' ? 7 : 30;
  const data: SalesDataPoint[] = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.floor(Math.random() * 15000) + 5000,
      orders: Math.floor(Math.random() * 20) + 5
    });
  }
  
  return data;
};

// Chart Component
const SalesChart: React.FC<{ data: SalesDataPoint[] }> = ({ data }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const height = 200;
  const width = 100;
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = ((maxRevenue - point.revenue) / maxRevenue) * height;
    return `${x}% ${y}px`;
  }).join(', ');
  
  const areaPoints = `${points}, ${width}% ${height}px, 0% ${height}px`;

  return (
    <div className="relative h-48 w-full">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-gray-100"></div>
        ))}
      </div>
      
      {/* Chart */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 200" preserveAspectRatio="none">
        {/* Gradient Area */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Filled Area */}
        <polygon
          points={areaPoints}
          fill="url(#chartGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data Points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxRevenue - point.revenue) / maxRevenue) * 200;
          return (
            <g key={index}>
              <circle
                cx={`${x}%`}
                cy={`${y}px`}
                r="3"
                fill="#3B82F6"
                className="opacity-0 hover:opacity-100 transition-opacity"
              />
              <text
                x={`${x}%`}
                y="195"
                textAnchor="middle"
                className="text-[8px] fill-gray-400"
              >
                {point.date}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip Example */}
      <div className="absolute top-2 right-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-gray-900">
            {Math.round((data[data.length - 1].revenue / data[0].revenue - 1) * 100)}%
          </span>
          <span className="text-xs text-gray-600">growth</span>
        </div>
      </div>
    </div>
  );
};

// Main Component
const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('30d');
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, replace with:
    // const summary = await fetchSalesSummary(dateRange);
    // const orders = await fetchRecentOrders();
    // const products = await fetchTopProducts();
    // const alertsData = await fetchAlerts();
    // const chartData = await fetchSalesData(dateRange);
    
    setSalesSummary(generateSalesSummary());
    setRecentOrders(generateRecentOrders());
    setTopProducts(generateTopProducts());
    setAlerts(generateAlerts());
    setSalesData(generateSalesData(dateRange));
    
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: Order['status']) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-production': { color: 'bg-blue-100 text-blue-800', icon: Settings },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('-', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading business data...</p>
        </div>
      </div>
    );
  }

  if (!salesSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load dashboard data</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Seller Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Business performance summary • Last updated: Today, 10:30 AM</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${dateRange === '7d' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${dateRange === '30d' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Last 30 Days
              </button>
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Refresh</span>
            </button>
            
            <div className="hidden md:block">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Export Report</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-2">
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Business Value</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(salesSummary.totalRevenue)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+{salesSummary.revenueGrowth}% vs previous period</span>
                  </div>
                </div>
                <BarChart3 className="w-12 h-12 opacity-80" />
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(salesSummary.averageOrderValue)}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${salesSummary.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {salesSummary.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(salesSummary.revenueGrowth)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesSummary.totalRevenue)}</p>
          <p className="text-sm font-medium text-gray-700">Total Revenue</p>
          <p className="text-xs text-gray-500 mt-1">{salesSummary.completedOrders} completed orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${salesSummary.orderGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {salesSummary.orderGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(salesSummary.orderGrowth)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{salesSummary.totalOrders}</p>
          <p className="text-sm font-medium text-gray-700">Total Orders</p>
          <p className="text-xs text-gray-500 mt-1">From {salesSummary.totalOrders - 15} customers</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            {salesSummary.pendingOrders > 10 && (
              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Attention needed
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold ${salesSummary.pendingOrders > 10 ? 'text-red-600' : 'text-gray-900'}`}>
            {salesSummary.pendingOrders}
          </p>
          <p className="text-sm font-medium text-gray-700">Pending Orders</p>
          <p className="text-xs text-gray-500 mt-1">Requiring action</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((salesSummary.completedOrders / salesSummary.totalOrders) * 100)}% rate
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{salesSummary.completedOrders}</p>
          <p className="text-sm font-medium text-gray-700">Completed Orders</p>
          <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-lg">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            {salesSummary.lowStockCount > 0 && (
              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {salesSummary.lowStockCount} items
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{salesSummary.lowStockCount}</p>
          <p className="text-sm font-medium text-gray-700">Low Stock Items</p>
          <p className="text-xs text-gray-500 mt-1">Need restocking</p>
        </div>
      </div>

      {/* Sales Performance Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sales Performance</h2>
            <p className="text-gray-600 text-sm mt-1">Daily revenue trend for {dateRange === '7d' ? 'last 7 days' : 'last 30 days'}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Revenue</span>
            </div>
          </div>
        </div>
        
        <div className="h-48">
          <SalesChart data={salesData} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Peak Revenue</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(Math.max(...salesData.map(d => d.revenue)))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Daily</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.length)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Best Day</p>
            <p className="text-lg font-bold text-gray-900">
              {salesData.find(d => d.revenue === Math.max(...salesData.map(d => d.revenue)))?.date}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Period</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(salesData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => navigate('/seller/orders')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View All Orders
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-1">Last 7 orders from your store</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{order.createdAt}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.itemsCount} items</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.orderType === 'custom' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.orderType === 'custom' ? 'Custom' : 'Ready-made'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => navigate(`/seller/orders/${order.id}`)}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
                <div className="p-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1">Best performers by revenue</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {topProducts.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {product.isBestSeller && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            Best
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-medium">{product.rating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                          <p className="text-xs text-gray-500">{product.unitsSold} units sold</p>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                          product.stock <= 5 
                            ? 'bg-red-100 text-red-800' 
                            : product.stock <= 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Stock: {product.stock}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/seller/products')}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All Products
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Alerts & Quick Actions */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Alerts & Actions</h2>
              </div>
              <p className="text-gray-600 text-sm mt-1">Items requiring your attention</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-600' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {alert.type === 'low-stock' && <Package className="w-4 h-4" />}
                      {alert.type === 'pending-order' && <Clock className="w-4 h-4" />}
                      {alert.type === 'custom-order' && <Settings className="w-4 h-4" />}
                      {alert.type === 'dispute' && <AlertCircle className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => navigate(alert.targetPage)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm whitespace-nowrap"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/seller/inventory')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium text-sm transition"
                >
                  <Layers className="w-4 h-4" />
                  Manage Inventory
                </button>
                <button
                  onClick={() => navigate('/seller/custom-orders')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm transition"
                >
                  <Settings className="w-4 h-4" />
                  Custom Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Next payout:</span> SAR 42,850 on Jan 25, 2024
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              VAT obligation for Q4 2023: SAR 23,138 • Due on Feb 15, 2024
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Store Performance Score</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
              <span className="text-sm font-bold text-gray-900">89%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;