import React from "react";
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Settings,
  FileText,
  Star,
  Wallet
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000, orders: 65 },
    { month: 'Feb', revenue: 15000, orders: 78 },
    { month: 'Mar', revenue: 18000, orders: 92 },
    { month: 'Apr', revenue: 22000, orders: 115 },
    { month: 'May', revenue: 25000, orders: 134 },
    { month: 'Jun', revenue: 28000, orders: 156 },
  ];

  const categoryData = [
    { name: 'Living Room', value: 35, color: '#3b82f6' },
    { name: 'Bedroom', value: 25, color: '#8b5cf6' },
    { name: 'Office', value: 20, color: '#10b981' },
    { name: 'Kitchen', value: 15, color: '#f59e0b' },
    { name: 'Outdoor', value: 5, color: '#ef4444' },
  ];

  const statsCards = [
    {
      title: "Total Revenue",
      value: "$156,420",
      change: "+12.5%",
      icon: <DollarSign className="h-6 w-6" />,
      color: "bg-green-50 text-green-700 border-green-100",
      trend: "up"
    },
    {
      title: "Total Orders",
      value: "892",
      change: "+8.2%",
      icon: <ShoppingBag className="h-6 w-6" />,
      color: "bg-blue-50 text-blue-700 border-blue-100",
      trend: "up"
    },
    {
      title: "Active Users",
      value: "2,453",
      change: "+5.7%",
      icon: <Users className="h-6 w-6" />,
      color: "bg-purple-50 text-purple-700 border-purple-100",
      trend: "up"
    },
    {
      title: "Pending Reviews",
      value: "23",
      change: "-3.1%",
      icon: <Clock className="h-6 w-6" />,
      color: "bg-yellow-50 text-yellow-700 border-yellow-100",
      trend: "down"
    }
  ];

  const recentActivities = [
    { id: 1, user: "John Smith", action: "Placed new order", time: "2 min ago", type: "order" },
    { id: 2, user: "Sarah Johnson", action: "Posted a review", time: "15 min ago", type: "review" },
    { id: 3, user: "Mike Chen", action: "Created new listing", time: "1 hour ago", type: "listing" },
    { id: 4, user: "Emma Wilson", action: "Updated profile", time: "2 hours ago", type: "profile" },
    { id: 5, user: "David Brown", action: "Withdrawn funds", time: "3 hours ago", type: "wallet" },
  ];

  // Admin Sidebar Component
  const AdminSidebar = () => (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-gray-400">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500 text-white"
        >
          <BarChart3 className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => navigate("/admin/users")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <Users className="h-5 w-5" />
          <span>Users</span>
        </button>
        <button
          onClick={() => navigate("/admin/sellers")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <Package className="h-5 w-5" />
          <span>Sellers</span>
        </button>
        <button
          onClick={() => navigate("/admin/products")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Products</span>
        </button>
        <button
          onClick={() => navigate("/admin/orders")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <Clock className="h-5 w-5" />
          <span>Orders</span>
        </button>
        <button
          onClick={() => navigate("/admin/reviews")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <Star className="h-5 w-5" />
          <span>Reviews</span>
        </button>
        <button
          onClick={() => navigate("/admin/contracts")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <FileText className="h-5 w-5" />
          <span>Contracts</span>
        </button>
        <button
          onClick={() => navigate("/admin/wallet")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800"
        >
          <Wallet className="h-5 w-5" />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mt-6"
        >
          <Home className="h-5 w-5" />
          <span>Back to Home</span>
        </button>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="ml-64 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your marketplace.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Refresh Data
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className={`${card.color} border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {card.icon}
                </div>
                <span className={`text-sm font-medium ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {card.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
              <p className="text-sm">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Revenue & Orders</h3>
                <p className="text-sm text-gray-600">Last 6 months performance</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg">Monthly</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Quarterly</button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="orders" name="Orders" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-6">Categories Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {categoryData.map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Activities</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {activity.type === 'order' && <Package className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'review' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {activity.type === 'listing' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                      {activity.type === 'profile' && <Users className="h-5 w-5 text-yellow-600" />}
                      {activity.type === 'wallet' && <DollarSign className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-6">System Status</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">All Systems Operational</p>
                    <p className="text-sm text-green-700">Last checked 5 min ago</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Response Time</span>
                  <span className="text-sm font-medium text-green-600">98ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Server Uptime</span>
                  <span className="text-sm font-medium text-green-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="text-sm font-medium text-blue-600">247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Load</span>
                  <span className="text-sm font-medium text-yellow-600">42%</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;