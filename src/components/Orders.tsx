import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
  Printer,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Phone,
  ShoppingBag,
  Check,
  MoreVertical,
  ArrowUpDown,
  Mail,
  Home,
  Box,
  Ruler,
  Palette,
  Edit,
  Ban,
  Scissors,
  Settings,
  Grid,
  List,
  Layers,
  Factory,
  Palette as PaletteIcon,
  Ruler as RulerIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ============== TYPES ==============
interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  is_custom: boolean;
  specifications?: string;
  image_url?: string;
  customization?: any;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_type: "ready" | "custom";
  status:
    | "pending"
    | "accepted"
    | "in_production"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  payment_status: "paid" | "pending" | "refunded";
  payment_method: string;
  items: OrderItem[];
  subtotal: number;
  vat_amount: number;
  delivery_fee: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  is_urgent: boolean;
  customization_details?: any;
  is_custom?: boolean;
  seller_id?: string;
  seller_name?: string;
  production_start_date?: string;
  estimated_completion_date?: string;
}

interface OrderFilters {
  search: string;
  orderType: "all" | "ready" | "custom";
  orderStatus: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

interface OrdersPageProps {
  onNavigate: (page: string) => void;
  onBack: () => void | Promise<void>;
}

// ============== MAIN COMPONENT ==============
const Orders: React.FC<OrdersPageProps> = ({ onNavigate, onBack }) => {
  // State Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "ready" | "custom">("all");
  const [filters, setFilters] = useState<OrderFilters>({
    search: "",
    orderType: "all",
    orderStatus: "all",
    paymentStatus: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Status Options
  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    {
      value: "accepted",
      label: "Accepted",
      color: "bg-blue-100 text-blue-800",
      icon: CheckCircle,
    },
    {
      value: "in_production",
      label: "In Production",
      color: "bg-purple-100 text-purple-800",
      icon: Settings,
    },
    {
      value: "shipped",
      label: "Shipped",
      color: "bg-indigo-100 text-indigo-800",
      icon: Truck,
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
      icon: Ban,
    },
    {
      value: "returned",
      label: "Returned",
      color: "bg-gray-100 text-gray-800",
      icon: ArrowUpDown,
    },
  ];

  // Load Orders from localStorage with categorization
  const loadOrders = async () => {
    try {
      setLoading(true);

      // Get seller ID from auth or localStorage
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const sellerId = user?.id || "default_seller";

      // Load from type-specific storage
      const readyOrdersKey = `seller_${sellerId}_ready_orders`;
      const customOrdersKey = `seller_${sellerId}_custom_orders`;
      const allOrdersKey = `seller_${sellerId}_orders`;

      const readyOrdersData = JSON.parse(
        localStorage.getItem(readyOrdersKey) || "[]",
      );
      const customOrdersData = JSON.parse(
        localStorage.getItem(customOrdersKey) || "[]",
      );
      const allOrdersData = JSON.parse(
        localStorage.getItem(allOrdersKey) || "[]",
      );

      // Transform ready orders
      const readyOrders: Order[] = readyOrdersData.map((order: any) => ({
        id: order.id,
        order_number: order.orderNumber || `ORD-${order.id.slice(0, 8)}`,
        customer_name: order.userName || "Customer",
        customer_email: order.userEmail || "email@example.com",
        customer_phone: order.userPhone || "+966 XXX XXX XXX",
        customer_address:
          order.deliveryAddress?.address || "Address not specified",
        order_type: "ready",
        status: order.status || "pending",
        payment_status: order.paymentStatus || "pending",
        payment_method: order.paymentMethod || "Credit Card",
        items: order.items || [
          {
            id: `item_${order.id}`,
            product_name: order.items?.[0]?.product_name || "Product",
            quantity: order.items?.[0]?.quantity || 1,
            price: order.items?.[0]?.unit_price || order.total || 0,
            is_custom: false,
          },
        ],
        subtotal: order.subtotal || 0,
        vat_amount: 0,
        delivery_fee: order.deliveryFee || 0,
        total_amount: order.total || 0,
        notes: order.notes || "",
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: order.updatedAt || new Date().toISOString(),
        estimated_delivery: order.estimatedDeliveryDate || "",
        is_urgent: order.is_urgent || false,
        seller_id: order.sellerInfo?.id,
        seller_name: order.sellerInfo?.business_name,
      }));

      // Transform custom orders
      const customOrders: Order[] = customOrdersData.map((order: any) => ({
        id: order.id,
        order_number: order.orderNumber || `CUST-${order.id.slice(0, 8)}`,
        customer_name: order.userName || "Customer",
        customer_email: order.userEmail || "email@example.com",
        customer_phone: order.userPhone || "+966 XXX XXX XXX",
        customer_address:
          order.deliveryAddress?.address || "Address not specified",
        order_type: "custom",
        status: order.status || "pending",
        payment_status: order.paymentStatus || "pending",
        payment_method: order.paymentMethod || "Credit Card",
        items: order.items || [
          {
            id: `item_${order.id}`,
            product_name: order.items?.[0]?.product_name || "Custom Product",
            quantity: order.items?.[0]?.quantity || 1,
            price: order.items?.[0]?.unit_price || order.total || 0,
            is_custom: true,
            customization: order.customizationDetails,
            specifications: order.customizationDetails
              ? JSON.stringify(order.customizationDetails)
              : undefined,
          },
        ],
        subtotal: order.subtotal || 0,
        vat_amount: 0,
        delivery_fee: order.deliveryFee || 0,
        total_amount: order.total || 0,
        notes: order.notes || "",
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: order.updatedAt || new Date().toISOString(),
        estimated_delivery: order.estimatedDeliveryDate || "",
        is_urgent: order.is_urgent || false,
        customization_details: order.customizationDetails,
        is_custom: true,
        seller_id: order.sellerInfo?.id,
        seller_name: order.sellerInfo?.business_name,
        production_start_date: order.production_start_date,
        estimated_completion_date: order.estimated_completion_date,
      }));

      // Combine all orders
      const allOrders = [...readyOrders, ...customOrders];

      // Add any orders from allOrdersData that aren't already included
      allOrdersData.forEach((order: any) => {
        if (!allOrders.some((o) => o.id === order.id)) {
          const orderType =
            order.orderType || (order.is_custom ? "custom" : "ready");
          allOrders.push({
            id: order.id,
            order_number: order.orderNumber || `ORD-${order.id.slice(0, 8)}`,
            customer_name: order.userName || "Customer",
            customer_email: order.userEmail || "email@example.com",
            customer_phone: order.userPhone || "+966 XXX XXX XXX",
            customer_address:
              order.deliveryAddress?.address || "Address not specified",
            order_type: orderType,
            status: order.status || "pending",
            payment_status: order.paymentStatus || "pending",
            payment_method: order.paymentMethod || "Credit Card",
            items: order.items || [
              {
                id: `item_${order.id}`,
                product_name: order.items?.[0]?.product_name || "Product",
                quantity: order.items?.[0]?.quantity || 1,
                price: order.items?.[0]?.unit_price || order.total || 0,
                is_custom: orderType === "custom",
              },
            ],
            subtotal: order.subtotal || 0,
            vat_amount: 0,
            delivery_fee: order.deliveryFee || 0,
            total_amount: order.total || 0,
            notes: order.notes || "",
            created_at: order.createdAt || new Date().toISOString(),
            updated_at: order.updatedAt || new Date().toISOString(),
            estimated_delivery: order.estimatedDeliveryDate || "",
            is_urgent: order.is_urgent || false,
            customization_details: order.customizationDetails,
            is_custom: orderType === "custom",
            seller_id: order.sellerInfo?.id,
            seller_name: order.sellerInfo?.business_name,
          });
        }
      });

      setOrders(allOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    loadOrders();
  }, []);

  // Filter Orders based on active tab and filters
 const filteredOrders = useMemo(() => {
  // Use actual orders or fallback to 15 dummy orders if none exist
  let result = orders?.length > 0
    ? orders
    : Array.from({ length: 15 }).map((_, index) => ({
        id: `demo-${index + 1}`,
        order_number: `ORD-DEMO-${index + 1}`,
        customer_name: `Customer ${index + 1}`,
        customer_email: `customer${index + 1}@demo.com`,
        total_amount: 1000 + index * 50,
        status: "processing",
        payment_status: "pending",
        order_type: index % 2 === 0 ? "ready" : "custom",
        created_at: new Date(Date.now() - index * 86400000).toISOString(), // spread dates
      }));

  // Filter by active tab
  if (activeTab === "ready") {
    result = result.filter(order => order.order_type === "ready");
  } else if (activeTab === "custom") {
    result = result.filter(order => order.order_type === "custom");
  }

  // Apply other filters
  return result.filter(order => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Order type filter (advanced)
    if (filters.orderType && filters.orderType !== "all" && order.order_type !== filters.orderType) {
      return false;
    }

    // Order status filter
    if (filters.orderStatus && filters.orderStatus !== "all" && order.status !== filters.orderStatus) {
      return false;
    }

    // Payment status filter
    if (filters.paymentStatus && filters.paymentStatus !== "all" && order.payment_status !== filters.paymentStatus) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const orderDate = new Date(order.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (orderDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const orderDate = new Date(order.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }

    // Amount range filter
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      if (order.total_amount < min) return false;
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      if (order.total_amount > max) return false;
    }

    return true; // order passes all filters
  });
}, [orders, activeTab, filters]);


  // Order Summary Statistics by type
  const orderStats = useMemo(() => {
    const allOrders = orders;
    const readyOrders = orders.filter((o) => o.order_type === "ready");
    const customOrders = orders.filter((o) => o.order_type === "custom");

    return {
      all: {
        total: allOrders.length,
        pending: allOrders.filter((o) => o.status === "pending").length,
        in_production: allOrders.filter((o) => o.status === "in_production")
          .length,
        shipped: allOrders.filter((o) => o.status === "shipped").length,
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        totalRevenue: allOrders.reduce(
          (sum, order) => sum + order.total_amount,
          0,
        ),
        urgent: allOrders.filter((o) => o.is_urgent).length,
      },
      ready: {
        total: readyOrders.length,
        pending: readyOrders.filter((o) => o.status === "pending").length,
        shipped: readyOrders.filter((o) => o.status === "shipped").length,
        delivered: readyOrders.filter((o) => o.status === "delivered").length,
        totalRevenue: readyOrders.reduce(
          (sum, order) => sum + order.total_amount,
          0,
        ),
        urgent: readyOrders.filter((o) => o.is_urgent).length,
      },
      custom: {
        total: customOrders.length,
        pending: customOrders.filter((o) => o.status === "pending").length,
        in_production: customOrders.filter((o) => o.status === "in_production")
          .length,
        shipped: customOrders.filter((o) => o.status === "shipped").length,
        delivered: customOrders.filter((o) => o.status === "delivered").length,
        totalRevenue: customOrders.reduce(
          (sum, order) => sum + order.total_amount,
          0,
        ),
        urgent: customOrders.filter((o) => o.is_urgent).length,
      },
    };
  }, [orders]);

  // Handle Status Update
  const handleStatusUpdate = async (
    orderId: string,
    currentStatus: string,
    newStatus: string,
  ) => {
    // Validate status transition
    const statusFlow = [
      "pending",
      "accepted",
      "in_production",
      "shipped",
      "delivered",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const newIndex = statusFlow.indexOf(newStatus);

    if (currentIndex === -1 || newIndex === -1 || newIndex < currentIndex) {
      alert("Invalid status transition. Please follow the proper order flow.");
      return;
    }

    // Update order status in state
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus as any,
              updated_at: new Date().toISOString(),
            }
          : order,
      ),
    );

    // Update in localStorage
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const sellerId = user?.id || "default_seller";

      // Get the order to determine its type
      const order = orders.find((o) => o.id === orderId);

      if (order) {
        if (order.order_type === "ready") {
          // Update in ready orders
          const readyOrdersKey = `seller_${sellerId}_ready_orders`;
          const readyOrders = JSON.parse(
            localStorage.getItem(readyOrdersKey) || "[]",
          );
          const updatedReadyOrders = readyOrders.map((o: any) =>
            o.id === orderId
              ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
              : o,
          );
          localStorage.setItem(
            readyOrdersKey,
            JSON.stringify(updatedReadyOrders),
          );
        } else {
          // Update in custom orders
          const customOrdersKey = `seller_${sellerId}_custom_orders`;
          const customOrders = JSON.parse(
            localStorage.getItem(customOrdersKey) || "[]",
          );
          const updatedCustomOrders = customOrders.map((o: any) =>
            o.id === orderId
              ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
              : o,
          );
          localStorage.setItem(
            customOrdersKey,
            JSON.stringify(updatedCustomOrders),
          );
        }

        // Update in all orders
        const allOrdersKey = `seller_${sellerId}_orders`;
        const allOrders = JSON.parse(
          localStorage.getItem(allOrdersKey) || "[]",
        );
        const updatedAllOrders = allOrders.map((o: any) =>
          o.id === orderId
            ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
            : o,
        );
        localStorage.setItem(allOrdersKey, JSON.stringify(updatedAllOrders));
      }
    } catch (error) {
      console.error("Error updating order status in localStorage:", error);
    }

    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  // Handle Cancel Order
  const handleCancelOrder = async (orderId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "cancelled",
              payment_status: "refunded",
              updated_at: new Date().toISOString(),
            }
          : order,
      ),
    );

    // Update in localStorage
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const sellerId = user?.id || "default_seller";

      const order = orders.find((o) => o.id === orderId);

      if (order) {
        if (order.order_type === "ready") {
          const readyOrdersKey = `seller_${sellerId}_ready_orders`;
          const readyOrders = JSON.parse(
            localStorage.getItem(readyOrdersKey) || "[]",
          );
          const updatedReadyOrders = readyOrders.map((o: any) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                  payment_status: "refunded",
                  updatedAt: new Date().toISOString(),
                }
              : o,
          );
          localStorage.setItem(
            readyOrdersKey,
            JSON.stringify(updatedReadyOrders),
          );
        } else {
          const customOrdersKey = `seller_${sellerId}_custom_orders`;
          const customOrders = JSON.parse(
            localStorage.getItem(customOrdersKey) || "[]",
          );
          const updatedCustomOrders = customOrders.map((o: any) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                  payment_status: "refunded",
                  updatedAt: new Date().toISOString(),
                }
              : o,
          );
          localStorage.setItem(
            customOrdersKey,
            JSON.stringify(updatedCustomOrders),
          );
        }

        const allOrdersKey = `seller_${sellerId}_orders`;
        const allOrders = JSON.parse(
          localStorage.getItem(allOrdersKey) || "[]",
        );
        const updatedAllOrders = allOrders.map((o: any) =>
          o.id === orderId
            ? {
                ...o,
                status: "cancelled",
                payment_status: "refunded",
                updatedAt: new Date().toISOString(),
              }
            : o,
        );
        localStorage.setItem(allOrdersKey, JSON.stringify(updatedAllOrders));
      }
    } catch (error) {
      console.error("Error cancelling order in localStorage:", error);
    }
  };

  // Handle Export
  // const handleExportOrders = (type: "all" | "ready" | "custom") => {
  //   const ordersToExport =
  //     type === "all"
  //       ? filteredOrders
  //       : filteredOrders.filter((order) => order.order_type === type);

  //   if (ordersToExport.length === 0) {
  //     alert(`No ${type} orders to export`);
  //     return;
  //   }

  //   const csvData = ordersToExport.map((order) => ({
  //     "Order ID": order.order_number,
  //     Customer: order.customer_name,
  //     "Order Type":
  //       order.order_type === "custom" ? "Custom Furniture" : "Ready-made",
  //     Status: order.status,
  //     "Payment Status": order.payment_status,
  //     "Total Amount": order.total_amount,
  //     "Created Date": new Date(order.created_at).toLocaleDateString(),
  //     "Items Count": order.items.length,
  //   }));

  //   const csvString = [
  //     Object.keys(csvData[0]).join(","),
  //     ...csvData.map((row) => Object.values(row).join(",")),
  //   ].join("\n");

  //   const blob = new Blob([csvString], { type: "text/csv" });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `${type}_orders_export_${new Date().toISOString().split("T")[0]}.csv`;
  //   a.click();
  // };

  // Format currency for SAR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    const Icon = statusOption?.icon || AlertCircle;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusOption?.color || "bg-gray-100 text-gray-800"}`}
      >
        <Icon className="w-3 h-3" />
        <span>{statusOption?.label || status}</span>
      </span>
    );
  };

  // Get order type badge
  const getOrderTypeBadge = (orderType: string) => {
    return orderType === "custom" ? (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center space-x-1">
        <Scissors className="w-3 h-3" />
        <span>Custom</span>
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center space-x-1">
        <Package className="w-3 h-3" />
        <span>Ready</span>
      </span>
    );
  };

  // Render Order Type Tabs
  const renderOrderTypeTabs = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${
            activeTab === "all"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>All Orders</span>
            {orderStats.all.total > 0 && (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === "all"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {orderStats.all.total}
              </span>
            )}
          </div>
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${
            activeTab === "ready"
              ? "text-green-600 bg-green-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Ready Orders</span>
            {orderStats.ready.total > 0 && (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === "ready"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {orderStats.ready.total}
              </span>
            )}
          </div>
          {activeTab === "ready" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${
            activeTab === "custom"
              ? "text-purple-600 bg-purple-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Scissors className="w-4 h-4" />
            <span>Custom Orders</span>
            {orderStats.custom.total > 0 && (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === "custom"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {orderStats.custom.total}
              </span>
            )}
          </div>
          {activeTab === "custom" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600"></div>
          )}
        </button>
      </div>
    </div>
  );

  // Render Statistics Cards for active tab
  const renderStatisticsCards = () => {
    const stats =
      activeTab === "all"
        ? orderStats.all
        : activeTab === "ready"
          ? orderStats.ready
          : orderStats.custom;

    const bgColor =
      activeTab === "all" ? "blue" : activeTab === "ready" ? "green" : "purple";
    const textColor =
      activeTab === "all" ? "blue" : activeTab === "ready" ? "green" : "purple";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 bg-${bgColor}-100 rounded-lg`}>
              <ShoppingBag className={`w-5 h-5 text-${bgColor}-600`} />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full bg-${bgColor}-100 text-${bgColor}-800`}
            >
              Total
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-sm font-medium text-gray-700">
            {activeTab === "all"
              ? "Total Orders"
              : activeTab === "ready"
                ? "Ready Orders"
                : "Custom Orders"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(stats.totalRevenue)} revenue
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              Attention
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">
            {stats.pending}
          </p>
          <p className="text-sm font-medium text-gray-700">Pending</p>
          <p className="text-xs text-gray-500 mt-1">{stats.urgent} urgent</p>
        </div>

        {activeTab === "custom" || activeTab === "all" ? (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                Production
              </span>
            </div>
            {/* <p className="text-xl font-bold text-gray-900 mb-1">{stats.in_production}</p> */}
            <p className="text-sm font-medium text-gray-700">In Production</p>
            <p className="text-xs text-gray-500 mt-1">Manufacturing</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                Shipped
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              {stats.shipped}
            </p>
            <p className="text-sm font-medium text-gray-700">Shipped</p>
            <p className="text-xs text-gray-500 mt-1">In transit</p>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
              Completed
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">
            {stats.delivered}
          </p>
          <p className="text-sm font-medium text-gray-700">Delivered</p>
          <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              Urgent
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">{stats.urgent}</p>
          <p className="text-sm font-medium text-gray-700">Urgent Orders</p>
          <p className="text-xs text-gray-500 mt-1">Require priority</p>
        </div>
      </div>
    );
  };

  // Render Order Details Modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h2>
                <p className="text-gray-600">{selectedOrder.order_number}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getOrderTypeBadge(selectedOrder.order_type)}
                  {selectedOrder.is_urgent && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-8">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Order Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(selectedOrder.created_at)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Last Updated:</span>{" "}
                      {formatDate(selectedOrder.updated_at)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Type:</span>
                      {getOrderTypeBadge(selectedOrder.order_type)}
                    </p>
                    {selectedOrder.estimated_delivery && (
                      <p className="text-sm">
                        <span className="font-medium">Est. Delivery:</span>{" "}
                        {formatDate(selectedOrder.estimated_delivery)}
                      </p>
                    )}
                    {selectedOrder.order_type === "custom" &&
                      selectedOrder.estimated_completion_date && (
                        <p className="text-sm">
                          <span className="font-medium">Est. Completion:</span>{" "}
                          {formatDate(selectedOrder.estimated_completion_date)}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedOrder.customer_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedOrder.customer_email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedOrder.customer_phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedOrder.customer_address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : selectedOrder.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Method:</span>
                      <span className="text-sm">
                        {selectedOrder.payment_method}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Order Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Order Details */}
            {selectedOrder.order_type === "custom" &&
              selectedOrder.customization_details && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Scissors className="w-5 h-5 mr-2 text-purple-600" />
                    Customization Details
                  </h3>
                  <div className="space-y-3">
                    {typeof selectedOrder.customization_details === "object" ? (
                      Object.entries(selectedOrder.customization_details).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium text-purple-800 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="text-sm text-purple-700">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-purple-700">
                        {selectedOrder.customization_details}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            {item.is_custom && item.specifications && (
                              <div className="text-xs text-gray-500 mt-1">
                                <div className="flex items-center space-x-2">
                                  <RulerIcon className="w-3 h-3" />
                                  <span>Specs: {item.specifications}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${item.is_custom ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                          >
                            {item.is_custom ? "Custom" : "Ready-made"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.vat_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.delivery_fee)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Order Notes
                </h4>
                <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={
                  selectedOrder.status === "cancelled" ||
                  selectedOrder.status === "delivered"
                }
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedOrder.status === "cancelled" ||
                  selectedOrder.status === "delivered"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Cancel Order
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setNewStatus(selectedOrder.status);
                  setShowStatusModal(true);
                }}
                disabled={
                  selectedOrder.status === "cancelled" ||
                  selectedOrder.status === "delivered" ||
                  selectedOrder.status === "returned"
                }
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedOrder.status === "cancelled" ||
                  selectedOrder.status === "delivered" ||
                  selectedOrder.status === "returned"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : selectedOrder.order_type === "custom"
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Status Update Modal
  const renderStatusModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Update Order Status
                {selectedOrder.order_type === "custom" && (
                  <span className="ml-2 text-sm font-normal text-purple-600">
                    (Custom Order)
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Updating status for order{" "}
                <span className="font-medium">
                  {selectedOrder.order_number}
                </span>
              </p>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Current Status
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select new status</option>
                  {statusOptions
                    .filter((option) => {
                      // For custom orders, show all statuses
                      // For ready orders, hide 'in_production'
                      if (
                        selectedOrder.order_type === "ready" &&
                        option.value === "in_production"
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.value === selectedOrder.status}
                      >
                        {option.label}
                      </option>
                    ))}
                </select>
                {selectedOrder.order_type === "custom" &&
                  newStatus === "in_production" && (
                    <p className="text-xs text-purple-600 mt-1">
                      Production typically takes 2-4 weeks for custom orders.
                    </p>
                  )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      selectedOrder.id,
                      selectedOrder.status,
                      newStatus,
                    )
                  }
                  disabled={!newStatus || newStatus === selectedOrder.status}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    !newStatus || newStatus === selectedOrder.status
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : selectedOrder.order_type === "custom"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // // Loading State
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
  //         <p className="text-gray-600">Loading orders...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen  px-3">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orders Management
            </h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => handleExportOrders(activeTab)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>
                Export{" "}
                {activeTab === "all"
                  ? "All"
                  : activeTab === "ready"
                    ? "Ready"
                    : "Custom"}
              </span>
            </button>
            <button
              onClick={loadOrders}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Order Type Tabs */}
        {renderOrderTypeTabs()}

        {/* Statistics Cards */}
        {renderStatisticsCards()}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, or Email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={() => {
                  setFilters({
                    search: "",
                    orderType: "all",
                    orderStatus: "all",
                    paymentStatus: "all",
                    dateFrom: "",
                    dateTo: "",
                    minAmount: "",
                    maxAmount: "",
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Order Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <select
                  value={filters.orderType}
                  onChange={(e) =>
                    setFilters({ ...filters, orderType: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="ready">Ready-made</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={filters.orderStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, orderStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, paymentStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 ${order.is_urgent ? "bg-red-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {order.order_number}
                        </span>
                        {order.is_urgent && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOrderTypeBadge(order.order_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* {order.items.length}{" "} */}
                      {/* {order.items.length === 1 ? "item" : "items"} */}
                      {order.order_type === "custom" && (
                        <div className="text-xs text-purple-600 mt-1">
                          Custom order
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : order.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                            setShowStatusModal(true);
                          }}
                          disabled={
                            order.status === "cancelled" ||
                            order.status === "delivered" ||
                            order.status === "returned"
                          }
                          className={`p-1.5 rounded-lg ${
                            order.status === "cancelled" ||
                            order.status === "delivered" ||
                            order.status === "returned"
                              ? "text-gray-400 cursor-not-allowed"
                              : order.order_type === "custom"
                                ? "text-purple-600 hover:bg-purple-50"
                                : "text-green-600 hover:bg-green-50"
                          }`}
                          title="Update Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {activeTab === "all" ? (
                        <>
                          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-600">
                            No orders found
                          </p>
                        </>
                      ) : activeTab === "ready" ? (
                        <>
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-600">
                            No ready orders found
                          </p>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-600">
                            No custom orders found
                          </p>
                        </>
                      )}
                      <p className="text-sm mt-1">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">
                  {Math.min(filteredOrders.length, 10)}
                </span>{" "}
                of <span className="font-medium">{filteredOrders.length}</span>{" "}
                orders
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && renderOrderDetailsModal()}
      {showStatusModal && renderStatusModal()}
    </div>
  );
};

export default Orders;
