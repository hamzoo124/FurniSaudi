import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Import hooks - UPDATED to not require parameters
import { useDashboard } from "../hooks/useDashboard";
import { useProducts } from "../hooks/useProducts";
import { useOrders } from "../hooks/useOrders";

// import { useOrders } from '@/hooks/useOrders';
import { useInventory } from "../hooks/useInventory";
import { useCustomOrders } from "../hooks/useCustomOrders";
import { useFinance } from "../hooks/useFinance";
import { useReports } from "../hooks/useReports";
import { useReviews } from "../hooks/useReviews";
import { useNotifications } from "../hooks/useNotifications";
import { useStoreProfile } from "../hooks/useStoreProfile";
import useAccountSettings from "../hooks/useAccountSettings";
import { useWallet } from "../hooks/useWallet";
import { useVAT } from "../hooks/useVAT";
import { useAdvertising } from "../hooks/useAdvertising";
import { useContracts } from "../hooks/useContracts";

// Import all components
import DashboardOverview from "./DashboardOverview";
import Products from "./Products";
import SellerApproval from "./SellerApproval ";
import Orders from "./Orders";
import Inventory from "./Inventory";
import CustomOrders from "./CustomOrders";
import ShippingDelivery from "./ShippingDelivery";
import Finance from "./Finance";
import ReportsAnalytics from "./ReportsAnalytics";
import ReviewsRatings from "./ReviewsRatings";
import Notifications from "./Notifications";
import StoreProfile from "./StoreProfile";
import Support from "./Support";
import AccountSettings from "./AccountSettings";
import WalletPage from "../pages/admin/wallet";
import VATSummary from "./VATSummary";
import AdvertisingPage from "./Advertising";
import Contracts from "./Contracts";
import AddProduct from "./admin/addproduct";

// Import icons
import {
  Package,
  ShoppingBag,
  BarChart,
  Settings,
  Bell,
  Search,
  LogOut,
  DollarSign,
  RefreshCw,
  Warehouse,
  Star,
  Truck,
  Receipt,
  Wallet,
  LayoutDashboard,
  HelpCircle,
  Store,
  Megaphone,
  Plus,
  Grid,
  List,
  Scissors,
  FileSignature,
  X,
  Menu,
  User,
  AlertCircle,
  Shield,
  BadgeCheck,
  UserCheck,
} from "lucide-react";

interface SellerDashboardProps {
  onNavigate?: (page: string) => void;
  section?: string;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onNavigate,
  section: propSection = "dashboard",
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState(propSection);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // DEBUG: Log user info
  useEffect(() => {
    console.log("SellerDashboard - User:", user);
    console.log("SellerDashboard - User ID:", user?.id);
    console.log("SellerDashboard - User Role:", user?.role);
  }, [user]);

  const sallerId = user?.id || "";
  useEffect(() => {
    console.log("Fetched seller ID:", sallerId);
  }, [sallerId]);

  // Initialize all hooks - FIXED: No parameters needed
  const dashboard = useDashboard();
  const products = useProducts(); // Placeholder for SellerApproval hook/component
  const orders = useOrders();
  const inventory = useInventory();
  const customOrders = useCustomOrders();
  const finance = useFinance();
  const reports = useReports();
  const reviews = useReviews();
  const notifications = useNotifications();
  const storeProfile = useStoreProfile();
  const accountSettings = useAccountSettings();
  const wallet = useWallet();
  const vat = useVAT();
  const advertising = useAdvertising();
  const contracts = useContracts();

  // Check user role and demo mode - FIXED LOGIC
  useEffect(() => {
    const demoMode = localStorage.getItem("demoMode") === "seller";
    setIsDemoMode(demoMode);

    console.log("Demo mode check:", demoMode);
    console.log("User role:", user?.role);

    // Allow access if demo mode OR user is seller
    if (!demoMode && user?.role !== "seller") {
      console.warn("User role is not seller:", user?.role);
      // Don't block access, just show warning
    }
  }, [user]);


 


  // Navigation items with hooks - FIXED: Proper hook references
  const navItems = useMemo(
    () => [
      {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        hook: dashboard,
        badge: 0,
      },
      {
  id: "users",
  icon: UserCheck,
  label: "Users",
  badge: 0,
  children: [
    {
      id: "user-seller",
      label: "Seller",
      children: [
        {
          id: "seller-approval",
          label: "Seller Approval",
        },
        {
          id: "seller-products",
          label: "Seller Products",
        },
      ],
    },
    {
      id: "user-buyer",
      label: "Buyer",
      children: [
        {
          id: "buyer-orders",
          label: "Buyer Orders",
        },
        {
          id: "buyer-reviews",
          label: "Buyer Reviews",
        },
      ],
    },
    {
      id: "user-admin",
      label: "Admin",
      children: [
        {
          id: "admin-users",
          label: "User Management",
        },
        {
          id: "admin-reports",
          label: "Reports",
        },
      ],
    },
  ],
},

      {
        id: "SellerApproval",
        icon: BadgeCheck,
        label: "SellerApproval",
        badge: 0,
      },

      {
        id: "products",
        icon: Package,
        label: "Products",
        hook: products,
        badge: 0,
      },
      {
        id: "orders",
        icon: ShoppingBag,
        label: "Orders",
        hook: orders,
        badge: 0,
      },
      {
        id: "inventory",
        icon: Warehouse,
        label: "Inventory",
        hook: inventory,
        badge: 0,
      },
      {
        id: "custom-orders",
        icon: Scissors,
        label: "Custom Orders",
        hook: customOrders,
        badge: 0,
      },
      {
        id: "shipping",
        icon: Truck,
        label: "Shipping",
        hook: {
          loading: false,
          error: null,
          shipments: [],
          reload: async () => {},
        },
        badge: 0,
      },
      {
        id: "finance",
        icon: DollarSign,
        label: "Finance",
        hook: finance,
        badge: 0,
      },
      {
        id: "reports",
        icon: BarChart,
        label: "Reports",
        hook: reports,
        badge: 0,
      },
      {
        id: "reviews",
        icon: Star,
        label: "Reviews",
        hook: reviews,
        badge: 0,
      },
      {
        id: "advertising",
        icon: Megaphone,
        label: "Advertising",
        hook: advertising,
        badge: 0,
      },
      {
        id: "wallet",
        icon: Wallet,
        label: "Wallet",
        hook: wallet,
        badge: 0,
      },
      {
        id: "vat",
        icon: Receipt,
        label: "VAT",
        hook: vat,
        badge: 0,
      },
      {
        id: "contracts",
        icon: FileSignature,
        label: "Contracts",
        hook: contracts,
        badge: 0,
      },
      {
        id: "profile",
        icon: Store,
        label: "Store Profile",
        hook: storeProfile,
        badge: 0,
      },
      {
        id: "notifications",
        icon: Bell,
        label: "Notifications",
        hook: notifications,
        badge: notifications.unreadCount || 0,
      },
      {
        id: "support",
        icon: HelpCircle,
        label: "Support",
        hook: {
          loading: false,
          error: null,
          tickets: [],
          reload: async () => {},
        },
        badge: 0,
      },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        hook: accountSettings,
        badge: 0,
      },
    ],
    [
      dashboard,
      SellerApproval,
      products,
      orders,
      inventory,
      customOrders,
      finance,
      reports,
      reviews,
      advertising,
      wallet,
      vat,
      contracts,
      storeProfile,
      notifications,
      accountSettings,
    ],
  );

  // Handle section changes
  useEffect(() => {
    if (propSection && propSection !== activeSection) {
      setActiveSection(propSection);
    }
  }, [propSection]);

  const handleSectionClick = useCallback(
    (section: string) => {
      console.log("Navigating to section:", section);
      setActiveSection(section);
      setShowMobileMenu(false);
      setSearchQuery(""); // Reset search on navigation

      if (onNavigate) {
        onNavigate(section);
      }
    },
    [onNavigate],
  );

  const handleAddNewProduct = useCallback(() => {
    setActiveSection("add-product");
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log("Refreshing section:", activeSection);
    const currentNav = navItems.find((item) => item.id === activeSection);
    if (currentNav?.hook?.reload) {
      try {
        await currentNav.hook.reload();
        console.log("Refresh successful for:", activeSection);
      } catch (error) {
        console.error("Refresh failed:", error);
      }
    } else {
      console.log("No reload function for:", activeSection);
    }
  }, [activeSection, navItems]);

  const handleSearch = useCallback(
    (query: string) => {
      console.log("Searching:", query);
      setSearchQuery(query);
      const currentNav = navItems.find((item) => item.id === activeSection);

      // Apply search based on section
      if (currentNav?.hook?.updateFilters) {
        currentNav.hook.updateFilters({ search: query });
      } else if (currentNav?.hook?.reload) {
        currentNav.hook.reload();
      }
    },
    [activeSection, navItems],
  );

  const handleLogout = async () => {
    try {
      await signOut();
      if (isDemoMode) {
        localStorage.removeItem("demoMode");
        localStorage.removeItem("userRole");
      }
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
// Recursive search function to find nav item by ID
const findNavItemById = (id: string, items: typeof navItems): any => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findNavItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
};

  // const getCurrentHook = useCallback(() => {
  //   return navItems.find((item) => item.id === activeSection)?.hook;
  // }, [activeSection, navItems]);
  const getCurrentHook = useCallback(() => {
  const item = findNavItemById(activeSection, navItems);
  return item?.hook;
}, [activeSection, navItems]);


  // FIXED: Better render logic with demo mode handling
  const renderContent = useCallback(() => {
    const currentHook = getCurrentHook();
    const isLoading = currentHook?.loading || false;
    const hasError = currentHook?.error;

    // console.log("Rendering section:", activeSection);
    // console.log("Loading state:", isLoading);
    // console.log("Error state:", hasError);
    // console.log("Demo mode:", isDemoMode);

    // Show loading only if not demo mode
    if (isLoading && !isDemoMode) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading data...</p>
          </div>
        </div>
      );
    }

    // Show error if exists and not demo mode
    if (hasError && !isDemoMode) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">{String(hasError)}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      );
    }

    // Get data based on demo mode
    const getData = (hookData: any, demoData: any) => {
      return isDemoMode ? demoData : hookData || [];
    };

    const getStats = (hookStats: any, demoStats: any) => {
      return isDemoMode ? demoStats : hookStats || {};
    };

    // Demo data templates
    const demoProducts = [
      {
        id: "1",
        name: "Modern Office Chair",
        price: 2999,
        stock: 42,
        status: "active",
      },
      {
        id: "2",
        name: "Leather Sofa",
        price: 8999,
        stock: 8,
        status: "active",
      },
    ];

    const demoOrders = [
      {
        id: "1",
        order_number: "ORD-001",
        customer_name: "Ahmed",
        total: 2450,
        status: "processing",
      },
      {
        id: "2",
        order_number: "ORD-002",
        customer_name: "Sarah",
        total: 1890,
        status: "shipped",
      },
    ];

    const demoStats = {
      totalProducts: 24,
      totalOrders: 156,
      totalRevenue: 154850,
      pendingOrders: 12,
      activeOrders: 15,
    };

    // Render based on active section
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardOverview
            stats={getStats(dashboard.stats, demoStats)}
            onRefresh={handleRefresh}
            onMetricClick={(metric) => {
              console.log("Metric clicked:", metric);
              switch (metric) {
                case "SellerApproval":
                  handleSectionClick("SellerApproval");
                  break;
                case "products":
                  handleSectionClick("products");
                  break;

                case "orders":
                  handleSectionClick("orders");
                  break;
                
                case "finance":
                  handleSectionClick("finance");
                  break;
                case "reviews":
                  handleSectionClick("reviews");
                  break;
                case "wallet":
                  handleSectionClick("wallet");
                  break;
                default:
                  break;
              }
            }}
          />
        );
        case "SellerApproval":
    return <SellerApproval />;
      case "products":
        return (
          <Products
            onAddProduct={handleAddNewProduct}
            products={getData(products.products, demoProducts)}
            loading={isDemoMode ? false : products.loading}
            error={isDemoMode ? null : products.error}
            onCreateProduct={products.createProduct}
            onUpdateProduct={products.updateProduct}
            onDeleteProduct={products.deleteProduct}
            onUpdateStock={products.updateStock}
            onToggleFeatured={products.toggleFeatured}
            onRefresh={products.reload}
            viewMode={viewMode}
          />
        );
      case "orders":
        return (
          <Orders
            orders={getData(orders.orders, demoOrders)}
            loading={isDemoMode ? false : orders.loading}
            error={isDemoMode ? null : orders.error}
            onUpdateStatus={orders.updateOrderStatus}
            onUpdateShipping={orders.updateShippingInfo}
            onRefresh={orders.reload}
          />
        );
      case "inventory":
        return (
          <Inventory
            inventory={getData(inventory.inventory, [])}
            loading={isDemoMode ? false : inventory.loading}
            error={isDemoMode ? null : inventory.error}
            onUpdate={inventory.updateInventory}
            onRefresh={inventory.reload}
          />
        );
      case "custom-orders":
        return (
          <CustomOrders
            orders={getData(customOrders.orders, [])}
            loading={isDemoMode ? false : customOrders.loading}
            error={isDemoMode ? null : customOrders.error}
            onUpdateStatus={customOrders.updateOrderStatus}
            onRefresh={customOrders.reload}
          />
        );
      case "shipping":
        return (
          <ShippingDelivery
            shipments={[]}
            loading={false}
            error={null}
            onUpdateShipping={() => Promise.resolve()}
            onRefresh={() => Promise.resolve()}
          />
        );
      case "finance":
        return (
          <Finance
            transactions={getData(finance.transactions, [])}
            loading={isDemoMode ? false : finance.loading}
            error={isDemoMode ? null : finance.error}
            stats={getStats(finance.stats, {})}
            onRefresh={finance.reload}
          />
        );
      case "reports":
        return (
          <ReportsAnalytics
            reports={getData(reports.reports, [])}
            loading={isDemoMode ? false : reports.loading}
            error={isDemoMode ? null : reports.error}
            onGenerateReport={reports.generateReport}
            onRefresh={reports.reload}
          />
        );
      case "reviews":
        return (
          <ReviewsRatings
            reviews={getData(reviews.reviews, [])}
            loading={isDemoMode ? false : reviews.loading}
            error={isDemoMode ? null : reviews.error}
            stats={getStats(reviews.stats, {})}
            onUpdateReview={reviews.updateReview}
            onReplyToReview={reviews.replyToReview}
            onRefresh={reviews.reload}
          />
        );
      case "notifications":
        return (
          <Notifications
            notifications={getData(notifications.notifications, [])}
            loading={isDemoMode ? false : notifications.loading}
            error={isDemoMode ? null : notifications.error}
            unreadCount={isDemoMode ? 2 : notifications.unreadCount}
            onMarkAsRead={notifications.markAsRead}
            onDeleteNotification={notifications.deleteNotification}
            onRefresh={notifications.reload}
          />
        );
      case "profile":
        return (
          <StoreProfile
            profile={getData(storeProfile.profile, {})}
            loading={isDemoMode ? false : storeProfile.loading}
            error={isDemoMode ? null : storeProfile.error}
            onUpdateProfile={storeProfile.updateProfile}
            onUploadLogo={storeProfile.uploadLogo}
            onUploadBanner={storeProfile.uploadBanner}
            onRefresh={storeProfile.reload}
          />
        );
      case "support":
        return (
          <Support
            tickets={[]}
            loading={false}
            error={null}
            onCreateTicket={() => Promise.resolve()}
            onUpdateTicket={() => Promise.resolve()}
            onRefresh={() => Promise.resolve()}
          />
        );
      case "settings":
        return (
          <AccountSettings
            settings={getData(accountSettings.settings, {})}
            loading={isDemoMode ? false : accountSettings.loading}
            error={isDemoMode ? null : accountSettings.error}
            onUpdateSettings={accountSettings.updateSettings}
            onChangePassword={accountSettings.changePassword}
            onRefresh={accountSettings.reload}
          />
        );
      case "wallet":
        return (
          <SellerWallet
            balance={isDemoMode ? 50000 : wallet.balance}
            transactions={getData(wallet.transactions, [])}
            loading={isDemoMode ? false : wallet.loading}
            error={isDemoMode ? null : wallet.error}
            onWithdraw={wallet.withdraw}
            onRefresh={wallet.reload}
          />
        );
      case "vat":
        return (
          <VATSummary
            vatData={getData(vat.vatData, [])}
            loading={isDemoMode ? false : vat.loading}
            error={isDemoMode ? null : vat.error}
            onFileVAT={vat.fileVAT}
            onRefresh={vat.reload}
          />
        );
      case "advertising":
        return (
          <AdvertisingPage
            campaigns={getData(advertising.campaigns, [])}
            loading={isDemoMode ? false : advertising.loading}
            error={isDemoMode ? null : advertising.error}
            onCreateCampaign={advertising.createCampaign}
            onUpdateCampaign={advertising.updateCampaign}
            onRefresh={advertising.reload}
            onBack={() => handleSectionClick("dashboard")}
          />
        );
      case "contracts":
        return (
          <Contracts
            contracts={getData(contracts.contracts, [])}
            loading={isDemoMode ? false : contracts.loading}
            error={isDemoMode ? null : contracts.error}
            onSignContract={contracts.signContract}
            onRenewContract={contracts.renewContract}
            onRefresh={contracts.reload}
            onBack={() => handleSectionClick("dashboard")}
            onNavigate={onNavigate}
          />
        );
      case "add-product":
        return (
          <AddProduct
            onCreate={products.createProduct}
            loading={isDemoMode ? false : products.loading}
            error={isDemoMode ? null : products.error}
            onBack={() => handleSectionClick("products")}
            categories={products.categories || []}
          />
        );
      default:
        return (
          <DashboardOverview
            stats={getStats(dashboard.stats, demoStats)}
            onRefresh={handleRefresh}
          />
        );
    }
  }, [
    activeSection,
    isDemoMode,
    getCurrentHook,
    handleRefresh,
    handleSectionClick,
    handleAddNewProduct,
    viewMode,
    dashboard.stats,
    SellerApproval,
    products,
    orders,
    inventory,
    customOrders,
    finance,
    reports,
    reviews,
    notifications,
    storeProfile,
    accountSettings,
    wallet,
    vat,
    advertising,
    contracts,
    onNavigate,
  ]);

  // Authorization check - FIXED: More flexible
  if (!isDemoMode && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please login to access the seller dashboard.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show demo mode warning if needed
  if (isDemoMode && (!user || user.role !== "seller")) {
    console.log("Showing demo mode interface");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                Seller Hub
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {isDemoMode
                  ? "Demo Store"
                  : storeProfile.profile?.business_name ||
                    user?.email?.split("@")[0] ||
                    "My Store"}
              </p>
              {isDemoMode && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-1 inline-block">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isLoading = item.hook?.loading;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                disabled={isLoading && !isDemoMode}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  activeSection === item.id
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isLoading && !isDemoMode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <item.icon className="w-4 h-4" />
                  )}
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {isDemoMode
                  ? "Demo Seller"
                  : user?.name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {isDemoMode
                  ? "Demo Account"
                  : user?.role === "seller"
                    ? "Seller Account"
                    : "User Account"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">
                    Seller Hub
                  </h1>
                  <p className="text-xs text-gray-500">
                    {isDemoMode
                      ? "Demo Store"
                      : storeProfile.profile?.business_name ||
                        user?.email?.split("@")[0] ||
                        "Store"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSectionClick("notifications")}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {isDemoMode ? 2 : notifications.unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionClick(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      activeSection === item.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 lg:p-6">
          {/* Header with Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 capitalize">
                {activeSection === "dashboard"
                  ? "Dashboard"
                  : activeSection === "add-product"
                    ? "Add Product"
                    : activeSection.replace("-", " ")}
              </h1>
              {/* <p className="text-sm text-gray-500 mt-1">
                {isDemoMode
                  ? "Demo Mode - Showing sample data"
                  : activeSection === "dashboard"
                    ? "Overview of your store performance and analytics"
                    : `Manage your ${activeSection.replace("-", " ")}`}
              </p> */}
            </div>

            <div className="flex items-center gap-2">
              {["products", "orders", "inventory", "custom-orders"].includes(
                activeSection,
              ) && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent w-full md:w-64"
                    />
                  </div>

                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1.5 rounded text-sm ${
                        viewMode === "grid"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1.5 rounded text-sm ${
                        viewMode === "list"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {activeSection === "products" && (
                <button
                  onClick={handleAddNewProduct}
                  disabled={products.loading && !isDemoMode}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {products.loading && !isDemoMode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={getCurrentHook()?.loading && !isDemoMode}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${getCurrentHook()?.loading && !isDemoMode ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {renderContent()}
          </div>

          {/* Error Display - Only show if not demo mode */}
          {getCurrentHook()?.error && !isDemoMode && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">
                  {String(getCurrentHook()?.error)}
                </p>
              </div>
            </div>
          )}

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <p className="text-sm text-yellow-700">
                  Demo Mode Active - Showing sample data. Switch to real mode by
                  logging in with a seller account.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Seller Hub • v2.0 •
              {isDemoMode
                ? " Demo Store"
                : ` ${storeProfile.profile?.business_name || user?.email?.split("@")[0] || "My Store"}`}
              {isDemoMode && " • Demo Mode"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
