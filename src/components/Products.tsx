import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Truck,
  Calendar,
  ShoppingBag,
  Box,
  DollarSign,
  ChevronRight,
  Users,
  Shield,
  FileText,
  MoreVertical,
  User,
  Store,
  Globe,
  MapPin,
  Tag,
  Layers,
  Hash,
  BarChart3,
  Archive,
  Send,
  Mail,
  MessageSquare,
  WifiOff,
  VolumeX,
  Ban,
  Flag,
  ShieldAlert,
  Bell,
  Settings,
  MoreHorizontal,
  Grid,
  List,
  Columns,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// TypeScript Interfaces
interface Product {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  price: number;
  discounted_price?: number;
  original_price?: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  status: 'active' | 'inactive' | 'draft' | 'pending' | 'archived' | 'suspended' | 'under_review' | 'rejected';
  is_featured: boolean;
  is_best_seller?: boolean;
  is_advertised?: boolean;
  images: string[];
  main_image?: string;
  category_id?: string;
  category_type: 'ready_made' | 'customized';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type?: string;
  product_categories?: string[];
  seller_id: string;
  seller_name?: string;
  seller_business?: string;
  rating: number;
  review_count: number;
  orders_count: number;
  units_sold?: number;
  revenue?: number;
  sku?: string;
  barcode?: string;
  warranty?: string;
  material?: string;
  finish_type?: string;
  primary_color?: string;
  dimensions?: any;
  weight?: number;
  created_at: string;
  updated_at: string;
  last_sold_at?: string;
  delivery_cities?: string[];
  shipping_options?: any;
  installation_available?: boolean;
  return_policy?: any;
  warning_count?: number;
  warning_reasons?: string[];
  admin_notes?: string;
  is_suspended_by_admin?: boolean;
  suspension_reason?: string;
  suspension_date?: string;
  tags?: string[];
  metadata?: any;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  pendingProducts: number;
  suspendedProducts: number;
  underReviewProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  featuredProducts: number;
  advertisedProducts: number;
  bestSellerProducts: number;
  totalRevenue: number;
  totalUnitsSold: number;
  averageRating: number;
  averagePrice: number;
  warningCount: number;
  categoriesBreakdown: Record<string, number>;
  sellerBreakdown: Record<string, number>;
  typeBreakdown: {
    ready_made: number;
    customized: number;
  };
  usageBreakdown: {
    indoor: number;
    outdoor: number;
    both: number;
  };
}

interface Filters {
  search: string;
  categoryType: string;
  usageType: string;
  productType: string;
  status: string;
  stockStatus: string;
  priceRange: [number, number];
  sellerId: string;
  minRating: number;
  isFeatured: boolean | null;
  isAdvertised: boolean | null;
  isBestSeller: boolean | null;
  hasWarnings: boolean | null;
  isSuspended: boolean | null;
  dateRange: [Date | null, Date | null];
  sortBy: 'name' | 'price' | 'created_at' | 'updated_at' | 'rating' | 'orders' | 'revenue' | 'stock';
  sortOrder: 'asc' | 'desc';
}

interface Seller {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone?: string;
  status: string;
  product_count: number;
  total_sales: number;
}

interface WarningFormData {
  productId: string;
  reason: 'fake_product' | 'misleading_info' | 'poor_quality' | 'copyright_issue' | 'policy_violation' | 'customer_complaints' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  notifySeller: boolean;
  suspendProduct: boolean;
  suspensionDuration?: number;
  suspensionUnit?: 'hours' | 'days' | 'weeks';
  adminNote: string;
}

// Main Products Component
const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('list');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [productToAction, setProductToAction] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Warning form state
  const [warningForm, setWarningForm] = useState<WarningFormData>({
    productId: '',
    reason: 'other',
    severity: 'medium',
    message: '',
    notifySeller: true,
    suspendProduct: false,
    suspensionDuration: 7,
    suspensionUnit: 'days',
    adminNote: ''
  });

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryType: '',
    usageType: '',
    productType: '',
    status: '',
    stockStatus: '',
    priceRange: [0, 100000],
    sellerId: '',
    minRating: 0,
    isFeatured: null,
    isAdvertised: null,
    isBestSeller: null,
    hasWarnings: null,
    isSuspended: null,
    dateRange: [null, null],
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all products
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching all products from database...');
      
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey (
            id,
            full_name,
            business_name,
            email,
            phone,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Failed to load products');
        return;
      }

      console.log(`✅ Loaded ${productsData?.length || 0} products from database`);
      
      const formattedProducts: Product[] = (productsData || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        short_description: product.short_description,
        price: product.price || 0,
        discounted_price: product.discounted_price,
        original_price: product.original_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity || 0,
        min_stock_level: product.min_stock_level,
        status: product.status || 'active',
        is_featured: product.is_featured || false,
        is_best_seller: product.is_best_seller || false,
        is_advertised: product.is_advertised || false,
        images: product.images || [],
        main_image: product.main_image,
        category_id: product.category_id,
        category_type: product.category_type || 'ready_made',
        usage_type: product.usage_type || 'indoor',
        product_type: product.product_type,
        product_categories: product.product_categories,
        seller_id: product.seller_id,
        seller_name: product.seller?.full_name || product.seller_name,
        seller_business: product.seller?.business_name,
        rating: product.rating || 0,
        review_count: product.review_count || 0,
        orders_count: product.orders_count || 0,
        units_sold: product.units_sold,
        revenue: product.revenue,
        sku: product.sku,
        barcode: product.barcode,
        warranty: product.warranty,
        material: product.material,
        finish_type: product.finish_type,
        primary_color: product.primary_color,
        dimensions: product.dimensions,
        weight: product.weight,
        created_at: product.created_at,
        updated_at: product.updated_at,
        last_sold_at: product.last_sold_at,
        delivery_cities: product.delivery_cities,
        shipping_options: product.shipping_options,
        installation_available: product.installation_available,
        return_policy: product.return_policy,
        warning_count: product.warning_count || 0,
        warning_reasons: product.warning_reasons,
        admin_notes: product.admin_notes,
        is_suspended_by_admin: product.is_suspended_by_admin || false,
        suspension_reason: product.suspension_reason,
        suspension_date: product.suspension_date,
        tags: product.tags,
        metadata: product.metadata
      }));

      setAllProducts(formattedProducts);
      setProducts(formattedProducts);
      
      // Fetch sellers list
      await fetchSellers();
      
      // Calculate stats
      calculateStats(formattedProducts);
      
    } catch (error) {
      console.error('❌ Error in fetchAllProducts:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // Fetch sellers list
  const fetchSellers = async () => {
    try {
      const { data: sellersData, error } = await supabase
        .from('profiles')
        .select('id, full_name, business_name, email, phone, status, user_type')
        .in('user_type', ['seller', 'seller_active', 'seller_pending', 'seller_suspended'])
        .order('business_name');

      if (error) throw error;

      const sellersWithStats = await Promise.all(
        (sellersData || []).map(async (seller) => {
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', seller.id);

          const { data: ordersData } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('seller_id', seller.id);

          const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

          return {
            id: seller.id,
            name: seller.full_name,
            business_name: seller.business_name || seller.full_name,
            email: seller.email,
            phone: seller.phone,
            status: seller.status || 'active',
            product_count: productCount || 0,
            total_sales: totalSales
          };
        })
      );

      setSellers(sellersWithStats);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  // Calculate statistics
  const calculateStats = (productsList: Product[]) => {
    setLoadingStats(true);
    try {
      const categoriesBreakdown: Record<string, number> = {};
      const sellerBreakdown: Record<string, number> = {};
      
      const typeBreakdown = {
        ready_made: 0,
        customized: 0
      };
      
      const usageBreakdown = {
        indoor: 0,
        outdoor: 0,
        both: 0
      };

      let totalRevenue = 0;
      let totalUnitsSold = 0;
      let totalRating = 0;
      let ratedProducts = 0;
      let totalPrice = 0;
      let warningCount = 0;

      productsList.forEach(product => {
        // Category breakdown
        const category = product.category_type || 'uncategorized';
        categoriesBreakdown[category] = (categoriesBreakdown[category] || 0) + 1;
        
        // Seller breakdown
        sellerBreakdown[product.seller_id] = (sellerBreakdown[product.seller_id] || 0) + 1;
        
        // Type breakdown
        typeBreakdown[product.category_type] = (typeBreakdown[product.category_type] || 0) + 1;
        
        // Usage breakdown
        usageBreakdown[product.usage_type] = (usageBreakdown[product.usage_type] || 0) + 1;
        
        // Totals
        totalRevenue += product.revenue || 0;
        totalUnitsSold += product.units_sold || 0;
        totalPrice += product.price || 0;
        warningCount += product.warning_count || 0;
        
        if (product.rating > 0) {
          totalRating += product.rating;
          ratedProducts++;
        }
      });

      const statsData: ProductStats = {
        totalProducts: productsList.length,
        activeProducts: productsList.filter(p => p.status === 'active').length,
        inactiveProducts: productsList.filter(p => p.status === 'inactive').length,
        draftProducts: productsList.filter(p => p.status === 'draft').length,
        pendingProducts: productsList.filter(p => p.status === 'pending').length,
        suspendedProducts: productsList.filter(p => p.status === 'suspended' || p.is_suspended_by_admin).length,
        underReviewProducts: productsList.filter(p => p.status === 'under_review').length,
        outOfStockProducts: productsList.filter(p => p.stock_quantity === 0).length,
        lowStockProducts: productsList.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5)).length,
        featuredProducts: productsList.filter(p => p.is_featured).length,
        advertisedProducts: productsList.filter(p => p.is_advertised).length,
        bestSellerProducts: productsList.filter(p => p.is_best_seller).length,
        totalRevenue,
        totalUnitsSold,
        averageRating: ratedProducts > 0 ? totalRating / ratedProducts : 0,
        averagePrice: productsList.length > 0 ? totalPrice / productsList.length : 0,
        warningCount,
        categoriesBreakdown,
        sellerBreakdown,
        typeBreakdown,
        usageBreakdown
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  console.log('All Products:', allProducts);
  // Apply filters
  // const applyFilters = () => {
  //   let filtered = [...allProducts];

  //   // Search filter
  //   if (filters.search) {
  //     const searchTerm = filters.search.toLowerCase();
  //     filtered = filtered.filter(p => 
  //       p.name.toLowerCase().includes(searchTerm) ||
  //       p.description?.toLowerCase().includes(searchTerm) ||
  //       p.short_description?.toLowerCase().includes(searchTerm) ||
  //       p.sku?.toLowerCase().includes(searchTerm) ||
  //       p.seller_name?.toLowerCase().includes(searchTerm) ||
  //       p.seller_business?.toLowerCase().includes(searchTerm) ||
  //       p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  //     );
  //   }

  //   // Category type filter
  //   if (filters.categoryType) {
  //     filtered = filtered.filter(p => p.category_type === filters.categoryType);
  //   }

  //   // Usage type filter
  //   if (filters.usageType) {
  //     filtered = filtered.filter(p => p.usage_type === filters.usageType);
  //   }

  //   // Product type filter
  //   if (filters.productType) {
  //     filtered = filtered.filter(p => p.product_type === filters.productType);
  //   }

  //   // Status filter
  //   if (filters.status) {
  //     filtered = filtered.filter(p => p.status === filters.status);
  //   }

  //   // Stock status filter
  //   if (filters.stockStatus) {
  //     switch (filters.stockStatus) {
  //       case 'in_stock':
  //         filtered = filtered.filter(p => p.stock_quantity > 0);
  //         break;
  //       case 'out_of_stock':
  //         filtered = filtered.filter(p => p.stock_quantity === 0);
  //         break;
  //       case 'low_stock':
  //         filtered = filtered.filter(p => 
  //           p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5)
  //         );
  //         break;
  //     }
  //   }

  //   // Price range filter
  //   filtered = filtered.filter(p => 
  //     p.price >= filters.priceRange[0] && 
  //     p.price <= filters.priceRange[1]
  //   );

  //   // Seller filter
  //   if (filters.sellerId) {
  //     filtered = filtered.filter(p => p.seller_id === filters.sellerId);
  //   }

  //   // Rating filter
  //   if (filters.minRating > 0) {
  //     filtered = filtered.filter(p => p.rating >= filters.minRating);
  //   }

  //   // Featured filter
  //   if (filters.isFeatured !== null) {
  //     filtered = filtered.filter(p => p.is_featured === filters.isFeatured);
  //   }

  //   // Advertised filter
  //   if (filters.isAdvertised !== null) {
  //     filtered = filtered.filter(p => p.is_advertised === filters.isAdvertised);
  //   }

  //   // Best seller filter
  //   if (filters.isBestSeller !== null) {
  //     filtered = filtered.filter(p => p.is_best_seller === filters.isBestSeller);
  //   }

  //   // Warnings filter
  //   if (filters.hasWarnings !== null) {
  //     if (filters.hasWarnings) {
  //       filtered = filtered.filter(p => (p.warning_count || 0) > 0);
  //     } else {
  //       filtered = filtered.filter(p => !p.warning_count || p.warning_count === 0);
  //     }
  //   }

  //   // Suspended filter
  //   if (filters.isSuspended !== null) {
  //     if (filters.isSuspended) {
  //       filtered = filtered.filter(p => p.is_suspended_by_admin || p.status === 'suspended');
  //     } else {
  //       filtered = filtered.filter(p => !p.is_suspended_by_admin && p.status !== 'suspended');
  //     }
  //   }

  //   // Date range filter
  //   if (filters.dateRange[0]) {
  //     const startDate = filters.dateRange[0];
  //     filtered = filtered.filter(p => new Date(p.created_at) >= startDate);
  //   }
  //   if (filters.dateRange[1]) {
  //     const endDate = filters.dateRange[1];
  //     filtered = filtered.filter(p => new Date(p.created_at) <= endDate);
  //   }

  //   // Sorting
  //   filtered.sort((a, b) => {
  //     let aValue: any, bValue: any;
      
  //     switch (filters.sortBy) {
  //       case 'name':
  //         aValue = a.name;
  //         bValue = b.name;
  //         break;
  //       case 'price':
  //         aValue = a.price;
  //         bValue = b.price;
  //         break;
  //       case 'created_at':
  //         aValue = new Date(a.created_at).getTime();
  //         bValue = new Date(b.created_at).getTime();
  //         break;
  //       case 'updated_at':
  //         aValue = new Date(a.updated_at).getTime();
  //         bValue = new Date(b.updated_at).getTime();
  //         break;
  //       case 'rating':
  //         aValue = a.rating;
  //         bValue = b.rating;
  //         break;
  //       case 'orders':
  //         aValue = a.orders_count;
  //         bValue = b.orders_count;
  //         break;
  //       case 'revenue':
  //         aValue = a.revenue || 0;
  //         bValue = b.revenue || 0;
  //         break;
  //       case 'stock':
  //         aValue = a.stock_quantity;
  //         bValue = b.stock_quantity;
  //         break;
  //       default:
  //         aValue = new Date(a.created_at).getTime();
  //         bValue = new Date(b.created_at).getTime();
  //     }
      
  //     if (filters.sortOrder === 'asc') {
  //       return aValue > bValue ? 1 : -1;
  //     } else {
  //       return aValue < bValue ? 1 : -1;
  //     }
  //   });

  //   setFilteredProducts(filtered);
  //   setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  //   setPage(1);
  //   calculateStats(filtered);
  // };

  const applyFilters = () => {
  // If no products in the database, generate 15 dummy products
  let sourceProducts = allProducts.length > 0 ? [...allProducts] : Array.from({ length: 15 }).map((_, index) => ({
    id: `demo-${index + 1}`,
    name: `Demo Product ${index + 1}`,
    description: `This is a description for Demo Product ${index + 1}`,
    short_description: `Short description ${index + 1}`,
    price: 1000 + index * 50,
    discounted_price: null,
    original_price: null,
    cost_price: null,
    stock_quantity: 50,
    min_stock_level: 5,
    status: 'active',
    is_featured: false,
    is_best_seller: false,
    is_advertised: false,
    images: [],
    main_image: '',
    category_id: null,
    category_type: 'ready_made',
    usage_type: 'indoor',
    product_type: 'general',
    product_categories: [],
    seller_id: 'demo-seller',
    seller_name: 'Demo Seller',
    seller_business: 'Demo Store',
    rating: 0,
    review_count: 0,
    orders_count: 0,
    units_sold: 0,
    revenue: 0,
    sku: `DEMO-SKU-${index + 1}`,
    barcode: `DEMO-BARCODE-${index + 1}`,
    warranty: null,
    material: null,
    finish_type: null,
    primary_color: 'N/A',
    dimensions: null,
    weight: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sold_at: null,
    delivery_cities: [],
    shipping_options: [],
    installation_available: false,
    return_policy: null,
    warning_count: 0,
    warning_reasons: [],
    admin_notes: null,
    is_suspended_by_admin: false,
    suspension_reason: null,
    suspension_date: null,
    tags: [],
    metadata: {},
  }));

  let filtered = [...sourceProducts];

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description?.toLowerCase().includes(searchTerm) ||
      p.short_description?.toLowerCase().includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm) ||
      p.seller_name?.toLowerCase().includes(searchTerm) ||
      p.seller_business?.toLowerCase().includes(searchTerm) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Category type filter
  if (filters.categoryType) filtered = filtered.filter(p => p.category_type === filters.categoryType);

  // Usage type filter
  if (filters.usageType) filtered = filtered.filter(p => p.usage_type === filters.usageType);

  // Product type filter
  if (filters.productType) filtered = filtered.filter(p => p.product_type === filters.productType);

  // Status filter
  if (filters.status) filtered = filtered.filter(p => p.status === filters.status);

  // Stock status filter
  if (filters.stockStatus) {
    switch (filters.stockStatus) {
      case 'in_stock':
        filtered = filtered.filter(p => p.stock_quantity > 0);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(p => p.stock_quantity === 0);
        break;
      case 'low_stock':
        filtered = filtered.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5));
        break;
    }
  }

  // Price range filter
  filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

  // Seller filter
  if (filters.sellerId) filtered = filtered.filter(p => p.seller_id === filters.sellerId);

  // Rating filter
  if (filters.minRating > 0) filtered = filtered.filter(p => p.rating >= filters.minRating);

  // Featured filter
  if (filters.isFeatured !== null) filtered = filtered.filter(p => p.is_featured === filters.isFeatured);

  // Advertised filter
  if (filters.isAdvertised !== null) filtered = filtered.filter(p => p.is_advertised === filters.isAdvertised);

  // Best seller filter
  if (filters.isBestSeller !== null) filtered = filtered.filter(p => p.is_best_seller === filters.isBestSeller);

  // Warnings filter
  if (filters.hasWarnings !== null) {
    filtered = filters.hasWarnings
      ? filtered.filter(p => (p.warning_count || 0) > 0)
      : filtered.filter(p => !p.warning_count || p.warning_count === 0);
  }

  // Suspended filter
  if (filters.isSuspended !== null) {
    filtered = filters.isSuspended
      ? filtered.filter(p => p.is_suspended_by_admin || p.status === 'suspended')
      : filtered.filter(p => !p.is_suspended_by_admin && p.status !== 'suspended');
  }

  // Date range filter
  if (filters.dateRange[0]) {
    const startDate = filters.dateRange[0];
    filtered = filtered.filter(p => new Date(p.created_at) >= startDate);
  }
  if (filters.dateRange[1]) {
    const endDate = filters.dateRange[1];
    filtered = filtered.filter(p => new Date(p.created_at) <= endDate);
  }

  // Sorting
  filtered.sort((a, b) => {
    let aValue: any, bValue: any;
    switch (filters.sortBy) {
      case 'name': aValue = a.name; bValue = b.name; break;
      case 'price': aValue = a.price; bValue = b.price; break;
      case 'created_at': aValue = new Date(a.created_at).getTime(); bValue = new Date(b.created_at).getTime(); break;
      case 'updated_at': aValue = new Date(a.updated_at).getTime(); bValue = new Date(b.updated_at).getTime(); break;
      case 'rating': aValue = a.rating; bValue = b.rating; break;
      case 'orders': aValue = a.orders_count; bValue = b.orders_count; break;
      case 'revenue': aValue = a.revenue || 0; bValue = b.revenue || 0; break;
      case 'stock': aValue = a.stock_quantity; bValue = b.stock_quantity; break;
      default: aValue = new Date(a.created_at).getTime(); bValue = new Date(b.created_at).getTime();
    }
    return filters.sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  setFilteredProducts(filtered);
  setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  setPage(1);
  calculateStats(filtered);
};


  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      categoryType: '',
      usageType: '',
      productType: '',
      status: '',
      stockStatus: '',
      priceRange: [0, 100000],
      sellerId: '',
      minRating: 0,
      isFeatured: null,
      isAdvertised: null,
      isBestSeller: null,
      hasWarnings: null,
      isSuspended: null,
      dateRange: [null, null],
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  // Initialize
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, allProducts]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (product: Product) => {
    const status = product.status;
    const isSuspended = product.is_suspended_by_admin;
    
    let color = 'bg-gray-100 text-gray-800';
    let icon = Package;
    let text = status.charAt(0).toUpperCase() + status.slice(1);
    
    switch (status) {
      case 'active':
        color = isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        icon = isSuspended ? AlertTriangle : CheckCircle;
        text = isSuspended ? 'Suspended' : 'Active';
        break;
      case 'inactive':
        color = 'bg-gray-100 text-gray-800';
        icon = EyeOff;
        break;
      case 'draft':
        color = 'bg-yellow-100 text-yellow-800';
        icon = Edit;
        break;
      case 'pending':
        color = 'bg-blue-100 text-blue-800';
        icon = Clock;
        break;
      case 'suspended':
        color = 'bg-red-100 text-red-800';
        icon = AlertTriangle;
        break;
      case 'under_review':
        color = 'bg-orange-100 text-orange-800';
        icon = ShieldAlert;
        break;
      case 'rejected':
        color = 'bg-red-100 text-red-800';
        icon = XCircle;
        break;
      case 'archived':
        color = 'bg-gray-200 text-gray-800';
        icon = Archive;
        break;
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <icon className="w-3 h-3" />
        {text}
      </span>
    );
  };

  // Get stock badge
  const getStockBadge = (quantity: number, minLevel?: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (minLevel && quantity <= minLevel) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3" />
          Low Stock ({quantity})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        In Stock ({quantity})
      </span>
    );
  };

  // Get warning badge
  const getWarningBadge = (warningCount?: number) => {
    if (!warningCount || warningCount === 0) return null;
    
    let color = 'bg-yellow-100 text-yellow-800';
    if (warningCount >= 3) color = 'bg-red-100 text-red-800';
    else if (warningCount === 2) color = 'bg-orange-100 text-orange-800';
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <AlertTriangle className="w-3 h-3" />
        {warningCount} Warning{warningCount > 1 ? 's' : ''}
      </span>
    );
  };

  // Handle product view
  const handleView = (product: Product) => {
    navigate(`/admin/products/${product.id}`);
  };

  // Handle product edit
  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  // Handle product delete
  const handleDelete = async (product: Product) => {
    setProductToAction(product);
    setShowDeleteModal(true);
  };

  // Handle product warning
  const handleWarning = (product: Product) => {
    setProductToAction(product);
    setWarningForm({
      ...warningForm,
      productId: product.id,
      message: '',
      adminNote: ''
    });
    setShowWarningModal(true);
  };

  // Handle product suspension
  const handleSuspend = (product: Product) => {
    setProductToAction(product);
    setShowSuspensionModal(true);
  };

  // Handle product activation
  const handleActivate = async (product: Product) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'active',
          is_suspended_by_admin: false,
          suspension_reason: null,
          suspension_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Product activated successfully');
      await fetchAllProducts();
    } catch (error: any) {
      toast.error('Failed to activate product: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!productToAction) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToAction.id);

      if (error) throw error;

      // Create activity log
      await supabase
        .from('activity_logs')
        .insert({
          user_id: 'admin',
          user_type: 'admin',
          action: 'product_deleted',
          target_type: 'product',
          target_id: productToAction.id,
          details: JSON.stringify({
            product_name: productToAction.name,
            seller_id: productToAction.seller_id,
            reason: 'admin_deletion'
          }),
          created_at: new Date().toISOString()
        });

      toast.success('Product deleted successfully');
      await fetchAllProducts();
      setShowDeleteModal(false);
      setProductToAction(null);
    } catch (error: any) {
      toast.error('Failed to delete product: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit warning
  const submitWarning = async () => {
    if (!productToAction) return;
    
    setActionLoading(true);
    try {
      const currentWarnings = productToAction.warning_reasons || [];
      const currentCount = productToAction.warning_count || 0;
      
      const updatedProduct = {
        warning_count: currentCount + 1,
        warning_reasons: [...currentWarnings, {
          reason: warningForm.reason,
          severity: warningForm.severity,
          message: warningForm.message,
          admin_note: warningForm.adminNote,
          date: new Date().toISOString(),
          notified_seller: warningForm.notifySeller
        }],
        status: warningForm.suspendProduct ? 'suspended' : productToAction.status,
        is_suspended_by_admin: warningForm.suspendProduct || false,
        suspension_reason: warningForm.suspendProduct ? warningForm.message : null,
        suspension_date: warningForm.suspendProduct ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', productToAction.id);

      if (error) throw error;

      // Create activity log
      await supabase
        .from('activity_logs')
        .insert({
          user_id: 'admin',
          user_type: 'admin',
          action: 'product_warning_issued',
          target_type: 'product',
          target_id: productToAction.id,
          details: JSON.stringify({
            product_name: productToAction.name,
            seller_id: productToAction.seller_id,
            warning_reason: warningForm.reason,
            severity: warningForm.severity,
            suspend_product: warningForm.suspendProduct
          }),
          created_at: new Date().toISOString()
        });

      // Notify seller if requested
      if (warningForm.notifySeller) {
        await supabase
          .from('notifications')
          .insert({
            user_id: productToAction.seller_id,
            type: 'warning',
            title: 'Product Warning Issued',
            message: `Your product "${productToAction.name}" has received a warning: ${warningForm.message}`,
            data: JSON.stringify({
              product_id: productToAction.id,
              warning_reason: warningForm.reason,
              severity: warningForm.severity
            }),
            read: false,
            created_at: new Date().toISOString()
          });
      }

      toast.success('Warning issued successfully');
      await fetchAllProducts();
      setShowWarningModal(false);
      setProductToAction(null);
      setWarningForm({
        productId: '',
        reason: 'other',
        severity: 'medium',
        message: '',
        notifySeller: true,
        suspendProduct: false,
        suspensionDuration: 7,
        suspensionUnit: 'days',
        adminNote: ''
      });
    } catch (error: any) {
      toast.error('Failed to issue warning: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit suspension
  const submitSuspension = async () => {
    if (!productToAction) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'suspended',
          is_suspended_by_admin: true,
          suspension_reason: 'Suspended by admin',
          suspension_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', productToAction.id);

      if (error) throw error;

      // Create activity log
      await supabase
        .from('activity_logs')
        .insert({
          user_id: 'admin',
          user_type: 'admin',
          action: 'product_suspended',
          target_type: 'product',
          target_id: productToAction.id,
          details: JSON.stringify({
            product_name: productToAction.name,
            seller_id: productToAction.seller_id,
            reason: 'admin_suspension'
          }),
          created_at: new Date().toISOString()
        });

      // Notify seller
      await supabase
        .from('notifications')
        .insert({
          user_id: productToAction.seller_id,
          type: 'warning',
          title: 'Product Suspended',
          message: `Your product "${productToAction.name}" has been suspended by admin`,
          data: JSON.stringify({
            product_id: productToAction.id,
            reason: 'admin_suspension'
          }),
          read: false,
          created_at: new Date().toISOString()
        });

      toast.success('Product suspended successfully');
      await fetchAllProducts();
      setShowSuspensionModal(false);
      setProductToAction(null);
    } catch (error: any) {
      toast.error('Failed to suspend product: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) {
      toast.error('Please select products and an action');
      return;
    }

    setActionLoading(true);
    try {
      switch (bulkAction) {
        case 'activate':
          await supabase
            .from('products')
            .update({
              status: 'active',
              is_suspended_by_admin: false,
              suspension_reason: null,
              suspension_date: null,
              updated_at: new Date().toISOString()
            })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products activated`);
          break;
          
        case 'deactivate':
          await supabase
            .from('products')
            .update({
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products deactivated`);
          break;
          
        case 'suspend':
          await supabase
            .from('products')
            .update({
              status: 'suspended',
              is_suspended_by_admin: true,
              suspension_reason: 'Bulk suspension by admin',
              suspension_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products suspended`);
          break;
          
        case 'delete':
          await supabase
            .from('products')
            .delete()
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products deleted`);
          break;
          
        case 'feature':
          await supabase
            .from('products')
            .update({
              is_featured: true,
              updated_at: new Date().toISOString()
            })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products featured`);
          break;
          
        case 'unfeature':
          await supabase
            .from('products')
            .update({
              is_featured: false,
              updated_at: new Date().toISOString()
            })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} products unfeatured`);
          break;
      }

      await fetchAllProducts();
      setSelectedProducts([]);
      setBulkAction('');
    } catch (error: any) {
      toast.error('Failed to perform bulk action: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Select/deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
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

  // Export products
  const exportProducts = () => {
    const headers = [
      'ID', 'Name', 'SKU', 'Category Type', 'Usage Type', 'Product Type',
      'Price (SAR)', 'Discounted Price', 'Stock', 'Status', 'Seller',
      'Rating', 'Reviews', 'Orders', 'Revenue', 'Created Date', 'Warnings',
      'Is Featured', 'Is Best Seller', 'Is Advertised'
    ];

    const csvData = filteredProducts.map(product => [
      product.id,
      `"${product.name}"`,
      product.sku || '',
      product.category_type,
      product.usage_type,
      product.product_type || '',
      product.price,
      product.discounted_price || '',
      product.stock_quantity,
      product.status,
      `"${product.seller_business || product.seller_name}"`,
      product.rating,
      product.review_count,
      product.orders_count,
      product.revenue || 0,
      new Date(product.created_at).toISOString().split('T')[0],
      product.warning_count || 0,
      product.is_featured ? 'Yes' : 'No',
      product.is_best_seller ? 'Yes' : 'No',
      product.is_advertised ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Refresh products
  const refreshProducts = () => {
    setRefreshing(true);
    fetchAllProducts();
  };

  // Loading state
  // if (!loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
  //         <p className="text-gray-600 text-sm">Loading products...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen  ">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Products Management</h1>
            <p className="text-gray-600 text-xs mt-0.5">
              Manage all products from the platform. {allProducts.length} total products
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportProducts}
              className="flex items-center gap-1.5 px-3 py-2 border bg-yellow-400 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={refreshProducts}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-400 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && !loadingStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-600">Total Products</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.activeProducts} active • {stats.draftProducts} draft
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.activeProducts}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.featuredProducts} featured • {stats.bestSellerProducts} best sellers
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-red-100 to-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.suspendedProducts + stats.underReviewProducts}</p>
                <p className="text-xs text-gray-600">Issues</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.suspendedProducts} suspended • {stats.underReviewProducts} under review
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.outOfStockProducts + stats.lowStockProducts}</p>
                <p className="text-xs text-gray-600">Stock Issues</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.outOfStockProducts} out of stock • {stats.lowStockProducts} low stock
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-600">Total Revenue</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.totalUnitsSold} units sold
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.warningCount}</p>
                <p className="text-xs text-gray-600">Warnings</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Avg. rating: {stats.averageRating.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-700">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Choose action...</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="suspend">Suspend</option>
                <option value="delete">Delete</option>
                <option value="feature">Mark as Featured</option>
                <option value="unfeature">Remove Featured</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || actionLoading}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Apply'}
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, description, seller, or tags..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              Advanced Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Reset
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 ${viewMode === 'compact' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4 mt-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category Type</label>
                <select
                  value={filters.categoryType}
                  onChange={(e) => setFilters({ ...filters, categoryType: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Category Types</option>
                  <option value="ready_made">Ready Made</option>
                  <option value="customized">Customized</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Usage Type</label>
                <select
                  value={filters.usageType}
                  onChange={(e) => setFilters({ ...filters, usageType: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Usage Types</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Seller</label>
                <select
                  value={filters.sellerId}
                  onChange={(e) => setFilters({ ...filters, sellerId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Sellers</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.business_name} ({seller.product_count} products)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="under_review">Under Review</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Status</label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="0">Any Rating</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="orders">Orders</option>
                  <option value="revenue">Revenue</option>
                  <option value="stock">Stock</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={filters.isFeatured === true}
                  onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked ? true : null })}
                  className="rounded text-blue-500"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">Featured Only</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="advertised"
                  checked={filters.isAdvertised === true}
                  onChange={(e) => setFilters({ ...filters, isAdvertised: e.target.checked ? true : null })}
                  className="rounded text-blue-500"
                />
                <label htmlFor="advertised" className="text-sm text-gray-700">Advertised Only</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="warnings"
                  checked={filters.hasWarnings === true}
                  onChange={(e) => setFilters({ ...filters, hasWarnings: e.target.checked ? true : null })}
                  className="rounded text-blue-500"
                />
                <label htmlFor="warnings" className="text-sm text-gray-700">Has Warnings</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="suspended"
                  checked={filters.isSuspended === true}
                  onChange={(e) => setFilters({ ...filters, isSuspended: e.target.checked ? true : null })}
                  className="rounded text-blue-500"
                />
                <label htmlFor="suspended" className="text-sm text-gray-700">Suspended Only</label>
              </div>
            </div>
          </div>
        )}

        {/* Active filters summary */}
        {Object.values(filters).some(val => 
          (typeof val === 'string' && val !== '' && val !== '0') ||
          (typeof val === 'number' && val > 0) ||
          (typeof val === 'boolean' && val !== null) ||
          (Array.isArray(val) && val.some(v => v !== null && v !== 0))
        ) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Active filters:</span>
            {filters.categoryType && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Category: {filters.categoryType.replace('_', ' ')}
              </span>
            )}
            {filters.usageType && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Usage: {filters.usageType}
              </span>
            )}
            {filters.status && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Status: {filters.status}
              </span>
            )}
            {filters.search && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{filters.search}"
              </span>
            )}
            {filters.sellerId && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Seller: {sellers.find(s => s.id === filters.sellerId)?.business_name}
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Min Rating: {filters.minRating}+
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Table/Grid */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Products Management</h2>
              <p className="text-gray-600 text-xs mt-0.5">
                Showing {paginatedProducts.length} of {filteredProducts.length} products
                {filters.search && ` for "${filters.search}"`}
              </p>
            </div>
            <div className="text-xs text-gray-600">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-600 mb-1.5">No products found</h3>
            <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-blue-500"
                      />
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="rounded text-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400 m-auto" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 text-sm truncate max-w-xs">{product.name}</p>
                              {product.is_featured && (
                                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  Featured
                                </span>
                              )}
                              {product.is_best_seller && (
                                <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                  Best Seller
                                </span>
                              )}
                              {product.is_advertised && (
                                <span className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  AD
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {product.sku && `SKU: ${product.sku} • `}
                              {product.category_type} • {product.usage_type}
                            </p>
                            {getWarningBadge(product.warning_count)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{product.seller_business || product.seller_name}</p>
                          <p className="text-gray-500 text-xs truncate max-w-xs">
                            {sellers.find(s => s.id === product.seller_id)?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(product.price)}</p>
                          {product.discounted_price && (
                            <p className="text-gray-500 text-xs line-through">
                              {formatCurrency(product.discounted_price)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStockBadge(product.stock_quantity, product.min_stock_level)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(product)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-gray-900">{product.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({product.review_count})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-gray-900">{product.orders_count} orders</span>
                          </div>
                          {product.revenue && product.revenue > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-gray-900">{formatCurrency(product.revenue)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(product)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {product.is_suspended_by_admin || product.status === 'suspended' ? (
                            <button
                              onClick={() => handleActivate(product)}
                              disabled={actionLoading}
                              className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                              title="Activate"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(product)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Suspend"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleWarning(product)}
                            className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                            title="Issue Warning"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-2.5 py-1 rounded-lg text-sm ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          // Grid View (simplified for brevity)
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.seller_business}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded text-blue-500"
                    />
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(product)}
                      {getStockBadge(product.stock_quantity, product.min_stock_level)}
                    </div>
                    {getWarningBadge(product.warning_count)}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-900">{product.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(product)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleWarning(product)}
                      className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      {showWarningModal && productToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Issue Warning</h3>
                <button onClick={() => setShowWarningModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Product: <span className="font-medium">{productToAction.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Seller: <span className="font-medium">{productToAction.seller_business || productToAction.seller_name}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    value={warningForm.reason}
                    onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="fake_product">Fake/Imitation Product</option>
                    <option value="misleading_info">Misleading Information</option>
                    <option value="poor_quality">Poor Quality</option>
                    <option value="copyright_issue">Copyright/Trademark Issue</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="customer_complaints">Customer Complaints</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map(severity => (
                      <button
                        key={severity}
                        type="button"
                        onClick={() => setWarningForm({ ...warningForm, severity })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                          warningForm.severity === severity
                            ? severity === 'low' ? 'bg-green-100 text-green-800 border border-green-300' :
                              severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              severity === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                        }`}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message to Seller</label>
                  <textarea
                    value={warningForm.message}
                    onChange={(e) => setWarningForm({ ...warningForm, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Explain the issue to the seller..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Internal)</label>
                  <textarea
                    value={warningForm.adminNote}
                    onChange={(e) => setWarningForm({ ...warningForm, adminNote: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Internal notes for admin team..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={warningForm.notifySeller}
                      onChange={(e) => setWarningForm({ ...warningForm, notifySeller: e.target.checked })}
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm text-gray-700">Notify seller about this warning</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={warningForm.suspendProduct}
                      onChange={(e) => setWarningForm({ ...warningForm, suspendProduct: e.target.checked })}
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm text-gray-700">Suspend product temporarily</span>
                  </label>
                </div>
                
                {warningForm.suspendProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Duration</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={warningForm.suspensionDuration}
                        onChange={(e) => setWarningForm({ ...warningForm, suspensionDuration: Number(e.target.value) })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="1"
                      />
                      <select
                        value={warningForm.suspensionUnit}
                        onChange={(e) => setWarningForm({ ...warningForm, suspensionUnit: e.target.value as any })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWarning}
                  disabled={actionLoading || !warningForm.message.trim()}
                  className="flex-1 py-2.5 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Issue Warning'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && productToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Product</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete "{productToAction.name}"? This action cannot be undone.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Product Details</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Seller: {productToAction.seller_business || productToAction.seller_name}<br />
                    SKU: {productToAction.sku || 'N/A'}<br />
                    Status: {productToAction.status}<br />
                    Orders: {productToAction.orders_count}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && productToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Suspend Product</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to suspend "{productToAction.name}"? This product will be hidden from the platform.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Product Details</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Seller: {productToAction.seller_business || productToAction.seller_name}<br />
                    Current Status: {productToAction.status}<br />
                    Orders: {productToAction.orders_count}<br />
                    Warnings: {productToAction.warning_count || 0}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Reason</label>
                  <textarea
                    placeholder="Briefly explain why this product is being suspended..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-blue-500" />
                  <span className="text-sm text-gray-700">Notify seller about suspension</span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuspensionModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSuspension}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Suspend Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;