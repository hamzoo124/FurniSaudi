import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminsPage from "../../components/AdminPages/AdminsPage"
import UserpageTabs from "../users/UserpageTabs";


import {
  Home,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  Shield,
  Bell,
  Settings,
  LogOut,
  Search,
  Download,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  BarChart,
  Receipt,
  Megaphone,
  Activity,
  Star,
  ChevronRight,
  CheckCircle,
  CreditCard,
  Wallet,
  FolderTree,
  FileCheck,
  ShoppingCart,
  Menu,
  X,
  UserCheck,
  UserX,
  Eye,
  Calendar,
  FileText,
  Building,
  Phone,
  MapPin,
  Banknote,
  BadgeCheck,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  ExternalLink,
  Filter,
  Mail,
  Clock,
  AlertTriangle,
  Info,
  Database,
  Loader2,
  Edit,
  Trash2,
  EyeOff,
  TrendingDown,
  Award,
  Truck,
  Box,
  Tag,
  Layers,
  Hash,
  Archive,
  Send,
  VolumeX,
  Ban,
  Flag,
  ShieldAlert,
  Grid,
  List,
  Columns,
  Upload,
  Plus,
  Image as ImageIcon,
  TrendingUp as TrendingUpIcon,
  Save,
  User,
  ChevronDown,
  BarChart3,
} from "lucide-react";

// Import Hooks
import { useDashboardData } from "../../hooks/useDashboardData";
import { useSellers } from "../../hooks/useSellers";
import { useProducts } from "../../hooks/useProducts";
import { useOrders } from "../../hooks/useOrders";
import { useActivityLogs } from "../../hooks/useActivityLogs";
import { useNotifications } from "../../hooks/useNotifications";
import { useAdminReports } from "../../hooks/useAdminReports";
import { useReviews } from "../../hooks/useReviews";
import { useFinance } from "../../hooks/useFinance";
import { useWallet } from "../../hooks/useWallet";
import { useCategories } from "../../hooks/useCategories";
import { useContracts } from "../../hooks/useContracts";
import { useAdvertising } from "../../hooks/useAdvertising";

import { toast } from "sonner";
import ProtectedRoute from "../ProtectedRoute";
import { render } from "react-dom";
import BuyersPage from "../AdminPages/BuyersPage";
import UsersPage from "../users/UserpageTabs";
import UserManagementWrapper from "./dashboard/UserManagementWrapper";

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
  section?: string;
}

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
  status:
    | "active"
    | "inactive"
    | "draft"
    | "pending"
    | "archived"
    | "suspended"
    | "under_review"
    | "rejected";
  is_featured: boolean;
  is_best_seller?: boolean;
  is_advertised?: boolean;
  images: string[];
  main_image?: string;
  category_id?: string;
  category_type: "ready_made" | "customized";
  usage_type: "indoor" | "outdoor" | "both";
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
  business_type: string;
  business_description: string;
  cr_number: string;
  cr_document_url?: string;
  bank_name: string;
  account_number: string;
  iban: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
  updated_at: string;
}

interface WarningFormData {
  productId: string;
  reason:
    | "fake_product"
    | "misleading_info"
    | "poor_quality"
    | "copyright_issue"
    | "policy_violation"
    | "customer_complaints"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  notifySeller: boolean;
  suspendProduct: boolean;
  suspensionDuration?: number;
  suspensionUnit?: "hours" | "days" | "weeks";
  adminNote: string;
}

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: any;
  color?: "primary" | "success" | "warning" | "danger" | "accent" | "info";
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
  onClick?: () => void;
}> = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend,
  loading = false,
  onClick,
}) => {
  const colorClasses = {
    primary: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50",
    accent: "border-purple-200 bg-purple-50",
    info: "border-cyan-200 bg-cyan-50",
  };

  const iconColorClasses = {
    primary: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    danger: "bg-red-100 text-red-600",
    accent: "bg-purple-100 text-purple-600",
    info: "bg-cyan-100 text-cyan-600",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : ""
      } ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && !loading && (
          <span
            className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.isPositive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUp className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-7 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
        </>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string; small?: boolean }> = ({
  status,
  small = false,
}) => {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800 border border-green-200";
      case "pending":
      case "processing":
      case "under_review":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "rejected":
      case "cancelled":
      case "blocked":
      case "suspended":
        return "bg-red-100 text-red-800 border border-red-200";
      case "shipped":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    return status?.replace(/_/g, " ") || "Unknown";
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(status)} ${small ? "text-xs px-2 py-0.5" : ""}`}
    >
      {getStatusText(status)}
    </span>
  );
};

// Helper Functions
const getProductStatusBadge = (product: Product) => {
  const status = product.status;
  const isSuspended = product.is_suspended_by_admin || status === "suspended";

  let color = "bg-gray-100 text-gray-800";
  let Icon = Package;
  let text = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "active":
      color = isSuspended
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800";
      Icon = isSuspended ? AlertTriangle : CheckCircle;
      text = isSuspended ? "Suspended" : "Active";
      break;
    case "inactive":
      color = "bg-gray-100 text-gray-800";
      Icon = EyeOff;
      break;
    case "draft":
      color = "bg-yellow-100 text-yellow-800";
      Icon = Edit;
      break;
    case "pending":
      color = "bg-blue-100 text-blue-800";
      Icon = Clock;
      break;
    case "suspended":
      color = "bg-red-100 text-red-800";
      Icon = AlertTriangle;
      break;
    case "under_review":
      color = "bg-orange-100 text-orange-800";
      Icon = ShieldAlert;
      break;
    case "rejected":
      color = "bg-red-100 text-red-800";
      Icon = Ban;
      break;
    case "archived":
      color = "bg-gray-200 text-gray-800";
      Icon = Archive;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
};

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

const getWarningBadge = (warningCount?: number) => {
  if (!warningCount || warningCount === 0) return null;

  let color = "bg-yellow-100 text-yellow-800";
  if (warningCount >= 3) color = "bg-red-100 text-red-800";
  else if (warningCount === 2) color = "bg-orange-100 text-orange-800";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {warningCount} Warning{warningCount > 1 ? "s" : ""}
    </span>
  );
};

// Action Button Component
const ActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}> = ({
  icon: Icon,
  label,
  variant = "secondary",
  onClick,
  disabled = false,
  size = "md",
}) => {
  const variantClasses = {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-orange-600 text-white hover:bg-orange-700",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${sizeClasses[size]}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  type?: "approve" | "reject" | "delete" | "suspend" | "activate" | "warning";
}> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isProcessing = false,
  type = "approve",
}) => {
  if (!isOpen) return null;

  const typeColors = {
    approve: "bg-green-600 hover:bg-green-700",
    reject: "bg-red-600 hover:bg-red-700",
    delete: "bg-red-600 hover:bg-red-700",
    suspend: "bg-yellow-600 hover:bg-yellow-700",
    activate: "bg-green-600 hover:bg-green-700",
    warning: "bg-orange-600 hover:bg-orange-700",
  };

  const typeIcons = {
    approve: <UserCheck className="w-6 h-6 text-green-600" />,
    reject: <UserX className="w-6 h-6 text-red-600" />,
    delete: <Trash2 className="w-6 h-6 text-red-600" />,
    suspend: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    activate: <CheckCircle className="w-6 h-6 text-green-600" />,
    warning: <AlertCircle className="w-6 h-6 text-orange-600" />,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`p-3 rounded-full ${
                type === "approve"
                  ? "bg-green-100"
                  : type === "reject" || type === "delete"
                    ? "bg-red-100"
                    : type === "suspend"
                      ? "bg-yellow-100"
                      : type === "activate"
                        ? "bg-green-100"
                        : "bg-orange-100"
              }`}
            >
              {typeIcons[type]}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${
                typeColors[type]
              } disabled:opacity-50`}
            >
              {isProcessing ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Warning Modal Component
const WarningModal: React.FC<{
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (formData: WarningFormData) => void;
  isProcessing?: boolean;
}> = ({ isOpen, product, onClose, onSubmit, isProcessing = false }) => {
  const [formData, setFormData] = useState<WarningFormData>({
    productId: "",
    reason: "other",
    severity: "medium",
    message: "",
    notifySeller: true,
    suspendProduct: false,
    suspensionDuration: 7,
    suspensionUnit: "days",
    adminNote: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...formData,
        productId: product.id,
      });
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = () => {
    if (!formData.message.trim()) {
      toast.error("Please enter a warning message");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Issue Product Warning
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Product: <span className="font-medium">{product.name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Seller:{" "}
              <span className="font-medium">
                {product.seller_business || product.seller_name}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="fake_product">Fake/Imitation Product</option>
                <option value="misleading_info">Misleading Information</option>
                <option value="poor_quality">Poor Quality</option>
                <option value="copyright_issue">
                  Copyright/Trademark Issue
                </option>
                <option value="policy_violation">Policy Violation</option>
                <option value="customer_complaints">Customer Complaints</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high", "critical"] as const).map(
                  (severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        formData.severity === severity
                          ? severity === "low"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : severity === "medium"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : severity === "high"
                                ? "bg-orange-100 text-orange-800 border border-orange-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                      }`}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message to Seller
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Explain the issue to the seller..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Note (Internal)
              </label>
              <textarea
                value={formData.adminNote}
                onChange={(e) =>
                  setFormData({ ...formData, adminNote: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Internal notes for admin team..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notifySeller}
                  onChange={(e) =>
                    setFormData({ ...formData, notifySeller: e.target.checked })
                  }
                  className="rounded text-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Notify seller about this warning
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.suspendProduct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      suspendProduct: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Suspend product temporarily
                </span>
              </label>
            </div>

            {formData.suspendProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suspension Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.suspensionDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suspensionDuration: Number(e.target.value),
                      })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                  <select
                    value={formData.suspensionUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suspensionUnit: e.target.value as any,
                      })
                    }
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
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !formData.message.trim()}
              className="flex-1 py-2.5 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Issue Warning"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Seller Detail Modal Component
const SellerDetailModal: React.FC<{
  isOpen: boolean;
  seller: SellerApplication | null;
  onClose: () => void;
  onApprove: (seller: SellerApplication) => void;
  onReject: (seller: SellerApplication) => void;
}> = ({ isOpen, seller, onClose, onApprove, onReject }) => {
  if (!isOpen || !seller) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Seller Application Details
              </h2>
              <p className="text-sm text-gray-600">
                Application ID: {seller.application_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Building className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {seller.business_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Applied on {formatDate(seller.submitted_at)}
                  </p>
                </div>
              </div>
              <StatusBadge status={seller.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {seller.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium text-gray-900">{seller.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact Number</p>
                    <p className="font-medium text-gray-900">
                      {seller.contact_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Business Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {seller.business_type?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CR Number</p>
                    <p className="font-medium text-gray-900">
                      {seller.cr_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {seller.city}, {seller.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Business Description
                </h3>
                <p className="text-gray-700 text-sm">
                  {seller.business_description}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Bank Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                    <p className="font-medium text-gray-900">
                      {seller.bank_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Number</p>
                    <p className="font-medium text-gray-900">
                      {seller.account_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IBAN</p>
                    <p className="font-medium text-gray-900 font-mono">
                      {seller.iban}
                    </p>
                  </div>
                </div>
              </div>

              {seller.cr_document_url && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CR Document
                  </h3>
                  <a
                    href={seller.cr_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
              {seller.status === "pending" && (
                <>
                  <button
                    onClick={() => onReject(seller)}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => onApprove(seller)}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main AdminDashboard Component
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  section: propSection = "dashboard",
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(propSection);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Use all hooks with error handling
  // Replace ALL hook destructuring in your AdminDashboard with this:

  const {
    metrics,
    loading: dashboardLoading,
    refresh: refreshMetrics,
  } = useDashboardData();

  const {
    sellers,
    sellerApplications,
    loading: sellersLoading,
    refresh: refreshSellers,
    approveSeller,
    rejectSeller,
  } = useSellers();

  const {
    products,
    pendingProducts,
    loading: productsLoading,
    refresh: refreshProducts,
    updateProduct,
    deleteProduct,
    suspendProduct,
    activateProduct,
    issueWarning,
  } = useProducts();

  const {
    orders,
    recentOrders,
    loading: ordersLoading,
    refresh: refreshOrders,
  } = useOrders();

  const {
    activities: logs,
    loading: logsLoading,
    refresh: refreshLogs,
  } = useActivityLogs();

  const { unreadCount, refetch: refreshNotifications } = useNotifications();

  const {
    savedReports: reports,
    loading: reportsLoading,
    refresh: refreshReports,
  } = useAdminReports();

  const {
    reviews,
    loading: reviewsLoading,
    refresh: refreshReviews,
  } = useReviews();

  const {
    summary: financeData,
    summaryLoading: financeLoading,
    refresh: refreshFinance,
  } = useFinance();

  const {
    walletData,
    loading: walletLoading,
    refresh: refreshWallet,
  } = useWallet();

  const {
    categories,
    loading: categoriesLoading,
    refresh: refreshCategories,
  } = useCategories();

  const {
    contracts,
    loading: contractsLoading,
    refresh: refreshContracts,
  } = useContracts();

  const {
    campaigns: ads,
    loading: adsLoading,
    refresh: refreshAds,
  } = useAdvertising();

  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSeller, setSelectedSeller] =
    useState<SellerApplication | null>(null);
  const [showSellerDetail, setShowSellerDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const [productFilters, setProductFilters] = useState({
    search: "",
    status: "",
    categoryType: "",
    usageType: "",
    stockStatus: "",
    sellerId: "",
    minRating: 0,
    hasWarnings: null as boolean | null,
    isSuspended: null as boolean | null,
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "delete" | "suspend" | "activate" | "warning";
    title: string;
    message: string;
    data: any;
  } | null>(null);

  const [productToAction, setProductToAction] = useState<Product | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filter products based on filters
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];

    return products.filter((product: Product) => {
      // Search filter
      if (
        productFilters.search &&
        !product.name
          .toLowerCase()
          .includes(productFilters.search.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (productFilters.status && product.status !== productFilters.status) {
        return false;
      }

      // Category type filter
      if (
        productFilters.categoryType &&
        product.category_type !== productFilters.categoryType
      ) {
        return false;
      }

      // Stock status filter
      if (productFilters.stockStatus) {
        if (
          productFilters.stockStatus === "out_of_stock" &&
          product.stock_quantity > 0
        ) {
          return false;
        }
        if (
          productFilters.stockStatus === "in_stock" &&
          product.stock_quantity === 0
        ) {
          return false;
        }
        if (
          productFilters.stockStatus === "low_stock" &&
          (!product.min_stock_level ||
            product.stock_quantity > product.min_stock_level)
        ) {
          return false;
        }
      }

      // Seller filter
      if (
        productFilters.sellerId &&
        product.seller_id !== productFilters.sellerId
      ) {
        return false;
      }

      // Has warnings filter
      if (productFilters.hasWarnings !== null) {
        const hasWarnings = (product.warning_count || 0) > 0;
        if (productFilters.hasWarnings !== hasWarnings) {
          return false;
        }
      }

      // Is suspended filter
      if (productFilters.isSuspended !== null) {
        const isSuspended =
          product.is_suspended_by_admin || product.status === "suspended";
        if (productFilters.isSuspended !== isSuspended) {
          return false;
        }
      }

      // Rating filter
      if (
        productFilters.minRating > 0 &&
        product.rating < productFilters.minRating
      ) {
        return false;
      }

      return true;
    });
  }, [products, productFilters]);
  //  sideBar navigation items
  const navItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      permission: "view_dashboard",
    },

    {
      id: "users",
      icon: Users,
      label: "Users",
      permission: "manage_users",
   
      // dropdownItems: [
      //   {
      //     id: "all-users",
      //     label: "All Users",
      //     permission: "manage_users",
      //     href: "/admin/users/all",
      //   },
        
      //   {
      //     id: "admin-users",
      //     label: "Admins",
      //     permission: "manage_admins",
      //     href: "/admin/users/admins",
      //   },
      //   {
      //     id: "seller-users",
      //     label: "Sellers",
      //     permission: "manage_sellers",
      //     href: "/admin/users/sellers",
      //   },
      //  ],
    },

    // Sellers dropdown
    {
      id: "sellers",
      icon: Users,
      label: "Sellers",
      permission: "manage_sellers",
    },

    // Products dropdown
    {
      id: "products",
      icon: Package,
      label: "Products",
      permission: "manage_products",
      dropdown: true,
      
    },

    // Orders dropdown
    {
      id: "orders",
      icon: ShoppingBag,
      label: "Orders",
      permission: "manage_orders",
      
    },

    // Reviews dropdown
    {
      id: "reviews",
      icon: Star,
      label: "Reviews",
      permission: "manage_products",
      dropdown: true,
    },

    // Finance dropdown
    {
      id: "finance",
      icon: DollarSign,
      label: "Finance",
      permission: "manage_finance",
      dropdown: true,
    },

    // Wallet dropdown
    {
      id: "wallet",
      icon: Wallet,
      label: "Wallet",
      permission: "manage_finance",
      dropdown: true,
    },

    // Categories dropdown
    {
      id: "categories",
      icon: FolderTree,
      label: "Categories",
      permission: "manage_products",
      dropdown: true,
    },

    // Contracts dropdown
    {
      id: "contracts",
      icon: FileCheck,
      label: "Contracts",
      permission: "manage_orders",
      dropdown: true,
    },

    // Advertising dropdown
    {
      id: "advertising",
      icon: Megaphone,
      label: "Advertising",
      permission: "manage_ads",
      dropdown: true,
    },

    // Analytics dropdown
    {
      id: "analytics",
      icon: BarChart,
      label: "Analytics",
      permission: "view_reports",
      dropdown: true,
    },

    // Activity Logs dropdown
    {
      id: "activity",
      icon: Activity,
      label: "Activity Logs",
      permission: "view_logs",
      dropdown: true,
    },

    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      permission: "manage_settings",
      dropdown: true,
      dropdownItems: [
        {
          id: "general-settings",
          label: "General Settings",
          permission: "manage_settings",
          href: "/admin/settings/general",
        },
        {
          id: "payment-settings",
          label: "Payment Settings",
          permission: "manage_settings",
          href: "/admin/settings/payment",
        },
        {
          id: "shipping-settings",
          label: "Shipping Settings",
          permission: "manage_settings",
          href: "/admin/settings/shipping",
        },
        {
          id: "notification-settings",
          label: "Notifications",
          permission: "manage_settings",
          href: "/admin/settings/notifications",
        },
        {
          id: "tax-settings",
          label: "Tax Settings",
          permission: "manage_settings",
          href: "/admin/settings/tax",
        },
        {
          id: "security-settings",
          label: "Security",
          permission: "manage_settings",
          href: "/admin/settings/security",
        },
        {
          id: "email-settings",
          label: "Email Settings",
          permission: "manage_settings",
          href: "/admin/settings/email",
        },
        {
          id: "api-settings",
          label: "API Settings",
          permission: "manage_settings",
          href: "/admin/settings/api",
        },
        {
          id: "backup-settings",
          label: "Backup & Restore",
          permission: "manage_settings",
          href: "/admin/settings/backup",
        },
      ],
    },
  ];

  // Handle issue warning
  const handleIssueWarning = async (formData: WarningFormData) => {
    if (!productToAction) return;

    setIsProcessing(true);
    try {
      await issueWarning(productToAction.id, formData);
      toast.success("Warning issued successfully");
      await refreshProducts();
      setShowWarningModal(false);
      setProductToAction(null);
    } catch (error: any) {
      toast.error("Failed to issue warning: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle suspend product
  const handleSuspendProduct = async (product: Product) => {
    setIsProcessing(true);
    try {
      await suspendProduct(product.id, "Suspended by admin");
      toast.success("Product suspended successfully");
      await refreshProducts();
    } catch (error: any) {
      toast.error("Failed to suspend product: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle activate product
  const handleActivateProduct = async (product: Product) => {
    setIsProcessing(true);
    try {
      await activateProduct(product.id);
      toast.success("Product activated successfully");
      await refreshProducts();
    } catch (error: any) {
      toast.error("Failed to activate product: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (product: Product) => {
    setIsProcessing(true);
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted successfully");
      await refreshProducts();
    } catch (error: any) {
      toast.error("Failed to delete product: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle approve seller
  const handleApproveSeller = async (seller: SellerApplication) => {
    setIsProcessing(true);
    try {
      await approveSeller(seller.id);
      toast.success("Seller approved successfully");
      await refreshSellers();
      setShowSellerDetail(false);
      setSelectedSeller(null);
    } catch (error: any) {
      toast.error("Failed to approve seller");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject seller
  const handleRejectSeller = async (seller: SellerApplication) => {
    setIsProcessing(true);
    try {
      await rejectSeller(seller.id, "Application rejected by admin");
      toast.success("Seller application rejected");
      await refreshSellers();
      setShowSellerDetail(false);
      setSelectedSeller(null);
    } catch (error: any) {
      toast.error("Failed to reject seller");
    } finally {
      setIsProcessing(false);
    }
  };

  // Navigation handlers
  const handleViewProduct = (product: Product) => {
    navigate(`/admin/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  // Bulk actions handler
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) {
      toast.error("Please select products and an action");
      return;
    }

    setIsProcessing(true);
    try {
      switch (bulkAction) {
        case "activate":
          await Promise.all(selectedProducts.map((id) => activateProduct(id)));
          toast.success(`${selectedProducts.length} products activated`);
          break;

        case "deactivate":
          await Promise.all(
            selectedProducts.map((id) =>
              updateProduct(id, { status: "inactive" } as any),
            ),
          );
          toast.success(`${selectedProducts.length} products deactivated`);
          break;

        case "suspend":
          await Promise.all(
            selectedProducts.map((id) =>
              suspendProduct(id, "Bulk suspension by admin"),
            ),
          );
          toast.success(`${selectedProducts.length} products suspended`);
          break;

        case "delete":
          await Promise.all(selectedProducts.map((id) => deleteProduct(id)));
          toast.success(`${selectedProducts.length} products deleted`);
          break;
      }

      await refreshProducts();
      setSelectedProducts([]);
      setBulkAction("");
    } catch (error: any) {
      toast.error("Failed to perform bulk action: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Selection handlers
  const handleSelectAllProducts = (checked: boolean) => {
    if (checked && filteredProducts.length > 0) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Formatting functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refreshMetrics(),
        refreshSellers(),
        refreshProducts(),
        refreshOrders(),
        refreshNotifications(),
        refreshReviews(),
        refreshFinance(),
        refreshWallet(),
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  // Modal openers
  const openSellerDetail = (seller: SellerApplication) => {
    setSelectedSeller(seller);
    setShowSellerDetail(true);
  };

  const openApproveModal = (seller: SellerApplication) => {
    setModalState({
      isOpen: true,
      type: "approve",
      title: "Approve Seller Application",
      message: `Are you sure you want to approve ${seller.business_name}? This will activate their seller account.`,
      data: seller,
    });
  };

  const openRejectModal = (seller: SellerApplication) => {
    setModalState({
      isOpen: true,
      type: "reject",
      title: "Reject Seller Application",
      message: `Are you sure you want to reject ${seller.business_name}'s application? This action cannot be undone.`,
      data: seller,
    });
  };

  const openWarningModal = (product: Product) => {
    setProductToAction(product);
    setShowWarningModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToAction(product);
    setModalState({
      isOpen: true,
      type: "delete",
      title: "Delete Product",
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      data: product,
    });
  };

  const openSuspensionModal = (product: Product) => {
    setProductToAction(product);
    setModalState({
      isOpen: true,
      type: "suspend",
      title: "Suspend Product",
      message: `Are you sure you want to suspend "${product.name}"? This product will be hidden from the platform.`,
      data: product,
    });
  };

  const openActivationModal = (product: Product) => {
    setProductToAction(product);
    setModalState({
      isOpen: true,
      type: "activate",
      title: "Activate Product",
      message: `Are you sure you want to activate "${product.name}"? This product will be visible on the platform.`,
      data: product,
    });
  };

  // Load data when section changes
  useEffect(() => {
    const loadSectionData = async () => {
      try {
        switch (activeSection) {
          case "dashboard":
            await refreshMetrics();
            break;
          case "sellers":
            await refreshSellers();
            break;
          case "products":
            await refreshProducts();
            break;
          case "orders":
            await refreshOrders();
            break;
          case "reviews":
            await refreshReviews();
            break;
          case "finance":
            await refreshFinance();
            break;
          case "wallet":
            await refreshWallet();
            break;
          case "categories":
            await refreshCategories();
            break;
          case "contracts":
            await refreshContracts();
            break;
          case "advertising":
            await refreshAds();
            break;
          case "analytics":
            await refreshReports();
            break;
          case "activity":
            await refreshLogs();
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeSection} data:`, error);
        toast.error(`Failed to load ${activeSection} data`);
      }
    };

    loadSectionData();
  }, [activeSection]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onNavigate) {
      onNavigate(sectionId);
    }
  };

  const getLocalStorageUser = () => {
    try {
      const adminToken = localStorage.getItem("admin_token");
      const userRole = localStorage.getItem("userRole");

      if (adminToken === "true" && userRole === "admin") {
        return {
          id: "admin-id-123",
          email: "admin@premiumfurniture.com",
          user_metadata: {
            full_name: "Admin User",
            role: "admin",
          },
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const currentUser = getLocalStorageUser();

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("demoMode");
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      localStorage.clear();
      navigate("/");
    }
  };

  // Placeholder component for unimplemented sections
  const renderPlaceholder = (
    title: string,
    description: string,
    Icon: React.ElementType,
  ) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
          <p className="text-gray-500">
            Coming soon - Implementation in progress
          </p>
          <button
            onClick={() => toast.info(`Feature coming soon: ${title}`)}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
          >
            Notify When Ready
          </button>
        </div>
      </div>
    );
  };

  // ============== RENDER SECTIONS ==============
const setFilterOpen = (open: boolean) => {
  // Placeholder function for filter modal
  toast.info(`Filter modal ${open ? "opened" : "closed"}`);
}
  // Dashboard Section
  const renderDashboard = () => {
    const userName = currentUser?.user_metadata?.full_name || "Admin";
 
    return (
  <div className="space-y-8 min-h-screen">
    {/* Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Left: Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          Dashboard Overview
        </h2>
        <p className="text-sm font-medium text-gray-600 mt-1">
          Welcome back, {userName || "Hamza"}
        </p>
      </div>

      {/* Right: Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search users, orders..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <button
          onClick={() => setFilterOpen(true)}
          className="inline-flex items-center bg-yellow-400 justify-center gap-2 px-3 py-2 text-sm font-semibold
                     border border-gray-300 rounded-lg  text-gray-700
                     hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 " />
          Filters
        </button>
      </div>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[
        {
          title: "Total Users",
          value: 120,
          icon: Users,
          click: () => handleSectionClick("sellers"),
        },
        {
          title: "Active Sellers",
          value: 30,
          icon: UserCheck,
          click: () => handleSectionClick("sellers"),
        },
        {
          title: "Total Products",
          value: 450,
          icon: Package,
          click: () => handleSectionClick("products"),
        },
        {
          title: "Total Orders",
          value: 75,
          icon: ShoppingBag,
          click: () => handleSectionClick("orders"),
        },
        {
          title: "Pending Payments",
          value: 5,
          icon: CreditCard,
          click: () => handleSectionClick("finance"),
        },
      ].map((item, i) => (
        <div
          key={i}
          onClick={item.click}
          className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-100">
              <item.icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {item.title}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {item.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Metric Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Revenue"
        value="$12,000"
        icon={DollarSign}
        color="success"
        loading={false}
      />
      <MetricCard
        title="Pending Approvals"
        value={1}
        icon={AlertCircle}
        color="warning"
        loading={false}
        onClick={() => handleSectionClick("sellers")}
      />
      <MetricCard
        title="Approved Applications"
        value={1}
        icon={CheckCircle}
        color="success"
        loading={false}
        onClick={() => handleSectionClick("sellers")}
      />
      <MetricCard
        title="Rejected Applications"
        value={1}
        icon={UserX}
        color="danger"
        loading={false}
        onClick={() => handleSectionClick("sellers")}
      />
    </div>

    {/* Recent Orders & Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
          <button
            onClick={() => handleSectionClick("orders")}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { id: "1", order_number: "A1001", created_at: "2026-01-23", total_amount: 150, status: "completed" },
            { id: "2", order_number: "A1002", created_at: "2026-01-22", total_amount: 200, status: "pending" },
          ].map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">#{order.order_number}</p>
                <p className="text-xs text-gray-500">
                  {order.created_at} • ${order.total_amount}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => handleSectionClick("activity")}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { id: "1", action: "user_login", target_type: "User", created_at: "2026-01-23" },
            { id: "2", action: "order_created", target_type: "Order", created_at: "2026-01-22" },
          ].map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Activity className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm capitalize truncate">
                  {log.action.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500">{log.target_type} • {log.created_at}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

  };

  // Sellers Section
  const renderSellers = () => {
    const pendingCount = sellerApplications
      ? sellerApplications.filter(
          (app: SellerApplication) => app.status === "pending",
        ).length
      : 0;
    const approvedCount = sellerApplications
      ? sellerApplications.filter(
          (app: SellerApplication) => app.status === "approved",
        ).length
      : 0;
    const rejectedCount = sellerApplications
      ? sellerApplications.filter(
          (app: SellerApplication) => app.status === "rejected",
        ).length
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Seller Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{sellers?.length || 0}</span>{" "}
              active sellers •
              <span className="font-semibold text-yellow-600">
                {" "}
                {pendingCount}
              </span>{" "}
              pending •
              <span className="font-semibold text-green-600">
                {" "}
                {approvedCount}
              </span>{" "}
              approved •
              <span className="font-semibold text-red-600">
                {" "}
                {rejectedCount}
              </span>{" "}
              rejected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>
            <ActionButton
              icon={sellersLoading ? Loader2 : RefreshCw}
              label={sellersLoading ? "Loading..." : "Refresh"}
              variant="secondary"
              onClick={() => refreshSellers()}
              disabled={sellersLoading}
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              statusFilter === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Applications
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {sellerApplications?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              statusFilter === "pending"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pending
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              statusFilter === "approved"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Approved
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {approvedCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              statusFilter === "rejected"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rejected
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Seller Applications Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Seller Applications (
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  )
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Showing{" "}
                  {sellerApplications
                    ? sellerApplications.filter(
                        (app: SellerApplication) =>
                          statusFilter === "all" || app.status === statusFilter,
                      ).length
                    : 0}{" "}
                  applications
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Application ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sellerApplications && sellerApplications.length > 0
                  ? sellerApplications
                      .filter(
                        (app: SellerApplication) =>
                          statusFilter === "all" || app.status === statusFilter,
                      )
                      .filter(
                        (app: SellerApplication) =>
                          !searchQuery ||
                          app.business_name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          app.full_name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          app.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          app.application_id
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                      )
                      .map((application: SellerApplication) => (
                        <tr
                          key={application.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {application.application_id}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {application.business_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {application.city}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">
                              {application.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {application.email}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={application.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">
                                {formatDate(application.submitted_at)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(application.submitted_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ActionButton
                                icon={Eye}
                                label="View"
                                variant="secondary"
                                size="sm"
                                onClick={() => openSellerDetail(application)}
                              />
                              {application.status === "pending" && (
                                <>
                                  <ActionButton
                                    icon={UserCheck}
                                    label="Approve"
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                      openApproveModal(application)
                                    }
                                    disabled={isProcessing}
                                  />
                                  <ActionButton
                                    icon={UserX}
                                    label="Reject"
                                    variant="danger"
                                    size="sm"
                                    onClick={() => openRejectModal(application)}
                                    disabled={isProcessing}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  : !sellersLoading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="max-w-md mx-auto">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">
                              No applications found
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                              {searchQuery
                                ? `No results for "${searchQuery}"`
                                : "No seller applications yet"}
                            </p>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  setStatusFilter("all");
                                  setSearchQuery("");
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                              >
                                Clear Filters
                              </button>
                              <button
                                onClick={() => refreshSellers()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                              >
                                Refresh Data
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                {sellersLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-gray-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Sellers Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Active Sellers
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {sellers?.length || 0} sellers on platform
                </p>
              </div>
              <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sellers && sellers.length > 0
                  ? sellers
                      .filter(
                        (seller: any) =>
                          !searchQuery ||
                          seller.business_name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          seller.name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          seller.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                      )
                      .map((seller: any) => (
                        <tr
                          key={seller.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {seller.business_name ||
                                  seller.name ||
                                  seller.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {seller.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={
                                seller.status || seller.user_type || "active"
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">
                              {seller.total_products || 0}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">
                              {seller.total_orders || 0}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(seller.total_sales || 0)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">
                              {formatDate(
                                seller.created_at || seller.joined_at,
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ActionButton
                                icon={Eye}
                                label="View"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  window.open(`/seller/${seller.id}`, "_blank")
                                }
                              />
                              <ActionButton
                                icon={UserX}
                                label="Block"
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  const application = sellerApplications?.find(
                                    (app: SellerApplication) =>
                                      app.user_id === seller.id,
                                  );
                                  if (application) {
                                    openRejectModal(application);
                                  } else {
                                    toast.error(
                                      "Application not found for this seller",
                                    );
                                  }
                                }}
                                disabled={isProcessing}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                  : !sellersLoading && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            No active sellers found
                          </p>
                        </td>
                      </tr>
                    )}
                {sellersLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-gray-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Products Section
  const renderProducts = () => {
    const productsWithWarnings =
      products?.filter((p: Product) => (p.warning_count || 0) > 0) || [];
    const suspendedProducts =
      products?.filter(
        (p: Product) => p.is_suspended_by_admin || p.status === "suspended",
      ) || [];
    const outOfStockProducts =
      products?.filter((p: Product) => p.stock_quantity === 0) || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Product Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{products?.length || 0}</span>{" "}
              total products •
              <span className="font-semibold text-green-600">
                {" "}
                {products?.filter((p: Product) => p.status === "active")
                  .length || 0}
              </span>{" "}
              active •
              <span className="font-semibold text-red-600">
                {" "}
                {suspendedProducts.length}
              </span>{" "}
              suspended •
              <span className="font-semibold text-yellow-600">
                {" "}
                {productsWithWarnings.length}
              </span>{" "}
              with warnings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={productFilters.search}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    search: e.target.value,
                  })
                }
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>
            <ActionButton
              icon={productsLoading ? Loader2 : RefreshCw}
              label={productsLoading ? "Loading..." : "Refresh"}
              variant="secondary"
              onClick={() => refreshProducts()}
              disabled={productsLoading}
            />
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {products?.filter((p: Product) => p.status === "active")
                    .length || 0}
                </p>
                <p className="text-xs text-gray-600">Active Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {productsWithWarnings.length}
                </p>
                <p className="text-xs text-gray-600">With Warnings</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {outOfStockProducts.length}
                </p>
                <p className="text-xs text-gray-600">Out of Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    products?.reduce(
                      (sum: number, p: Product) => sum + (p.revenue || 0),
                      0,
                    ) || 0,
                  )}
                </p>
                <p className="text-xs text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">
                  {selectedProducts.length} product
                  {selectedProducts.length > 1 ? "s" : ""} selected
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
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || isProcessing}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Apply"}
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

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={productFilters.status}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category Type
              </label>
              <select
                value={productFilters.categoryType}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    categoryType: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="ready_made">Ready Made</option>
                <option value="customized">Customized</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={productFilters.stockStatus}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    stockStatus: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Seller
              </label>
              <select
                value={productFilters.sellerId}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    sellerId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Sellers</option>
                {sellers?.map((seller: any) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.business_name || seller.name || seller.email} (
                    {seller.total_products || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasWarnings"
                checked={productFilters.hasWarnings === true}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    hasWarnings: e.target.checked ? true : null,
                  })
                }
                className="rounded text-blue-500"
              />
              <label htmlFor="hasWarnings" className="text-sm text-gray-700">
                Has Warnings
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSuspended"
                checked={productFilters.isSuspended === true}
                onChange={(e) =>
                  setProductFilters({
                    ...productFilters,
                    isSuspended: e.target.checked ? true : null,
                  })
                }
                className="rounded text-blue-500"
              />
              <label htmlFor="isSuspended" className="text-sm text-gray-700">
                Suspended Only
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setProductFilters({
                    search: "",
                    status: "",
                    categoryType: "",
                    usageType: "",
                    stockStatus: "",
                    sellerId: "",
                    minRating: 0,
                    hasWarnings: null,
                    isSuspended: null,
                  })
                }
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  All Products
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Showing {filteredProducts.length} products
                  {productFilters.search && ` for "${productFilters.search}"`}
                </p>
              </div>
              <div className="text-xs text-gray-600">
                {products?.filter((p: Product) => p.status === "active")
                  .length || 0}{" "}
                active • {suspendedProducts.length} suspended
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={(e) =>
                        handleSelectAllProducts(e.target.checked)
                      }
                      className="rounded text-blue-500"
                    />
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length > 0
                  ? filteredProducts.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition"
                      >
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
                                <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                                  {product.name}
                                </p>
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
                            <p className="font-medium text-gray-900 text-sm">
                              {product.seller_business ||
                                product.seller_name ||
                                "Unknown Seller"}
                            </p>
                            <p className="text-gray-500 text-xs truncate max-w-xs">
                              {sellers?.find(
                                (s: any) => s.id === product.seller_id,
                              )?.email || "No email"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {formatCurrency(product.price)}
                            </p>
                            {product.discounted_price && (
                              <p className="text-gray-500 text-xs line-through">
                                {formatCurrency(product.discounted_price)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStockBadge(
                            product.stock_quantity,
                            product.min_stock_level,
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getProductStatusBadge(product)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-900">
                                {product.rating?.toFixed(1) || "0.0"}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({product.review_count || 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-gray-900">
                                {product.orders_count || 0} orders
                              </span>
                            </div>
                            {product.revenue && product.revenue > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-900">
                                  {formatCurrency(product.revenue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewProduct(product)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {product.is_suspended_by_admin ||
                            product.status === "suspended" ? (
                              <button
                                onClick={() => openActivationModal(product)}
                                className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                                title="Activate"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openSuspensionModal(product)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Suspend"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openWarningModal(product)}
                              className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                              title="Issue Warning"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(product)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : !productsLoading && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center">
                          <div className="max-w-md mx-auto">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">
                              No products found
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                              {productFilters.search
                                ? `No results for "${productFilters.search}"`
                                : "No products available yet"}
                            </p>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() =>
                                  setProductFilters({
                                    search: "",
                                    status: "",
                                    categoryType: "",
                                    usageType: "",
                                    stockStatus: "",
                                    sellerId: "",
                                    minRating: 0,
                                    hasWarnings: null,
                                    isSuspended: null,
                                  })
                                }
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                              >
                                Clear Filters
                              </button>
                              <button
                                onClick={() => refreshProducts()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                              >
                                Refresh Data
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                {productsLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-gray-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Orders Section
  const renderOrders = () => {
    return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Order Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track customer orders
        </p>
        <div className="mt-1 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {orders?.length || 0}
          </span>{" "}
          total orders •{" "}
          <span className="font-medium text-gray-700">
            {recentOrders?.length || 0}
          </span>{" "}
          recent
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white
                       text-sm text-gray-900 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                "Order #",
                "Customer",
                "Date",
                "Amount",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition"
                >
                  {/* Order */}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    #{order.order_number || order.id.substring(0, 8)}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {order.customer_name ||
                        order.profiles?.full_name ||
                        "Unknown Customer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customer_email ||
                        order.profiles?.email ||
                        "No email"}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(order.created_at)}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(order.total_amount || 0)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status || "pending"} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <ActionButton
                      icon={Eye}
                      label="View"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        window.open(`/order/${order.id}`, "_blank")
                      }
                    />
                  </td>
                </tr>
              ))
            ) : !ordersLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No orders found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Orders will appear here once customers place them
                  </p>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-200 rounded-lg"
                      />
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

  };

  // Reviews Section
  const renderReviews = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Reviews Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {reviews?.length || 0} total reviews • Manage and moderate
              customer reviews
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              variant="secondary"
              onClick={() => refreshReviews()}
              disabled={reviewsLoading}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                All Reviews
              </h3>
              <div className="flex items-center gap-2">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="all">All Reviews</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.customer_name || "Anonymous"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={review.status || "pending"} />
                    </div>
                    <p className="text-gray-700 text-sm mb-3">
                      {review.comment}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Product: {review.product_name || "Unknown Product"}
                      </span>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Finance Section
  const renderFinance = () => {
   return (
  <div className="bg-gray-100 min-h-screen p-6">
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
     <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  <div>
    <h2 className="text-2xl font-bold text-gray-900">
      Finance Management
    </h2>
    <p className="text-sm text-gray-600 mt-1">
      Complete financial control and revenue management system
    </p>
  </div>

  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
    {/* Search */}
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search transactions..."
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
      />
    </div>

    {/* Filter */}
    <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
      {/* <SlidersHorizontal className="h-4 w-4" /> */}
      Filters
    </button>

    {/* Generate Report */}
    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-400 text-black hover:bg-yellow-400">
      Generate Report
    </button>
  </div>
</div>

<div className="bg-white border border-gray-200 rounded-xl p-4">
  <h3 className="text-sm font-semibold text-gray-900 mb-4">
    Revenue Management
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Total Revenue */}
    <div className="  rounded-lg p-4">
      <p className="text-sm text-gray-500">Total Revenue</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">$542,890</p>
      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
        <TrendingUp className="h-4 w-4" /> +12.5% this month
      </p>
    </div>

    {/* Platform Commission */}
    <div className="  rounded-lg p-4">
      <p className="text-sm text-gray-500">Platform Commission</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">$54,289</p>
      <p className="text-xs text-gray-500 mt-2">10% of total revenue</p>
    </div>

    {/* Seller Earnings */}
    <div className=" rounded-lg p-4">
      <p className="text-sm text-gray-500">Seller Earnings</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">$488,601</p>
      <p className="text-xs text-gray-500 mt-2">90% paid to sellers</p>
    </div>

    {/* Top Category */}
    <div className=" rounded-lg p-4">
      <p className="text-sm text-gray-500">Top Category</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">Sofas</p>
      <p className="text-xs text-gray-500 mt-2">$124,500 revenue</p>
    </div>
  </div>
</div>



      {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
  {[
    {
      icon: Receipt,
      title: "Refunds & Cancellations",
      subtitle: "Manage returns",
      accent: "yellow",
      stats: [
        { label: "Pending Refunds", value: "8 Urgent", color: "text-yellow-600" },
        { label: "Total Refunded", value: "$12,450", color: "text-red-600" },
        { label: "Refund Rate", value: "2.4%", color: "text-blue-600" },
      ],
    },
    {
      icon: FileText,
      title: "Invoices & Billing",
      subtitle: "Invoice management",
      accent: "blue",
      stats: [
        { label: "Generated Today", value: "42", color: "text-green-600" },
        { label: "Pending Approval", value: "12", color: "text-yellow-600" },
        { label: "Tax Invoices", value: "1,089", color: "text-blue-600" },
      ],
    },
    {
      icon: Wallet,
      title: "Wallet & Ledger",
      subtitle: "Balance tracking",
      accent: "green",
      stats: [
        { label: "Platform Wallet", value: "$86,450", color: "text-green-700" },
        { label: "Seller Wallets", value: "$124,890", color: "text-blue-600" },
        { label: "Transactions Today", value: "142", color: "text-gray-700" },
      ],
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      subtitle: "Analytics & insights",
      accent: "blue",
      stats: [
        { label: "P&L Reports", value: "Updated Today", color: "text-green-600" },
        { label: "Seller Reports", value: "24 Ready", color: "text-blue-600" },
        { label: "Export Formats", value: "PDF / Excel", color: "text-gray-700" },
      ],
    },
    {
      icon: ShieldAlert,
      title: "Fraud & Risk Control",
      subtitle: "Security monitoring",
      accent: "yellow",
      stats: [
        { label: "Suspicious Activity", value: "3 Flags", color: "text-red-600" },
        { label: "Manual Reviews", value: "8", color: "text-yellow-600" },
        { label: "Risk Score", value: "Low", color: "text-green-600" },
      ],
    },
    {
      icon: Settings,
      title: "Admin Controls",
      subtitle: "System configuration",
      accent: "gray",
      stats: [
        { label: "Payout Threshold", value: "$100", color: "text-gray-900" },
        { label: "Payout Cycle", value: "Bi-weekly", color: "text-blue-600" },
        { label: "Active Currencies", value: "Multi", color: "text-green-600" },
      ],
    },
  ].map((item, idx) => (
    <div
      key={idx}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`
            p-3 rounded-xl
            ${item.accent === "yellow" && "bg-yellow-100"}
            ${item.accent === "green" && "bg-green-100"}
            ${item.accent === "blue" && "bg-blue-100"}
            ${item.accent === "gray" && "bg-gray-100"}
          `}
        >
          <item.icon className="h-6 w-6 text-gray-800" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">
            {item.title}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {item.subtitle}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {item.stats.map((stat, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-600 font-medium">
              {stat.label}
            </span>
            <span className={`font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>



      {/* Transactions */}
      <div className="bg-white border border-gray-200 rounded-xl">
  <div className="flex items-center justify-between p-4 border-b border-gray-200">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">
        Recent Transactions
      </h3>
      <p className="text-xs text-gray-500">Latest financial activities</p>
    </div>
    <button className="text-sm font-medium text-blue-600 hover:underline">
      View All
    </button>
  </div>
</div>

    </div>
  </div>
);

  };

  // Wallet Section
  const renderWallet = () => {
    return renderPlaceholder("Wallet", "Manage platform wallet", Wallet);
  };

  // Contracts Section
  const renderContracts = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Contracts Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {contracts?.length || 0} active contracts • Manage seller
              agreements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              variant="secondary"
              onClick={() => refreshContracts()}
              disabled={contractsLoading}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                All Contracts
              </h3>
              <div className="flex items-center gap-2">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="all">All Contracts</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            {contractsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : contracts && contracts.length > 0 ? (
              <div className="space-y-4">
                {contracts.map((contract: any) => (
                  <div
                    key={contract.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {contract.seller_name || "Unknown Seller"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Contract ID: {contract.contract_number}
                        </p>
                      </div>
                      <StatusBadge status={contract.status || "active"} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(contract.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(contract.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Commission</p>
                        <p className="font-medium text-gray-900">
                          {contract.commission_rate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Actions</p>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                            View
                          </button>
                          <button className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                            Renew
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No contracts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUser = () => {
    return (
      <div className="space-y-6">
  <div className="w-full">
    <UserManagementWrapper />
  </div>
</div>

    )};
  // Advertising Section







  const renderAdvertising = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Advertising Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {ads?.length || 0} active campaigns • Manage platform advertising
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={Plus}
              label="New Campaign"
              variant="primary"
              onClick={() => navigate("/admin/advertising/new")}
            />
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              variant="secondary"
              onClick={() => refreshAds()}
              disabled={adsLoading}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Advertising Campaigns
              </h3>
              <div className="flex items-center gap-2">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="all">All Campaigns</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            {adsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : ads && ads.length > 0 ? (
              <div className="space-y-4">
                {ads.map((ad: any) => (
                  <div
                    key={ad.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{ad.name}</p>
                        <p className="text-sm text-gray-600">
                          {ad.description}
                        </p>
                      </div>
                      <StatusBadge status={ad.status || "active"} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(ad.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Spent</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(ad.spent || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Impressions</p>
                        <p className="font-medium text-gray-900">
                          {ad.impressions?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Clicks</p>
                        <p className="font-medium text-gray-900">
                          {ad.clicks?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                        {ad.status === "active" ? "Pause" : "Activate"}
                      </button>
                      <button className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No advertising campaigns found</p>
                <button
                  onClick={() => navigate("/admin/advertising/new")}
                  className="mt-3 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
                >
                  Create First Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
    
  const mainReport = {
    totalVisits: 12500,
    avgOrderValue: 75.5,
    topProducts: [
      { id: 1, name: "Product A", sales: 120, revenue: 3600 },
      { id: 2, name: "Product B", sales: 95, revenue: 2850 },
      { id: 3, name: "Product C", sales: 60, revenue: 1800 },
    ],
  };


  // Analytics Section
  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Platform Analytics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              variant="secondary"
              onClick={() => refreshReports()}
              disabled={reportsLoading}
            />
            <ActionButton
              icon={Download}
              label="Export"
              variant="secondary"
              onClick={() => toast.info("Export feature coming soon")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-xl font-bold text-gray-900">
                  {reports && reports.length > 0
                    ? reports[0]?.totalVisits?.toLocaleString() || "0"
                    : "0"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {mainReport?.totalVisits?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(mainReport?.avgOrderValue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Top Products
          </h3>
          {reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : mainReport?.topProducts && mainReport.topProducts.length > 0 ? (
            <div className="space-y-3">
              {mainReport.topProducts.map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.sales} sales
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No analytics data available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Activity Logs Section
  const renderActivityLogs = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Activity Logs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {logs?.length || 0} log entries • System activity and audit trail
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              variant="secondary"
              onClick={() => refreshLogs()}
              disabled={logsLoading}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                System Activity
              </h3>
              <div className="flex items-center gap-2">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="all">All Activities</option>
                  <option value="user">User Actions</option>
                  <option value="system">System Events</option>
                  <option value="admin">Admin Actions</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.slice(0, 10).map((log: any) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm capitalize">
                        {log.action?.replace(/_/g, " ")}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">
                          By: {log.user_name || "System"} • Type:{" "}
                          {log.user_type} • Target: {log.target_type}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Details:{" "}
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activity logs found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Settings Section
  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Platform Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure platform settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              icon={Save}
              label="Save Changes"
              variant="primary"
              onClick={() => toast.success("Settings saved successfully")}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              General Settings
            </h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="Premium Furniture"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Default Commission Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue="15"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Platform Currency
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent">
                <option value="USD">USD ($)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded text-blue-500"
                  defaultChecked
                />
                <span className="text-sm text-gray-900">
                  Enable Email Notifications
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded text-blue-500"
                  defaultChecked
                />
                <span className="text-sm text-gray-900">
                  Enable SMS Notifications
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // const isLoading = dashboardLoading || sellersLoading || productsLoading || ordersLoading;
  const isLoading = false; // Simplified for demonstration
  console.log("Overall Loading State:", isLoading);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return renderUser();
      case "products":
        return renderProducts();
      case "orders":
        return renderOrders();
      case "reviews":
        return renderReviews();
      case "finance":
        return renderFinance();
      case "wallet":
        return renderWallet();
      case "categories":
        return renderPlaceholder(
          "Categories",
          "Manage product categories",
          FolderTree,
        );
      case "contracts":
        return renderContracts();
      case "advertising":
        return renderAdvertising();
      case "analytics":
        return renderAnalytics();
      case "activity":
        return renderActivityLogs();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  const [expandedDropdowns, setExpandedDropdowns] = useState<string[]>([]);

  // Add this function to handle dropdown toggles
  const handleDropdownToggle = (itemId: string) => {
    setExpandedDropdowns((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  // Sidebar Component
  const Sidebar = ({
    isMobile = false,
    onClose,
  }: {
    isMobile?: boolean;
    onClose?: () => void;
  }) => {
    const userEmail = currentUser?.email || "admin@premiumfurniture.com";
    const userName = currentUser?.user_metadata?.full_name || "Admin User";
    const pendingCount = sellerApplications
      ? sellerApplications.filter(
          (app: SellerApplication) => app.status === "pending",
        ).length
      : 0;
 

    return (
      <div
        className={`${isMobile ? "fixed inset-0 z-50 bg-white" : "w-64 bg-white border-r border-gray-200 hidden lg:block"} h-full flex flex-col`}
      >
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-500">Premium Furniture</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className=" ">
                <h1 className="text-2xl  font-bold text-gray-900">
                 Admin Central
                </h1>
                <p className="text-xs font-bold text-gray-500">Premium Furniture</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 hidden ">
              <p className="font-medium text-gray-900">{userName}</p>
              <p className="text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
        )}

         <nav className="flex-1 p-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                handleSectionClick(item.id);
                if (isMobile && onClose) onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.id === 'sellers' && pendingCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* dropdown  navbar */}
     


        <div className="p-4 border-t border-gray-200 space-y-2 bg-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 text-sm font-medium w-full px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />

        {showMobileMenu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="relative max-w-xs w-full h-full">
              <Sidebar isMobile onClose={() => setShowMobileMenu(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex bg-gray-100 flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-gray-900">
                      Admin Panel
                    </h1>
                    <p className="text-xs text-gray-500">Premium Furniture</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshAllData}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-700 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => refreshNotifications()}
                  className="relative p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-4 h-4 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="hidden lg:flex items-center justify-end mb-6">
              {/* <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeSection === "dashboard"
                    ? "Dashboard"
                    : activeSection.replace(/_/g, " ")}
                </h1>
                <p className="text-gray-600 mt-1">
                  {activeSection === "dashboard"
                    ? "Platform overview and analytics"
                    : `Manage ${activeSection.replace(/_/g, " ")}`}
                </p>
              </div> */}

              {/* <div className="flex items-center gap-3">
                {activeSection !== "dashboard" &&
                  activeSection !== "settings" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${activeSection}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  )}

                <button
                  onClick={refreshAllData}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-700 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={() => refreshNotifications()}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {currentUser?.user_metadata?.full_name
                        ?.charAt(0)
                        .toUpperCase() || "A"}
                    </span>
                  </div>
                </div>
              </div> */}
            </div>

            {isLoading && activeSection === "dashboard" ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="inline-block animate-spin w-8 h-8 text-gray-900 mb-3" />
                  <p className="mt-3 text-gray-600">
                    Loading dashboard data...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">{renderActiveSection()}</div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} Premium Furniture • Admin Panel
                  v2.0
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-gray-500">
                    Last sync:{" "}
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SellerDetailModal
        isOpen={showSellerDetail}
        seller={selectedSeller}
        onClose={() => {
          setShowSellerDetail(false);
          setSelectedSeller(null);
        }}
        onApprove={handleApproveSeller}
        onReject={handleRejectSeller}
      />

      <WarningModal
        isOpen={showWarningModal}
        product={productToAction}
        onClose={() => {
          setShowWarningModal(false);
          setProductToAction(null);
        }}
        onSubmit={handleIssueWarning}
        isProcessing={isProcessing}
      />

      {modalState && (
        <ConfirmationModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          confirmLabel={
            modalState.type === "approve"
              ? "Approve"
              : modalState.type === "reject"
                ? "Reject"
                : modalState.type === "delete"
                  ? "Delete"
                  : modalState.type === "suspend"
                    ? "Suspend"
                    : modalState.type === "activate"
                      ? "Activate"
                      : "Confirm"
          }
          cancelLabel="Cancel"
          onConfirm={() => {
            if (modalState.type === "approve") {
              handleApproveSeller(modalState.data);
            } else if (modalState.type === "reject") {
              handleRejectSeller(modalState.data);
            } else if (modalState.type === "delete") {
              handleDeleteProduct(modalState.data);
            } else if (modalState.type === "suspend") {
              handleSuspendProduct(modalState.data);
            } else if (modalState.type === "activate") {
              handleActivateProduct(modalState.data);
            }
            setModalState(null);
          }}
          onCancel={() => setModalState(null)}
          isProcessing={isProcessing}
          type={modalState.type}
        />
      )}
    </>
  );
};

const ProtectedAdminDashboard: React.FC<AdminDashboardProps> = (props) => (
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard {...props} />
  </ProtectedRoute>
);

export default ProtectedAdminDashboard;
