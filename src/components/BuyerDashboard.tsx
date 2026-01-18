// src/components/BuyerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, MessageSquare, Heart, Star, Wallet, 
  User, Bell, Search, Package, Truck, ShoppingCart,
  ChevronRight, ChevronDown, Menu, X, Settings, LogOut,
  CreditCard, MapPin, Calendar, DollarSign, Filter,
  ChevronLeft, Check, Clock, AlertCircle, HelpCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';
// import { supabase } from '@/lib/supabase';
import { supabase } from '../lib/supabase';

interface BuyerDashboardProps {
  onNavigate: (page: string, data?: any) => void;
  activeSection: string;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({onNavigate, activeSection: propSection = 'dashboard' }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(propSection);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data
  const [stats, setStats] = useState({
    totalOrders: 12,
    activeOrders: 3,
    walletBalance: 2450,
    unreadMessages: 2
  });
  
  const [orders, setOrders] = useState([
    {
      id: 'ORD-789012',
      date: '2024-01-15',
      seller: 'Premium Furniture',
      total: 1899,
      status: 'Shipped',
      items: 2,
      deliveryDate: '2024-01-20'
    },
    {
      id: 'ORD-789013',
      date: '2024-01-10',
      seller: 'Modern Living',
      total: 3450,
      status: 'Delivered',
      items: 1,
      deliveryDate: '2024-01-12'
    },
    {
      id: 'ORD-789014',
      date: '2024-01-05',
      seller: 'Artisan Crafts',
      total: 850,
      status: 'Processing',
      items: 3,
      deliveryDate: '2024-01-18'
    }
  ]);
  
  const [wishlist, setWishlist] = useState([
    {
      id: 'WIS-001',
      name: 'Modern Sofa Set',
      price: 1999,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
      seller: 'Premium Furniture',
      rating: 4.8
    },
    {
      id: 'WIS-002',
      name: 'Wooden Dining Table',
      price: 850,
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w-400&h=300&fit=crop',
      seller: 'Artisan Crafts',
      rating: 4.6
    }
  ]);
  
  const [recommendedProducts, setRecommendedProducts] = useState([
    {
      id: 'PROD-001',
      name: 'Ergonomic Office Chair',
      price: 450,
      originalPrice: 550,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      seller: 'Office Pro',
      rating: 4.7,
      delivery: '2-3 days'
    },
    {
      id: 'PROD-002',
      name: 'Minimalist Bed Frame',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
      seller: 'Modern Living',
      rating: 4.9,
      delivery: '1-2 weeks'
    },
    {
      id: 'PROD-003',
      name: 'Outdoor Patio Set',
      price: 2200,
      originalPrice: 2800,
      image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
      seller: 'Garden Living',
      rating: 4.5,
      delivery: '3-4 weeks'
    },
    {
      id: 'PROD-004',
      name: 'Bookshelf Unit',
      price: 350,
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=300&fit=crop',
      seller: 'Home Solutions',
      rating: 4.4,
      delivery: '1 week'
    }
  ]);
  
  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Your Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Account', icon: User }
  ];
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Handle navigation
  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    setShowMobileMenu(false);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'Buyer'}!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your orders</p>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">
            Start Shopping
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-600 font-medium">
            {stats.activeOrders} active • View all
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(stats.walletBalance)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-green-600 font-medium">
            Secure escrow • Add funds
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unreadMessages}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-purple-600 font-medium">
            From {orders.length} sellers • View messages
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wishlist Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{wishlist.length}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-red-600 font-medium">
            Saved for later • View wishlist
          </div>
        </div>
      </div>
      
      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                <button 
                  onClick={() => handleSectionClick('orders')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all orders
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">Order #{order.id}</p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.seller} • {order.items} item{order.items > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Ordered on {formatDate(order.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Delivery: {formatDate(order.deliveryDate)}
                      </p>
                      <div className="mt-2 space-x-2">
                        <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                          Track
                        </button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Quick Actions & Recommendations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-5 space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">Browse Furniture</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">Request Custom Furniture</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">Add Funds to Wallet</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">Contact Support</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Wishlist Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Your Wishlist</h2>
                <button 
                  onClick={() => handleSectionClick('wishlist')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all
                </button>
              </div>
            </div>
            <div className="p-5">
              {wishlist.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center space-x-3 mb-4 last:mb-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-bold text-gray-900">{formatPrice(item.price)}</p>
                      <button className="p-1">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommended Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recommended For You</h2>
          <p className="text-gray-600 text-sm mt-1">Based on your browsing history</p>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded"
                    />
                    {product.originalPrice && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Save {formatPrice(product.originalPrice - product.price)}
                      </div>
                    )}
                    <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-600">{product.rating}</span>
                      <span className="text-xs text-gray-400">• {product.seller}</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Delivery: {product.delivery}</p>
                    </div>
                    
                    <button className="w-full mt-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render Orders
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
              <p className="text-gray-600 mt-1">{orders.length} orders placed</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.map((order) => (
            <div key={order.id} className="p-5 hover:bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{order.seller}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Ordered on {formatDate(order.date)}</span>
                        <span>•</span>
                        <span>{order.items} item{order.items > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Delivery expected by {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                  <div className="mt-3 flex lg:justify-end space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Track Order
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      View Details
                    </button>
                    {order.status === 'Delivered' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Render Wishlist
  const renderWishlist = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Wishlist</h1>
              <p className="text-gray-600 mt-1">{wishlist.length} saved items</p>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">
              Move All to Cart
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-6">Save items you're interested in for later</p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-600">{item.rating}</span>
                      <span className="text-sm text-gray-400">• {item.seller}</span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-xl text-gray-900">{formatPrice(item.price)}</span>
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          Remove
                        </button>
                        <button className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render Messages
  const renderMessages = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Communicate with sellers about your orders</p>
      </div>
      
      <div className="p-5">
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Your messages will appear here</h3>
          <p className="text-gray-500">Start conversations with sellers from your order details page</p>
        </div>
      </div>
    </div>
  );
  
  // Render Wallet
  const renderWallet = () => (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Available Balance</p>
            <p className="text-4xl font-bold mt-2">{formatPrice(stats.walletBalance)}</p>
            <p className="text-blue-100 text-sm mt-2">Secure escrow protection</p>
          </div>
          <div className="text-right">
            <Wallet className="w-12 h-12 text-white/80" />
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button className="flex-1 px-4 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
            Add Funds
          </button>
          <button className="flex-1 px-4 py-3 border border-white text-white rounded-lg font-medium hover:bg-white/10">
            Withdraw
          </button>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
        </div>
        
        <div className="p-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    i === 1 ? 'bg-green-50 text-green-600' :
                    i === 2 ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {i === 1 ? <DollarSign className="w-5 h-5" /> :
                     i === 2 ? <CreditCard className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {i === 1 ? 'Wallet Deposit' :
                       i === 2 ? 'Order Payment' :
                       'Refund Processed'}
                    </p>
                    <p className="text-sm text-gray-500">Jan {15 + i}, 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    i === 1 || i === 3 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {i === 1 || i === 3 ? '+' : '-'}
                    {formatPrice(i === 1 ? 1000 : i === 2 ? 450 : 250)}
                  </p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render Profile
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
        </div>
        
        <div className="p-5">
          <div className="max-w-2xl space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Address Book */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Address Book</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Add New Address
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">Home</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Default
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">123 Main Street, Riyadh 12345</p>
                    <p className="text-sm text-gray-500">Saudi Arabia</p>
                    <p className="text-sm text-gray-500 mt-1">Phone: +966 50 123 4567</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                </div>
              </div>
            </div>
            
            {/* Security */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Change Password</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Two-Factor Authentication</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
            
            {/* Danger Zone */}
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Account Actions</h3>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return renderOrders();
      case 'wishlist':
        return renderWishlist();
      case 'messages':
        return renderMessages();
      case 'wallet':
        return renderWallet();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Navigation */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <h1 className="text-xl font-bold">FurnitureMarket</h1>
              
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionClick(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      activeSection === item.id 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/90 hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right: Search, Notifications, User */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden lg:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dashboard..."
                  className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg">
                <Bell className="w-5 h-5" />
                {stats.unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {/* Cart */}
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'B'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSectionClick(item.id);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="py-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleSectionClick(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 text-left ${
                    activeSection === item.id 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderActiveSection()}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <div className="mb-4 md:mb-0">
              <p className="font-medium text-gray-900">FurnitureMarket</p>
              <p className="text-gray-500">Professional furniture marketplace</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Help Center</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Contact Us</a>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} FurnitureMarket. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BuyerDashboard;