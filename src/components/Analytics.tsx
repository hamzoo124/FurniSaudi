// src/components/Analytics.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  PieChart,
  LineChart,
  Target,
  BarChart2,
  Activity
} from 'lucide-react';

interface AnalyticsPageProps {
  onNavigate: (page: string, data?: any) => void;
  onBack: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate, onBack }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Mock data - in a real app, this would come from an API
  const analyticsData = {
    overview: {
      totalRevenue: 125430,
      totalOrders: 342,
      averageOrderValue: 366.75,
      conversionRate: 4.2,
      newCustomers: 89,
      returningCustomers: 253,
      revenueGrowth: 12.5,
      orderGrowth: 8.3
    },
    revenueByMonth: [
      { month: 'Jan', revenue: 95000, orders: 280 },
      { month: 'Feb', revenue: 110000, orders: 310 },
      { month: 'Mar', revenue: 125430, orders: 342 },
      { month: 'Apr', revenue: 98000, orders: 290 },
      { month: 'May', revenue: 135000, orders: 370 },
      { month: 'Jun', revenue: 142000, orders: 390 }
    ],
    topProducts: [
      { name: 'Queen Bed', revenue: 28500, orders: 95, growth: 15 },
      { name: 'Modern Sofa', revenue: 24200, orders: 88, growth: 22 },
      { name: 'Dining Table', revenue: 19800, orders: 66, growth: 8 },
      { name: 'Office Chair', revenue: 16500, orders: 75, growth: 18 },
      { name: 'Wardrobe', revenue: 14300, orders: 52, growth: 12 }
    ],
    trafficSources: [
      { source: 'Direct', visitors: 15420, conversion: 5.2 },
      { source: 'Google Search', visitors: 12350, conversion: 4.8 },
      { source: 'Social Media', visitors: 8760, conversion: 3.5 },
      { source: 'Referral', visitors: 5430, conversion: 6.1 },
      { source: 'Email', visitors: 3210, conversion: 7.8 }
    ],
    customerSegments: [
      { segment: 'New Customers', count: 89, revenue: 35600 },
      { segment: 'Returning Customers', count: 253, revenue: 89830 },
      { segment: 'VIP Customers', count: 45, revenue: 51200 }
    ]
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: `${analyticsData.overview.totalRevenue.toLocaleString()} SR`,
      change: `${analyticsData.overview.revenueGrowth}%`,
      isPositive: analyticsData.overview.revenueGrowth > 0,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: analyticsData.overview.totalOrders.toLocaleString(),
      change: `${analyticsData.overview.orderGrowth}%`,
      isPositive: analyticsData.overview.orderGrowth > 0,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Avg Order Value',
      value: `${analyticsData.overview.averageOrderValue.toFixed(2)} SR`,
      change: '3.2%',
      isPositive: true,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Conversion Rate',
      value: `${analyticsData.overview.conversionRate}%`,
      change: '0.8%',
      isPositive: true,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-amber-500'
    }
  ];

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' SR';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor your business performance and insights</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.color} text-white`}>
                  {metric.icon}
                </div>
                <div className={`flex items-center text-sm ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-600">Monthly revenue and orders</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Orders</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {analyticsData.revenueByMonth.map((month, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">{month.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${(month.revenue / 150000) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-right">
                        <div className="font-semibold">{formatCurrency(month.revenue)}</div>
                        <div className="text-sm text-gray-500">{month.orders} orders</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="text-sm text-gray-600">By revenue and growth</p>
              </div>
              <Filter className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                    <div className={`text-sm ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth > 0 ? '+' : ''}{product.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer & Traffic Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Traffic Sources */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h3>
            
            <div className="space-y-4">
              {analyticsData.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{source.source}</h4>
                      <p className="text-sm text-gray-600">{source.visitors.toLocaleString()} visitors</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{source.conversion}%</div>
                    <div className="text-sm text-gray-600">Conversion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Segments */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Segments</h3>
            
            <div className="space-y-6">
              {analyticsData.customerSegments.map((segment, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{segment.segment}</h4>
                    <span className="text-sm text-gray-600">{segment.count} customers</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 
                        'bg-purple-500'
                      }`}
                      style={{ width: `${(segment.revenue / 100000) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(segment.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.newCustomers + analyticsData.overview.returningCustomers}
              </div>
              <div className="text-sm text-gray-600">Total Customers</div>
              <div className="flex items-center justify-center space-x-2 mt-2 text-sm">
                <span className="text-green-600">+{analyticsData.overview.newCustomers} new</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600">{analyticsData.overview.returningCustomers} returning</span>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.conversionRate}%
              </div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="flex items-center justify-center space-x-2 mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600">+0.8% from last month</span>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <PieChart className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.averageOrderValue.toFixed(2)} SR
              </div>
              <div className="text-sm text-gray-600">Average Order Value</div>
              <div className="flex items-center justify-center space-x-2 mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600">+3.2% from last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Insights & Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">📈 Revenue Growth</h4>
                <p className="text-sm text-gray-600">
                  Your revenue has grown by {analyticsData.overview.revenueGrowth}% this month. 
                  Consider increasing marketing spend on top-performing channels.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">👥 Customer Retention</h4>
                <p className="text-sm text-gray-600">
                  {analyticsData.overview.returningCustomers} returning customers generated {formatCurrency(89830)} in revenue. 
                  Focus on loyalty programs to maintain this growth.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">🏆 Top Products</h4>
                <p className="text-sm text-gray-600">
                  "Queen Bed" and "Modern Sofa" are your best sellers. Consider bundling them or 
                  creating special offers to increase average order value.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Conversion Opportunity</h4>
                <p className="text-sm text-gray-600">
                  Email traffic converts at 7.8% (highest among all channels). 
                  Consider expanding your email marketing campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add default export for backward compatibility
export default AnalyticsPage;