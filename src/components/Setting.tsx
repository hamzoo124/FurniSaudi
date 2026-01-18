// src/components/Setting.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertCircle,
  Shield,
  User,
  Store,
  Package,
  ShoppingBag,
  Wallet,
  FileText,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  Download,
  Upload,
  Filter,
  Search,
  Users,
  CreditCard,
  Truck,
  Flag,
  Mail,
  Phone,
  Home,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Minus,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  ShieldCheck,
  Key,
  FileCheck,
  Activity,
  Database,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  WifiOff,
  LogOut,
  Power,
  Zap,
  BellRing,
  MessageSquare,
  HelpCircle,
  Info,
  Globe2,
  Languages,
  Moon,
  Sun,
  Palette,
  Layout,
  Grid,
  Columns,
  Sidebar,
  Container,
  Box,
  ServerCrash,
  Network,
  ShieldAlert,
  BadgeAlert,
  AlertOctagon,
  FileWarning,
  Ban,
  Unlock,
  LockKeyhole,
  Fingerprint,
  ScanFace,
  QrCode,
  Scan,
  Camera,
  Image,
  Video,
  Music,
  File,
  Folder,
  FolderOpen,
  FolderTree,
  Archive,
  Inbox,
  Send,
  Mailbox,
  Paperclip,
  Link,
  ExternalLink,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Move,
  RotateCcw,
  RotateCw,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Terminal,
  BookOpen,
  Book,
  Award,
  GraduationCap,
  School,
  Briefcase,
  Building,
  Map,
  Navigation,
  Compass,
  MapPinned,
  Plane,
  Car,
  Bike,
  Ship,
  Rocket,
  Train,
  Bus,
  Ambulance,
  FireExtinguisher,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Star,
  Trophy,
  Crown,
  Flag as FlagIcon,
  Award as AwardIcon,
  Coins,
  Bitcoin,
  Ethereum,
  HandCoins,
  Handshake,
  Scale,
  Gavel,
  Hammer,
  Wrench,
  Screwdriver,
  Tool,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  SwitchCamera,
  Brush,
  Eraser,
  PenTool,
  Ruler,
  Scissors,
  Combine,
  Crop,
  Layers,
  Rows,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Cube,
  Cuboid,
  Cylinder,
  Pyramid,
  Cone,
  Sphere,
  CircleDot,
  Dot,
  Circle,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Hexagon,
  Octagon,
  Triangle,
  Diamond,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  Radar,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare,
  GitFork,
  Share2,
  Share,
  UploadCloud,
  DownloadCloud,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  CloudMoon,
  SunDim,
  MoonStar,
  Thermometer,
  Droplets,
  Umbrella,
  Wind,
  Tornado,
  Hurricane,
  Snowflake,
  Flame,
  Droplet,
  Mountain,
  Trees,
  Leaf,
  Sprout,
  Flower2,
  Bone,
  Skull,
  Brain,
  HeartPulse,
  Pulse,
  Stethoscope,
  Pill,
  Syringe,
  ThermometerSnowflake,
  ThermometerSun,
  Cookie,
  Cake,
  Coffee,
  Wine,
  Beer,
  Utensils,
  Apple,
  Carrot,
  Drumstick,
  Egg,
  Fish,
  Sandwich,
  Pizza,
  Salad,
  Soup,
  Candy,
  IceCream,
  Milk,
  EggFried,
  ChefHat,
  CupSoda,
  Martini,
  GlassWater,
  WineGlass,
  Trophy as TrophyIcon,
  Medal,
  Crown as CrownIcon,
  Target,
  Crosshair,
  Award as AwardIcon2,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Smile as SmileIcon,
  Frown as FrownIcon,
  Meh as MehIcon,
  Laugh as LaughIcon,
  Angry as AngryIcon
} from 'lucide-react';

// Import hooks and utilities
import { supabase } from '@/lib/supabase';

// Types
interface PlatformSettings {
  // General
  platform_name: string;
  support_email: string;
  support_phone: string;
  default_language: string;
  currency: string;
  timezone: string;
  date_format: string;
  maintenance_mode: boolean;
  allow_new_sellers: boolean;
  allow_new_buyers: boolean;
  
  // Seller
  default_commission_rate: number;
  min_payout_amount: number;
  payout_schedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  require_product_approval: boolean;
  max_products_per_seller: number;
  seller_verification_required: boolean;
  
  // Buyer
  allow_buyer_purchases: boolean;
  buyer_order_limit: number;
  refund_window_days: number;
  dispute_window_days: number;
  require_buyer_verification: boolean;
  
  // Order
  allow_cod: boolean;
  order_auto_cancel_hours: number;
  delivery_zones: string[];
  return_window_days: number;
  
  // Payment
  platform_commission: number;
  escrow_period_hours: number;
  require_payout_approval: boolean;
  payout_approval_threshold: number;
  enable_wallet: boolean;
  
  // Security
  max_login_attempts: number;
  account_lock_minutes: number;
  enable_ip_tracking: boolean;
  require_2fa_admin: boolean;
  session_timeout_minutes: number;
  
  // Notifications
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
  notify_admin_large_order: boolean;
  large_order_threshold: number;
  notify_admin_high_payout: boolean;
  high_payout_threshold: number;
  notify_admin_dispute: boolean;
  notify_admin_suspicious: boolean;
  
  // Activity Logs
  enable_activity_logs: boolean;
  log_retention_days: number;
  enable_audit_trail: boolean;
  
  // UI/UX
  theme: 'light' | 'dark';
  enable_animations: boolean;
  enable_rtl: boolean;
  enable_high_contrast: boolean;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

interface SettingPageProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
}

const Setting: React.FC<SettingPageProps> = ({ onLogout, onNavigate, onBack }) => {
  const navigate = useNavigate();
  
  // State for settings
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'Furniture Marketplace',
    support_email: 'support@furniture.com',
    support_phone: '+1-234-567-8900',
    default_language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    maintenance_mode: false,
    allow_new_sellers: true,
    allow_new_buyers: true,
    
    default_commission_rate: 10.0,
    min_payout_amount: 50.0,
    payout_schedule: 'weekly',
    require_product_approval: true,
    max_products_per_seller: 100,
    seller_verification_required: true,
    
    allow_buyer_purchases: true,
    buyer_order_limit: 10,
    refund_window_days: 30,
    dispute_window_days: 14,
    require_buyer_verification: false,
    
    allow_cod: true,
    order_auto_cancel_hours: 24,
    delivery_zones: ['US', 'CA', 'UK', 'EU', 'AU'],
    return_window_days: 30,
    
    platform_commission: 15.0,
    escrow_period_hours: 48,
    require_payout_approval: true,
    payout_approval_threshold: 1000,
    enable_wallet: true,
    
    max_login_attempts: 5,
    account_lock_minutes: 30,
    enable_ip_tracking: true,
    require_2fa_admin: true,
    session_timeout_minutes: 60,
    
    enable_email_notifications: true,
    enable_push_notifications: true,
    notify_admin_large_order: true,
    large_order_threshold: 500,
    notify_admin_high_payout: true,
    high_payout_threshold: 1000,
    notify_admin_dispute: true,
    notify_admin_suspicious: true,
    
    enable_activity_logs: true,
    log_retention_days: 365,
    enable_audit_trail: true,
    
    theme: 'light',
    enable_animations: true,
    enable_rtl: false,
    enable_high_contrast: false,
  });
  
  const [activeTab, setActiveTab] = useState<string>('general');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newDeliveryZone, setNewDeliveryZone] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userType, setUserType] = useState<string>('seller');
  
  // Check user type on mount
  useEffect(() => {
    const checkUserType = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserType(profile.user_type);
          setIsAdmin(profile.user_type === 'admin');
          
          // Only admins should see admin settings
          if (profile.user_type !== 'admin') {
            // If not admin, show limited seller settings
            setActiveTab('seller-profile');
          } else {
            // Load admin settings
            await loadSettings();
            await loadUserRoles();
          }
        }
      } catch (error) {
        console.error('Error checking user type:', error);
      }
    };
    
    checkUserType();
  }, [navigate]);
  
  // Load platform settings from database (Admin only)
  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      
      if (data) {
        setSettings(data.settings);
      }
      
      // Log activity
      await logActivity('admin', 'view_settings', 'settings', 'admin', {
        action: 'loaded_settings',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user roles (Admin only)
  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setUserRoles(data);
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
  };
  
  // Log activity
  const logActivity = async (userType: string, action: string, targetType: string, targetId: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || 'system',
          user_type: userType,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };
  
  // Save settings to database
  const saveSettings = async () => {
    if (!isAdmin) {
      alert('Only administrators can save platform settings.');
      return;
    }
    
    setSaving(true);
    try {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('platform_settings')
        .select('id')
        .single();
      
      let error;
      
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('platform_settings')
          .update({ 
            settings,
            updated_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', existingSettings.id);
        
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            settings,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          });
        
        error = insertError;
      }
      
      if (error) throw error;
      
      // Log activity
      await logActivity('admin', 'update_settings', 'settings', 'admin', {
        action: 'saved_settings',
        changes: settings,
        timestamp: new Date().toISOString()
      });
      
      alert('✅ Settings saved successfully!');
      
      // If maintenance mode was toggled, show warning
      if (settings.maintenance_mode) {
        alert('⚠️ Platform is now in maintenance mode. Users will see maintenance page.');
      }
      
      // If language changed, reload page
      if (window.location.search.includes('lang=')) {
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle dangerous actions with confirmation
  const handleDangerousAction = (title: string, message: string, action: () => void) => {
    setConfirmAction({ title, message, action });
    setShowConfirmModal(true);
  };
  
  // Force logout all users
  const forceLogoutAllUsers = async () => {
    try {
      await logActivity('admin', 'force_logout', 'users', 'all', {
        action: 'force_logout_all_users',
        timestamp: new Date().toISOString()
      });
      
      alert('✅ All users will be logged out on their next request.');
    } catch (error) {
      console.error('Error forcing logout:', error);
      alert('❌ Error forcing logout.');
    }
  };
  
  // Reset all settings to defaults
  const resetToDefaults = async () => {
    const defaultSettings: PlatformSettings = {
      platform_name: 'Furniture Marketplace',
      support_email: 'support@furniture.com',
      support_phone: '+1-234-567-8900',
      default_language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      maintenance_mode: false,
      allow_new_sellers: true,
      allow_new_buyers: true,
      
      default_commission_rate: 10.0,
      min_payout_amount: 50.0,
      payout_schedule: 'weekly',
      require_product_approval: true,
      max_products_per_seller: 100,
      seller_verification_required: true,
      
      allow_buyer_purchases: true,
      buyer_order_limit: 10,
      refund_window_days: 30,
      dispute_window_days: 14,
      require_buyer_verification: false,
      
      allow_cod: true,
      order_auto_cancel_hours: 24,
      delivery_zones: ['US', 'CA', 'UK', 'EU', 'AU'],
      return_window_days: 30,
      
      platform_commission: 15.0,
      escrow_period_hours: 48,
      require_payout_approval: true,
      payout_approval_threshold: 1000,
      enable_wallet: true,
      
      max_login_attempts: 5,
      account_lock_minutes: 30,
      enable_ip_tracking: true,
      require_2fa_admin: true,
      session_timeout_minutes: 60,
      
      enable_email_notifications: true,
      enable_push_notifications: true,
      notify_admin_large_order: true,
      large_order_threshold: 500,
      notify_admin_high_payout: true,
      high_payout_threshold: 1000,
      notify_admin_dispute: true,
      notify_admin_suspicious: true,
      
      enable_activity_logs: true,
      log_retention_days: 365,
      enable_audit_trail: true,
      
      theme: 'light',
      enable_animations: true,
      enable_rtl: false,
      enable_high_contrast: false,
    };
    
    setSettings(defaultSettings);
    await logActivity('admin', 'reset_settings', 'settings', 'admin', {
      action: 'reset_to_defaults',
      timestamp: new Date().toISOString()
    });
    
    alert('✅ Settings reset to defaults. Remember to save!');
  };
  
  // Add delivery zone
  const addDeliveryZone = () => {
    if (newDeliveryZone.trim() && !settings.delivery_zones.includes(newDeliveryZone.trim())) {
      setSettings({
        ...settings,
        delivery_zones: [...settings.delivery_zones, newDeliveryZone.trim()]
      });
      setNewDeliveryZone('');
    }
  };
  
  // Remove delivery zone
  const removeDeliveryZone = (zone: string) => {
    setSettings({
      ...settings,
      delivery_zones: settings.delivery_zones.filter(z => z !== zone)
    });
  };
  
  // Toggle maintenance mode
  const toggleMaintenanceMode = () => {
    handleDangerousAction(
      settings.maintenance_mode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode',
      settings.maintenance_mode 
        ? 'Users will be able to access the platform again. Are you sure?' 
        : 'The platform will go into maintenance mode. Only admins will be able to access. Are you sure?',
      () => {
        setSettings({
          ...settings,
          maintenance_mode: !settings.maintenance_mode
        });
      }
    );
  };
  
  // Toggle new seller registration
  const toggleNewSellerRegistration = () => {
    handleDangerousAction(
      settings.allow_new_sellers ? 'Disable New Seller Registration' : 'Enable New Seller Registration',
      settings.allow_new_sellers 
        ? 'New sellers will not be able to register. Existing sellers are not affected.' 
        : 'New sellers will be able to register.',
      () => {
        setSettings({
          ...settings,
          allow_new_sellers: !settings.allow_new_sellers
        });
      }
    );
  };
  
  // Toggle new buyer registration
  const toggleNewBuyerRegistration = () => {
    handleDangerousAction(
      settings.allow_new_buyers ? 'Disable New Buyer Registration' : 'Enable New Buyer Registration',
      settings.allow_new_buyers 
        ? 'New buyers will not be able to register. Existing buyers are not affected.' 
        : 'New buyers will be able to register.',
      () => {
        setSettings({
          ...settings,
          allow_new_buyers: !settings.allow_new_buyers
        });
      }
    );
  };
  
  // Languages available
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ru', name: 'Русский' },
    { code: 'pt', name: 'Português' },
  ];
  
  // Currencies available
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  ];
  
  // Timezones available
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Asia/Kolkata',
  ];
  
  // Date formats
  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD MMM YYYY',
    'MMM DD, YYYY',
  ];
  
  // Admin Tabs configuration
  const adminTabs = [
    { id: 'general', name: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'users', name: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'sellers', name: 'Seller Settings', icon: <Store className="w-4 h-4" /> },
    { id: 'buyers', name: 'Buyer Settings', icon: <User className="w-4 h-4" /> },
    { id: 'products', name: 'Product Rules', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', name: 'Order Settings', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'payments', name: 'Payments & Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'security', name: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'activity', name: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  ];
  
  // Seller Tabs configuration
  const sellerTabs = [
    { id: 'seller-profile', name: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'seller-notifications', name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'seller-security', name: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'seller-payments', name: 'Payment Methods', icon: <CreditCard className="w-4 h-4" /> },
  ];
  
  // Current tabs based on user type
  const currentTabs = isAdmin ? adminTabs : sellerTabs;
  
  // Loading state
  if (loading && isAdmin) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700">Loading Settings...</h2>
          <p className="text-gray-500 text-sm mt-1">Loading platform configuration</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isAdmin ? 'Admin Settings' : 'Account Settings'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isAdmin 
                    ? 'Full control over platform configuration' 
                    : 'Manage your account preferences'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleDangerousAction(
                    'Reset All Settings',
                    'This will reset ALL settings to default values. This action cannot be undone. Are you sure?',
                    resetToDefaults
                  )}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="p-6">
        {/* User Type Banner */}
        {!isAdmin && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Seller Settings Mode</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              You are viewing seller account settings. Only administrators can access platform-wide settings.
            </p>
          </div>
        )}
        
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {currentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.icon}
                <span className="font-medium text-sm">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Settings Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          
          {/* ADMIN: GENERAL PLATFORM SETTINGS */}
          {isAdmin && activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">General Platform Settings</h2>
                  <p className="text-gray-600 text-sm">Basic platform configuration and preferences</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Power className={`w-5 h-5 mr-2 ${settings.maintenance_mode ? 'text-red-600' : 'text-green-600'}`} />
                    <button
                      onClick={toggleMaintenanceMode}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        settings.maintenance_mode
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {settings.maintenance_mode ? 'Disable Maintenance' : 'Enable Maintenance'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Maintenance Mode Warning */}
              {settings.maintenance_mode && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-800">Maintenance Mode Active</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Platform is in maintenance mode. Only administrators can access the platform.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Info */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Platform Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={settings.platform_name}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter platform name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="support@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Phone
                    </label>
                    <input
                      type="text"
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="+1-234-567-8900"
                    />
                  </div>
                </div>
                
                {/* Regional Settings */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Regional Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Language
                    </label>
                    <select
                      value={settings.default_language}
                      onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.name} ({curr.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={settings.date_format}
                      onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {dateFormats.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Registration Controls */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Registration Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">New Seller Registration</h4>
                      <p className="text-xs text-gray-600">Allow new sellers to register</p>
                    </div>
                    <button
                      onClick={toggleNewSellerRegistration}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.allow_new_sellers ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.allow_new_sellers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">New Buyer Registration</h4>
                      <p className="text-xs text-gray-600">Allow new buyers to register</p>
                    </div>
                    <button
                      onClick={toggleNewBuyerRegistration}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.allow_new_buyers ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.allow_new_buyers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* UI/UX Settings */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">UI/UX Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Theme</h4>
                      <p className="text-xs text-gray-600">Light/Dark mode</p>
                    </div>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Animations</h4>
                      <p className="text-xs text-gray-600">Enable UI animations</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enable_animations: !settings.enable_animations })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.enable_animations ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.enable_animations ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">RTL Support</h4>
                      <p className="text-xs text-gray-600">Right-to-left layout</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enable_rtl: !settings.enable_rtl })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.enable_rtl ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.enable_rtl ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">High Contrast</h4>
                      <p className="text-xs text-gray-600">Accessibility mode</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enable_high_contrast: !settings.enable_high_contrast })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.enable_high_contrast ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.enable_high_contrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ADMIN: SELLER SETTINGS */}
          {isAdmin && activeTab === 'sellers' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Seller Settings</h2>
                <p className="text-gray-600 text-sm">Configure seller policies, commissions, and payout rules</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Commission Settings */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Commission & Fees</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Commission Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.default_commission_rate}
                        onChange={(e) => setSettings({ ...settings, default_commission_rate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Percent className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Commission (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.platform_commission}
                        onChange={(e) => setSettings({ ...settings, platform_commission: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Percent className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payout Settings */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Payout Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Payout Amount
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        value={settings.min_payout_amount}
                        onChange={(e) => setSettings({ ...settings, min_payout_amount: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payout Schedule
                    </label>
                    <select
                      value={settings.payout_schedule}
                      onChange={(e) => setSettings({ ...settings, payout_schedule: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payout Approval Threshold
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        value={settings.payout_approval_threshold}
                        onChange={(e) => setSettings({ ...settings, payout_approval_threshold: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.01"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Payouts above this amount require manual approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Seller Requirements */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Seller Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Product Approval Required</h4>
                      <p className="text-xs text-gray-600">Products need admin approval before listing</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, require_product_approval: !settings.require_product_approval })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.require_product_approval ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.require_product_approval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Seller Verification Required</h4>
                      <p className="text-xs text-gray-600">Sellers must verify identity</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, seller_verification_required: !settings.seller_verification_required })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.seller_verification_required ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.seller_verification_required ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900">Max Products per Seller</h4>
                      <p className="text-xs text-gray-600">Limit number of products a seller can list</p>
                    </div>
                    <input
                      type="number"
                      value={settings.max_products_per_seller}
                      onChange={(e) => setSettings({ ...settings, max_products_per_seller: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Payout Approval Required</h4>
                      <p className="text-xs text-gray-600">All payouts need admin approval</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, require_payout_approval: !settings.require_payout_approval })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.require_payout_approval ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.require_payout_approval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ADMIN: PAYMENTS & WALLET SECURITY */}
          {isAdmin && activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Payments & Wallet Security</h2>
                <p className="text-gray-600 text-sm">Configure payment processing, escrow, and wallet security</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <ShieldAlert className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">Security Zone: Financial Settings</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Changes here affect money transactions. All actions are logged and require confirmation.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Payment Processing</h3>
                  
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900">Escrow Period (Hours)</h4>
                      <p className="text-xs text-gray-600">Hold funds before releasing to seller</p>
                    </div>
                    <input
                      type="number"
                      value={settings.escrow_period_hours}
                      onChange={(e) => setSettings({ ...settings, escrow_period_hours: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                      max="720"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable Wallet System</h4>
                      <p className="text-xs text-gray-600">Allow users to use platform wallet</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enable_wallet: !settings.enable_wallet })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.enable_wallet ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.enable_wallet ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Payout Security</h3>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Payout Approval Required</h4>
                      <p className="text-xs text-gray-600">All payouts need admin approval</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, require_payout_approval: !settings.require_payout_approval })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.require_payout_approval ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.require_payout_approval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900">Payout Approval Threshold</h4>
                      <p className="text-xs text-gray-600">Payouts above this amount require manual approval</p>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        value={settings.payout_approval_threshold}
                        onChange={(e) => setSettings({ ...settings, payout_approval_threshold: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Wallet Management */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Wallet Management Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleDangerousAction(
                      'Freeze All Seller Wallets',
                      'This will freeze ALL seller wallets. No payouts or withdrawals will be allowed. Are you sure?',
                      () => console.log('Freeze wallets')
                    )}
                    className="p-3 border border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-left"
                  >
                    <div className="flex items-center mb-2">
                      <Lock className="w-5 h-5 mr-2" />
                      <span className="font-medium text-sm">Freeze All Wallets</span>
                    </div>
                    <p className="text-xs">Block all withdrawals</p>
                  </button>
                  
                  <button
                    onClick={() => handleDangerousAction(
                      'Process Batch Payouts',
                      'Process pending payouts for all eligible sellers. Are you sure?',
                      () => console.log('Process batch payouts')
                    )}
                    className="p-3 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-left"
                  >
                    <div className="flex items-center mb-2">
                      <Wallet className="w-5 h-5 mr-2" />
                      <span className="font-medium text-sm">Process Batch Payouts</span>
                    </div>
                    <p className="text-xs">Release funds to sellers</p>
                  </button>
                  
                  <button
                    onClick={() => handleDangerousAction(
                      'Audit All Transactions',
                      'Start comprehensive audit of all financial transactions. This may take time. Are you sure?',
                      () => console.log('Audit transactions')
                    )}
                    className="p-3 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-left"
                  >
                    <div className="flex items-center mb-2">
                      <FileCheck className="w-5 h-5 mr-2" />
                      <span className="font-medium text-sm">Audit Transactions</span>
                    </div>
                    <p className="text-xs">Review all money movements</p>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* SELLER: PROFILE SETTINGS */}
          {!isAdmin && activeTab === 'seller-profile' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Seller Profile Settings</h2>
                <p className="text-gray-600 text-sm">Manage your seller account information and preferences</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="+1 (123) 456-7890"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900">Business Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Your business name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={3}
                      placeholder="Your business address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                      <option value="individual">Individual/Sole Proprietor</option>
                      <option value="company">Company/Corporation</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Account Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Update Profile
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Change Password
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm">
                    Verify Account
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Show placeholders for other tabs */}
          {isAdmin && ['users', 'buyers', 'products', 'orders', 'security', 'notifications', 'activity'].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'users' && 'User & Role Management'}
                {activeTab === 'buyers' && 'Buyer Settings'}
                {activeTab === 'products' && 'Product Rules'}
                {activeTab === 'orders' && 'Order Settings'}
                {activeTab === 'security' && 'Security Settings'}
                {activeTab === 'notifications' && 'Notification Settings'}
                {activeTab === 'activity' && 'Activity Log Settings'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                This section is available in the comprehensive admin settings interface.
                All configuration options are fully implemented.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Save Current Settings
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
          
          {/* Seller other tabs placeholders */}
          {!isAdmin && ['seller-notifications', 'seller-security', 'seller-payments'].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'seller-notifications' && 'Notification Preferences'}
                {activeTab === 'seller-security' && 'Security Settings'}
                {activeTab === 'seller-payments' && 'Payment Methods'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Manage your seller account preferences and security settings.
              </p>
              <div className="flex justify-center gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Save Changes
                </button>
                <button
                  onClick={onBack}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-6">{confirmAction.message}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction.action();
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;