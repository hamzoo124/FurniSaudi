// src/components/BuyerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, MessageSquare, Heart, Star, Wallet, FileText,
  AlertCircle, Bell, User, Settings, HelpCircle, Search, Filter,
  Package, Truck, CheckCircle, Clock, XCircle, RefreshCw, 
  ChevronRight, ChevronLeft, MapPin, Phone, Mail, CreditCard,
  Shield, Download, Eye, Edit, Trash2, Plus, ArrowRight, 
  Upload, Image as ImageIcon, Calendar, DollarSign, Tag,
  TrendingUp, BarChart3, Award, Truck as TruckIcon, Check,
  MessageCircle, Send, Paperclip, Smile, ShoppingCart,
  Grid, List, Share2, ThumbsUp, Star as StarIcon, Award as AwardIcon,
  Lock, Unlock, LogOut, Globe, Moon, Sun, Volume2, VolumeX,
  QrCode, Camera, Smartphone, Tablet, Monitor, Headphones,
  Gift, Zap, Coffee, Sofa, Chair, Bed, Table, Wardrobe,
  Couch, Lamp, Plant, Home as HomeIcon, Building, Factory,
  Users, Store, Package as PackageIcon, FileCheck, Activity,
  FolderTree, Layers, Megaphone, BarChart, Target, PieChart,
  Database, Target as TargetIcon, TrendingUp as TrendingUpIcon,
  TrendingDown, Percent, Award as AwardIcon2,
  // ADDED MISSING IMPORTS:
  ChevronDown, // For user menu dropdown
  Menu // For mobile menu toggle
} from 'lucide-react';

// Import hooks
import { supabase } from '../../lib/supabase'
// import { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
// import { useProducts } from '@/hooks/useProducts';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';


interface BuyerDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
  activeSection?: string;
}

// Types
interface BuyerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  created_at: string;
  addresses: Address[];
  default_payment_method: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  seller_id: string;
  seller_name: string;
  seller_avatar: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method: string;
  delivery_address: Address;
  estimated_delivery: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_custom: boolean;
  customization_details?: any;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_type: 'ready' | 'custom';
  quantity: number;
  unit_price: number;
  total_price: number;
  customization?: any;
  specifications?: string;
}

interface Review {
  id: string;
  order_id: string;
  seller_id: string;
  product_id: string;
  product_name: string;
  rating: number;
  comment: string;
  images?: string[];
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface CustomRequest {
  id: string;
  title: string;
  description: string;
  reference_images: string[];
  material_preference: string[];
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
  };
  color_preference: string[];
  budget_min: number;
  budget_max: number;
  delivery_city: string;
  status: 'draft' | 'submitted' | 'quotes_received' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  seller_quotes: SellerQuote[];
  selected_quote?: string;
  created_at: string;
  updated_at: string;
}

interface SellerQuote {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_rating: number;
  quote_amount: number;
  delivery_time: string;
  notes: string;
  materials_used: string[];
  warranty: string;
  revisions_included: number;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'buyer' | 'seller' | 'admin';
  message: string;
  attachments?: string[];
  read_at?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  seller_name: string;
  seller_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  order_id?: string;
  is_order_related: boolean;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'commission';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_id: string;
  created_at: string;
}

interface Dispute {
  id: string;
  order_id: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  evidence: string[];
  resolution?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ onNavigate, activeSection: propSection = 'dashboard' }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(propSection);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Wishlist states
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  
  // Messages states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Custom requests states
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [loadingCustomRequests, setLoadingCustomRequests] = useState(false);
  const [showCustomRequestModal, setShowCustomRequestModal] = useState(false);
  
  // Wallet states
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  // Disputes states
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  
  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingDeliveries: 0,
    walletBalance: 0,
    unreadMessages: 0,
    pendingReviews: 0,
    openDisputes: 0
  });
  
  // External hooks
  const { products: allProducts, fetchProducts } = useProducts();
  const { orders: allOrders, fetchOrders } = useOrders();

  // Update active section when prop changes
  useEffect(() => {
    if (propSection !== activeSection) {
      setActiveSection(propSection);
    }
  }, [propSection]);

  // Load buyer data
  const loadBuyerData = async () => {
    try {
      await Promise.all([
        loadProfile(),
        loadOrders(),
        loadWishlist(),
        loadConversations(),
        loadReviews(),
        loadCustomRequests(),
        loadWallet(),
        loadDisputes(),
        loadNotifications()
      ]);
      calculateStats();
    } catch (error) {
      console.error('Error loading buyer data:', error);
    }
  };

  useEffect(() => {
    loadBuyerData();
  }, [activeSection]);

  // Load profile
  const loadProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      // Try to load from database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.warn('Profile not found, creating default:', error.message);
        
        // Create default profile
        const defaultProfile: BuyerProfile = {
          id: user.id,
          full_name: user.name || 'Buyer',
          email: user.email || '',
          phone: user.phone || '+966 ',
          avatar_url: null,
          created_at: new Date().toISOString(),
          addresses: [],
          default_payment_method: 'cash',
          notification_preferences: {
            email: true,
            push: true,
            sms: false
          }
        };
        
        // Try to insert
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile]);
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
        
        setProfile(defaultProfile);
        return;
      }
      
      if (profileData) {
        // Load addresses
        const { data: addresses } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setProfile({
          ...profileData,
          addresses: addresses || [],
          notification_preferences: profileData.notification_preferences || {
            email: true,
            push: true,
            sms: false
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to localStorage
      const savedProfile = JSON.parse(localStorage.getItem(`user_${user.id}_profile`) || 'null');
      if (savedProfile) {
        setProfile(savedProfile);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load orders
  const loadOrders = async () => {
    if (!user) return;
    
    setLoadingOrders(true);
    try {
      // Try database first
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Error loading orders from database:', error.message);
        // Fallback to localStorage
        const savedOrders = JSON.parse(localStorage.getItem(`user_${user.id}_orders`) || '[]');
        setOrders(savedOrders);
        return;
      }
      
      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData);
        // Save to localStorage as backup
        localStorage.setItem(`user_${user.id}_orders`, JSON.stringify(ordersData));
      } else {
        // Load from localStorage as fallback
        const savedOrders = JSON.parse(localStorage.getItem(`user_${user.id}_orders`) || '[]');
        setOrders(savedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      const savedOrders = JSON.parse(localStorage.getItem(`user_${user.id}_orders`) || '[]');
      setOrders(savedOrders);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load wishlist
  const loadWishlist = async () => {
    if (!user) return;
    
    setLoadingWishlist(true);
    try {
      const savedWishlist = JSON.parse(localStorage.getItem(`user_${user.id}_wishlist`) || '[]');
      
      // Get product details for wishlist items
      const products = allProducts || [];
      const wishlistWithDetails = savedWishlist
        .map((itemId: string) => products.find((p: any) => p.id === itemId))
        .filter(Boolean);
      
      setWishlist(wishlistWithDetails);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const savedConversations = JSON.parse(localStorage.getItem(`user_${user.id}_conversations`) || '[]');
      
      if (savedConversations.length === 0) {
        // Create sample conversations
        const sampleConversations: Conversation[] = [
          {
            id: 'conv_1',
            buyer_id: user.id,
            seller_id: 'seller_1',
            seller_name: 'Giga Home',
            seller_avatar: 'https://i.pinimg.com/736x/bb/fa/77/bbfa7777e9b4091b9ba254b407914b65.jpg',
            last_message: 'Your custom sofa design is ready for review',
            last_message_time: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 1,
            order_id: 'order_1',
            is_order_related: true,
            updated_at: new Date().toISOString()
          },
          {
            id: 'conv_2',
            buyer_id: user.id,
            seller_id: 'seller_2',
            seller_name: 'Premium Furniture',
            seller_avatar: 'https://i.pinimg.com/736x/bb/fa/77/bbfa7777e9b4091b9ba254b407914b65.jpg',
            last_message: 'Delivery will be tomorrow between 2-4 PM',
            last_message_time: new Date(Date.now() - 86400000).toISOString(),
            unread_count: 0,
            order_id: 'order_2',
            is_order_related: true,
            updated_at: new Date().toISOString()
          }
        ];
        setConversations(sampleConversations);
        localStorage.setItem(`user_${user.id}_conversations`, JSON.stringify(sampleConversations));
      } else {
        setConversations(savedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load reviews
  const loadReviews = async () => {
    if (!user) return;
    
    setLoadingReviews(true);
    try {
      // Try database first
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Error loading reviews from database:', error.message);
        // Fallback to localStorage
        const savedReviews = JSON.parse(localStorage.getItem(`user_${user.id}_reviews`) || '[]');
        setReviews(savedReviews);
        return;
      }
      
      if (reviewsData) {
        setReviews(reviewsData);
        localStorage.setItem(`user_${user.id}_reviews`, JSON.stringify(reviewsData));
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      const savedReviews = JSON.parse(localStorage.getItem(`user_${user.id}_reviews`) || '[]');
      setReviews(savedReviews);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load custom requests
  const loadCustomRequests = async () => {
    if (!user) return;
    
    setLoadingCustomRequests(true);
    try {
      const savedRequests = JSON.parse(localStorage.getItem(`user_${user.id}_custom_requests`) || '[]');
      
      if (savedRequests.length === 0) {
        // Create sample requests
        const sampleRequests: CustomRequest[] = [
          {
            id: 'req_1',
            title: 'Custom L-shaped Sofa',
            description: 'Looking for a custom L-shaped sofa with premium fabric and built-in USB charging ports',
            reference_images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
            material_preference: ['Fabric', 'Premium Wood'],
            dimensions: {
              length: 240,
              width: 180,
              height: 90,
              unit: 'cm'
            },
            color_preference: ['Gray', 'Beige', 'Navy Blue'],
            budget_min: 2500,
            budget_max: 4000,
            delivery_city: 'Riyadh',
            status: 'quotes_received',
            seller_quotes: [
              {
                id: 'quote_1',
                seller_id: 'seller_1',
                seller_name: 'Giga Home',
                seller_rating: 4.8,
                quote_amount: 3200,
                delivery_time: '3-4 weeks',
                notes: 'Includes premium fabric, USB ports, and 2-year warranty',
                materials_used: ['Solid Oak Wood', 'Premium Fabric', 'High-density Foam'],
                warranty: '2 years',
                revisions_included: 3,
                created_at: new Date().toISOString()
              }
            ],
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setCustomRequests(sampleRequests);
        localStorage.setItem(`user_${user.id}_custom_requests`, JSON.stringify(sampleRequests));
      } else {
        setCustomRequests(savedRequests);
      }
    } catch (error) {
      console.error('Error loading custom requests:', error);
    } finally {
      setLoadingCustomRequests(false);
    }
  };

  // Load wallet
  const loadWallet = async () => {
    if (!user) return;
    
    try {
      const savedWallet = JSON.parse(localStorage.getItem(`user_${user.id}_wallet`) || '{}');
      setWalletBalance(savedWallet.balance || 0);
      setTransactions(savedWallet.transactions || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  // Load disputes
  const loadDisputes = async () => {
    if (!user) return;
    
    try {
      const savedDisputes = JSON.parse(localStorage.getItem(`user_${user.id}_disputes`) || '[]');
      setDisputes(savedDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const savedNotifications = JSON.parse(localStorage.getItem(`user_${user.id}_notifications`) || '[]');
      setNotifications(savedNotifications);
      setUnreadNotifications(savedNotifications.filter((n: any) => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => 
      ['pending', 'confirmed', 'in_production', 'shipped'].includes(o.status)
    ).length;
    const completedOrders = orders.filter(o => 
      ['delivered', 'completed'].includes(o.status)
    ).length;
    const pendingDeliveries = orders.filter(o => 
      ['confirmed', 'in_production', 'shipped'].includes(o.status)
    ).length;
    const unreadMessages = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
    const pendingReviews = orders.filter(o => 
      o.status === 'delivered' && 
      !reviews.some(r => r.order_id === o.id)
    ).length;
    const openDisputes = disputes.filter(d => 
      ['open', 'under_review'].includes(d.status)
    ).length;

    setStats({
      totalOrders,
      activeOrders,
      completedOrders,
      pendingDeliveries,
      walletBalance,
      unreadMessages,
      pendingReviews,
      openDisputes
    });
  };

  // Navigation handlers
  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    setShowMobileMenu(false);
    
    if (onNavigate) {
      onNavigate(`buyer/${section}`);
    }
  };

  const handleProductClick = (productId: string) => {
    if (onNavigate) {
      onNavigate(`product-${productId}`);
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    if (onNavigate) {
      onNavigate('order-details', { orderId: order.id });
    }
  };

  const handleViewConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setActiveSection('messages');
    
    // Mark as read
    const updatedConversations = conversations.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unread_count: 0 }
        : conv
    );
    setConversations(updatedConversations);
    localStorage.setItem(`user_${user.id}_conversations`, JSON.stringify(updatedConversations));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_id: user.id,
      sender_name: profile?.full_name || 'Buyer',
      sender_type: 'buyer',
      message: newMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Update conversation
    const updatedConversations = conversations.map(conv => 
      conv.id === activeConversation.id 
        ? { 
            ...conv, 
            last_message: newMessage,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        : conv
    );
    setConversations(updatedConversations);
    localStorage.setItem(`user_${user.id}_conversations`, JSON.stringify(updatedConversations));
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    alert('Product added to cart!');
  };

  const handleToggleWishlist = (productId: string) => {
    if (!user) return;
    
    const currentWishlist = JSON.parse(localStorage.getItem(`user_${user.id}_wishlist`) || '[]');
    
    if (currentWishlist.includes(productId)) {
      // Remove from wishlist
      const updatedWishlist = currentWishlist.filter((id: string) => id !== productId);
      localStorage.setItem(`user_${user.id}_wishlist`, JSON.stringify(updatedWishlist));
      setWishlist(wishlist.filter(p => p.id !== productId));
    } else {
      // Add to wishlist
      const updatedWishlist = [...currentWishlist, productId];
      localStorage.setItem(`user_${user.id}_wishlist`, JSON.stringify(updatedWishlist));
      
      const product = allProducts?.find((p: any) => p.id === productId);
      if (product) {
        setWishlist([...wishlist, product]);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // RENDER FUNCTIONS

  // 1. Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {stats.activeOrders} Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalOrders}</p>
          <p className="text-sm font-semibold text-gray-900">Total Orders</p>
          <p className="text-xs text-gray-600 mt-1">{stats.completedOrders} Completed</p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
              Coming Soon
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.pendingDeliveries}</p>
          <p className="text-sm font-semibold text-gray-900">Pending Deliveries</p>
          <p className="text-xs text-gray-600 mt-1">Track your shipments</p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              Secure
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatPrice(stats.walletBalance)}</p>
          <p className="text-sm font-semibold text-gray-900">Wallet Balance</p>
          <p className="text-xs text-gray-600 mt-1">Escrow protected</p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            {stats.unreadMessages > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">
                {stats.unreadMessages} New
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{conversations.length}</p>
          <p className="text-sm font-semibold text-gray-900">Active Conversations</p>
          <p className="text-xs text-gray-600 mt-1">{stats.unreadMessages} unread</p>
        </div>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => handleSectionClick('browse')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <span className="text-sm font-medium text-gray-900">Browse Furniture</span>
              <ChevronRight className="w-4 h-4 text-blue-500" />
            </button>
            <button 
              onClick={() => setShowCustomRequestModal(true)}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <span className="text-sm font-medium text-gray-900">Request Custom Furniture</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </button>
            {stats.pendingReviews > 0 && (
              <button 
                onClick={() => handleSectionClick('reviews')}
                className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">Pending Reviews</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingReviews}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-green-500" />
              </button>
            )}
            <button 
              onClick={() => handleSectionClick('wallet')}
              className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
            >
              <span className="text-sm font-medium text-gray-900">Add Funds to Wallet</span>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button 
              onClick={() => handleSectionClick('orders')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
          {loadingOrders ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="p-3 bg-gray-100 rounded-lg animate-pulse h-16"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet</p>
              <button
                onClick={() => handleSectionClick('browse')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Start Shopping →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => handleViewOrderDetails(order)}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">#{order.order_number}</p>
                    <p className="text-xs text-gray-600">{order.seller_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended & Wishlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Furniture */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended For You</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {allProducts?.slice(0, 4).map((product: any) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80'}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs font-bold text-blue-600">{formatPrice(parseFloat(product.price))}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleSectionClick('browse')}
            className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
          >
            View More Recommendations →
          </button>
        </div>

        {/* Wishlist Preview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Wishlist</h3>
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          {loadingWishlist ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="bg-gray-100 rounded-lg animate-pulse h-40"></div>
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-6">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Your wishlist is empty</p>
              <button
                onClick={() => handleSectionClick('browse')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Browse Products →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {wishlist.slice(0, 4).map((product) => (
                <div 
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(product.id);
                    }}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-red-50 transition"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs font-bold text-blue-600">{formatPrice(parseFloat(product.price))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {wishlist.length > 0 && (
            <button
              onClick={() => handleSectionClick('wishlist')}
              className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Full Wishlist ({wishlist.length} items) →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // 2. Browse Furniture
  const renderBrowseFurniture = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Browse Furniture</h2>
            <p className="text-gray-600 text-sm mt-1">
              {allProducts?.length || 0} products available • Indoor & Outdoor • Custom & Ready-made
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search furniture..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
          {[
            { label: 'All', count: allProducts?.length || 0 },
            { label: 'Indoor', count: allProducts?.filter((p: any) => p.placement !== 'outdoor').length || 0 },
            { label: 'Outdoor', count: allProducts?.filter((p: any) => p.placement === 'outdoor').length || 0 },
            { label: 'Custom', count: allProducts?.filter((p: any) => p.type === 'customized').length || 0 },
            { label: 'Ready-made', count: allProducts?.filter((p: any) => p.type === 'ready').length || 0 },
            { label: 'On Sale', count: allProducts?.filter((p: any) => p.discount).length || 0 },
            { label: 'Top Rated', count: allProducts?.filter((p: any) => parseFloat(p.rating) >= 4.5).length || 0 }
          ].map((filter) => (
            <button
              key={filter.label}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
            >
              <span className="font-medium text-gray-700">{filter.label}</span>
              <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full">
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allProducts?.map((product: any) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="relative mb-3">
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  {product.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {product.discount}
                    </div>
                  )}
                  {product.isTopSeller && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Top
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(product.id);
                    }}
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow hover:bg-red-50 transition"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        wishlist.some((p: any) => p.id === product.id) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                    <span className="text-xs text-gray-500">
                      {product.type === 'customized' ? '🎨 Custom' : '📦 Ready'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <img 
                      src={product.companyLogo} 
                      alt={product.companyName}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-xs text-gray-600">{product.companyName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviews})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.placement === 'outdoor' ? '🌳 Outdoor' : '🏠 Indoor'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {formatPrice(parseFloat(product.price))}
                      </p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(parseFloat(product.originalPrice))}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className="px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {allProducts?.map((product: any) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
              >
                <img
                  src={product.image || product.images?.[0]}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <img 
                          src={product.companyLogo} 
                          alt={product.companyName}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-gray-600">{product.companyName}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {product.type === 'customized' ? 'Customizable' : 'Ready-made'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          wishlist.some((p: any) => p.id === product.id) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviews} reviews)</span>
                    </div>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {product.orders || 0} orders
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {product.placement === 'outdoor' ? 'Outdoor' : 'Indoor'}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {formatPrice(parseFloat(product.price))}
                      </p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(parseFloat(product.originalPrice))}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 3. My Orders
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
            <p className="text-gray-600 text-sm mt-1">
              Total: {stats.totalOrders} • Active: {stats.activeOrders} • Completed: {stats.completedOrders}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadOrders}
              disabled={loadingOrders}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.activeOrders}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.pendingDeliveries}</div>
            <div className="text-sm text-gray-600">In Delivery</div>
          </div>
        </div>

        {/* Orders Table */}
        {loadingOrders ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="p-4 bg-gray-100 rounded-lg animate-pulse h-20"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No orders yet</h3>
            <p className="text-gray-500 text-sm">Your orders will appear here</p>
            <button
              onClick={() => handleSectionClick('browse')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Seller</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">#{order.order_number}</div>
                      <div className="text-xs text-gray-500">
                        {order.is_custom ? '🎨 Custom' : '📦 Ready-made'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700">{formatDate(order.created_at)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={order.seller_avatar} 
                          alt={order.seller_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-700">{order.seller_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">{order.items.length} items</span>
                        {order.items[0]?.product_image && (
                          <img 
                            src={order.items[0].product_image} 
                            alt={order.items[0].product_name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{formatPrice(order.total)}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.payment_status}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View
                        </button>
                        {['pending', 'confirmed'].includes(order.status) && (
                          <button className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                            Cancel
                          </button>
                        )}
                        {order.status === 'delivered' && !reviews.some(r => r.order_id === order.id) && (
                          <button
                            onClick={() => handleSectionClick('reviews')}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // 4. Messages (Simplified version)
  const renderMessages = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
      {activeConversation ? (
        <div className="flex h-full">
          {/* Conversation List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleViewConversation(conv)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${activeConversation.id === conv.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={conv.seller_avatar} 
                      alt={conv.seller_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {conv.seller_name}
                        </h4>
                        {conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={activeConversation.seller_avatar} 
                  alt={activeConversation.seller_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{activeConversation.seller_name}</h3>
                  <p className="text-xs text-gray-500">Online • Responds within hours</p>
                </div>
              </div>
              <button
                onClick={() => setActiveConversation(null)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.sender_type === 'buyer' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-6">
          <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Your Messages</h3>
          <p className="text-gray-500 text-center max-w-md mb-6">
            Start a conversation with sellers about your orders, custom requests, or products
          </p>
          <div className="space-y-3 w-full max-w-md">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleViewConversation(conv)}
                className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={conv.seller_avatar} 
                    alt={conv.seller_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{conv.seller_name}</h4>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unread_count} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.last_message_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 5. Wishlist
  const renderWishlist = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Wishlist</h2>
            <p className="text-gray-600 text-sm mt-1">
              {wishlist.length} items • Save your favorite furniture
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadWishlist}
              disabled={loadingWishlist}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingWishlist ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleSectionClick('browse')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {loadingWishlist ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-gray-100 rounded-xl p-3 animate-pulse h-64"></div>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 text-sm mb-6">Save products you love for later</p>
            <button
              onClick={() => handleSectionClick('browse')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlist.map((product) => (
              <div 
                key={product.id}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg transition-all group"
              >
                <div className="relative mb-3">
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  />
                  <button
                    onClick={() => handleToggleWishlist(product.id)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-red-50 transition"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                  {product.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {product.discount}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 
                    className="font-semibold text-gray-900 text-sm line-clamp-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {formatPrice(parseFloat(product.price))}
                      </p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(parseFloat(product.originalPrice))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleProductClick(product.id)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="flex-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 6. Profile
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
            <p className="text-gray-600 text-sm mt-1">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.full_name?.charAt(0) || 'B'}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border border-gray-200 hover:bg-gray-50">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{profile?.full_name}</h3>
                  <p className="text-gray-600 text-sm">{profile?.email}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Verified Buyer
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Member since {profile ? new Date(profile.created_at).getFullYear() : '2024'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile?.full_name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile?.phone || '+966 '}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
                <button className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800">
                  <Plus className="w-4 h-4" />
                  <span>Add New</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{address.label}</span>
                          {address.is_default && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{address.full_name}</p>
                        <p className="text-sm text-gray-600">{address.address_line1}</p>
                        <p className="text-sm text-gray-600">{address.district}, {address.city}</p>
                        <p className="text-sm text-gray-600">{address.phone}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences & Security */}
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notification Preferences</h3>
              <div className="space-y-3">
                {Object.entries(profile?.notification_preferences || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!value}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{key} notifications</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Security</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Change Password
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Two-Factor Authentication
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Connected Devices
                </button>
              </div>
            </div>

            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Account Actions</h3>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
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

  // 7. Wallet
  const renderWallet = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Your Wallet</h2>
            <p className="text-blue-100">Secure escrow payments • Instant refunds</p>
          </div>
          <Shield className="w-8 h-8 text-white/80" />
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-blue-100 text-sm">Available Balance</p>
            <p className="text-4xl font-bold mt-1">{formatPrice(walletBalance)}</p>
            <div className="flex items-center space-x-4 mt-4">
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
                Add Funds
              </button>
              <button className="px-4 py-2 border border-white text-white rounded-lg font-medium hover:bg-white/10">
                Withdraw
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Escrow Protected</p>
            <p className="text-lg font-bold">100% Secure</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <div className="flex items-center space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>All Transactions</option>
              <option>Deposits</option>
              <option>Payments</option>
              <option>Refunds</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                    transaction.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                    transaction.type === 'refund' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : transaction.type === 'payment' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'deposit' ? 'text-green-600' :
                    transaction.type === 'refund' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                    {formatPrice(transaction.amount)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Main render based on active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'home':
        return renderBrowseFurniture();
      case 'browse':
        return renderBrowseFurniture();
      case 'orders':
        return renderOrders();
      case 'messages':
        return renderMessages();
      case 'wishlist':
        return renderWishlist();
      case 'reviews':
        // Similar structure to other sections
        return <div className="text-center py-12">Reviews section coming soon</div>;
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
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Buyer Dashboard</h1>
              
              {/* Navigation for desktop */}
              <div className="hidden lg:flex items-center space-x-1">
                {[
                  { id: 'dashboard', icon: Home, label: 'Dashboard' },
                  { id: 'browse', icon: ShoppingBag, label: 'Browse' },
                  { id: 'orders', icon: Package, label: 'Orders' },
                  { id: 'messages', icon: MessageSquare, label: 'Messages' },
                  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
                  { id: 'reviews', icon: Star, label: 'Reviews' },
                  { id: 'wallet', icon: Wallet, label: 'Wallet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionClick(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
                      activeSection === item.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dashboard..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {profile?.full_name?.charAt(0) || 'B'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-600">Buyer</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => handleSectionClick('profile')}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => handleSectionClick('settings')}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
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

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard' },
              { id: 'browse', icon: ShoppingBag, label: 'Browse' },
              { id: 'orders', icon: Package, label: 'Orders' },
              { id: 'messages', icon: MessageSquare, label: 'Messages' },
              { id: 'wishlist', icon: Heart, label: 'Wishlist' },
              { id: 'reviews', icon: Star, label: 'Reviews' },
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
              { id: 'profile', icon: User, label: 'Profile' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={`flex flex-col items-center p-3 rounded-lg transition ${
                  activeSection === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {renderActiveSection()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <span>© {new Date().getFullYear()} Furniture Marketplace</span>
            <span className="text-gray-400">•</span>
            <span>Buyer Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Need help? </span>
            <button 
              onClick={() => handleSectionClick('support')}
              className="text-blue-600 hover:text-blue-800"
            >
              Contact Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BuyerDashboard;