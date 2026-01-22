import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Auth Context
import { AuthProvider } from "../src/contexts/AuthContext";
import { useToast } from "./components/ui/use-toast";
import { ToastContainer } from "./components/Toast";
import { Toaster, toast } from "react-hot-toast";

// OLD ADMIN COMPONENT (Legacy)
import OldAdminDashboard from "./components/AdminDashboard";

// NEW ADMIN COMPONENT - NO ROUTING INSIDE
import NewAdminDashboard from "./components/admin/AdminDashboard";

// CATEGORIES COMPONENT
import AdminCategories from "./components/admin/Categories";

// BUYER DASHBOARD COMPONENT
import BuyerDashboard from "./components/BuyerDashboard";

// Existing Screens
import HomePage from "./components/HomePage";
import SellerDashboard from "./components/SellerDashboard";
import AddProduct from "./components/addproduct";
import OrdersPage from "./components/Orders";
import PaymentsPage from "./components/Payments";
import Contracts from "./components/Contracts";
import Setting from "./components/Setting";
import AdvertisingPage from "./components/Advertising";
import { ProductDetail } from "./components/ProductDetail";
import SellerRegistration from "./components/SellerRegistration";
import EditProduct from "./components/EditProduct";
import OrderDetails from "./components/OrderDetails";
// import WalletPage from "./pages/admin/wallet";
import SupportPage from "./components/Support";
import { Checkout } from "./components/Checkout";

// Protected Route

import ProtectedRoute from "./components/ProtectedRoute";

// Icons
import { 
  ArrowLeft, Home, UserPlus, Package, Users, 
  ShoppingCart, Megaphone, LayoutDashboard, 
  Settings, Store, FileText, CreditCard, 
  MessageSquare, BarChart3, Building2,
  FileCheck, Activity, Wallet, Bell,
  Database, RefreshCw, Shield, TrendingUp,
  AlertTriangle, X, User
} from "lucide-react";


// Import Supabase client
import { supabase } from "./lib/supabase";
import WalletPage from "./pages/admin/wallet";
import SellersPage from "./components/AdminPages/SellersPage";
import BuyersPage from "./components/AdminPages/BuyersPage";
import AdminsPage from "./components/AdminPages/AdminsPage";
import { TooltipProvider } from "./components/ui/tooltip";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});

// ================================
// CONNECTION STATUS COMPONENT
// ================================
const ConnectionStatus = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          setStatus('error');
          setMessage(`Database error: ${error.message}`);
        } else {
          setStatus('connected');
          setMessage('Database connected ✓');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(`Connection failed: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  const getColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className={`fixed top-4 left-4 z-50 px-3 py-2 rounded-lg hidden text-white text-sm shadow-lg ${getColor()}`}>
      {status === 'checking' ? '🔍 Checking connection...' : 
       status === 'connected' ? '✅ Database connected' : 
       '❌ Connection error'}
    </div>
  );
};

// ================================
// DEMO BUYER DASHBOARD (Bypasses Authentication)
// ================================
const DemoBuyerDashboard: React.FC<{ activeSection?: string }> = ({ activeSection = 'dashboard' }) => {
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const navigate = useNavigate();

  // Mock authentication for demo buyer
  const mockAuth = useCallback(async () => {
    try {
      // Create a mock buyer user session in localStorage
      const mockUser = {
        id: 'demo-buyer-id-456',
        email: 'demo@buyer.com',
        name: 'Demo Buyer',
        phone: '+966 500 000 000',
        user_metadata: {
          full_name: 'Demo Buyer',
          role: 'buyer'
        }
      };
      
      // Store in localStorage to trick auth checks
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'demo-buyer-token',
        refresh_token: 'demo-buyer-refresh',
        user: mockUser
      }));

      // Set a flag to indicate demo mode
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('userRole', 'buyer');
      
      // Load demo data
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLoading(false);
    } catch (error) {
      console.error('Demo buyer setup error:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mockAuth();
  }, [mockAuth]);

  const handleNavigate = (page: string, data?: any) => {
    console.log(`📱 BuyerDashboard navigation: ${page}`, data);
    
    if (page === 'home') {
      navigate('/');
    } else if (page.startsWith('buyer/')) {
      const section = page.replace('buyer/', '');
      navigate(`/buyer/${section}`);
    } else if (page.startsWith('product-')) {
      const productId = page.replace('product-', '');
      navigate(`/product/${productId}`);
    } else if (page === 'order-details') {
      navigate(`/buyer/orders/${data?.orderId}`);
    } else if (page === 'cart') {
      navigate('/cart');
    } else {
      navigate(`/${page}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading buyer dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Authentication bypassed for demonstration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Demo Mode Banner */}
      {showDemoBanner && (
        <div className="fixed top-20 right-4 z-50 bg-blue-100 border border-blue-400 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Demo Buyer Mode Active</p>
                <p className="text-xs text-blue-700">Using mock authentication for buyer dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Render BuyerDashboard with demo context */}
      <BuyerDashboard 
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />
    </div>
  );
};

// ================================
// ADMIN NAVIGATION SIDEBAR
// ================================
const AdminNavSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  adminType: 'old' | 'new';
}> = ({ isOpen, onClose, onNavigate, adminType }) => {
  const oldNavItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin-dashboard" },
    { icon: <Users size={20} />, label: "Customers", path: "/admin-dashboard?section=users" },
    { icon: <ShoppingCart size={20} />, label: "Orders", path: "/admin-dashboard?section=orders" },
    { icon: <Package size={20} />, label: "Products", path: "/admin-dashboard?section=products" },
    { icon: <Store size={20} />, label: "Sellers", path: "/admin-dashboard?section=sellers" },
    { icon: <FileText size={20} />, label: "Contracts", path: "/admin-dashboard?section=contracts" },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/admin-dashboard?section=payments" },
    { icon: <MessageSquare size={20} />, label: "Reviews", path: "/admin-dashboard?section=reviews" },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin-dashboard?section=analytics" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin-dashboard?section=settings" },
  ];

  const newNavItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin/dashboard" },
    { icon: <Users size={20} />, label: "Users", path: "/admin/users" },
    { icon: <Store size={20} />, label: "Sellers", path: "/admin/sellers" },
    { icon: <Package size={20} />, label: "Products", path: "/admin/products" },
    { icon: <ShoppingCart size={20} />, label: "Orders", path: "/admin/orders" },
    { icon: <MessageSquare size={20} />, label: "Reviews", path: "/admin/reviews" },
    { icon: <Wallet size={20} />, label: "Wallet", path: "/admin/wallet" },
    { icon: <FileCheck size={20} />, label: "Contracts", path: "/admin/contracts" },
    { icon: <Megaphone size={20} />, label: "Advertising", path: "/admin/advertising" },
    { icon: <Activity size={20} />, label: "Activity Logs", path: "/admin/activity" },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin/analytics" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
  ];

  const navItems = adminType === 'old' ? oldNavItems : newNavItems;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 size={24} />
              <h2 className="text-xl font-bold">
                {adminType === 'old' ? 'Legacy Admin' : 'Modern Admin'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-800 rounded"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {adminType === 'old' ? (
              <>
                <Database size={14} className="text-yellow-400" />
                <p className="text-gray-400 text-xs">Static Mock Data</p>
              </>
            ) : (
              <>
                <RefreshCw size={14} className="text-green-400 animate-spin" />
                <p className="text-green-400 text-xs">Live Database</p>
              </>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {adminType === 'old' 
              ? 'Legacy Interface (Mock Data)' 
              : 'Real-time Dashboard (Live Data)'}
          </p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                console.log(`📋 Sidebar navigation: ${item.path}`);
                onNavigate(item.path);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
            >
              {item.icon}
              <span>{item.label}</span>
              {adminType === 'new' && item.path.includes('dashboard') && (
                <span className="ml-auto">
                  <TrendingUp size={14} className="text-green-400" />
                </span>
              )}
            </button>
          ))}
          
          {/* Switch Admin Button */}
          <div className="pt-6 mt-6 border-t border-gray-800">
            <button
              onClick={() => {
                onNavigate(adminType === 'old' ? '/admin/dashboard' : '/admin-dashboard');
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded ${adminType === 'old' ? 'bg-teal-500' : 'bg-blue-500'}`}>
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium">Switch to {adminType === 'old' ? 'Modern' : 'Legacy'} Admin</span>
                  <p className="text-xs text-gray-400">
                    {adminType === 'old' ? 'Real-time data' : 'Mock data'}
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

// ================================
// SIMPLE CART COMPONENT (FIXED VERSION)
// ================================
const SimpleCartPage: React.FC<{ onNavigate: (page: string, data?: any) => void;
  cartItems: any[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void}> = ({ onNavigate, cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.product.finalPrice || item.product.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    onNavigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <button
              onClick={() => onNavigate('/')}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 border-b pb-4">
                <img
                  src={item.product.images?.[0]}
                  alt={item.product.title || item.product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.title || item.product.name}</h3>
                  <p className="text-gray-600 text-sm">
                    Price: {(item.product.finalPrice || item.product.price)} SR
                  </p>
                  {item.customization && (
                    <p className="text-xs text-purple-600 mt-1">🎨 Customized Product</p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="w-8 h-8 border rounded-full flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="w-8 h-8 border rounded-full flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">
                    {((item.product.finalPrice || item.product.price) * item.quantity).toFixed(2)} SR
                  </p>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Total: {calculateTotal().toFixed(2)} SR</h3>
                <button
                  onClick={onClearCart}
                  className="text-red-500 hover:text-red-700 text-sm mt-2"
                >
                  Clear Cart
                </button>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onNavigate('/')}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

// ================================
// FLOATING DASHBOARD BUTTONS
// ================================
const FloatingDashboardButtons: React.FC<{
  onNavigate: (page: string) => void;
  showAdminNav: boolean;
  onToggleAdminNav: () => void;
}> = ({ onNavigate, showAdminNav, onToggleAdminNav }) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  const buttons = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => onNavigate('/'),
      tooltipPosition: "right-16",
    },
    {
      icon: <UserPlus className="w-5 h-5" />,
      label: "Seller Registration",
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: () => onNavigate('/seller-registration'),
      tooltipPosition: "right-16",
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: "Seller Dashboard",
      color: "bg-gray-900 hover:bg-gray-800",
      onClick: () => {
        localStorage.setItem('demoMode', 'seller');
        localStorage.setItem('userRole', 'seller');
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'demo-seller-token',
          refresh_token: 'demo-seller-refresh',
          user: {
            id: 'demo-seller-id-123',
            email: 'seller@example.com',
            name: 'Demo Seller',
            user_metadata: { full_name: 'Demo Seller', role: 'seller' }
          }
        }));
        onNavigate('/seller/dashboard?force=true');
      },
      tooltipPosition: "right-16",
    },
    {
      icon: <User className="w-5 h-5" />,
      label: "Buyer Dashboard",
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => {
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('userRole', 'buyer');
        onNavigate('/buyer/dashboard');
      },
      tooltipPosition: "right-16",
    },
    {
      icon: <Megaphone className="w-5 h-5" />,
      label: "Advertising Center",
      color: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
      onClick: () => {
        localStorage.setItem('demoMode', 'seller');
        localStorage.setItem('userRole', 'seller');
        onNavigate('/seller/advertising');
      },
      tooltipPosition: "right-16",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Admin Dashboard",
      color: "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700",
      onClick: () => {
        // Set admin authentication
        localStorage.setItem('admin_token', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.removeItem('demoMode');
        onNavigate('/admin/dashboard');
      },
      tooltipPosition: "right-16",
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Regular Buttons */}
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={`w-12 h-12 ${button.color} text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative`}
          aria-label={button.label}
          onMouseEnter={() => setShowTooltip(button.label)}
          onMouseLeave={() => setShowTooltip(null)}
        >
          {button.icon}
          {showTooltip === button.label && (
            <div 
              className={`absolute ${button.tooltipPosition} top-1/2 -translate-y-1/2 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap pointer-events-none z-50`}
              style={{ 
                backgroundColor: button.color.split(' ')[0].replace('hover:', ''),
                filter: 'brightness(0.9)'
              }}
            >
              {button.label}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// ================================
// SELLER DASHBOARD WRAPPER (FIXED VERSION)
// ================================
const SellerDashboardWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Extract section from URL - UPDATED to include all new sections
  const getSectionFromPath = () => {
    const path = location.pathname;
    if (path === '/seller/dashboard') return 'dashboard';
    
    // Extract section from path like /seller/dashboard/products
    const parts = path.split('/');
    if (parts.length >= 4 && parts[1] === 'seller' && parts[2] === 'dashboard') {
      const section = parts[3];
      
      // Map to supported sections (including new ones)
      const validSections = [
        'dashboard', 'products',  'orders', 'inventory', 'custom-orders',
        'shipping', 'finance', 'reports', 'reviews', 'advertising',
        'wallet', 'vat', 'profile', 'settings', 'notifications', 'support'
      ];
      
      if (validSections.includes(section)) {
        return section;
      }
    }
    
    return 'dashboard';
  };

  const activeSection = getSectionFromPath();

  // Check authentication and ensure user stays on seller dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for force parameter in URL
        const searchParams = new URLSearchParams(location.search);
        const forceLogin = searchParams.get('force') === 'true';
        
        if (forceLogin) {
          // Force seller demo mode
          const demoUser = {
            id: 'demo-seller-id-123',
            email: 'seller@example.com',
            user_metadata: {
              full_name: 'Demo Furniture Store',
              role: 'seller',
              business_name: 'Demo Furniture Store'
            },
            sellerId: 'demo-seller-id-123'
          };
          
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'demo-seller-token',
            refresh_token: 'demo-seller-refresh',
            user: demoUser
          }));
          
          localStorage.setItem('demoMode', 'seller');
          localStorage.setItem('userRole', 'seller');
          localStorage.setItem('force_seller_dashboard', 'true');
          
          setUserData(demoUser);
          setLoading(false);
          return;
        }

        // First, check if we have a stored session
        const storedAuth = localStorage.getItem('supabase.auth.token');
        let userDataToSet = null;

        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth);
          userDataToSet = parsedAuth.user;
          
          // Ensure sellerId is set
          if (userDataToSet && !userDataToSet.sellerId) {
            userDataToSet.sellerId = userDataToSet.id;
          }
        } else {
          // If no stored session, check Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // User is authenticated
            userDataToSet = {
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata || {},
              sellerId: session.user.id // Ensure sellerId is set
            };
            
            // Store in localStorage
            localStorage.setItem('supabase.auth.token', JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              user: userDataToSet
            }));
          } else {
            // No authenticated user - use demo mode
            userDataToSet = {
              id: 'demo-seller-id-123',
              email: 'seller@example.com',
              user_metadata: {
                full_name: 'Demo Furniture Store',
                role: 'seller',
                business_name: 'Demo Furniture Store'
              },
              sellerId: 'demo-seller-id-123' // Ensure sellerId is set
            };
            
            localStorage.setItem('supabase.auth.token', JSON.stringify({
              access_token: 'demo-seller-token',
              refresh_token: 'demo-seller-refresh',
              expires_at: Date.now() + 3600 * 1000,
              user: userDataToSet
            }));
            
            localStorage.setItem('demoMode', 'seller');
            localStorage.setItem('userRole', 'seller');
          }
        }

        // Set user data in state
        setUserData(userDataToSet);
        
      } catch (error) {
        console.error('Auth check error:', error);
        // Fallback to demo mode
        const fallbackUser = {
          id: 'fallback-seller-id',
          email: 'seller@example.com',
          user_metadata: {
            full_name: 'Seller Store',
            role: 'seller',
            business_name: 'Furniture Store'
          },
          sellerId: 'fallback-seller-id' // Ensure sellerId is set
        };
        
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'fallback-token',
          user: fallbackUser
        }));
        
        localStorage.setItem('demoMode', 'seller');
        localStorage.setItem('userRole', 'seller');
        
        setUserData(fallbackUser);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.search]);

  const handleNavigate = (page: string) => {
    console.log('🛒 Seller navigation:', page);
    
    if (page.startsWith('/')) {
      navigate(page);
    } else if (page === 'home' || page === '') {
      navigate('/');
    } else if (page === 'add-product') {
      navigate('/seller/add-product');
    } else if (page === 'logout') {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('force_seller_dashboard');
      localStorage.removeItem('demoMode');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('cart');
      localStorage.removeItem('userRole');
      navigate('/');
    } else {
      // Navigate to seller dashboard section
      navigate(`/seller/dashboard/${page}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <button
            onClick={() => {
              // Force seller demo mode
              const demoUser = {
                id: 'demo-seller-id-123',
                email: 'seller@example.com',
                user_metadata: {
                  full_name: 'Demo Furniture Store',
                  role: 'seller',
                  business_name: 'Demo Furniture Store'
                },
                sellerId: 'demo-seller-id-123'
              };
              
              localStorage.setItem('supabase.auth.token', JSON.stringify({
                access_token: 'demo-seller-token',
                refresh_token: 'demo-seller-refresh',
                user: demoUser
              }));
              
              localStorage.setItem('demoMode', 'seller');
              localStorage.setItem('userRole', 'seller');
              localStorage.setItem('force_seller_dashboard', 'true');
              
              window.location.href = '/seller/dashboard?force=true';
            }}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            Continue as Demo Seller
          </button>
        </div>
      </div>
    );
  }

  return (
    <SellerDashboard 
      onNavigate={handleNavigate}
      section={activeSection}
    />
  );
};

// ================================
// NEW ADMIN DASHBOARD WRAPPER
// ================================
const NewAdminDashboardWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getSectionFromPath = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/sellers') return 'sellers';
    if (path === '/admin/products') return 'products';
    if (path === '/admin/orders') return 'orders';
    if (path === '/admin/reviews') return 'reviews';
    if (path === '/admin/wallet') return 'wallet';
    if (path === '/admin/contracts') return 'contracts';
    if (path === '/admin/advertising') return 'advertising';
    if (path === '/admin/activity') return 'activity';
    if (path === '/admin/analytics') return 'analytics';
    if (path === '/admin/settings') return 'settings';
    if (path === '/admin/categories') return 'categories';
    return 'dashboard';
  };

  const section = getSectionFromPath();

  const handleNavigate = (page: string) => {
    console.log('👑 Admin navigation:', page);
    if (page.startsWith('/')) {
      navigate(page);
    } else {
      navigate(`/admin/${page}`);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <NewAdminDashboard 
        section={section}
        onNavigate={handleNavigate}
      />
    </ProtectedRoute>
  );
};

// ================================
// APP CONTENT WITH TOAST
// ================================
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  // const { toasts, removeToast, showToast } = useToast();
  const [showAdminNav, setShowAdminNav] = useState(false);
  const [adminNavType, setAdminNavType] = useState<'old' | 'new'>('new');
  
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [directOrderData, setDirectOrderData] = useState<any>(null);

  // Update admin nav type based on current route
  useEffect(() => {
    if (location.pathname === '/admin-dashboard') {
      setAdminNavType('old');
    } else if (location.pathname.startsWith('/admin/')) {
      setAdminNavType('new');
    }
  }, [location.pathname]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cartItems]);

  // Simple navigation handler
  const handleNavigate = (page: string) => {
    console.log('🛤️ Navigation request:', page);
    
    // Check if it's a product navigation pattern (product-{id})
    if (page.startsWith('product-')) {
      const productId = page.replace('product-', '');
      console.log(`📦 Navigating to product detail: /product/${productId}`);
      navigate(`/product/${productId}`);
      return;
    }
    
    // Check if it's a direct path
    if (page.startsWith('/')) {
      console.log(`🛤️ Direct navigation to: ${page}`);
      navigate(page);
      return;
    }
    
    // Map key to path
    const pageMap: Record<string, string> = {
      'cart': '/cart',
      'home': '/',
      'seller/dashboard': '/seller/dashboard',
      'seller/advertising': '/seller/advertising',
      'buyer/dashboard': '/buyer/dashboard',
      'buyer': '/buyer/dashboard',
      'checkout': '/checkout',
      'seller-registration': '/seller-registration',
      'auth': '/seller-registration',
      'product-detail': '/product',
      'advertising': '/seller/advertising',
      'settings': '/seller/settings',
      'admin-settings': '/admin/settings/standalone',
      'seller/products': '/seller/dashboard/products',
      'seller/orders': '/seller/dashboard/orders',
      'seller/inventory': '/seller/dashboard/inventory',
      'seller/finance': '/seller/dashboard/finance',
      'seller/reports': '/seller/dashboard/reports',
      'seller/reviews': '/seller/dashboard/reviews',
      'seller/notifications': '/seller/dashboard/notifications',
      'seller/profile': '/seller/dashboard/profile',
      'seller/support': '/seller/dashboard/support',
      'seller/wallet': '/seller/dashboard/wallet',
      'seller/vat': '/seller/dashboard/vat',
      'seller/custom-orders': '/seller/dashboard/custom-orders',
      'seller/shipping': '/seller/dashboard/shipping'
    };
    
    const mappedPage = pageMap[page] || `/${page}`;
    console.log(`🗺️ Mapped navigation to: ${mappedPage}`);
    navigate(mappedPage);
  };

  // Add to cart function
  const handleAddToCart = (productId: string, customization?: any, quantity: number = 1) => {
    console.log('🛒 Adding to cart:', { productId, customization, quantity });
    
    // Check if productId has prefix
    const cleanProductId = productId.startsWith('product-') 
      ? productId.replace('product-', '') 
      : productId;
    
    const savedProducts = JSON.parse(localStorage.getItem('furnitureProducts') || '[]');
    const product = savedProducts.find((p: any) => p.id === cleanProductId);
    
    if (!product) {
      console.error('❌ Product not found for ID:', cleanProductId);
      alert('Product not found');
      return;
    }

    const cartItem = {
      product: {
        ...product,
        title: product.name || product.title,
        finalPrice: customization?.totalPrice || product.price,
        customization: customization || null
      },
      quantity,
      customization,
      addedAt: new Date().toISOString()
    };
    
    setCartItems(prev => [...prev, cartItem]);
    alert(`✅ Added ${quantity} "${product.name || product.title}" to cart!`);
  };

  // Remove from cart
  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update cart quantity
  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(index);
      return;
    }
    
    setCartItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    );
  };

  // Handle order success
  const handleOrderSuccess = () => {
    console.log('✅ Order successful');
    
    if (cartItems.length > 0 && !directOrderData) {
      setCartItems([]);
      localStorage.removeItem('cart');
    }
    
    setDirectOrderData(null);
    setTimeout(() => navigate('/'), 2000);
  };

  // Toggle wishlist
  const handleToggleWishlist = (productId: string) => {
    const cleanProductId = productId.startsWith('product-') 
      ? productId.replace('product-', '') 
      : productId;
    
    setWishlistItems(prev =>
      prev.includes(cleanProductId) 
        ? prev.filter(id => id !== cleanProductId) 
        : [...prev, cleanProductId]
    );
  };

  // Component Wrappers
  const HomePageWrapper = () => (
    <HomePage
      onNavigate={(page, data) => {
        console.log('🏠 HomePage navigation:', page, data);
        
        if (page.startsWith('product-')) {
          handleNavigate(page);
        } else {
          handleNavigate(page);
        }
      }}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      wishlistItems={wishlistItems}
    />
  );

  // BUYER DASHBOARD WRAPPER
  const BuyerDashboardWrapper = () => {
    const getSectionFromPath = () => {
      const path = location.pathname;
      if (path === '/buyer/dashboard') return 'dashboard';
      if (path === '/buyer/browse') return 'browse';
      if (path === '/buyer/orders') return 'orders';
      if (path === '/buyer/messages') return 'messages';
      if (path === '/buyer/wishlist') return 'wishlist';
      if (path === '/buyer/profile') return 'profile';
      if (path === '/buyer/wallet') return 'wallet';
      if (path === '/buyer/cart') return 'cart';
      if (path === '/buyer/reviews') return 'reviews';
      return 'dashboard';
    };

    const activeSection = getSectionFromPath();
    return <DemoBuyerDashboard activeSection={activeSection} />;
  };

  const ProductDetailWrapper = () => {
    const { productId } = useParams<{ productId: string }>();
    
    if (!productId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <button
              onClick={() => navigate("/")}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <ProductDetail
        productId={productId}
        onNavigate={(page, data) => {
          console.log('📦 ProductDetail navigation:', page, data);
          handleNavigate(page);
        }}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        wishlistItems={wishlistItems}
      />
    );
  };

  const CartPageWrapper = () => (
    <SimpleCartPage
      onNavigate={(page, data) => {
        console.log('🛒 Cart navigation:', page, data);
        handleNavigate(page);
      }}
      cartItems={cartItems}
      onUpdateQuantity={handleUpdateCartQuantity}
      onRemoveItem={handleRemoveFromCart}
      onClearCart={() => setCartItems([])}
      />
    );
  

  const CheckoutPageWrapper = () => {
    useEffect(() => {
      const localStorageOrder = localStorage.getItem('directOrderData');
      if (localStorageOrder && !directOrderData) {
        console.log('📦 Loading direct order from localStorage');
        setDirectOrderData(JSON.parse(localStorageOrder));
      }
    }, []);
    
    return (
      <Checkout
        onNavigate={(page, data) => {
          console.log('💳 Checkout navigation:', page, data);
          handleNavigate(page);
        }}
        cartItems={directOrderData ? [] : cartItems}
        onOrderSuccess={handleOrderSuccess}
        directOrder={directOrderData}
      />
    );
  };
  console.log("carttttttttttttttttttttttttttt",cartItems);

  const EditProductWrapper = () => {
    const { productId } = useParams();
    return (
      <EditProduct 
        productId={productId || ""} 
        onNavigate={handleNavigate}
        onSuccess={() => navigate("/seller/dashboard")} 
      />
    );
  };

  const OrderDetailsWrapper = () => {
    const { orderId } = useParams();
    const isAdmin = window.location.pathname.includes('/admin/orders');
    
    return (
      <OrderDetails 
        orderId={orderId || ""} 
        onNavigate={handleNavigate}
        onBack={() => navigate(isAdmin ? "/admin/orders" : "/seller/dashboard")} 
      />
    );
  };

  const OrdersPageWrapper = () => {
    const isAdmin = window.location.pathname.includes('/admin/orders');
    
    return (
      <OrdersPage 
        onNavigate={handleNavigate}
        onBack={() => navigate(isAdmin ? "/admin/dashboard" : "/seller/dashboard")} 
      />
    );
  };

  const ContractsWrapper = () => (
    <Contracts onBack={() => navigate("/seller/dashboard")} />
  );

  const ContractDetailWrapper = () => {
    const { contractId } = useParams();
    return (
     <Contracts
  onBack={() => navigate("/seller/dashboard")}
  contractData={undefined}
/>
    );
  };

  const AdvertisingPageWrapper = () => (
    <AdvertisingPage 
      onBack={() => navigate("/seller/dashboard")} 
      onNavigate={handleNavigate}
    />
  );

  const WalletPageWrapper = () => (
    <WalletPage 
      onNavigate={handleNavigate}
      onBack={() => navigate("/seller/dashboard")} 
    />
  );

  const SupportPageWrapper = () => (
    <SupportPage 
      onNavigate={handleNavigate}
      onBack={() => navigate("/seller/dashboard")} 
    />
  );

  const PaymentsPageWrapper = () => (
    <PaymentsPage 
      onNavigate={handleNavigate}
      onBack={() => navigate("/seller/dashboard")} 
    />
  );

  // Settings Page Wrapper
  const SettingsPageWrapper = () => (
    <Setting 
      onNavigate={(page) => {
        console.log('⚙️ Settings navigation:', page);
        handleNavigate(page);
      }}
      onBack={() => {
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
          navigate('/admin/dashboard');
        } else if (path.includes('/seller/')) {
          navigate('/seller/dashboard');
        } else if (path.includes('/buyer/')) {
          navigate('/buyer/dashboard');
        } else {
          navigate('/');
        }
      }}
      onLogout={() => {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('force_seller_dashboard');
        localStorage.removeItem('demoMode');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('cart');
        localStorage.removeItem('userRole');
        navigate('/');
      }}
    />
  );

  // Categories Page Wrapper
  const CategoriesPageWrapper = () => {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminCategories />
      </ProtectedRoute>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Toast Notifications */}
      {/* <ToastContainer toasts={toasts} removeToast={removeToast} /> */}
      
      
      {/* Admin Navigation Sidebar */}
      <AdminNavSidebar
        isOpen={showAdminNav}
        onClose={() => setShowAdminNav(false)}
        onNavigate={(path) => {
          console.log('📋 Admin sidebar navigation:', path);
          handleNavigate(path);
          setShowAdminNav(false);
        }}
        adminType={adminNavType}
      />

      {/* Floating Buttons */}
      <FloatingDashboardButtons
        onNavigate={(page) => {
          console.log('🔘 Floating button navigation:', page);
          handleNavigate(page);
        }}
        showAdminNav={showAdminNav}
        onToggleAdminNav={() => setShowAdminNav(true)}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/product/:productId" element={<ProductDetailWrapper />} />
        <Route path="/cart" element={<CartPageWrapper />} />
        <Route path="/checkout" element={<CheckoutPageWrapper />} />

        {/* BUYER ROUTES */}
        <Route path="/buyer" element={<Navigate to="/buyer/dashboard" replace />} />
        <Route path="/buyer/dashboard" element={<BuyerDashboardWrapper />} />
        <Route path="/buyer/:section" element={<BuyerDashboardWrapper />} />

        {/* SELLER ROUTES */}
        <Route path="/seller/dashboard" element={<SellerDashboardWrapper />} />
        <Route path="/seller/dashboard/:section" element={<SellerDashboardWrapper />} />
        <Route path="/seller/add-product" element={<AddProduct />} />
        <Route path="/seller/edit-product/:productId" element={<EditProductWrapper />} />
        <Route path="/seller/wallet" element={<WalletPageWrapper />} />
        <Route path="/seller/orders" element={<OrdersPageWrapper />} />
        <Route path="/seller/orders/:orderId" element={<OrderDetailsWrapper />} />
        <Route path="/seller/contracts" element={<ContractsWrapper />} />
        <Route path="/seller/contracts/new" element={<ContractsWrapper />} />
        <Route path="/seller/contracts/:contractId" element={<ContractDetailWrapper />} />
        <Route path="/seller/advertising" element={<AdvertisingPageWrapper />} />
        <Route path="/seller/payments" element={<PaymentsPageWrapper />} />
        <Route path="/seller/settings" element={<SettingsPageWrapper />} />
        <Route path="/seller/support" element={<SupportPageWrapper />} />

        {/* OLD ADMIN ROUTE (Legacy - Mock Data) */}
        <Route path="/admin-dashboard" element={<OldAdminDashboard />} />

        {/* NEW ADMIN ROUTES (Modern - Live Database) */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/users" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/sellers" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/categories" element={<CategoriesPageWrapper />} />
        <Route path="/admin/products" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/orders" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/reviews" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/wallet" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/contracts" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/advertising" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/activity" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/analytics" element={<NewAdminDashboardWrapper />} />
        <Route path="/admin/settings" element={<NewAdminDashboardWrapper />} />
         <Route path="/admin/sellersPage" element={<SellersPage />} />
          <Route path="/admin/buyers" element={<BuyersPage />} />
          <Route path="/admins" element={<AdminsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        
        {/* STANDALONE ADMIN SETTINGS ROUTE */}
        <Route path="/admin/settings/standalone" element={<SettingsPageWrapper />} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}





 

// ================================
// MAIN APP COMPONENT
// ================================
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}