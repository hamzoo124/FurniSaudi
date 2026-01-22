// src/components/admin/AdminDashboard.tsx - SIMPLIFIED WHITE VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


// Lucide React imports
import { 
  Home,
  Users,
  Package,
  BarChart,
  Settings,
  Bell,
  Search,
  LogOut,
  DollarSign,
  ShoppingCart,
  UserPlus,
  RefreshCw,
  Eye,
  Check,
  X,
  Tag,
  MessageCircle,
  Activity,
  FolderTree,
  Shield,
  CreditCard,
  FileText,
  TrendingUp,
  Filter,
  Clock,
  FileCheck,
  ShoppingBag,
  Target,
  PieChart,
  Database,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  EyeOff,
  Grid,
  List,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Copy,
  Archive,
  BookOpen,
  Folder,
  Percent,
  Truck,
  Send,
  Receipt,
  AlertOctagon,
  MessageSquare,
  FileDown,
  TrendingDown,
  Store,
  Layers,
  Award,
  Wallet,
  BarChart3,
  Lock,
  Unlock,
  Megaphone,
  MoreHorizontal,
  Building,
  FileEdit,
  Verified,
  ExternalLink,
  Info,
  Ban,
  MoreVertical,
  ShieldCheck,
  MessageSquareMore,
  FileTextIcon,
  BadgeCheck,
  AlertTriangleIcon,
  Zap,
  TrendingUp as TrendingUpIcon,
  Package2,
  CreditCardIcon,
  UserCog,
  StoreIcon,
  ShoppingCartIcon,
  BarChart4,
  ActivityIcon,
  MessageSquareText,
  CalendarDays,
  DownloadCloud,
  UploadCloud,
  FileWarning,
  CheckSquare,
  XSquare,
  HelpCircle,
  Mail as MailIcon,
  PhoneCall,
  MapPin as MapPinIcon,
  User,
  Building2,
  FileDigit,
  Banknote,
  ReceiptText,
  Ship,
  Clock4,
  FileQuestion,
  MessageSquarePlus,
  AlertCircleIcon,
  BellRing,
  UsersRound,
  PackagePlus,
  ShoppingBasket,
  ShieldAlert,
  WalletCards,
  FileBarChart,
  Megaphone as MegaphoneIcon,
  LayoutGrid,
  List as ListIcon,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
  Share2,
  Printer,
  Bookmark,
  Star as StarIcon,
  Heart,
  Flag,
  ArchiveRestore,
  RotateCcw,
  Save,
  Loader2,
  AlertOctagon as AlertOctagonIcon,
  CheckCircle2,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart,
  CandlestickChart,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon2,
  Minus,
  Divide,
  Hash,
  Pilcrow,
  PilcrowSquare,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Highlighter,
  Eraser,
  Paintbrush,
  Palette,
  Droplet,
  Contrast,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Mic,
  Mic2,
  Video,
  Camera,
  Image,
  Music,
  Film,
  Gamepad2,
  Mouse,
  Keyboard,
  HardDrive,
  Server,
  Database as DatabaseIcon,
  Cloud,
  Globe,
  Wifi,
  Bluetooth,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  Power,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Key,
  Fingerprint,
  Scan,
  QrCode,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus as UserPlusIcon,
  Users as UsersIcon
} from 'lucide-react';

// Import hooks
import { supabaseAdmin as supabase } from '../lib/supabase'
// import AdminAdvertising from 'AdminAdvertising

// import ActivityLogs from '@/components/ActivityLogs';
import ActivityLogs from './ActivityLogs';

// Hooks
// import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardData } from '../hooks/useDashboardData';
import {useSellers} from '../hooks/useSellers';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import { useReviews } from '../hooks/useReviews';
import { useWallet } from '../hooks/useWallet';
// import { useContracts } from '../useAccountSettings/hooks/useContracts';
import {useContracts} from '../hooks/useContracts';
import { useAdvertising } from '../hooks/useAdvertising';
// import { useActivityLogs } from '@/hooks/useActivityLogs';
import {useActivityLogs} from '../hooks/useActivityLogs';
import SellerDetailModal from './SellerDetailModal';

// Types
interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
  section?: string;
}

interface SellerApplication {
  id: string;
  application_id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
  contact_number: string;
  address: string;
  city: string;
  business_type: 'individual' | 'company';
  business_description: string;
  cr_number: string;
  cr_document_url: string | null;
  bank_name: string;
  account_number: string;
  iban: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'more_info_needed';
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
}

interface Seller {
  id: string;
  user_id: string;
  application_id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  business_type: string;
  business_description: string;
  cr_number: string;
  cr_document_url: string | null;
  bank_name: string;
  account_number: string;
  iban: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  status: 'active' | 'inactive';
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  pending_payout: number;
  rating_avg: number;
  total_products: number;
  total_orders: number;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    email: string;
    phone: string;
    created_at: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 'admin' | 'seller' | 'buyer' | 'seller_pending' | 'seller_rejected';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  phone?: string;
  avatar_url?: string;
  business_name?: string;
  business_type?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at: string;
  last_sign_in_at?: string;
  total_orders?: number;
  total_spent?: number;
  total_products?: number;
  approval_status?: 'approved' | 'pending' | 'rejected' | 'suspended';
  seller_details?: Seller | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  category_id: string;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string;
  product_categories: string[];
  price: number;
  discounted_price: number | null;
  stock_quantity: number;
  sku: string;
  barcode: string | null;
  status: 'draft' | 'active' | 'inactive';
  is_published: boolean;
  is_featured: boolean;
  is_promoted: boolean;
  seller_id: string;
  seller_name: string;
  images: string[];
  main_image: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    unit: string;
  };
  weight: string | null;
  material: string | null;
  finish_type: string | null;
  primary_color: string | null;
  available_colors: string[];
  warranty_type: string | null;
  warranty_duration: string | null;
  has_variants: boolean;
  variants: any[];
  shipping_info: {
    available_cities: any[];
    shipping_options: any;
  };
  installation_available: boolean;
  installation_fee: string;
  return_policy: any;
  customization_time: string | null;
  materials_used: string[];
  display_section: string | null;
  rating: number;
  orders: number;
  reviews: any[];
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    display_name: string;
  };
}

interface NavItem {
  id: string;
  icon: any;
  label: string;
  showInMain?: boolean;
}

// Simple white/whitesmoke color palette
const simpleColors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    hover: '#F9F9F9'
  },
  border: {
    light: '#E5E5E5',
    medium: '#D4D4D4',
    dark: '#A3A3A3'
  },
  text: {
    primary: '#262626',
    secondary: '#525252',
    tertiary: '#737373',
    light: '#A3A3A3'
  },
  status: {
    active: '#16A34A',
    pending: '#F59E0B',
    rejected: '#DC2626',
    suspended: '#6B7280',
    draft: '#6B7280',
    promoted: '#F59E0B',
    approved: '#059669',
    under_review: '#2563EB',
    more_info_needed: '#7C3AED'
  }
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, section: propSection = 'dashboard' }) => {
  const navigate = useNavigate();
  
  // ============ STATE DECLARATIONS ============
  const [activeSection, setActiveSection] = useState(propSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([]);
  const [activeSellers, setActiveSellers] = useState<Seller[]>([]);
  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [applicationStats, setApplicationStats] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('active');
  
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFilter, setProductsFilter] = useState<string>('all');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [productStats, setProductStats] = useState<any>({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    outOfStock: 0,
    promoted: 0,
    readyMade: 0,
    customized: 0
  });
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSellerDetailModal, setShowSellerDetailModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [messageContent, setMessageContent] = useState('');
  
  const [additionalMetrics, setAdditionalMetrics] = useState({
    pendingPayments: 12,
    releasePayments: 8,
    warningsToSellers: 5,
    newSellerRequests: 7,
    buyerSellerMessages: 23,
    communications: 45,
    lateDeliveries: 3,
    lateDispatch: 2,
    lateReturnPayments: 1,
    totalDownloads: 156
  });

  const prevSellersRef = useRef<Seller[]>([]);
  const prevApplicationsRef = useRef<SellerApplication[]>([]);
  const prevProductsRef = useRef<Product[]>([]);
  const isInitialLoad = useRef(true);

  // ============ ORIGINAL HOOKS ============
  useEffect(() => {
    if (propSection && propSection !== activeSection) {
      setActiveSection(propSection);
    }
  }, [propSection]);

  const {
    metrics,
    chartData,
    recentActivities: dashboardActivities,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useDashboardData();

  const {
    sellers: hookSellers,
    pendingSellers: hookPendingSellers,
    sellerStats: hookSellerStats,
    loading: sellersLoading,
    approveSeller: approveSellerApi,
    rejectSeller: rejectSellerApi,
    suspendSeller: suspendSellerApi,
    activateSeller: activateSellerApi,
    fetchSellers: fetchHookSellers,
    fetchSellerStats: fetchHookSellerStats,
  } = useSellers();

 const {
  products: allProducts,
  pendingProducts,
  productStats: hookProductStats,
  loading: hookProductsLoading,
  fetchProducts,
} = useProducts();

  const { orders: allOrders,  orderStats,recentOrders = [],loading: ordersLoading, } = useOrders();

//  const { reviews, reviewStats, pendingReviews, loading: reviewsLoading } = useReview);
const sellerId = currentUser?.id || 'demo-seller'; // or get from context/auth

const { reviews, reviewStats, pendingReviews, loading: reviewsLoading } = useReviews(sellerId);


  const {
    stats: walletStats,
    payoutSummary,
    loading: walletLoading,
  } = useWallet();

  const {
    stats: contractStats,
    loading: contractsLoading,
  } = useContracts();

  const {
    stats: adStats,
    loading: adsLoading,
  } = useAdvertising();

  const {
    stats: activityStats,
    loading: activityLoading,
  } = useActivityLogs();

  // ============ DATA LOADING FUNCTIONS ============
  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      
      if (!isInitialLoad.current && products.length > 0 && productsFilter === 'all' && categoryTypeFilter === 'all' && productTypeFilter === 'all') {
        setProductsLoading(false);
        return;
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name, display_name)
        `)
        .order('created_at', { ascending: false });

      if (productsFilter !== 'all') {
        if (productsFilter === 'active') {
          query = query.eq('status', 'active').eq('is_published', true);
        } else if (productsFilter === 'pending') {
          query = query.eq('status', 'draft');
        } else if (productsFilter === 'rejected') {
          query = query.eq('status', 'inactive');
        } else if (productsFilter === 'out_of_stock') {
          query = query.lte('stock_quantity', 0);
        } else if (productsFilter === 'promoted') {
          query = query.eq('is_promoted', true);
        }
      }

      if (categoryTypeFilter !== 'all') {
        query = query.eq('category_type', categoryTypeFilter);
      }

      if (productTypeFilter !== 'all') {
        query = query.eq('product_type', productTypeFilter);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,seller_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      let fetchedProducts: Product[] = [];
      if (error) {
        console.error('Database error loading products:', error);
        if (prevProductsRef.current.length > 0) {
          fetchedProducts = prevProductsRef.current;
        } else {
          if (allProducts && allProducts.length > 0) {
            fetchedProducts = allProducts;
          }
        }
      } else if (data) {
        fetchedProducts = data as Product[];
      }

      const stats = {
        total: fetchedProducts.length,
        active: fetchedProducts.filter(p => p.status === 'active' && p.is_published).length,
        pending: fetchedProducts.filter(p => p.status === 'draft').length,
        rejected: fetchedProducts.filter(p => p.status === 'inactive').length,
        outOfStock: fetchedProducts.filter(p => p.stock_quantity <= 0).length,
        promoted: fetchedProducts.filter(p => p.is_promoted).length,
        readyMade: fetchedProducts.filter(p => p.category_type === 'ready_made').length,
        customized: fetchedProducts.filter(p => p.category_type === 'customized').length
      };

      setProductStats(stats);
      setProducts(fetchedProducts);
      prevProductsRef.current = fetchedProducts;

    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
      isInitialLoad.current = false;
    }
  }, [productsFilter, categoryTypeFilter, productTypeFilter, searchQuery, allProducts]);

  const loadSellerApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!isInitialLoad.current && sellerApplications.length > 0) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      let apps = [];
      if (error) {
        console.error('Database error:', error);
        if (prevApplicationsRef.current.length > 0) {
          apps = prevApplicationsRef.current;
        } else {
          const localApps = JSON.parse(localStorage.getItem('seller_applications_fallback') || '[]');
          apps = localApps;
        }
      } else if (data) {
        apps = data;
      } else {
        if (prevApplicationsRef.current.length > 0) {
          apps = prevApplicationsRef.current;
        } else {
          const localApps = JSON.parse(localStorage.getItem('seller_applications_fallback') || '[]');
          apps = localApps;
        }
      }

      const shouldUpdate = JSON.stringify(apps) !== JSON.stringify(prevApplicationsRef.current);
      
      if (shouldUpdate) {
        let filteredApps = apps;
        if (activeFilter !== 'all') {
          filteredApps = apps.filter((app: any) => app.status === activeFilter);
        }

        if (searchQuery) {
          filteredApps = filteredApps.filter((app: any) =>
            app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setSellerApplications(filteredApps);
        prevApplicationsRef.current = apps;

        const stats = {
          applications: {
            total: apps.length,
            pending: apps.filter((a: any) => a.status === 'pending').length,
            under_review: apps.filter((a: any) => a.status === 'under_review').length,
            approved: apps.filter((a: any) => a.status === 'approved').length,
            rejected: apps.filter((a: any) => a.status === 'rejected').length,
            more_info_needed: apps.filter((a: any) => a.status === 'more_info_needed').length
          }
        };
        setApplicationStats(stats);
      }

    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [activeFilter, searchQuery]);

  const loadAllSellers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!isInitialLoad.current && allSellers.length > 0) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sellers')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      let sellers = [];
      if (error) {
        console.error('Error fetching sellers:', error);
        if (prevSellersRef.current.length > 0) {
          sellers = prevSellersRef.current;
        } else {
          const { data: approvedApps } = await supabase
            .from('seller_applications')
            .select('*')
            .eq('status', 'approved');

          if (approvedApps && approvedApps.length > 0) {
            sellers = approvedApps.map((app: any) => ({
              id: `seller_from_app_${app.id}`,
              user_id: app.user_id,
              application_id: app.application_id,
              business_name: app.business_name,
              email: app.email,
              phone: app.contact_number,
              address: app.address,
              city: app.city,
              business_type: app.business_type,
              business_description: app.business_description,
              cr_number: app.cr_number,
              cr_document_url: app.cr_document_url,
              bank_name: app.bank_name,
              account_number: app.account_number,
              iban: app.iban,
              approval_status: 'approved',
              status: 'active',
              commission_rate: 10.00,
              total_sales: 0,
              total_earnings: 0,
              pending_payout: 0,
              rating_avg: 0,
              total_products: 0,
              total_orders: 0,
              suspension_reason: null,
              created_at: app.submitted_at,
              updated_at: app.updated_at,
              profiles: {
                full_name: app.full_name,
                avatar_url: null,
                email: app.email,
                phone: app.contact_number,
                created_at: app.submitted_at
              }
            }));
          } else {
            if (prevSellersRef.current.length > 0) {
              sellers = prevSellersRef.current;
            } else {
              const localApps = JSON.parse(localStorage.getItem('seller_applications_fallback') || '[]');
              sellers = localApps
                .filter((app: any) => app.status === 'approved')
                .map((app: any) => ({
                  id: app.id,
                  user_id: app.user_id,
                  application_id: app.application_id,
                  business_name: app.business_name,
                  email: app.email,
                  phone: app.contact_number,
                  address: app.address,
                  city: app.city,
                  business_type: app.business_type,
                  business_description: app.business_description,
                  cr_number: app.cr_number,
                  cr_document_url: app.cr_document_url,
                  bank_name: app.bank_name,
                  account_number: app.account_number,
                  iban: app.iban,
                  approval_status: 'approved',
                  status: 'active',
                  commission_rate: 10.00,
                  total_sales: 0,
                  total_earnings: 0,
                  pending_payout: 0,
                  rating_avg: 0,
                  total_products: 0,
                  total_orders: 0,
                  suspension_reason: null,
                  created_at: app.submitted_at,
                  updated_at: app.updated_at,
                  profiles: {
                    full_name: app.full_name,
                    avatar_url: null,
                    email: app.email,
                    phone: app.contact_number,
                    created_at: app.submitted_at
                  }
                }));
            }
          }
        }
      } else if (data) {
        sellers = data;
      } else {
        sellers = prevSellersRef.current;
      }

      const shouldUpdate = JSON.stringify(sellers) !== JSON.stringify(prevSellersRef.current);
      
      if (shouldUpdate) {
        let filteredSellers = sellers;
        if (sellerFilter !== 'all') {
          if (sellerFilter === 'active') {
            filteredSellers = sellers.filter((s: any) =>
              s.approval_status === 'approved' && s.status === 'active'
            );
          } else if (sellerFilter === 'pending') {
            filteredSellers = sellers.filter((s: any) =>
              s.approval_status === 'pending'
            );
          } else if (sellerFilter === 'suspended') {
            filteredSellers = sellers.filter((s: any) =>
              s.approval_status === 'suspended'
            );
          } else if (sellerFilter === 'rejected') {
            filteredSellers = sellers.filter((s: any) =>
              s.approval_status === 'rejected'
            );
          } else if (sellerFilter === 'inactive') {
            filteredSellers = sellers.filter((s: any) =>
              s.status === 'inactive'
            );
          }
        }

        if (searchQuery) {
          filteredSellers = filteredSellers.filter((seller: any) =>
            seller.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setAllSellers(filteredSellers);
        setActiveSellers(filteredSellers.filter((s: any) =>
          s.approval_status === 'approved' && s.status === 'active'
        ));

        const stats = {
          total: sellers.length,
          active: sellers.filter((s: any) => s.approval_status === 'approved' && s.status === 'active').length,
          pending: sellers.filter((s: any) => s.approval_status === 'pending').length,
          suspended: sellers.filter((s: any) => s.approval_status === 'suspended').length,
          rejected: sellers.filter((s: any) => s.approval_status === 'rejected').length,
          inactive: sellers.filter((s: any) => s.status === 'inactive').length,
          total_products: sellers.reduce((sum: number, s: any) => sum + (s.total_products || 0), 0),
          total_sales: sellers.reduce((sum: number, s: any) => sum + (s.total_sales || 0), 0),
          total_earnings: sellers.reduce((sum: number, s: any) => sum + (s.total_earnings || 0), 0),
          pending_payouts: sellers.reduce((sum: number, s: any) => sum + (s.pending_payout || 0), 0),
          avg_rating: sellers.length > 0
            ? sellers.reduce((sum: number, s: any) => sum + (s.rating_avg || 0), 0) / sellers.length
            : 0,
          avg_commission_rate: sellers.length > 0
            ? sellers.reduce((sum: number, s: any) => sum + (s.commission_rate || 0), 0) / sellers.length
            : 0
        };
        setSellerStats(stats);
        prevSellersRef.current = sellers;
      }

    } catch (error) {
      console.error('Error loading sellers:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [sellerFilter, searchQuery]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sellers (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const [authUsersResponse, sellersResponse] = await Promise.all([
          supabase.auth.admin.listUsers(),
          supabase.from('sellers').select('*')
        ]);

        const allUsers: User[] = [];

        if (authUsersResponse.data?.users) {
          for (const authUser of authUsersResponse.data.users) {
            const user: User = {
              id: authUser.id,
              email: authUser.email || 'No email',
              full_name: authUser.user_metadata?.full_name || 'Unknown User',
              user_type: authUser.user_metadata?.user_type || 'buyer',
              status: 'active',
              phone: authUser.phone || '',
              created_at: authUser.created_at || new Date().toISOString(),
              last_sign_in_at: authUser.last_sign_in_at,
              total_orders: 0,
              total_spent: 0,
              total_products: 0,
              seller_details: null
            };

            if (sellersResponse.data) {
              const seller = sellersResponse.data.find((s: any) => s.user_id === authUser.id);
              if (seller) {
                user.seller_details = seller;
                user.approval_status = seller.approval_status;
                user.user_type = 'seller';
                user.total_products = seller.total_products || 0;
                user.total_orders = seller.total_orders || 0;
              }
            }

            allUsers.push(user);
          }
        }

        setUsers(allUsers);
        return;
      }

      const allUsers: User[] = [];

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          const user: User = {
            id: profile.id,
            email: profile.email || 'No email',
            full_name: profile.full_name || 'Unknown User',
            user_type: profile.user_type as any || 'buyer',
            status: 'active',
            phone: profile.phone || '',
            avatar_url: profile.avatar_url,
            business_name: profile.business_name,
            business_type: profile.business_type,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            created_at: profile.created_at || new Date().toISOString(),
            last_sign_in_at: profile.last_sign_in_at,
            total_orders: 0,
            total_spent: 0,
            total_products: 0,
            seller_details: null
          };

          if (profile.user_type === 'seller' || profile.user_type === 'seller_pending' || profile.user_type === 'seller_rejected') {
            if (profile.sellers && profile.sellers.length > 0) {
              const seller = profile.sellers[0];
              user.seller_details = seller;
              user.approval_status = seller.approval_status;
              user.total_products = seller.total_products || 0;
              user.total_orders = seller.total_orders || 0;

              if (seller.approval_status === 'suspended') {
                user.status = 'suspended';
              } else if (seller.approval_status === 'pending') {
                user.status = 'pending';
              } else if (seller.status === 'inactive') {
                user.status = 'suspended';
              } else {
                user.status = 'active';
              }
            } else {
              user.approval_status = 'pending';
              user.status = 'pending';
            }
          }

          if (profile.user_type === 'seller_pending') {
            user.status = 'pending';
            user.approval_status = 'pending';
          } else if (profile.user_type === 'seller_rejected') {
            user.status = 'suspended';
            user.approval_status = 'rejected';
          }

          allUsers.push(user);
        }
      }

      const { data: allSellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*');

      if (!sellersError && allSellersData) {
        for (const seller of allSellersData) {
          const exists = allUsers.find(u => u.id === seller.user_id);
          if (!exists) {
            allUsers.push({
              id: seller.user_id,
              email: seller.email || 'No email',
              full_name: seller.business_name || 'Unknown Seller',
              user_type: 'seller',
              status: seller.status === 'active' ? 'active' : 'suspended',
              phone: seller.phone || '',
              business_name: seller.business_name,
              business_type: seller.business_type,
              address: seller.address,
              city: seller.city,
              created_at: seller.created_at || new Date().toISOString(),
              total_orders: seller.total_orders || 0,
              total_products: seller.total_products || 0,
              approval_status: seller.approval_status,
              seller_details: seller
            });
          }
        }
      }

      setUsers(allUsers);

    } catch (error) {
      console.error('Error loading users:', error);
      const fallbackUsers: User[] = allSellers.map((seller: any) => ({
        id: seller.user_id,
        email: seller.email,
        full_name: seller.profiles?.full_name || seller.business_name,
        user_type: 'seller',
        status: seller.status === 'active' ? 'active' : 'suspended',
        phone: seller.phone,
        business_name: seller.business_name,
        business_type: seller.business_type,
        address: seller.address,
        city: seller.city,
        created_at: seller.created_at,
        total_orders: seller.total_orders || 0,
        total_products: seller.total_products || 0,
        approval_status: seller.approval_status,
        seller_details: seller
      }));
      setUsers(fallbackUsers);
    } finally {
      setUsersLoading(false);
    }
  }, [allSellers]);

  // ============ ACTION HANDLERS ============
  const handleApproveApplication = async () => {
    if (!selectedApplication) return;

    try {
      setIsLoading(true);

      const { error: appError } = await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: approvalNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      setSellerApplications(prev => prev.map(app =>
        app.id === selectedApplication.id
          ? { ...app, status: 'approved', reviewed_at: new Date().toISOString() }
          : app
      ));

      const newSeller: Seller = {
        id: `seller_${selectedApplication.id}`,
        user_id: selectedApplication.user_id,
        application_id: selectedApplication.application_id,
        business_name: selectedApplication.business_name,
        email: selectedApplication.email,
        phone: selectedApplication.contact_number,
        address: selectedApplication.address,
        city: selectedApplication.city,
        business_type: selectedApplication.business_type,
        business_description: selectedApplication.business_description,
        cr_number: selectedApplication.cr_number,
        cr_document_url: selectedApplication.cr_document_url,
        bank_name: selectedApplication.bank_name,
        account_number: selectedApplication.account_number,
        iban: selectedApplication.iban,
        approval_status: 'approved',
        status: 'active',
        commission_rate: 10.00,
        total_sales: 0,
        total_earnings: 0,
        pending_payout: 0,
        rating_avg: 0,
        total_products: 0,
        total_orders: 0,
        suspension_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          full_name: selectedApplication.full_name,
          avatar_url: null,
          email: selectedApplication.email,
          phone: selectedApplication.contact_number,
          created_at: selectedApplication.submitted_at
        }
      };

      setAllSellers(prev => [newSeller, ...prev]);
      setActiveSellers(prev => [newSeller, ...prev]);

      setShowApproveModal(false);
      setApprovalNotes('');

      await Promise.all([
        loadSellerApplications(),
        loadAllSellers()
      ]);

      if (refreshDashboard) refreshDashboard();
      if (fetchHookSellers) fetchHookSellers();

      alert('Seller approved successfully!');

    } catch (error: any) {
      console.error('Error approving application:', error);
      alert(`Error: ${error.message || 'Failed to approve seller.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('seller_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_notes: approvalNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      setSellerApplications(prev => prev.map(app =>
        app.id === selectedApplication.id
          ? {
            ...app,
            status: 'rejected',
            rejection_reason: rejectionReason,
            reviewed_at: new Date().toISOString()
          }
          : app
      ));

      setShowRejectModal(false);
      setRejectionReason('');
      setApprovalNotes('');

      await loadSellerApplications();

      alert('Application rejected!');

    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(`Error: ${error.message || 'Failed to reject application'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSeller = async () => {
    if (!selectedSeller) return;

    try {
      setIsLoading(true);

      const { error: sellerError } = await supabase
        .from('sellers')
        .delete()
        .eq('id', selectedSeller.id);

      if (sellerError) throw sellerError;

      setAllSellers(prev => prev.filter(seller => seller.id !== selectedSeller.id));
      setActiveSellers(prev => prev.filter(seller => seller.id !== selectedSeller.id));

      setShowDeleteModal(false);
      setDeleteReason('');

      alert('Seller deleted successfully!');

    } catch (error: any) {
      console.error('Error deleting seller:', error);
      alert(`Error: ${error.message || 'Failed to delete seller'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerAction = async (action: string, seller: Seller) => {
    setSelectedSeller(seller);

    switch (action) {
      case 'suspend':
        if (confirm('Are you sure you want to suspend this seller?')) {
          try {
            setAllSellers(prev => prev.map(s =>
              s.id === seller.id
                ? { ...s, approval_status: 'suspended', status: 'inactive' }
                : s
            ));
            setActiveSellers(prev => prev.filter(s => s.id !== seller.id));

            const { error } = await supabase
              .from('sellers')
              .update({
                approval_status: 'suspended',
                status: 'inactive',
                suspension_reason: 'Suspended by admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', seller.id);

            if (error) throw error;

            alert('Seller suspended successfully');
          } catch (error) {
            console.error('Error suspending seller:', error);
            alert('Error suspending seller');
            loadAllSellers();
          }
        }
        break;

      case 'activate':
        if (confirm('Are you sure you want to activate this seller?')) {
          try {
            setAllSellers(prev => prev.map(s =>
              s.id === seller.id
                ? { ...s, approval_status: 'approved', status: 'active' }
                : s
            ));
            setActiveSellers(prev => [...prev, { ...seller, approval_status: 'approved', status: 'active' }]);

            const { error } = await supabase
              .from('sellers')
              .update({
                approval_status: 'approved',
                status: 'active',
                suspension_reason: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', seller.id);

            if (error) throw error;

            alert('Seller activated successfully');
          } catch (error) {
            console.error('Error activating seller:', error);
            alert('Error activating seller');
            loadAllSellers();
          }
        }
        break;

      case 'delete':
        setShowDeleteModal(true);
        break;

      case 'view':
        setSelectedSeller(seller);
        setShowSellerDetailModal(true);
        break;

      case 'message':
        setSelectedSeller(seller);
        setShowMessageModal(true);
        break;
    }
  };

  const handleUserAction = async (action: string, user: User) => {
    switch (action) {
      case 'view':
        if (user.user_type === 'seller' || user.user_type === 'seller_pending') {
          const seller = allSellers.find(s => s.user_id === user.id);
          if (seller) {
            setSelectedSeller(seller);
            setShowSellerDetailModal(true);
          } else {
            alert('Seller details not found');
          }
        }
        break;

      case 'approve':
        if (user.user_type === 'seller_pending' || user.approval_status === 'pending') {
          try {
            const { data: applications } = await supabase
              .from('seller_applications')
              .select('*')
              .eq('user_id', user.id)
              .in('status', ['pending', 'under_review']);

            if (applications && applications.length > 0) {
              setSelectedApplication(applications[0]);
              setShowApproveModal(true);
            } else {
              const sellerData: Seller = {
                id: `seller_${user.id}`,
                user_id: user.id,
                application_id: `app_${user.id}`,
                business_name: user.business_name || user.full_name,
                email: user.email,
                phone: user.phone || '',
                business_type: user.business_type || 'individual',
                approval_status: 'approved',
                status: 'active',
                commission_rate: 10.00,
                total_sales: 0,
                total_earnings: 0,
                pending_payout: 0,
                rating_avg: 0,
                total_products: 0,
                total_orders: 0,
                suspension_reason: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                address: user.address || '',
                city: user.city || '',
                business_description: '',
                cr_number: '',
                cr_document_url: null,
                bank_name: '',
                account_number: '',
                iban: ''
              };

              setAllSellers(prev => [...prev, sellerData]);
              setActiveSellers(prev => [...prev, sellerData]);

              alert('User approved as seller!');
            }
          } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to approve seller'}`);
          }
        }
        break;

      case 'suspend':
        if (confirm(`Suspend ${user.full_name}?`)) {
          try {
            if (user.user_type === 'seller' && user.seller_details) {
              setAllSellers(prev => prev.map(s =>
                s.user_id === user.id
                  ? { ...s, status: 'inactive', approval_status: 'suspended' }
                  : s
              ));
              setActiveSellers(prev => prev.filter(s => s.user_id !== user.id));
            }
            alert('User suspended!');
          } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to suspend user'}`);
          }
        }
        break;

      case 'activate':
        if (confirm(`Activate ${user.full_name}?`)) {
          try {
            if (user.user_type === 'seller' && user.seller_details) {
              setAllSellers(prev => prev.map(s =>
                s.user_id === user.id
                  ? { ...s, status: 'active', approval_status: 'approved' }
                  : s
              ));
              setActiveSellers(prev => [...prev, { ...user.seller_details!, status: 'active', approval_status: 'approved' }]);
            }
            alert('User activated!');
          } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to activate user'}`);
          }
        }
        break;

      case 'delete':
        if (confirm(`Delete ${user.full_name} permanently?`)) {
          try {
            if (user.user_type === 'seller' && user.seller_details) {
              setAllSellers(prev => prev.filter(s => s.user_id !== user.id));
              setActiveSellers(prev => prev.filter(s => s.user_id !== user.id));
            }
            alert('User deleted!');
          } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to delete user'}`);
          }
        }
        break;
    }
  };

  const handleProductAction = async (action: string, product: Product) => {
    setSelectedProduct(product);

    switch (action) {
      case 'view':
        alert(`Viewing product: ${product.name}`);
        break;

      case 'edit':
        navigate(`/admin/products/edit/${product.id}`);
        break;

      case 'activate':
        if (confirm(`Activate product "${product.name}"?`)) {
          try {
            const { error } = await supabase
              .from('products')
              .update({
                status: 'active',
                is_published: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (error) throw error;

            setProducts(prev => prev.map(p =>
              p.id === product.id
                ? { ...p, status: 'active', is_published: true }
                : p
            ));

            alert('Product activated successfully!');
            loadProducts();
          } catch (error: any) {
            console.error('Error activating product:', error);
            alert(`Error: ${error.message || 'Failed to activate product'}`);
          }
        }
        break;

      case 'deactivate':
        if (confirm(`Deactivate product "${product.name}"?`)) {
          try {
            const { error } = await supabase
              .from('products')
              .update({
                status: 'inactive',
                is_published: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (error) throw error;

            setProducts(prev => prev.map(p =>
              p.id === product.id
                ? { ...p, status: 'inactive', is_published: false }
                : p
            ));

            alert('Product deactivated successfully!');
            loadProducts();
          } catch (error: any) {
            console.error('Error deactivating product:', error);
            alert(`Error: ${error.message || 'Failed to deactivate product'}`);
          }
        }
        break;

      case 'promote':
        if (confirm(`Promote product "${product.name}" to featured?`)) {
          try {
            const { error } = await supabase
              .from('products')
              .update({
                is_promoted: !product.is_promoted,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (error) throw error;

            setProducts(prev => prev.map(p =>
              p.id === product.id
                ? { ...p, is_promoted: !product.is_promoted }
                : p
            ));

            alert(`Product ${!product.is_promoted ? 'promoted' : 'unpromoted'} successfully!`);
            loadProducts();
          } catch (error: any) {
            console.error('Error toggling promotion:', error);
            alert(`Error: ${error.message || 'Failed to update product promotion'}`);
          }
        }
        break;

      case 'delete':
        setShowProductDeleteModal(true);
        break;
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setProductsLoading(true);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== selectedProduct.id));

      setShowProductDeleteModal(false);
      setDeleteReason('');

      alert('Product deleted successfully!');

    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(`Error: ${error.message || 'Failed to delete product'}`);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!selectedApplication || !infoRequest.trim()) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('seller_applications')
        .update({
          status: 'more_info_needed',
          admin_notes: infoRequest,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      setSellerApplications(prev => prev.map(app =>
        app.id === selectedApplication.id
          ? { ...app, status: 'more_info_needed', admin_notes: infoRequest }
          : app
      ));

      setShowInfoModal(false);
      setInfoRequest('');

      alert('Information requested successfully!');

    } catch (error: any) {
      console.error('Error requesting info:', error);
      alert(`Error: ${error.message || 'Failed to request information'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedSeller || !messageContent.trim()) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('admin_messages')
        .insert({
          seller_id: selectedSeller.user_id,
          message: messageContent,
          admin_id: 'admin',
          created_at: new Date().toISOString(),
          read: false
        });

      if (error) throw error;

      setShowMessageModal(false);
      setMessageContent('');

      alert('Message sent successfully!');

    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Error: ${error.message || 'Failed to send message'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ SIMPLE COMPONENTS ============

  const SimpleMetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    onClick
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    subtitle?: string;
    onClick?: () => void;
  }) => {
    return (
      <div
        onClick={onClick}
        className={`bg-white border border-gray-200 rounded p-3 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-gray-100 rounded">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          {trend && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-lg font-semibold text-gray-900">{value}</p>
          <p className="text-xs font-medium text-gray-800">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  const SimpleStatusBadge = ({ status }: { status: string }) => {
    const getBadgeStyle = (status: string) => {
      const baseStyles = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";

      switch (status.toLowerCase()) {
        case 'active':
        case 'approved':
          return `${baseStyles} bg-green-100 text-green-700 border border-green-200`;
        case 'pending':
        case 'under_review':
        case 'draft':
          return `${baseStyles} bg-yellow-100 text-yellow-700 border border-yellow-200`;
        case 'rejected':
        case 'inactive':
          return `${baseStyles} bg-red-100 text-red-700 border border-red-200`;
        case 'suspended':
          return `${baseStyles} bg-gray-100 text-gray-700 border border-gray-300`;
        case 'more_info_needed':
          return `${baseStyles} bg-purple-100 text-purple-700 border border-purple-200`;
        case 'promoted':
          return `${baseStyles} bg-orange-100 text-orange-700 border border-orange-200`;
        default:
          return `${baseStyles} bg-gray-100 text-gray-700 border border-gray-200`;
      }
    };

    return (
      <span className={getBadgeStyle(status)}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const SimpleButton = ({
    children,
    variant = 'default',
    size = 'medium',
    icon: Icon,
    onClick,
    disabled = false
  }: {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'danger' | 'warning' | 'success' | 'outline';
    size?: 'small' | 'medium' | 'large';
    icon?: any;
    onClick?: () => void;
    disabled?: boolean;
  }) => {
    const variantClasses = {
      default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
      primary: 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700',
      danger: 'bg-red-600 border border-red-600 text-white hover:bg-red-700',
      warning: 'bg-orange-500 border border-orange-500 text-white hover:bg-orange-600',
      success: 'bg-green-600 border border-green-600 text-white hover:bg-green-700',
      outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    const sizeClasses = {
      small: 'px-2 py-1 text-xs',
      medium: 'px-3 py-1.5 text-sm',
      large: 'px-4 py-2 text-sm'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {Icon && <Icon className="w-3 h-3 mr-1.5" />}
        {children}
      </button>
    );
  };

  // ============ HELPER FUNCTIONS ============
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', showInMain: true },
    { id: 'users', icon: Users, label: 'Users', showInMain: true },
    { id: 'sellers', icon: Store, label: 'Sellers', showInMain: true },
    { id: 'products', icon: Package, label: 'Products', showInMain: true },
    { id: 'categories', icon: FolderTree, label: 'Categories', showInMain: true },
    { id: 'orders', icon: ShoppingBag, label: 'Orders', showInMain: true },
    { id: 'reviews', icon: MessageCircle, label: 'Reviews' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'contracts', icon: FileCheck, label: 'Contracts' },
    { id: 'advertising', icon: Megaphone, label: 'Advertising' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'activity', icon: Activity, label: 'Activity Logs' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleSectionClick = (section: string) => {
    setActiveSection(section);

    if (section === 'categories') {
      navigate('/admin/categories');
      return;
    }

    if (onNavigate) {
      onNavigate(section);
    }

    if (section === 'sellers') {
      loadAllSellers();
      loadSellerApplications();
    } else if (section === 'users') {
      loadUsers();
    } else if (section === 'products') {
      loadProducts();
    }
  };

  const handleMetricClick = (metricName: string) => {
    switch (metricName) {
      case 'Active Sellers':
        handleSectionClick('sellers');
        setSellerFilter('active');
        break;
      case 'New Seller Requests':
        handleSectionClick('sellers');
        setActiveFilter('pending');
        break;
      case 'Pending Payments':
        handleSectionClick('wallet');
        break;
      case 'Late Deliveries':
        handleSectionClick('orders');
        break;
      case 'Communications':
        handleSectionClick('activity');
        break;
      case 'Categories':
        navigate('/admin/categories');
        break;
      default:
        console.log(`Clicked on ${metricName}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatSARCURRENCY = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const userStats = {
    total: users.length,
    buyers: users.filter(u => u.user_type === 'buyer').length,
    sellers: users.filter(u => u.user_type === 'seller' || u.user_type === 'seller_pending' || u.user_type === 'seller_rejected').length,
    admins: users.filter(u => u.user_type === 'admin').length,
    pending: users.filter(u => u.status === 'pending' || u.user_type === 'seller_pending').length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

// Compute stats for admin dashboard
const stats = {
  // Revenue & Orders
  totalRevenue: walletStats?.total_revenue || orderStats?.totalRevenue || metrics?.totalRevenue || 0,
  monthlyRevenue: walletStats?.total_revenue || 0,
  totalOrders: orderStats?.total || metrics?.totalOrders || 0,
  todayOrders: orders?.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length || 0, // today’s orders

  // Users
  totalSellers: userStats?.sellers || activeSellers?.length || 0,
  approvedSellers: activeSellers?.length || 0,
  totalBuyers: userStats?.buyers || 0,
  totalUsers: userStats?.total || 0,

  // Products
  totalProducts: productStats?.total || 0,
  approvedProducts: productStats?.active || 0,
  pendingProducts: productStats?.pending || 0,
  lowStockAlerts: productStats?.low_stock || 0,

  // Reviews & Ratings
  pendingReviews: reviewStats?.pending || 0,
  activeDisputes: reviewStats?.pending || 0,
  avgRating: reviewStats?.avg_rating || 0,

  // Wallet & Payouts
  pendingPayouts: walletStats?.pending_payouts || payoutSummary?.total_pending || additionalMetrics?.pendingPayments || 0,
  platformEarnings: walletStats?.platform_earnings || 0,

  // Applications / Ads / Contracts
  pendingApprovals: applicationStats?.applications?.pending || 0,
  pendingAds: adStats?.pending_ads || 0,
  totalImpressions: adStats?.total_impressions || 0,
  activeContracts: contractStats?.active_contracts || 0,

  // Activities
  todayActivities: activityStats?.today || 0,

  // Merge any additional metrics
  ...additionalMetrics,
};


  const handleDownloadExcel = () => {
    alert('Downloading data as Excel...');
  };

  // ============ RENDER FUNCTIONS ============

  const renderProductsManagement = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Product Management</h1>
            <p className="text-sm text-gray-600">Manage all products, inventory, and product listings</p>
          </div>
          <div className="flex items-center space-x-2">
            <SimpleButton
              onClick={() => navigate('/seller/add-product')}
              variant="primary"
              icon={Plus}
            >
              Add New Product
            </SimpleButton>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SimpleButton
              onClick={() => {
                loadProducts();
                if (fetchHookProducts) fetchHookProducts();
              }}
              disabled={productsLoading}
              icon={RefreshCw}
              variant="default"
            >
              Refresh
            </SimpleButton>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          <SimpleMetricCard
            title="Total Products"
            value={productStats.total}
            icon={Package}
          />
          <SimpleMetricCard
            title="Active"
            value={productStats.active}
            icon={CheckCircle}
            onClick={() => setProductsFilter('active')}
          />
          <SimpleMetricCard
            title="Pending"
            value={productStats.pending}
            icon={Clock}
            onClick={() => setProductsFilter('pending')}
          />
          <SimpleMetricCard
            title="Rejected"
            value={productStats.rejected}
            icon={XCircle}
            onClick={() => setProductsFilter('rejected')}
          />
          <SimpleMetricCard
            title="Out of Stock"
            value={productStats.outOfStock}
            icon={AlertTriangle}
            onClick={() => setProductsFilter('out_of_stock')}
          />
          <SimpleMetricCard
            title="Promoted"
            value={productStats.promoted}
            icon={Award}
            onClick={() => setProductsFilter('promoted')}
          />
          <SimpleMetricCard
            title="Ready Made"
            value={productStats.readyMade}
            icon={Package}
            onClick={() => setCategoryTypeFilter('ready_made')}
          />
          <SimpleMetricCard
            title="Customized"
            value={productStats.customized}
            icon={Settings}
            onClick={() => setCategoryTypeFilter('customized')}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={productsFilter}
                  onChange={(e) => setProductsFilter(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending/Draft</option>
                  <option value="rejected">Rejected/Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="promoted">Promoted</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category Type</label>
                <select
                  value={categoryTypeFilter}
                  onChange={(e) => setCategoryTypeFilter(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="ready_made">Ready Made</option>
                  <option value="customized">Customized</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Type</label>
                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Product Types</option>
                  <option value="Sofa">Sofa</option>
                  <option value="Chair">Chair</option>
                  <option value="Table">Table</option>
                  <option value="Bed">Bed</option>
                  <option value="Wardrobe">Wardrobe</option>
                  <option value="Cabinet">Cabinet</option>
                  <option value="Shelf">Shelf</option>
                  <option value="Desk">Desk</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setProductsFilter('all');
                  setCategoryTypeFilter('all');
                  setProductTypeFilter('all');
                  setSearchQuery('');
                }}
                className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">
              {productsFilter === 'all' ? 'All Products' :
                productsFilter === 'active' ? 'Active Products' :
                productsFilter === 'pending' ? 'Pending/Draft Products' :
                productsFilter === 'rejected' ? 'Rejected/Inactive Products' :
                productsFilter === 'out_of_stock' ? 'Out of Stock Products' :
                'Promoted Products'}
              <span className="ml-2 text-sm text-gray-500">({products.length} items)</span>
            </h2>
          </div>

          <div className="p-4">
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-gray-600 mb-1">No products found</h3>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No products match your search' : 'No products available yet'}
                </p>
                <div className="mt-3">
                  <SimpleButton
                    onClick={() => navigate('/seller/add-product')}
                    variant="primary"
                    icon={Plus}
                  >
                    Add Your First Product
                  </SimpleButton>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{product.seller_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <SimpleStatusBadge status={product.status} />
                        {product.is_promoted && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded border border-orange-200">
                            Promoted
                          </span>
                        )}
                      </div>
                    </div>

                    {product.images && product.images.length > 0 && product.main_image && (
                      <div className="relative aspect-square rounded mb-2 bg-gray-100 overflow-hidden">
                        <img
                          src={product.main_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                          {product.images.length} images
                        </div>
                        <div className="absolute top-1 right-1">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${product.category_type === 'customized' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {product.category_type === 'customized' ? 'Customized' : 'Ready Made'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">SKU:</span>
                        <span className="text-xs font-mono text-gray-900">{product.sku}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Price:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatSARCURRENCY(product.price)}
                          {product.discounted_price && (
                            <span className="ml-1 text-xs text-red-500 line-through">
                              {formatSARCURRENCY(product.discounted_price)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Stock:</span>
                        <span className={`text-xs font-medium ${
                          product.stock_quantity <= 0 ? 'text-red-600' :
                          product.stock_quantity <= 10 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {product.stock_quantity} units
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Type:</span>
                        <span className="text-xs text-gray-900 capitalize">{product.product_type || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Added:</span>
                        <span className="text-xs text-gray-500">{formatDate(product.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <SimpleButton
                        onClick={() => handleProductAction('view', product)}
                        variant="default"
                        size="small"
                        icon={Eye}
                      >
                        View
                      </SimpleButton>
                      <SimpleButton
                        onClick={() => handleProductAction('edit', product)}
                        variant="default"
                        size="small"
                        icon={Edit}
                      >
                        Edit
                      </SimpleButton>
                      {product.status === 'active' ? (
                        <SimpleButton
                          onClick={() => handleProductAction('deactivate', product)}
                          variant="danger"
                          size="small"
                          icon={Ban}
                        >
                          Deactivate
                        </SimpleButton>
                      ) : (
                        <SimpleButton
                          onClick={() => handleProductAction('activate', product)}
                          variant="success"
                          size="small"
                          icon={Check}
                        >
                          Activate
                        </SimpleButton>
                      )}
                      <SimpleButton
                        onClick={() => handleProductAction('promote', product)}
                        variant={product.is_promoted ? "default" : "warning"}
                        size="small"
                        icon={Award}
                      >
                        {product.is_promoted ? 'Unpromote' : 'Promote'}
                      </SimpleButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            {product.main_image && (
                              <div className="flex-shrink-0 h-8 w-8 mr-2">
                                <img
                                  src={product.main_image}
                                  alt={product.name}
                                  className="h-8 w-8 rounded object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32x32?text=No+Image';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-900">{product.seller_name}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            <SimpleStatusBadge status={product.status} />
                            {product.is_promoted && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded border border-orange-200 inline-block">
                                Promoted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${product.category_type === 'customized' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {product.category_type === 'customized' ? 'Customized' : 'Ready Made'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatSARCURRENCY(product.price)}
                          </div>
                          {product.discounted_price && (
                            <div className="text-xs text-red-500 line-through">
                              {formatSARCURRENCY(product.discounted_price)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            product.stock_quantity <= 0 ? 'bg-red-100 text-red-800' :
                            product.stock_quantity <= 10 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {formatDate(product.created_at)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-1">
                            <SimpleButton
                              onClick={() => handleProductAction('view', product)}
                              variant="default"
                              size="small"
                              icon={Eye}
                            >
                              View
                            </SimpleButton>
                            <div className="relative group">
                              <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                                <button
                                  onClick={() => handleProductAction('edit', product)}
                                  className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="w-3 h-3 mr-1.5" />
                                  Edit Product
                                </button>
                                {product.status === 'active' ? (
                                  <button
                                    onClick={() => handleProductAction('deactivate', product)}
                                    className="flex items-center w-full px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50"
                                  >
                                    <Ban className="w-3 h-3 mr-1.5" />
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleProductAction('activate', product)}
                                    className="flex items-center w-full px-3 py-1.5 text-sm text-green-600 hover:bg-green-50"
                                  >
                                    <Check className="w-3 h-3 mr-1.5" />
                                    Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => handleProductAction('promote', product)}
                                  className="flex items-center w-full px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50"
                                >
                                  <Award className="w-3 h-3 mr-1.5" />
                                  {product.is_promoted ? 'Remove Promotion' : 'Promote'}
                                </button>
                                <button
                                  onClick={() => handleProductAction('delete', product)}
                                  className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3 mr-1.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
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
      </div>
    </div>
  );

  const renderDashboard = () => {
    const userStats = {
      total: users.length,
      buyers: users.filter(u => u.user_type === 'buyer').length,
      sellers: users.filter(u => u.user_type === 'seller' || u.user_type === 'seller_pending' || u.user_type === 'seller_rejected').length,
      admins: users.filter(u => u.user_type === 'admin').length,
      pending: users.filter(u => u.status === 'pending' || u.user_type === 'seller_pending').length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
    };

    const stats = {
      totalRevenue: walletStats?.total_revenue || orderStats?.totalRevenue || metrics?.totalRevenue || 0,
      totalOrders: orderStats?.total || metrics?.totalOrders || 0,
      totalSellers: userStats.sellers || activeSellers.length || 0,
      totalBuyers: userStats.buyers || 0,
      totalUsers: userStats.total || 0,
      totalProducts: productStats.total || 0,
      pendingProducts: productStats.pending || 0,
      pendingApprovals: applicationStats?.applications?.pending || 0,
      pendingPayouts: walletStats?.pending_payouts || payoutSummary?.total_pending || additionalMetrics.pendingPayments || 0,
      todayOrders: orderStats?.today || 0,
      monthlyRevenue: walletStats?.total_revenue || 0,
      activeDisputes: reviewStats?.pending || 0,
      pendingAds: adStats?.pending_ads || 0,
      lowStockAlerts: productStats?.low_stock || 0,
      approvedSellers: activeSellers.length || 0,
      approvedProducts: productStats.active || 0,
      pendingReviews: reviewStats?.pending || 0,
      avgRating: reviewStats?.avg_rating || 0,
      platformEarnings: walletStats?.platform_earnings || 0,
      activeContracts: contractStats?.active_contracts || 0,
      totalImpressions: adStats?.total_impressions || 0,
      todayActivities: activityStats?.today || 0,
      ...additionalMetrics,
    };

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your marketplace with precision</p>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{userStats.total} users</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <SimpleButton
                onClick={refreshDashboard}
                icon={RefreshCw}
                variant="default"
              >
                Refresh
              </SimpleButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <SimpleMetricCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            trend="+12.5%"
            subtitle={`${stats.totalOrders} orders`}
            onClick={() => handleSectionClick('wallet')}
          />

          <SimpleMetricCard
            title="Active Sellers"
            value={stats.approvedSellers}
            icon={Store}
            subtitle={`${stats.pendingApprovals} pending`}
            onClick={() => {
              handleSectionClick('sellers');
              setSellerFilter('active');
            }}
          />

          <SimpleMetricCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
            trend="+8.2%"
            subtitle={`${stats.todayOrders} today`}
            onClick={() => handleSectionClick('orders')}
          />

          <SimpleMetricCard
            title="Total Products"
            value={productStats.total.toLocaleString()}
            icon={Package}
            subtitle={`${productStats.pending} pending`}
            onClick={() => handleSectionClick('products')}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SimpleMetricCard
            title="Total Users"
            value={userStats.total}
            icon={Users}
            subtitle="Platform users"
            onClick={() => handleSectionClick('users')}
          />

          <SimpleMetricCard
            title="Buyers"
            value={userStats.buyers}
            icon={ShoppingCart}
            subtitle="Active customers"
            onClick={() => handleSectionClick('users')}
          />

          <SimpleMetricCard
            title="Sellers"
            value={userStats.sellers}
            icon={Store}
            subtitle={`${userStats.pending} pending`}
            onClick={() => handleSectionClick('sellers')}
          />

          <SimpleMetricCard
            title="Admins"
            value={userStats.admins}
            icon={Shield}
            subtitle="Platform administrators"
            onClick={() => handleSectionClick('users')}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <SimpleMetricCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={Clock}
            onClick={() => handleMetricClick('Pending Payments')}
          />

          <SimpleMetricCard
            title="Release Payments"
            value={stats.releasePayments}
            icon={Send}
            onClick={() => handleMetricClick('Release Payments')}
          />

          <SimpleMetricCard
            title="Platform Commission"
            value="9%"
            icon={Percent}
            subtitle="Current rate"
            onClick={() => handleMetricClick('Commission')}
          />

          <SimpleMetricCard
            title="Warnings Given"
            value={stats.warningsToSellers}
            icon={AlertOctagon}
            subtitle="Due to bad rating"
            onClick={() => handleMetricClick('Warnings to Sellers')}
          />

          <SimpleMetricCard
            title="New Seller Requests"
            value={stats.newSellerRequests}
            icon={UserPlus}
            onClick={() => {
              handleSectionClick('sellers');
              setActiveFilter('pending');
            }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <SimpleMetricCard
            title="Messages"
            value={stats.buyerSellerMessages}
            icon={MessageSquare}
            subtitle="Buyer-Seller"
            onClick={() => handleMetricClick('Buyer-Seller Messages')}
          />

          <SimpleMetricCard
            title="Communications"
            value={stats.communications}
            icon={MessageCircle}
            subtitle="Total interactions"
            onClick={() => handleMetricClick('Communications')}
          />

          <SimpleMetricCard
            title="Late Deliveries"
            value={stats.lateDeliveries}
            icon={Truck}
            subtitle="Past due date"
            onClick={() => handleMetricClick('Late Deliveries')}
          />

          <SimpleMetricCard
            title="Late Dispatch"
            value={stats.lateDispatch}
            icon={Clock}
            subtitle="Delayed shipments"
            onClick={() => handleMetricClick('Late Dispatch')}
          />

          <SimpleMetricCard
            title="Late Returns"
            value={stats.lateReturnPayments}
            icon={Receipt}
            subtitle="Overdue refunds"
            onClick={() => handleMetricClick('Late Return Payments')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">Pending Actions</h2>
            </div>
            <div className="p-3 space-y-2">
              {stats.pendingApprovals > 0 && (
                <div
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    handleSectionClick('sellers');
                    setActiveFilter('pending');
                  }}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-gray-100 rounded">
                      <UserPlus className="w-3 h-3 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Seller Applications</p>
                      <p className="text-xs text-gray-600">Awaiting approval</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                      {stats.pendingApprovals}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              )}

              {productStats.pending > 0 && (
                <div
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    handleSectionClick('products');
                    setProductsFilter('pending');
                  }}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-gray-100 rounded">
                      <Package className="w-3 h-3 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Product Approvals</p>
                      <p className="text-xs text-gray-600">Need review</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                      {productStats.pending}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              )}

              {stats.pendingReviews > 0 && (
                <div
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSectionClick('reviews')}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-gray-100 rounded">
                      <MessageCircle className="w-3 h-3 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Reviews</p>
                      <p className="text-xs text-gray-600">Require moderation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                      {stats.pendingReviews}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              )}

              {stats.activeDisputes > 0 && (
                <div
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSectionClick('reviews')}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-gray-100 rounded">
                      <AlertCircle className="w-3 h-3 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Disputes</p>
                      <p className="text-xs text-gray-600">Need resolution</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                      {stats.activeDisputes}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">Platform Performance</h2>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Platform Earnings</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.platformEarnings)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Active Contracts</span>
                <span className="text-sm font-semibold text-gray-900">{stats.activeContracts}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ad Impressions</span>
                <span className="text-sm font-semibold text-gray-900">{stats.totalImpressions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Today's Activities</span>
                <span className="text-sm font-semibold text-gray-900">{stats.todayActivities}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-600">Avg Seller Rating</span>
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                  <span className="text-sm font-semibold text-gray-900">{stats.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => navigate('/admin/categories')}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2.5">
                  <FolderTree className="w-3 h-3 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Manage Categories</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/seller/add-product')}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Plus className="w-3 h-3 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Add New Product</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>

              <button
                onClick={() => handleSectionClick('wallet')}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Wallet className="w-3 h-3 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Payout Requests</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>

              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={handleDownloadExcel}
                  className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-2.5">
                    <Download className="w-3 h-3 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export Data</p>
                      <p className="text-xs text-gray-600">Download Excel report</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => handleSectionClick('orders')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-3">
              {(!recentOrders || recentOrders.length === 0) ? (
                <div className="text-center py-6">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{order.order_number}</p>
                        <p className="text-xs text-gray-600">{order.buyer?.full_name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <SimpleStatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Recent Activities</h2>
                <button
                  onClick={() => handleSectionClick('activity')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-3">
              {(!dashboardActivities || dashboardActivities.length === 0) ? (
                <div className="text-center py-6">
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No activities yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboardActivities.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-2.5 p-2 hover:bg-gray-50 rounded">
                      <div className={`p-1.5 rounded ${activity.user_type === 'admin' ? 'bg-blue-50' : activity.user_type === 'seller' ? 'bg-green-50' : 'bg-purple-50'}`}>
                        {activity.user_type === 'admin' ? (
                          <Shield className="w-3 h-3 text-blue-600" />
                        ) : activity.user_type === 'seller' ? (
                          <Store className="w-3 h-3 text-green-600" />
                        ) : (
                          <Users className="w-3 h-3 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {activity.action?.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.target_type} • {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSellersManagement = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Seller Management</h1>
            <p className="text-sm text-gray-600">Manage seller applications, approvals, and performance monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search sellers..."
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SimpleButton
              onClick={() => {
                loadAllSellers();
                loadSellerApplications();
              }}
              disabled={isLoading}
              icon={RefreshCw}
              variant="default"
            >
              Refresh
            </SimpleButton>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          <SimpleMetricCard
            title="Total Sellers"
            value={sellerStats?.total || 0}
            icon={Store}
          />
          <SimpleMetricCard
            title="Active"
            value={sellerStats?.active || 0}
            icon={CheckCircle}
            onClick={() => setSellerFilter('active')}
          />
          <SimpleMetricCard
            title="Pending"
            value={sellerStats?.pending || 0}
            icon={Clock}
            onClick={() => setSellerFilter('pending')}
          />
          <SimpleMetricCard
            title="Suspended"
            value={sellerStats?.suspended || 0}
            icon={Ban}
            onClick={() => setSellerFilter('suspended')}
          />
          <SimpleMetricCard
            title="Total Sales"
            value={formatCurrency(sellerStats?.total_sales || 0)}
            icon={DollarSign}
          />
          <SimpleMetricCard
            title="Avg Rating"
            value={(sellerStats?.avg_rating || 0).toFixed(1)}
            icon={Star}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center space-x-4">
              {[
                { id: 'applications', label: 'Pending Applications', count: applicationStats?.applications?.pending || 0 },
                { id: 'active', label: 'Active Sellers', count: sellerStats?.active || 0 },
                { id: 'all', label: 'All Sellers', count: sellerStats?.total || 0 },
                { id: 'suspended', label: 'Suspended', count: sellerStats?.suspended || 0 },
              ].map((tab) => {
                const isActive = (
                  (tab.id === 'applications' && sellerFilter === 'pending') ||
                  (tab.id === 'active' && sellerFilter === 'active') ||
                  (tab.id === 'suspended' && sellerFilter === 'suspended') ||
                  (tab.id === 'all' && sellerFilter === 'all')
                );

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'applications') setSellerFilter('pending');
                      else if (tab.id === 'active') setSellerFilter('active');
                      else if (tab.id === 'suspended') setSellerFilter('suspended');
                      else setSellerFilter('all');
                    }}
                    className={`relative pb-2 px-1 font-medium text-sm transition-colors ${isActive ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded ${isActive ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-700'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            {sellerFilter === 'pending' ? (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Pending Seller Applications</h3>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading applications...</p>
                  </div>
                ) : sellerApplications.filter(app => app.status === 'pending').length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-base font-semibold text-gray-600 mb-1">No pending applications</h3>
                    <p className="text-sm text-gray-500">All seller applications have been reviewed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sellerApplications
                      .filter(app => app.status === 'pending')
                      .map((application) => (
                        <div key={application.id} className="bg-white border border-gray-200 rounded p-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{application.business_name}</h3>
                              <p className="text-xs text-gray-600">{application.full_name}</p>
                            </div>
                            <SimpleStatusBadge status={application.status} />
                          </div>

                          <div className="space-y-1.5 mb-2">
                            <div className="flex items-center text-sm text-gray-700">
                              <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                              <span className="truncate">{application.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                              {application.contact_number}
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
                              {application.city}
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 mb-2">
                            Applied on {formatDate(application.submitted_at)}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <SimpleButton
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowApproveModal(true);
                              }}
                              variant="success"
                              size="small"
                              icon={Check}
                            >
                              Approve
                            </SimpleButton>
                            <SimpleButton
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowRejectModal(true);
                              }}
                              variant="danger"
                              size="small"
                              icon={X}
                            >
                              Reject
                            </SimpleButton>
                          </div>
                          <div className="mt-1.5">
                            <SimpleButton
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowInfoModal(true);
                              }}
                              variant="default"
                              size="small"
                              icon={HelpCircle}
                            >
                              Request Info
                            </SimpleButton>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {sellerFilter === 'active' ? 'Active Sellers' :
                      sellerFilter === 'suspended' ? 'Suspended Sellers' :
                        sellerFilter === 'rejected' ? 'Rejected Sellers' :
                          'All Sellers'}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading sellers...</p>
                  </div>
                ) : allSellers.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-base font-semibold text-gray-600 mb-1">No sellers found</h3>
                    <p className="text-sm text-gray-500">
                      {sellerFilter === 'active' ? 'No active sellers yet' :
                        sellerFilter === 'pending' ? 'No pending sellers found' :
                          sellerFilter === 'suspended' ? 'No suspended sellers found' :
                            'Sellers will appear here when they register'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allSellers.map((seller) => (
                      <div key={seller.id} className="bg-white border border-gray-200 rounded p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{seller.business_name}</h3>
                            <p className="text-xs text-gray-600">{seller.profiles?.full_name || seller.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <SimpleStatusBadge status={seller.approval_status} />
                            <SimpleStatusBadge status={seller.status} />
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                            {seller.email}
                          </div>
                          {seller.phone && (
                            <div className="flex items-center text-sm text-gray-700">
                              <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                              {seller.phone}
                            </div>
                          )}
                          {seller.city && (
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
                              {seller.city}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                            <div className="font-semibold text-gray-900 text-sm">{seller.total_products || 0}</div>
                            <div className="text-xs text-gray-600">Products</div>
                          </div>
                          <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                            <div className="font-semibold text-gray-900 text-sm">{seller.total_orders || 0}</div>
                            <div className="text-xs text-gray-600">Orders</div>
                          </div>
                          <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                            <div className="font-semibold text-gray-900 text-sm">{formatCurrency(seller.total_sales || 0)}</div>
                            <div className="text-xs text-gray-600">Sales</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <SimpleButton
                            onClick={() => handleSellerAction('view', seller)}
                            variant="default"
                            size="small"
                            icon={Eye}
                          >
                            View Details
                          </SimpleButton>
                          <SimpleButton
                            onClick={() => handleSellerAction('message', seller)}
                            variant="default"
                            size="small"
                            icon={MessageSquare}
                          >
                            Message
                          </SimpleButton>
                          {seller.approval_status === 'approved' && seller.status === 'active' ? (
                            <SimpleButton
                              onClick={() => handleSellerAction('suspend', seller)}
                              variant="danger"
                              size="small"
                              icon={Ban}
                            >
                              Suspend
                            </SimpleButton>
                          ) : (
                            <SimpleButton
                              onClick={() => handleSellerAction('activate', seller)}
                              variant="success"
                              size="small"
                              icon={Check}
                            >
                              Activate
                            </SimpleButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allSellers.map((seller) => (
                          <tr key={seller.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium text-gray-900">{seller.business_name}</div>
                              <div className="text-sm text-gray-500">{seller.email}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm text-gray-900">{seller.profiles?.full_name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{seller.phone || 'No phone'}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-0.5">
                                <SimpleStatusBadge status={seller.approval_status} />
                                <SimpleStatusBadge status={seller.status} />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {formatCurrency(seller.total_sales || 0)}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {seller.total_products || 0}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                                <span className="text-sm text-gray-900">{seller.rating_avg?.toFixed(1) || '0.0'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-1">
                                <SimpleButton
                                  onClick={() => handleSellerAction('view', seller)}
                                  variant="default"
                                  size="small"
                                  icon={Eye}
                                >
                                  View
                                </SimpleButton>
                                <div className="relative group">
                                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                                    <button
                                      onClick={() => handleSellerAction('message', seller)}
                                      className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1.5" />
                                      Send Message
                                    </button>
                                    {seller.approval_status === 'approved' && seller.status === 'active' ? (
                                      <button
                                        onClick={() => handleSellerAction('suspend', seller)}
                                        className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <Ban className="w-3 h-3 mr-1.5" />
                                        Suspend
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSellerAction('activate', seller)}
                                        className="flex items-center w-full px-3 py-1.5 text-sm text-green-600 hover:bg-green-50"
                                      >
                                        <Check className="w-3 h-3 mr-1.5" />
                                        Activate
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSellerAction('delete', seller)}
                                      className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1.5" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">User Management</h1>
            <p className="text-sm text-gray-600">Manage all users, buyers, sellers, and administrators</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SimpleButton
              onClick={loadUsers}
              disabled={usersLoading}
              icon={RefreshCw}
              variant="default"
            >
              Refresh
            </SimpleButton>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          <SimpleMetricCard
            title="Total Users"
            value={userStats.total}
            icon={Users}
          />
          <SimpleMetricCard
            title="Buyers"
            value={userStats.buyers}
            icon={ShoppingCart}
          />
          <SimpleMetricCard
            title="Sellers"
            value={userStats.sellers}
            icon={Store}
          />
          <SimpleMetricCard
            title="Admins"
            value={userStats.admins}
            icon={Shield}
          />
          <SimpleMetricCard
            title="Active"
            value={userStats.active}
            icon={CheckCircle}
          />
          <SimpleMetricCard
            title="Suspended"
            value={userStats.suspended}
            icon={Ban}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">All Users</h2>
          </div>
          <div className="p-4">
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-gray-600 mb-1">No users found</h3>
                <p className="text-sm text-gray-500">Users will appear here when they register</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-semibold">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' : user.user_type === 'seller' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {user.user_type}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <SimpleStatusBadge status={user.status} />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-1">
                            {(user.user_type === 'seller' || user.user_type === 'seller_pending') && (
                              <SimpleButton
                                onClick={() => handleUserAction('view', user)}
                                variant="default"
                                size="small"
                                icon={Eye}
                              >
                                View
                              </SimpleButton>
                            )}
                            {(user.user_type === 'seller_pending' || user.approval_status === 'pending') && (
                              <SimpleButton
                                onClick={() => handleUserAction('approve', user)}
                                variant="success"
                                size="small"
                                icon={Check}
                              >
                                Approve
                              </SimpleButton>
                            )}
                            <div className="relative group">
                              <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                                {user.status === 'active' ? (
                                  <button
                                    onClick={() => handleUserAction('suspend', user)}
                                    className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Ban className="w-3 h-3 mr-1.5" />
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUserAction('activate', user)}
                                    className="flex items-center w-full px-3 py-1.5 text-sm text-green-600 hover:bg-green-50"
                                  >
                                    <Check className="w-3 h-3 mr-1.5" />
                                    Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUserAction('delete', user)}
                                  className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3 mr-1.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
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
      </div>
    </div>
  );

  const renderOtherSection = (title: string, description: string) => {
    let Icon = Package;
    switch (title) {
      case 'Orders': Icon = ShoppingBag; break;
      case 'Reviews': Icon = MessageCircle; break;
      case 'Wallet': Icon = Wallet; break;
      case 'Contracts': Icon = FileCheck; break;
      case 'Analytics': Icon = BarChart3; break;
      case 'Settings': Icon = Settings; break;
    }

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">{title} Management</h2>
          </div>
          <div className="p-4">
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-600">{title} Interface</h3>
              <p className="text-sm text-gray-500">Full {title.toLowerCase()} features available</p>
              <div className="mt-3">
                <SimpleButton variant="primary" icon={Icon}>
                  Explore {title}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className={`${sidebarCollapsed ? 'w-12' : 'w-56'} bg-white border-r border-gray-200 h-screen sticky top-0`}>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>

      <div className="p-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`flex items-center w-full p-2 rounded text-sm ${activeSection === item.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`${sidebarCollapsed ? 'mx-auto' : 'mr-2'} w-4 h-4`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-600">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (activeSection === 'sellers') {
      loadAllSellers();
      loadSellerApplications();
    }

    if (activeSection === 'users') {
      loadUsers();
    }

    if (activeSection === 'products') {
      loadProducts();
    }
  }, [activeSection, activeFilter, sellerFilter, productsFilter, categoryTypeFilter, productTypeFilter, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:block">
        {renderSidebar()}
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="lg:hidden p-1.5 hover:bg-gray-100 rounded"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-base font-semibold text-gray-900">
                  {(() => {
                    const activeItem = navItems.find(item => item.id === activeSection);
                    return activeItem ? activeItem.label : 'Dashboard';
                  })()}
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative hidden md:block">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button className="relative p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded"
                  >
                    <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      A
                    </div>
                    <span className="hidden md:inline text-sm font-semibold">Admin</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-600">Super Admin</p>
                      </div>
                      <button
                        onClick={() => {
                          handleSectionClick('settings');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        <span>System Settings</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('admin_token');
                          navigate('/admin/login');
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 md:hidden">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-4">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'users' && renderUserManagement()}
          {activeSection === 'sellers' && renderSellersManagement()}
          {activeSection === 'products' && renderProductsManagement()}
          {activeSection === 'orders' && renderOtherSection('Orders', 'Manage customer orders')}
          {activeSection === 'reviews' && renderOtherSection('Reviews', 'Moderate product reviews')}
          {activeSection === 'wallet' && renderOtherSection('Wallet', 'Manage payouts and commissions')}
          {activeSection === 'contracts' && renderOtherSection('Contracts', 'Manage seller contracts')}
          {/* {activeSection === 'advertising' && <AdminAdvertising />} */}
          {activeSection === 'analytics' && renderOtherSection('Analytics', 'Platform performance insights')}
          {activeSection === 'activity' && <ActivityLogs />}
          {activeSection === 'settings' && renderOtherSection('Settings', 'Platform configuration')}
        </main>

        <footer className="bg-white border-t border-gray-200 py-3 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <span>© {new Date().getFullYear()} Admin Dashboard</span>
              <span className="text-gray-400 hidden md:inline">•</span>
              <span className="hidden md:inline">Premium Admin Interface</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>{userStats.total} users</span>
              <span className="text-gray-400">•</span>
              <span>{activeSellers.length} active sellers</span>
              <span className="text-gray-400">•</span>
              <span>{productStats.total} products</span>
              <span className="text-gray-400">•</span>
              <span>Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      {showApproveModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Approve Seller Application</h3>
              <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-1.5 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Approving Seller</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  This will grant seller dashboard access to <strong>{selectedApplication.business_name}</strong>
                </p>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add notes about this approval..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovalNotes('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleApproveApplication}
                  disabled={isLoading}
                  variant="success"
                >
                  {isLoading ? 'Processing...' : 'Approve Seller'}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Reject Seller Application</h3>
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-1.5 text-red-700">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">Rejecting Application</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Applicant will be notified and cannot access seller dashboard
                </p>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Provide clear reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleRejectApplication}
                  disabled={!rejectionReason.trim() || isLoading}
                  variant="danger"
                >
                  {isLoading ? 'Processing...' : 'Reject Application'}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Request More Information</h3>
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center space-x-1.5 text-blue-700">
                  <HelpCircle className="w-4 h-4" />
                  <span className="font-medium">Information Request</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Applicant will need to provide additional information before approval
                </p>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  What information do you need? *
                </label>
                <textarea
                  value={infoRequest}
                  onChange={(e) => setInfoRequest(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Be specific about what additional information or documents you need..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    setInfoRequest('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleRequestMoreInfo}
                  disabled={!infoRequest.trim() || isLoading}
                  variant="warning"
                >
                  {isLoading ? 'Processing...' : 'Request Information'}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Seller</h3>
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-1.5 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning: This action cannot be undone</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  All seller data will be permanently removed from the platform
                </p>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-1.5">
                  Are you sure you want to delete <strong>{selectedSeller.business_name}</strong>?
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for deletion (Optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  rows={2}
                  placeholder="Why are you deleting this seller?"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleDeleteSeller}
                  variant="danger"
                >
                  Delete Seller
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Product</h3>
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-1.5 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning: This action cannot be undone</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  This product will be permanently removed from the marketplace
                </p>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-1.5">
                  Are you sure you want to delete <strong>"{selectedProduct.name}"</strong>?
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for deletion (Optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  rows={2}
                  placeholder="Why are you deleting this product?"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowProductDeleteModal(false);
                    setDeleteReason('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleDeleteProduct}
                  variant="danger"
                >
                  Delete Product
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Send Message to Seller</h3>
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center space-x-1.5 text-blue-700">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">Message to {selectedSeller.business_name}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  This message will be sent to the seller's dashboard
                </p>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message Content *
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Type your message here..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageContent('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <SimpleButton
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || isLoading}
                  variant="primary"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellerDetailModal && selectedSeller && (
        <SellerDetailModal
          seller={selectedSeller}
          isOpen={showSellerDetailModal}
          onClose={() => setShowSellerDetailModal(false)}
          onAction={(action, sellerId) => handleSellerAction(action, selectedSeller)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;